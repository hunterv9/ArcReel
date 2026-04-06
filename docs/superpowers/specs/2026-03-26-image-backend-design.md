# Thiết kế lớp dịch vụ tạo ảnh chung Image Backend

> Liên quan Issue: #101, #162
> Ngày: 2026-03-26

## Tổng quan

Trích xuất giao diện trừu tượng `ImageBackend` chung, cho phép nhà cung cấp ảnh cắm được. Phản chiếu mô hình `VideoBackend` hiện có, tích hợp bốn nhà cung cấp: Gemini AI Studio, Gemini Vertex AI, Ark (Volcano Ark Seedream), Grok (xAI Aurora). Đồng thời đổi tên provider `seedance` hiện có thành `ark`, thống nhất Seedance video + Seedream ảnh.

## Nền tảng

Hiện tại tạo ảnh trực tiếp nối `GeminiClient`, không thể tích hợp nhà cung cấp khác. Phía video đã có Protocol `VideoBackend` + Registry + 3 triển khai (Gemini/Seedance/Grok) hoàn chỉnh. Lần này sao chép mô hình này cho phía ảnh, và nhân cơ hội thống nhất tên nhà cung cấp Ark.

## Thiết kế

### 1. Lớp trừu tượng cốt lõi (`lib/image_backends/`)

#### Cấu trúc thư mục

```
lib/image_backends/
├── __init__.py          # auto-register all backends, xuất API chung
├── base.py              # ImageBackend Protocol + Request/Result + Capability enum
├── registry.py          # factory registry (create_backend / register_backend)
├── gemini.py            # GeminiImageBackend (AI Studio + Vertex AI)
├── ark.py               # ArkImageBackend (Seedream)
└── grok.py              # GrokImageBackend (Aurora)
```

#### Mô hình dữ liệu (`base.py`)

```python
class ImageCapability(str, Enum): # Kế thừa str để hỗ trợ so sánh chuỗi, nhất quán với VideoCapability
    TEXT_TO_IMAGE = "text_to_image"
    IMAGE_TO_IMAGE = "image_to_image"

@dataclass
class ReferenceImage:
    path: str              # Đường dẫn tệp cục bộ
    label: str = ""        # Nhãn tùy chọn (như "tham chiếu nhân vật")

@dataclass
class ImageGenerationRequest:
    prompt: str
    output_path: Path
    reference_images: list[ReferenceImage] = field(default_factory=list)
    aspect_ratio: str = "9:16"
    image_size: str = "1K"       # "1K", "2K"; các Backend bỏ qua trường không hỗ trợ
    project_name: str | None = None
    model: str
    image_uri: str | None = None   # URL từ xa (nếu có)
    seed: int | None = None

@dataclass
class ImageGenerationResult:
    image_path: Path
    provider: str            # "gemini-aistudio", "gemini-vertex", "ark", "grok"
    model: str
    image_uri: str | None = None   # URL từ xa (nếu có)
    seed: int | None = None
    usage_tokens: int | None = None
```

#### Registry (`registry.py`)

Hoàn toàn đối xứng với `video_backends/registry.py`:

- `register_backend(name, factory)` — Đăng ký hàm nhà máy
- `create_backend(name, **kwargs)` — Tạo thực thể
- `get_registered_backends()` — Liệt kê các backend đã đăng ký

### 2. Bốn triển khai cụ thể

#### 2.1 GeminiImageBackend (`gemini.py`)

- **Provider ID**: `gemini-aistudio` / `gemini-vertex` (phân biệt qua tham số `backend_type`)
- **SDK**: `google-genai`
- **Mô hình mặc định**: `gemini-3.1-flash-image-preview`
- **Khả năng**: `TEXT_TO_IMAGE`, `IMAGE_TO_IMAGE`
- **API**: `client.aio.models.generate_content(model, contents, config)`
- **Xử lý ảnh tham chiếu**: Di chuyển logic `_build_contents_with_labeled_refs()` từ `gemini_client.py`, chuyển danh sách `ReferenceImage` thành chuỗi contents `[label, PIL.Image, ...]`
- **Tham số khởi tạo**: `backend_type`, `api_key`, `rate_limiter`, `image_model`, `base_url`(AI Studio), `credentials_path`/`gcs_bucket`(Vertex)
- **Chứng thực Vertex**: Di chuyển logic khởi tạo chứng thực chế độ Vertex từ `GeminiClient` (`service_account.Credentials.from_service_account_file()`), truyền qua tham số `credentials_path`

#### 2.2 ArkImageBackend (`ark.py`)

