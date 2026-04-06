# ConfigResolver：Phân giải cấu hình thời gian chạy thống nhất

> Ngày：2026-03-25
> Trạng thái：Thiết kế đã xác nhận

## Vấn đề

Cấu hình `video_generate_audio` trong chuỗi truyền từ DB đến Vertex API đi qua 6 tệp, 4 lớp truyền, và tồn tại bug **giá trị mặc định không nhất quán**:

| Vị trí | Giá trị mặc định |
|------|--------|
| `server/routers/system_config.py` GET | `False` |
| `server/services/generation_tasks.py` `_load_all_config()` | `True` (chuỗi `"true"`) |
| `server/services/generation_tasks.py` fallback ngoại lệ | `True` |
| `lib/media_generator.py` `_resolve_video_generate_audio()` | `True` |
| `lib/gemini_client.py` chữ ký tham số | `True` |
| `lib/system_config.py` (đường dẫn đã loại bỏ) | `True` |

Sau khi người dùng tắt tạo âm thanh trong cấu hình toàn cục hệ thống, do một khâu nào đó trong chuỗi truyền quay lại giá trị mặc định `True`, thực tế vẫn tạo ra âm thanh.

Vấn đề sâu hơn là mang tính kiến trúc: giá trị cấu hình được truyền qua từng lớp tham số (DB → `_BulkConfig` → `get_media_generator()` → `MediaGenerator.__init__()` → `generate_video()`), mỗi lớp đều có giá trị mặc định riêng, chuỗi mong manh và khó bảo trì.

## Giải pháp

Đưa vào `ConfigResolver` làm lớp bao mỏng phía trên của `ConfigService`, cung cấp:

1. **Điểm định nghĩa giá trị mặc định duy nhất** — Loại bỏ các giá trị mặc định lẻ rải trong các tệp (tái dùng hằng số đã có của ConfigService)
2. **Xuất ra có kiểu** — Người gọi nhận được `bool`/`tuple[str, str]`/`dict`, không còn xử lý chuỗi gốc
3. **Phân giải ưu tiên tích hợp** — Cấu hình toàn cục → Ghi đè cấp dự án
4. **Đọc khi dùng** — Mỗi lần gọi đọc từ DB, không cache (chi phí SQLite cục bộ có thể bỏ qua)

## Thiết kế

### Thêm mới：`lib/config/resolver.py`

```python
from sqlalchemy.ext.asyncio import async_sessionmaker
from lib.config.service import ConfigService, _DEFAULT_VIDEO_BACKEND, _DEFAULT_IMAGE_BACKEND
from lib.project_manager import get_project_manager

class ConfigResolver:
    """Bộ phân giải cấu hình thời gian chạy. Mỗi lần gọi đọc từ DB, không cache."""

    # Điểm định nghĩa giá trị mặc định duy nhất. Giá trị mặc định backend tái dùng hằng số của ConfigService.
    _DEFAULT_VIDEO_GENERATE_AUDIO = False

    def __init__(self, session_factory: async_sessionmaker) -> None:
        self._session_factory = session_factory

    async def video_generate_audio(self, project_name: str | None = None) -> bool:
        """Phân giải video_generate_audio.

        Ưu tiên: Ghi đè cấp dự án > Cấu hình toàn cục > Giá trị mặc định(False).
        Ghi đè cấp dự án đọc từ project.json (thông qua ProjectManager).
        """
        # 1. Đọc cấu hình toàn cục từ DB
        async with self._session_factory() as session:
            svc = ConfigService(session)
            raw = await svc.get_setting("video_generate_audio", "")

        if raw:
            value = raw.lower() in ("true", "1", "yes")
        else:
            value = self._DEFAULT_VIDEO_GENERATE_AUDIO

        # 2. Nếu có project_name, đọc ghi đè cấp dự án
        if project_name:
            project = get_project_manager().load_project(project_name)
            override = project.get("video_generate_audio")
            if override is not None:
                value = bool(override) if not isinstance(override, str) else override.lower() in ("true", "1", "yes")

        return value

    async def default_video_backend(self) -> tuple[str, str]:
        """Trả về (provider_id, model_id)。Tái dùng logic phân giải và giá trị mặc định của ConfigService."""
        async with self._session_factory() as session:
            svc = ConfigService(session)
            return await svc.get_default_video_backend()

    async def default_image_backend(self) -> tuple[str, str]:
        """Trả về (provider_id, model_id)。Tái dùng logic phân giải và giá trị mặc định của ConfigService."""
        async with self._session_factory() as session:
            svc = ConfigService(session)
            return await svc.get_default_image_backend()

    async def provider_config(self, provider_id: str) -> dict[str, str]:
        """Lấy cấu hình nhà cung cấp đơn."""
        async with self._session_factory() as session:
            svc = ConfigService(session)
            return await svc.get_provider_config(provider_id)

    async def all_provider_configs(self) -> dict[str, dict[str, str]]:
        """Lấy cấu hình tất cả nhà cung cấp theo lô."""
        async with self._session_factory() as session:
            svc = ConfigService(session)
            return await svc.get_all_provider_configs()
```

