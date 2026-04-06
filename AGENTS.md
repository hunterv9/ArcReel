# AGENTS.md

Tệp này cung cấp hướng dẫn cho Codex (Codex.ai/code) khi làm việc với mã nguồn trong kho lưu trữ này.

## Quy tắc ngôn ngữ
- **Phải sử dụng tiếng Việt khi trả lời người dùng**: Tất cả các câu trả lời, quá trình suy nghĩ, danh sách nhiệm vụ và tệp kế hoạch đều phải sử dụng tiếng Việt.

## Tổng quan dự án

ArcReel là một nền tảng tạo video AI, chuyển đổi tiểu thuyết thành video ngắn. Kiến trúc ba lớp:

```
frontend/ (React SPA)  →  server/ (FastAPI)  →  lib/ (Thư viện lõi)
  React 19 + Tailwind       Phân phối route + SSE    Gemini API
  wouter routing            agent_runtime/           GenerationQueue
  zustand state management  (Claude Agent SDK)       ProjectManager
```

## Lệnh phát triển

```bash
# Backend
uv run python -m pytest                              # Kiểm thử (-v đơn tệp / -k từ khóa / --cov độ bao phủ)
uv run ruff check . && uv run ruff format .          # lint + format
uv sync                                              # Cài đặt phụ thuộc
uv run alembic upgrade head                          # Di chuyển cơ sở dữ liệu
uv run alembic revision --autogenerate -m "desc"     # Tạo file di chuyển

# Frontend (cd frontend &&)
pnpm build       # Build sản xuất (bao gồm typecheck)
pnpm check       # typecheck + test
```

## Các điểm quan trọng về kiến trúc

### Route API Backend

Tất cả API nằm dưới `/api/v1`, định nghĩa route trong `server/routers/`:
- `projects.py` — CRUD dự án, tạo bản tóm tắt
- `generate.py` — Tạo phân cảnh/video/nhân vật/manh mối (đưa vào hàng đợi tác vụ)
- `assistant.py` — Quản lý phiên Claude Agent SDK (luồng SSE)
- `agent_chat.py` — Tương tác hội thoại của agent
- `tasks.py` — Trạng thái hàng đợi tác vụ (luồng SSE)
- `project_events.py` — Đẩy sự kiện dự án qua SSE
- `files.py` — Tải lên tệp và tài nguyên tĩnh
- `versions.py` — Lịch sử phiên bản tài nguyên và hoàn tác
- `characters.py` / `clues.py` — Quản lý nhân vật/manh mối
- `usage.py` — Thống kê sử dụng API
- `auth.py` / `api_keys.py` — Xác thực và quản lý khóa API
- `system_config.py` — Cấu hình hệ thống
- `providers.py` — Quản lý cấu hình nhà cung cấp có sẵn (danh sách, đọc/ghi, kiểm tra kết nối)
- `custom_providers.py` — CRUD nhà cung cấp tùy chỉnh, quản lý và khám phá mô hình, kiểm tra kết nối

### server/services/ — Lớp dịch vụ nghiệp vụ

- `generation_tasks.py` — Điều phối tác vụ tạo phân cảnh/video/nhân vật/manh mối
- `project_archive.py` — Xuất dự án (đóng gói ZIP)
- `project_events.py` — Phát hành sự kiện thay đổi dự án
- `jianying_draft_service.py` — Xuất bản thảo Cắt Ảnh (Jianying)

### lib/ Các mô đun lõi