- **SDK**: `volcenginesdkarkruntime.Ark` → `client.images.generate()`
- **Mô hình mặc định**: `doubao-seedream-5-0-lite-260128`
- **Khả năng**: `TEXT_TO_IMAGE`, `IMAGE_TO_IMAGE`
- **Mô hình tùy chọn**: `doubao-seedream-5-0-lite-260128`, `doubao-seedream-4-5-251128`, `doubao-seedream-4-0-250828`
- **Gọi API**: SDK đồng bộ được bao bọc qua `asyncio.to_thread()`
- **Xử lý ảnh tham chiếu**: Đọc đường dẫn `ReferenceImage` thành base64, truyền qua tham số `image` (hỗ trợ nhiều ảnh)
- **Tham số khởi tạo**: `api_key`, `model`

#### 2.3 GrokImageBackend (`grok.py`)

- **SDK**: `xai_sdk.AsyncClient` → `client.image.sample()`
- **Mô hình mặc định**: `grok-imagine-image`
- **Mô hình tùy chọn**: `grok-imagine-image-pro`
- **Khả năng**: `TEXT_TO_IMAGE`, `IMAGE_TO_IMAGE`
- **Tạo**: `client.image.sample(prompt, model, aspect_ratio, resolution)`
- **Chỉnh sửa (I2I)**: `client.image.sample(prompt, model, image_url="data:image/png;base64,...")`, phương thức `sample()` của SDK tự động đi đường chỉnh sửa khi truyền `image_url`
- **Xử lý ảnh tham chiếu**: Đọc tấm `ReferenceImage` đầu tiên thành base64 data URI truyền vào `image_url`; trường hợp nhiều ảnh tham chiếu cần xác nhận SDK có hỗ trợ tham số mảng `images`, không hỗ trợ thì lấy tấm đầu tiên
- **Tham số khởi tạo**: `api_key`, `model`

#### 2.4 Chiến lược xử lý Reference Images

Mỗi backend nhận thống nhất `list[ReferenceImage]`, tự chuyển đổi nội bộ:

| Backend | Cách chuyển đổi |
|------|---------|
| Gemini | `PIL.Image` + nhãn chèn vào danh sách contents |
| Ark | Danh sách chuỗi base64 truyền vào tham số `image` |
| Grok | Tấm đầu tiên chuyển thành base64 data URI truyền vào `image_url`, nhiều tấm qua mảng `images` |

Khi không hỗ trợ `IMAGE_TO_IMAGE` (không xảy ra, vì cả bốn backend đều hỗ trợ I2I), bỏ qua reference_images và log warning.

### 3. Thay đổi lớp tích hợp

#### 3.1 GenerationWorker (`lib/generation_worker.py`)

- `_extract_provider()` hiện tại đã hỗ trợ phân giải provider cho tác vụ ảnh, **không cần sửa đổi**
- `_normalize_provider_id()` thêm ánh xạ `"seedance": "ark"`, đảm bảo tác vụ trong hàng đợi lịch sử được định tuyến đúng
- Chuỗi ưu tiên: payload chỉ định rõ > project.json `image_backend` > toàn cục `default_image_backend` > giá trị mã hóa cứng

#### 3.2 generation_tasks.py (`server/services/generation_tasks.py`)

- **Xóa bỏ** `_resolve_image_backend()` (trước trả về ba tuple Gemini-only)
- **Thêm mới** `_get_or_create_image_backend(provider_name, provider_settings, resolver, default_image_model)` hàm nhà máy, trả về thực thể `ImageBackend`
- Đối xứng `_get_or_create_video_backend()`, mang theo cache thực thể
- Tạo thực thể qua `image_backends.create_backend(provider_id, **config)`
- Cập nhật ánh xạ `_PROVIDER_ID_TO_BACKEND`: `"seedance"` → `"ark"`
- Cập nhật ánh xạ `_DEFAULT_VIDEO_RESOLUTION`: key cập nhật `PROVIDER_SEEDANCE` → `PROVIDER_ARK`
- Trong `get_media_generator()`: không còn truyền `image_backend_type` / `gemini_api_key` / `gemini_base_url` / `gemini_image_model` cho đường ảnh, đổi thành tiêm thực thể `image_backend` (chỉ giữ config Gemini cho tạo văn bản cần)

#### 3.3 MediaGenerator (`lib/media_generator.py`)

Hàm khởi tạo thêm tham số `image_backend`:

```python
def __init__(
    self,
    project_path: Path,
    image_backend: ImageBackend | None = None,  # Thêm mới
    ...
):
    self._image_backend = image_backend
```

`generate_image()` / `generate_image_async()` **bỏ qua GeminiClient fallback**, thống nhất đi qua `ImageBackend`:

```python
async def generate_image_async(self, request: ImageGenerationRequest) -> ImageGenerationResult:
    if self._image_backend is None:
        raise RuntimeError("image_backend not configured")
    result = await self._image_backend.generate(request)
    return result
```