### Tái cấu hình：`lib/media_generator.py`

**Xóa bỏ：**
- Tham số `video_generate_audio` trong hàm khởi tạo
- Trường `self._video_generate_audio`
- Phương thức `_resolve_video_generate_audio()`

**Thêm mới：**
- Hàm khởi tạo nhận `config_resolver: ConfigResolver`
- `generate_video()` / `generate_video_async()` gọi `self._config.video_generate_audio(project_name)` để lấy giá trị cấu hình

**Đồng bộ đường `generate_video()`**: Gọi phương thức async của ConfigResolver qua helper `_sync()` hiện có, nhất quán với cách gọi async khác.

**Hạn chế khả năng backend do backend tự xử lý**: ConfigResolver trả về "ý định người dùng", MediaGenerator truyền thực cho backend. Backend quyết định hành vi thực tế `generate_audio` dựa trên khả năng của chính nó và ghi lại giá trị thực qua `VideoGenerationResult.generate_audio`. MediaGenerator trong `finish_call` dùng giá trị thực do backend ghi lại để ghi đè bản ghi usage, đảm bảo thống kê sử dụng nhất quán với hành vi thực tế của API.

```python
# ConfigResolver trả về cấu hình người dùng
configured_generate_audio = await self._config.video_generate_audio(self.project_name)

# MediaGenerator truyền thực cho backend
request = VideoGenerationRequest(..., generate_audio=configured_generate_audio)
result = await self._video_backend.generate(request)

# Backend ghi lại giá trị thực, dùng cho usage tracking
await self.usage_tracker.finish_call(..., generate_audio=result.generate_audio)
```

**Đường GeminiClient** (không phải VideoBackend) vẫn xử lý logic aistudio ép `True` trong MediaGenerator, vì GeminiClient không tuân thủ Protocol VideoBackend.

**Ghi đè cấp gọi `version_metadata`**: Chỉ hỗ trợ trong đường VideoBackend, thực hiện qua `version_metadata.get("generate_audio", configured)`. Đường GeminiClient không hỗ trợ ghi đè này (đã như vậy trước khi tái cấu hình). Chuỗi ưu tiên hoàn chỉnh:
```
VideoBackend đường: version_metadata > Ghi đè cấp dự án > Cấu hình toàn cục > Giá trị mặc định(False)
GeminiClient đường:                   Ghi đè cấp dự án > Cấu hình toàn cục > Giá trị mặc định(False)
                                       ↑ Xử lý nội bộ ConfigResolver
```

### Tái cấu hình：`server/services/generation_tasks.py`

**Xóa bỏ：**
- Data class `_BulkConfig`
- Hàm `_load_all_config()`
- Phân giải tham số `video_generate_audio` và logic ghi đè cấp dự án trong `get_media_generator()`

**Tái cấu hình：**
- `_resolve_video_backend()` / `_resolve_image_backend()` đổi thành nhận `ConfigResolver`, chữ ký đổi thành `async` (vì cần `await resolver.default_video_backend()` v.v. gọi)
- `_get_or_create_video_backend()` đổi thành `async`, nhận `ConfigResolver` (cần `await resolver.provider_config()` thay thế `bulk.get_provider_config()` gốc)
- `get_media_generator()` tạo thực thể `ConfigResolver` và truyền cho `MediaGenerator`

`get_media_generator()` đơn giản hóa sau tái cấu hình:

```python
async def get_media_generator(project_path, project_name, ..., user_id=None):
    resolver = ConfigResolver(async_session_factory)

    image_backend_type, image_model, gemini_config_id = await _resolve_image_backend(resolver, ...)
    video_backend, video_backend_type, video_model = await _resolve_video_backend(resolver, ...)
    gemini_config = await resolver.provider_config(gemini_config_id)

    return MediaGenerator(
        project_path,
        config_resolver=resolver,
        video_backend=video_backend,
        image_backend_type=image_backend_type,
        video_backend_type=video_backend_type,
        gemini_api_key=gemini_config.get("api_key"),
        gemini_base_url=gemini_config.get("base_url"),
        gemini_image_model=image_model,
        gemini_video_model=video_model,
        user_id=user_id,
    )
```