- **{gemini,ark,grok,openai}_shared** — Nhà máy SDK và công cụ dùng chung cho từng nhà cung cấp
- **image_backends/** / **video_backends/** / **text_backends/** — Backend tạo đa phương tiện của nhiều nhà cung cấp, mẫu Registry + Factory (gemini/ark/grok/openai)
- **custom_provider/** — Hỗ trợ nhà cung cấp tùy chỉnh: đóng gói backend, khám phá mô hình, tạo nhà máy (tương thích OpenAI/Google)
- **MediaGenerator** (`media_generator.py`) — Kết hợp Backend + VersionManager + UsageTracker
- **GenerationQueue** (`generation_queue.py`) — Hàng đợi tác vụ bất đồng bộ, backend SQLAlchemy ORM, kiểm soát đồng thời dựa trên lease
- **GenerationWorker** (`generation_worker.py`) — Worker chạy nền, phân chia hai luồng đồng thời cho hình ảnh/video
- **ProjectManager** (`project_manager.py`) — Thao tác hệ thống tệp và quản lý dữ liệu dự án
- **StatusCalculator** (`status_calculator.py`) — Tính toán các trường trạng thái khi đọc, không lưu trữ trạng thái dư thừa
- **UsageTracker** (`usage_tracker.py`) — Theo dõi sử dụng API
- **CostCalculator** (`cost_calculator.py`) — Tính toán chi phí
- **TextGenerator** (`text_generator.py`) — Tác vụ tạo văn bản

### lib/config/ — Hệ thống cấu hình nhà cung cấp

ConfigService (`service.py`) → Repository (Lưu trữ + làm sạch khóa) → Resolver (Phân giải). `registry.py` duy trì bảng đăng ký nhà cung cấp có sẵn (PROVIDER_REGISTRY).

### lib/db/ — Lớp SQLAlchemy Async ORM

- `engine.py` — Engine bất đồng bộ + session factory (`DATABASE_URL` mặc định là `sqlite+aiosqlite`)
- `models/` — Các mô hình ORM: Tác vụ / Lời gọi API / Khóa API / Phiên Agent / Cấu hình / Thông tin xác thực / Người dùng / Nhà cung cấp tùy chỉnh / Mô hình nhà cung cấp tùy chỉnh
- `repositories/` — Repository bất đồng bộ: Tác vụ / Sử dụng / Phiên / Khóa API / Thông tin xác thực / Nhà cung cấp tùy chỉnh

Tệp cơ sở dữ liệu: `projects/.arcreel.db` (SQLite phát triển)

### Agent Runtime (Tích hợp Claude Agent SDK)

`server/agent_runtime/` đóng gói Claude Agent SDK:
- `AssistantService` (`service.py`) — Điều phối phiên hội thoại Claude SDK
- `SessionManager` — Vòng đời phiên + mẫu người đăng ký SSE
- `StreamProjector` — Xây dựng câu trả lời của trợ lý thời gian thực từ các sự kiện luồng

### Frontend

- React 19 + TypeScript + Tailwind CSS 4
- Định tuyến: `wouter` (không phải React Router)
- Quản lý trạng thái: `zustand` (các store nằm trong `frontend/src/stores/`)
- Alias đường dẫn: `@/` → `frontend/src/`
- Proxy Vite: `/api` → `http://127.0.0.1:1241`

## Các mẫu thiết kế chính

### Phân tầng dữ liệu

| Loại dữ liệu | Vị trí lưu trữ | Chiến lược |
|---------|---------|------|
| Định nghĩa nhân vật/manh mối | `project.json` | Nguồn sự thật duy nhất, trong kịch bản chỉ tham chiếu tên |
| Siêu dữ liệu tập phim (tập/tiêu đề/tệp kịch bản) | `project.json` | Đồng bộ hóa khi lưu kịch bản |
| Các trường thống kê (scenes_count / status / progress) | Không lưu trữ | Được chèn bởi `StatusCalculator` khi đọc |

### Giao tiếp thời gian thực

- Trợ lý: `/api/v1/assistant/sessions/{id}/stream` — Phản hồi luồng SSE
- Sự kiện dự án: `/api/v1/projects/{name}/events/stream` — Đẩy thay đổi dự án qua SSE
- Hàng đợi tác vụ: Frontend thăm dò `/api/v1/tasks` để lấy trạng thái

### Hàng đợi tác vụ

Tất cả các tác vụ tạo (phân cảnh/video/nhân vật/manh mối) đều được đưa vào hàng đợi thông qua GenerationQueue và được xử lý bất đồng bộ bởi GenerationWorker.
Hàm `enqueue_and_wait()` trong `generation_queue_client.py` đóng gói việc đưa vào hàng đợi + chờ hoàn thành.

### Mô hình dữ liệu Pydantic

`lib/script_models.py` định nghĩa `NarrationSegment` và `DramaScene`, dùng để xác thực kịch bản.
`lib/data_validator.py` xác thực cấu trúc và tính toàn vẹn tham chiếu của `project.json` và JSON của tập phim.

## Môi trường chạy Agent

Cấu hình dành riêng cho agent (kỹ năng, agent, prompt hệ thống) nằm trong thư mục `agent_runtime_profile/`,
tách biệt vật lý với thư mục phát triển `.claude/`.

### Duy trì Skill (Kỹ năng)

```bash
# Đánh giá tỷ lệ kích hoạt (cần anthropic SDK: uv pip install anthropic)
PYTHONPATH=~/.claude/plugins/cache/claude-plugins-official/skill-creator/*/skills/skill-creator:$PYTHONPATH \
  uv run python -m scripts.run_eval \
  --eval-set <eval-set.json> \
  --skill-path agent_runtime_profile/.claude/skills/<skill-name> \
  --model sonnet --runs-per-query 2 --verbose
```

#### Lưu ý (Gotchas)

- **Đồng bộ SKILL.md và tập lệnh**: Khi sửa đổi tập lệnh skill, cần cập nhật đồng thời SKILL.md và ngược lại, cả hai phải nhất quán.

## Cấu hình môi trường

Sao chép `.env.example` thành `.env`, thiết lập các tham số xác thực (`AUTH_USERNAME`/`AUTH_PASSWORD`/`AUTH_TOKEN_SECRET`).
Khóa API, lựa chọn backend, cấu hình mô hình, v.v. được quản lý qua trang cấu hình WebUI (`/settings`).
Phụ thuộc công cụ bên ngoài: `ffmpeg` (ghép nối video và hậu kỳ).

### Chất lượng mã nguồn

**ruff** (lint + format):
- Tập quy tắc: `E`/`F`/`I`/`UP`, bỏ qua `E402` (mẫu hiện có) và `E501` (được quản lý bởi formatter)
- Độ dài dòng: 120
- Loại trừ: thư mục `.worktrees`, `.claude/worktrees`
- Kiểm tra bắt buộc trong CI: `ruff check . && ruff format --check .`

**pytest**:
- `asyncio_mode = "auto"` (không cần đánh dấu async test thủ công)
- Phạm vi kiểm thử: `lib/` và `server/`, yêu cầu CI ≥80%
- Các fixture dùng chung trong `tests/conftest.py`, factory trong `tests/factories.py`, fake trong `tests/fakes.py`
- Phụ thuộc test trong `[dependency-groups] dev`, `uv sync` cài đặt mặc định, hình ảnh production loại trừ qua `--no-dev`