Kịch bản gọi trực tiếp MediaGenerator do người gọi chịu trách nhiệm tạo thực thể backend (qua `image_backends.create_backend()` là được).

#### 3.4 ConfigResolver

Đã có `default_image_backend()` trả về `(provider_id, model_id)`, **không cần sửa đổi**.

### 4. Đổi tên Provider: `seedance` → `ark`

#### 4.1 DB Migration

Thêm Alembic migration:

```sql
UPDATE provider_config SET provider = 'ark' WHERE provider = 'seedance';
UPDATE system_setting SET value = REPLACE(value, 'seedance/', 'ark/')
    WHERE key IN ('default_video_backend', 'default_image_backend');
```

#### 4.2 Thay đổi code

| Tệp | Thay đổi |
|------|------|
| `lib/video_backends/seedance.py` | Đổi tên thành `lib/video_backends/ark.py`, tên lớp `SeedanceVideoBackend` → `ArkVideoBackend` |
| `lib/video_backends/base.py` | `PROVIDER_SEEDANCE` → `PROVIDER_ARK` |
| `lib/video_backends/__init__.py` | Cập nhật import và đăng ký |
| `lib/config/registry.py` | key `"seedance"` → `"ark"`, cập nhật description, `media_types` thêm `"image"` |
| `server/routers/system_config.py` | key `_PROVIDER_MODELS` đổi thành `"ark"`, thêm danh sách mô hình image |
| `lib/cost_calculator.py` | `calculate_seedance_video_cost` → `calculate_ark_video_cost`; hằng số `SEEDANCE_VIDEO_COST` / `DEFAULT_SEEDANCE_MODEL` đổi tên thành `ARK_VIDEO_COST` / `DEFAULT_ARK_MODEL` |
| `lib/db/repositories/usage_repo.py` | Cập nhật logic khớp provider |
| `server/services/generation_tasks.py` | `_PROVIDER_ID_TO_BACKEND`: `"seedance"` → `"ark"`; `_DEFAULT_VIDEO_RESOLUTION`: key cập nhật |
| `lib/generation_worker.py` | `_normalize_provider_id()` thêm ánh xạ `"seedance": "ark"` tương thích ngược |
| Toàn cục | Tìm kiếm thay thế `PROVIDER_SEEDANCE` → `PROVIDER_ARK`, `"seedance"` → `"ark"` |

#### 4.x project.json tương thích ngược

`project.json` hiện tại có thể chứa `"video_provider": "seedance"` hoặc `"image_backend": "seedance/..."`. Thực hiện tương thích ngược thời gian chạy qua ánh xạ `"seedance" → "ark"` của `_normalize_provider_id()`, không cần di chuyển tệp.

#### 4.3 Mở rộng Grok Provider

Trong `lib/config/registry.py`, `media_types` của `"grok"` cập nhật thành `["video", "image"]`, `optional_keys` thêm `image_rpm`, `image_max_workers`.

#### 4.4 Cập nhật `_PROVIDER_MODELS`

```python
_PROVIDER_MODELS = {
    "gemini-aistudio": {
        "video": ["veo-3.1-generate-preview", "veo-3.1-fast-generate-preview"],
        "image": ["gemini-3.1-flash-image-preview"],
    },
    "gemini-vertex": {
        "video": ["veo-3.1-generate-001", "veo-3.1-fast-generate-001"],
        "image": ["gemini-3.1-flash-image-preview"],
    },
    "ark": {
        "video": ["doubao-seedance-1-5-pro-251215"],
        "image": ["doubao-seedream-5-0-lite-260128", "doubao-seedream-4-5-251128",
                    "doubao-seedream-4-0-250828"],
    },
    "grok": {
        "video": ["grok-imagine-video"],
        "image": ["grok-imagine-image", "grok-imagine-image-pro"],
    },
}
```

### 5. Mở rộng tính phí

#### 5.1 CostCalculator thêm phương thức

```python
def calculate_ark_image_cost(self, model: str | None = None, n: int = 1) -> tuple[float, str]:
    """Ảnh Ark tính phí theo tấm, trả về (cost, 'CNY')"""
    # doubao-seedream-5-0: 0.22, 4-5: 0.25, 4-0: 0.20, 5-0-lite: 0.22

def calculate_grok_image_cost(self, model: str | None = None, n: int = 1) -> float:
    """Ảnh Grok tính phí theo tấm, trả về USD"""
    # grok-imagine-image: $0.02, grok-imagine-image-pro: $0.07
```

**Mô tả kiểu trả về**: Giữ nhất quán với mô hình hiện tại (Ark trả về `tuple[float, str]` chứa currency, Grok/Gemini trả về `float` mặc định USD). UsageRepository quyết định currency theo loại provider: Ark series đặt `currency = "CNY"`, còn lại mặc định `"USD"`.

