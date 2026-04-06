# Hướng dẫn xuất bản thảo JianYing

Xuất các đoạn video đã tạo trong ArcReel theo tập thành tệp bản thảo JianYing (JianYing), mở trực tiếp trong phiên bản máy tính JianYing để chỉnh sửa lần hai — điều chỉnh nhịp độ, thêm phụ đề, chuyển cảnh, lồng tiếng, v.v.

## Điều kiện tiên quyết

- Đã hoàn thành tạo ít nhất một tập đoạn video trong ArcReel
- Đã cài đặt **JianYing phiên bản máy tính** (5.x hoặc 6+)

## Các bước thực hiện

### 1. Tìm thư mục bản thảo JianYing

Trước khi xuất cần biết đường dẫn lưu trữ bản thảo JianYing cục bộ.

**macOS:**
```
/Users/<Tên người dùng>/Movies/JianyingPro/User Data/Projects/com.lveditor.draft
```

**Windows:**
```
C:\Users\<Tên người dùng>\AppData\Local\JianyingPro\User Data\Projects\com.lveditor.draft
```

> **Gợi ý**: Có thể xem vị trí "Đường dẫn bản thảo" trong cài đặt JianYing. Nếu bạn đã sửa đổi đường dẫn mặc định, vui lòng sử dụng thư mục bản thảo thực tế.

### 2. Khởi tạo xuất trong ArcReel

1. Mở dự án mục tiêu
2. Nhấp vào nút **Xuất** ở góc trên bên phải
3. Chọn **Xuất thành bản thảo JianYing**

### 3. Điền tham số xuất

| Tham số | Mô tả |
|------|------|
| **Tập** | Chọn tập để xuất (dự án nhiều tập sẽ xuất hiện bộ chọn thả xuống) |
| **Phiên bản JianYing** | Chọn **6.0+** (khuyến nghị) hoặc **5.x**, cần khớp với phiên bản JianYing đã cài đặt cục bộ |
| **Thư mục bản thảo** | Điền đường dẫn thư mục bản thảo JianYing đã tìm ở trên (sẽ tự động ghi nhớ sau khi điền lần đầu) |

Nhấp vào **Xuất bản thảo**, trình duyệt sẽ tải xuống một tệp ZIP.

### 4. Giải nén vào thư mục bản thảo

Giải nén tệp ZIP đã tải xuống vào thư mục bản thảo JianYing đã điền ở trên. Cấu trúc sau khi giải nén như sau:

```
com.lveditor.draft/
├── ... (các bản thảo khác đã có)
└── {Tên dự án}_Tập{N}/          ← Thư mục giải nén ra
    ├── draft_info.json        (JianYing 6+) hoặc draft_content.json (5.x)
    ├── draft_meta_info.json
    └── assets/
        ├── segment_S1.mp4
        ├── segment_S2.mp4
        └── ...
```

### 5. Mở trong JianYing

1. Mở (hoặc khởi động lại) JianYing phiên bản máy tính
2. Trong danh sách "Bản thảo", tìm bản thảo **{Tên dự án}\_Tập{N}** mới xuất hiện
3. Nhấp đúp để mở, có thể thấy tất cả đoạn video trên dòng thời gian

## Mô tả nội dung xuất

### Chế độ kể chuyện (Narration)

- **Dòng video**: Tất cả đoạn video đã tạo được sắp xếp theo thứ tự
- **Dòng phụ đề**: Tự động đính kèm văn bản tiểu thuyết gốc tương ứng với mỗi đoạn làm phụ đề (chữ trắng, viền đen), có thể tự do điều chỉnh kiểu và vị trí trong JianYing

### Chế độ phim (Drama)

- **Dòng video**: Sắp xếp tất cả đoạn video đã tạo theo thứ tự cảnh
- Không đính kèm phụ đề (cấu trúc phụ đề cảnh hội thoại nhiều nhân vật khá phức tạp, khuyến nghị thêm thủ công trong JianYing)

### Kích thước canvas

Tự động xác định theo cài đặt dự án:
- Dọc (9:16) → 1080×1920
- Ngang (16:9) → 1920×1080

Nếu dự án chưa đặt tỷ lệ khung hình, sẽ tự động phát hiện từ tệp video đầu tiên.

## Câu hỏi thường gặp

### Không thấy bản thảo xuất trong JianYing?

- Xác nhận ZIP đã giải nén vào đúng thư mục bản thảo
- Xác nhận thư mục sau khi giải nén nằm trực tiếp dưới thư mục bản thảo (không được lồng thêm một lớp thư mục)
- Thử khởi động lại JianYing

### Làm gì khi phiên bản không khớp?

Phiên bản JianYing được chọn khi xuất phải tương ứng với phiên bản đã cài đặt cục bộ:
- JianYing 6.0 trở lên → Chọn **6.0+**
- JianYing 5.x → Chọn **5.x**

Nếu chọn sai phiên bản, xuất lại và chọn phiên bản đúng là được.

### Thiếu một số đoạn video?

Xuất chỉ bao gồm các đoạn video đã tạo thành công. Nếu một số đoạn chưa tạo hoặc tạo thất bại, chúng sẽ không xuất hiện trong bản thảo. Quay lại ArcReel bổ sung tạo rồi xuất lại là được.
