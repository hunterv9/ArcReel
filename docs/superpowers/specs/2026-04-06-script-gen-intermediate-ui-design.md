# Hiển thị UI sản phẩm trung gian tạo kịch bản và thông báo sự kiện

## Nền tảng

Hiện tại hai chế độ kể chuyện/phim hoạt động mỗi chế độ có một bước tiền đề trước khi tạo kịch bản JSON:

- **Chế độ narration**: subagent `split-narration-segments` tạo `step1_segments.md` (bảng phân đoạn)
- **Chế độ drama**: subagent `normalize-drama-script` tạo `step1_normalized_script.md` (bảng kịch bản chuẩn hóa)

Các sản phẩm trung gian này hoàn toàn không hiển thị cho người dùng — frontend không có UI hiển thị, không có thông báo sự kiện, thanh bên cũng không hiển thị các tập chỉ có step1. Người dùng không thể xem kết quả phân đoạn/chuẩn hóa, cũng không thể cảm nhận quá trình này.

## Mục tiêu

1. Người dùng có thể xem và chỉnh sửa sản phẩm trung gian step1 trong Web UI
2. Khi step1 tạo xong tự động thông báo người dùng và điều hướng đến nội dung tương ứng
3. Các tập chỉ có step1 (chưa có kịch bản JSON cuối cùng) cũng có thể hiển thị trong thanh bên

## Thiết kế giải pháp

### Một, thay đổi backend

#### 1.1 Sửa StatusCalculator

`_load_episode_script()` hiện tại chỉ phát hiện `step1_segments.md`, cần hỗ trợ chế độ drama cùng lúc dựa trên `content_mode`:

- `content_mode === "narration"` → phát hiện `step1_segments.md`
- `content_mode === "drama"` → phát hiện `step1_normalized_script.md`

Khi phát hiện tệp step1 tồn tại trong cả hai chế độ, đều trả về trạng thái `"segmented"`.

#### 1.2 Thêm loại sự kiện `draft`

Trong `ProjectEventService` thêm hai loại sự kiện:

| entity_type | action | Thời điểm kích hoạt |
|-------------|--------|---------|
| `draft` | `created` | Tệp step1 tạo lần đầu (endpoint PUT phát hiện tệp không tồn tại → tạo) |
| `draft` | `updated` | Tệp step1 được chỉnh sửa cập nhật (endpoint PUT phát hiện tệp đã tồn tại → cập nhật) |

Dữ liệu sự kiện chứa trường `focus`, dùng để điều hướng tự động frontend:

```python
focus = {
    "pane": "episode",
    "episode": episode_num,
    "tab": "preprocessing"  # Trường mới, chỉ định Tab kích hoạt
}
```

Trường `label` của sự kiện phân biệt theo content_mode:
- narration: `"Tập N phân đoạn"`
- drama: `"Tập N chuẩn hóa kịch bản"`

#### 1.3 Dọn dẹp drafts API

Xóa ánh xạ tệp step2/step3 trong `server/routers/files.py`, chỉ giữ lại step1:

```python
# chế độ narration
STEP_FILES = {1: "step1_segments.md"}

# chế độ drama
STEP_FILES = {1: "step1_normalized_script.md"}
```

Endpoint `GET/PUT/DELETE /drafts/{episode}/step1` nội bộ dựa trên `content_mode` của `project.json` quyết định thực tế đọc/ghi tệp nào. Frontend gọi thống nhất step1, không cần cảm nhận khác biệt tên tệp.

#### 1.4 Tích hợp kích hoạt sự kiện

Endpoint drafts PUT sau khi lưu thành công, gọi `ProjectEventService` phát sự kiện `draft:created` hoặc `draft:updated`. Subagent tự nhiên kích hoạt chuỗi sự kiện khi lưu tệp qua drafts API hiện có.

### Hai, thay đổi frontend

#### 2.1 Thanh bên (AssetSidebar)

Thay đổi logic render danh sách tập:

- Render bình thường các tập có `status === "segmented"` (hiện tại chỉ `"generated"` và có script_file mới render)
- Kiểu: điểm trạng thái màu xám (`text-gray-500`) + nhãn「Tiền xử lý」bên phải (huy hiệu nhỏ indigo: `text-indigo-400 bg-indigo-950`)
- Nhấp điều hướng đến `/episodes/{N}`, hành vi giống tập bình thường

Các tập không có step1 và không có kịch bản JSON không xuất hiện trong danh sách.

#### 2.2 Tái cấu hình Tab TimelineCanvas

