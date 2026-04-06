# Các vấn đề đã biết

Các khoản nợ kỹ thuật tồn tại được phát hiện trong quá trình tích hợp nhiều nhà cung cấp tạo video (#98), không ảnh hưởng đến tính chính xác của chức năng, được ghi lại để lặp lại sau này.

---

## ~~1. Logic định tuyến chi phí UsageRepository bị rò rỉ~~ ✅ Đã sửa

**Sửa:** `CostCalculator.calculate_cost()` nhập khẩu thống nhất định tuyến rõ ràng theo `(call_type, provider)`, Repository chỉ gọi một lần. Video Gemini không còn fallthrough ngầm.

---

## ~~2. Cấu trúc chi phí CostCalculator không đối xứng~~ ✅ Đã sửa

**Sửa:** Được giải quyết cùng với Vấn đề 1. `calculate_cost()` nhập khẩu thống nhất ẩn sự khác biệt cấu trúc từ điển tỷ lệ của các nhà cung cấp.

---

## 3. Tham số VideoGenerationRequest bị phình to

**Vị trí:** `lib/video_backends/base.py` — `VideoGenerationRequest`

**Hiện trạng:** Trong dataclass chia sẻ bị trộn các trường riêng của backend (`negative_prompt` là riêng của Veo, `service_tier`/`seed` là riêng của Seedance), dựa vào chú thích "các Backend bỏ qua các trường không được hỗ trợ" để quy ước.

**Đánh giá:** Chỉ có 3 backend với 3 trường riêng, độ phức tạp khi giới thiệu lớp cấu hình per-backend không đáng giá. Đợi khi backend thứ 4 được tích hợp rồi mới tái cấu trúc.

---

## ~~4. Mẫu khối secret SystemConfigManager bị lặp lại~~ ✅ Đã sửa

**Sửa:** Thay thế ~8 khối if/else secret có cùng mẫu trong `_apply_to_env()` bằng tuple + vòng lặp.

---

## 5. UsageRepository finish_call hai lần đi lại DB

**Vị trí:** `lib/db/repositories/usage_repo.py` — `finish_call()`

**Hiện trạng:** Trước tiên `SELECT` đọc toàn bộ hàng (lấy các trường `provider`, `call_type`, v.v. để tính chi phí), sau đó `UPDATE` ghi lại kết quả. Hai lần đi lại DB nối tiếp cho mỗi tác vụ.

**Đánh giá:** Tạo video mất thời gian tính bằng phút, ảnh hưởng của đi lại DB rất nhỏ. Để loại bỏ cần sửa đổi 3 nơi gọi (MediaGenerator, TextGenerator, UsageTracker), rủi ro không đối xứng.

---

## 6. UsageRepository.finish_call() tham số bị phình to

**Vị trí:** `lib/db/repositories/usage_repo.py` — `finish_call()`, `lib/usage_tracker.py` — `finish_call()`

**Hiện trạng:** `finish_call()` đã có 9 tham số từ khóa, và `UsageTracker.finish_call()` phản chiếu truyền qua 1:1.

**Đánh giá:** Liên kết với Vấn đề 5, lợi ích sửa đổi riêng thấp. Đợi Vấn đề 5 tái cấu trúc cùng lúc.

---

## ~~7. call_type chuỗi trần thiếu ràng buộc kiểu~~ ✅ Đã sửa

**Sửa:** Định nghĩa `CallType = Literal["image", "video", "text"]` ở phía Python (`lib/providers.py`), định nghĩa kiểu `CallType` tương ứng ở phía frontend (`frontend/src/types/provider.ts`), sử dụng thống nhất trong chữ ký giao diện.

---

## ~~8. Phương thức truy vấn UsageRepository xây dựng filter bị lặp lại~~ ✅ Đã sửa

**Sửa:** Nâng `_base_filters()` thành phương thức lớp `_build_filters()`, ba phương thức truy vấn chia sẻ.

---

## ~~9. update_project trường backend thiếu kiểm tra tính hợp pháp của provider~~ ✅ Đã sửa

**Sửa:** Trích xuất hàm kiểm tra chia sẻ `validate_backend_value()` (`server/routers/_validators.py`), `update_project()` và `patch_system_config()` sử dụng chung, từ chối giá trị provider/model bất hợp pháp và trả về 400.

---

## ~~10. tệp test_text_backends asyncio.to_thread patch bị lặp lại~~ ✅ Đã sửa

**Sửa:** Trích xuất fixture `sync_to_thread` trong `tests/test_text_backends/conftest.py`, các tệp test chia sẻ.