#### 5.2 UsageRepository mở rộng định tuyến chi phí

```python
elif row.call_type == "video":
    ...  # Logic hiện tại, seedance → ark đổi tên
```

`start_call()` đã hỗ trợ tham số `provider`, **giao diện không đổi**. MediaGenerator truyền đúng tên provider là được.

### 6. Dọn dẹp code chết

#### 6.1 Tinh gọn GeminiClient

Xóa bỏ từ `lib/gemini_client.py`:

- `generate_image()` / `generate_image_async()` / `generate_image_with_chat()` — được `GeminiImageBackend` thay thế
- `generate_video()` — đã được `GeminiVideoBackend` thay thế
- `_build_contents_with_labeled_refs()` — di chuyển đến `GeminiImageBackend`
- `_prepare_image_config()` / `_process_image_response()` — di chuyển đến `GeminiImageBackend`
- `_normalize_reference_image()` / `_extract_name_from_path()` / `_load_image_detached()` — di chuyển đến `GeminiImageBackend`
- `IMAGE_MODEL` / `VIDEO_MODEL` thuộc tính — không còn cần

Giữ lại:
- Hằng số `VERTEX_SCOPES`
- Lớp `RateLimiter` + `get_shared_rate_limiter()` / `refresh_shared_rate_limiter()`
- Decorator `with_retry()` / `with_retry_async()`
- Lớp `GeminiClient` tinh gọn thành client tạo văn bản thuần túy (giữ thuộc tính `client` + hàm khởi tạo)

#### 6.2 Di chuyển kiểu

- Alias kiểu `ReferenceImageInput` / `ReferenceImageValue` di chuyển từ `gemini_client.py` đến `image_backends/base.py`
- Cập nhật tất cả import tham chiếu

#### 6.3 Xóa phụ thuộc MediaGenerator vào GeminiClient

Xóa phụ thuộc của `MediaGenerator` vào `GeminiClient` cho tạo ảnh/video (như mục 3.3). `image_backend` là tiêm bắt buộc, kịch bản gọi trực tiếp do người gọi tạo thực thể qua `image_backends.create_backend()`. `MediaGenerator` không còn trực tiếp import `GeminiClient`.

### 7. Xử lý lỗi

- **Lỗi mạng/API**: Ném trực tiếp, Worker ghi `status=failed` + `error_message`
- **Từ chối kiểm duyệt**: Grok `respect_moderation=False`, Ark mã lỗi cụ thể → ném ngoại mô tả thống nhất
- **Khả năng không khớp**: Truyền `reference_images` nhưng backend không hỗ trợ `IMAGE_TO_IMAGE` → bỏ qua ảnh tham chiếu quay lại T2I, log warning (không ngắt, cả bốn backend đều hỗ trợ I2I, nhánh này là code phòng thủ)
- **Thử lại**: Lớp SDK xử lý lỗi API nhất thời (429/503) qua `@with_retry_async`; thất bại vĩnh cửu trực tiếp đánh dấu `failed` kết thúc, do người dùng quyết định có thử lại hay không

### 8. Chiến lược kiểm thử

#### Kiểm thử đơn vị (`tests/test_image_backends/`)

- Mỗi backend một tệp kiểm thử, mock SDK gọi
- Xác minh chuyển đổi `ImageGenerationRequest` → tham số SDK
- Xác minh chuyển đổi định dạng reference_images (base64, PIL, data URI)
- Xác minh khai báo capabilities nhất quán với hành vi

#### Kiểm thử tích hợp

- `test_generation_tasks.py` — Xác minh logic nhà máy `_get_or_create_image_backend()`
- `test_media_generator.py` — Xác minh luồng `generate_image()` sau khi tiêm image_backend
- `test_cost_calculator.py` — Thêm use case tính phí ảnh ark/grok

#### Fakes

- `tests/fakes.py` thêm `FakeImageBackend`, triển khai `ImageBackend` Protocol

#### Kiểm thử DB Migration

- Kịch bản bảng trống di chuyển bình thường
- Cấu hình `seedance` hiện có cập nhật đúng thành `ark`

## Không trong phạm vi

- Thay đổi UI frontend (`MediaModelSection` đã hỗ trợ chọn image backend, dữ liệu điều khiển)
- UI cấu hình cấp dự án (đã hỗ trợ trường `project.json`)
- Batch generation (tạo nhóm ảnh) — mở rộng `ImageCapability` theo nhu cầu sau
- Khả năng hội thoại nhiều vòng `generate_image_with_chat()` — Gemini riêng, không đưa vào Protocol chung