Thêm thanh Tab dưới vùng tiêu đề, hai Tab: 「Tiền xử lý」và「Dòng thời gian kịch bản」.

Quy tắc hiển thị và kích hoạt Tab:

| Trạng thái | Thanh Tab | Kích hoạt mặc định |
|------|--------|---------|
| Chỉ step1, không có kịch bản | Hiển thị, Tab「Dòng thời gian kịch bản」vô hiệu | Tiền xử lý |
| step1 + kịch bản đều có | Hiển thị, cả hai đều có thể nhấp | Dòng thời gian kịch bản |
| Chỉ kịch bản, không có step1 | Không hiển thị thanh Tab | — (giữ hành vi hiện tại) |

Kiểu Tab:
- Trạng thái kích hoạt: `text-indigo-400`, đáy 2px `border-indigo-500`
- Trạng thái không kích hoạt: `text-gray-500`, đáy 2px `transparent`
- Trạng thái vô hiệu: `text-gray-700`, `cursor-not-allowed`

#### 2.3 Component nội dung Tab tiền xử lý (tạo mới)

Tạo component `PreprocessingView`, tham khảo chế độ chuyển đổi chỉnh sửa/xem của `SourceFileViewer`:

**Chế độ xem (mặc định)**:
- Thanh trạng thái trên cùng: bên trái hiển thị trạng thái hoàn thành + timestamp, bên phải nút「Chỉnh sửa」
- Vùng chính: Render Markdown, render bảng Markdown của step1 thành bảng HTML
- Nhãn trạng thái hiển thị văn bản khác nhau theo content_mode:
  - narration: 「Phân đoạn đã hoàn thành」
  - drama: 「Chuẩn hóa kịch bản đã hoàn thành」

**Chế độ chỉnh sửa**:
- Nhấp nút「Chỉnh sửa」để vào
- Trình soạn thảo văn bản textarea (`font-mono`, tham khảo kiểu SourceFileViewer)
- Nút trên cùng đổi thành「Lưu」+「Hủy」
- Lưu gọi `PUT /api/v1/projects/{name}/drafts/{episode}/step1`
- Sau khi lưu thành công tự động thoát chế độ chỉnh sửa, backend phát sự kiện `draft:updated`

#### 2.4 Xử lý sự kiện và điều hướng tự động

Trong hook `useProjectEventsSSE` thêm xử lý cho sự kiện `draft`:

**Thông báo Toast**:
- `draft:created`: Thông báo quan trọng (`important: true`), hiện Toast
  - narration: 「Tập N phân đoạn hoàn thành · XX đoạn · khoảng XXs」
  - drama: 「Tập N chuẩn hóa kịch bản hoàn thành · XX cảnh · khoảng XXs」
- `draft:updated`: Thông báo không quan trọng

**Điều hướng tự động**:
- Sau khi nhận sự kiện `draft:created`, dựa trên trường `focus`:
  1. Điều hướng đến `/episodes/{N}` (nếu không ở trang đó)
  2. Kích hoạt Tab「Tiền xử lý」
- Kích hoạt tải lại dữ liệu dự án (làm mới danh sách tập thanh bên, làm tập mới hiển thị)

**Ưu tiên sự kiện**:
- Trong `CHANGE_PRIORITY` thêm `"draft:created": 6` (sau sự kiện episode, trước storyboard_ready)

## Các tệp liên quan

### Backend
- `lib/status_calculator.py` — Sửa phát hiện step1 chế độ drama
- `server/routers/files.py` — Dọn dẹp ánh xạ step2/step3, tích hợp phát sự kiện
- `server/services/project_events.py` — Thêm loại sự kiện draft và tạo label

### Frontend
- `frontend/src/components/layout/AssetSidebar.tsx` — Thanh bên hỗ trợ trạng thái segmented
- `frontend/src/components/canvas/timeline/TimelineCanvas.tsx` — Thêm thanh Tab
- `frontend/src/components/canvas/timeline/PreprocessingView.tsx` — **Tạo mới**, component nội dung tiền xử lý
- `frontend/src/hooks/useProjectEventsSSE.ts` — Thêm xử lý sự kiện draft
- `frontend/src/types/workspace.ts` — Thêm định nghĩa loại sự kiện draft
- `frontend/src/utils/project-changes.ts` — Thêm văn bản thông báo sự kiện draft
- `frontend/src/api.ts` — Đã có draft API, không cần sửa đổi

### Kiểm thử
- `tests/test_status_calculator.py` — Bổ sung use case phát hiện step1 chế độ drama
- `tests/test_files_router.py` — Cập nhật kiểm thử drafts API (xóa step2/step3)