### Tái cấu hình：`server/routers/generate.py`

Trong route `generate_video` dòng 213-216, `_load_all_config()` chỉ dùng trong nhánh `else` (khi dự án không có cấu hình `video_backend`) để lấy backend mặc định toàn cục. Thay thế bằng:

```python
# Trước đó
else:
    from server.services.generation_tasks import _load_all_config
    bulk = await _load_all_config()
    video_provider, video_model = bulk.default_video_backend

# Sau đó
else:
    from lib.config.resolver import ConfigResolver
    from lib.db import async_session_factory
    resolver = ConfigResolver(async_session_factory)
    video_provider, video_model = await resolver.default_video_backend()
```

Cấu trúc nhánh điều kiện không đổi, chỉ thay đổi nguồn dữ liệu trong nhánh else.

### Phần không thay đổi

- **`lib/gemini_client.py`** — Tiếp tục nhận tham số `generate_audio: bool`, nó là client chung, không phụ thuộc vào lớp cấu hình nghiệp vụ
- **`lib/generation_worker.py`** — Đã có đường gọi ConfigService độc lập, không bị ảnh hưởng
- **`server/routers/system_config.py`** — Endpoint GET/PATCH trực tiếp dùng ConfigService đọc ghi giá trị gốc, không bị ảnh hưởng
- **`server/agent_runtime/session_manager.py`** — Dùng ConfigService độc lập, không bị ảnh hưởng
- **`server/routers/projects.py`** — Endpoint ghi `video_generate_audio` cấp dự án không đổi, vẫn ghi vào project.json

### Loại bỏ dọn dẹp

- **`lib/system_config.py`** — Trong đó logic ánh xạ biến môi trường liên quan `video_generate_audio` (`GEMINI_VIDEO_GENERATE_AUDIO`) đã được thay thế bằng đường DB. Sau khi ConfigResolver đưa vào hoạt động, code liên quan audio trong tệp này nên đánh dấu là dead code và dọn dẹp trong lần sau.

## Phạm vi ảnh hưởng

| Tệp | Loại thay đổi |
|------|---------|
| `lib/config/resolver.py` | **Thêm mới** |
| `lib/config/__init__.py` | Xuất ConfigResolver |
| `lib/media_generator.py` | Xóa tham số/phương thức audio, thêm config_resolver；`finish_call` truyền giá trị thực do backend ghi lại |
| `server/services/generation_tasks.py` | Xóa `_BulkConfig`/`_load_all_config()`, dùng ConfigResolver |
| `server/routers/generate.py` | Xóa nhập `_load_all_config()`, dùng ConfigResolver |
| `lib/video_backends/base.py` | `VideoGenerationResult` thêm trường `generate_audio` |
| `lib/video_backends/gemini.py` | `generate()` ghi lại giá trị thực `generate_audio` |
| `lib/video_backends/seedance.py` | `generate()` ghi lại giá trị thực `generate_audio` |
| `lib/video_backends/grok.py` | `generate()` ghi lại giá trị thực `generate_audio` |
| `lib/usage_tracker.py` | `finish_call` thêm tham số tùy chọn `generate_audio` |
| `lib/db/repositories/usage_repo.py` | `finish_call` hỗ trợ ghi đè `generate_audio` bằng giá trị thực backend |
| Tệp kiểm thử | Cập nhật cách tạo MediaGenerator |

## Chiến lược kiểm thử

1. **Kiểm thử đơn vị ConfigResolver**
   - Giá trị mặc định: Trả về `False` khi DB không có giá trị
   - Đọc cấu hình toàn cục: Phân giải đúng chuỗi boolean khi DB có giá trị (`"true"`, `"false"`, `"TRUE"`, `"0"`, `"1"`, `"yes"`)
   - Ưu tiên ghi đè cấp dự án: Ghi đè giá trị toàn cục khi giá trị dự án không phải None
   - Bỏ qua ghi đè cấp dự án khi `project_name=None`
   - Hành vi khi DB ngoại lệ (nên ném ngoại lệ chứ không âm thầm quay lại True)
2. **Kiểm thử tích hợp MediaGenerator**
   - Xác minh `generate_video` lấy cài đặt audio đúng qua ConfigResolver
   - Xác minh backend aistudio vẫn ép `audio=True`
   - Xác minh ghi đè cấp gọi `version_metadata` hoạt động bình thường
3. **Kiểm thử hồi quy** — Các kiểm thử hiện có sau khi thích ứng cách tạo mới nên đều vượt qua
