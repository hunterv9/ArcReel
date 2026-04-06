# Tham khảo chi phí Volcano Ark

---

# Mô tả tính phí mô hình tạo video (Seedance)

Mô hình tạo video sử dụng **suy luận bất đồng bộ**, tính phí theo lượng token tiêu thụ của video đầu ra (nhân dân tệ/million token).

## 1. Bảng giá theo Token

| **Tên mô hình**                     | **Suy luận trực tuyến (nhân dân tệ/million token)**                        | **Suy luận ngoại tuyến (nhân dân tệ/million token)** |
| -------------------------------- | -------------------------------------------------- | --------------------------- |
| **doubao-seedance-2.0**          | - Đầu vào không có video: 46.00 - Đầu vào có video: 28.00        | Chưa hỗ trợ                    |
| **doubao-seedance-2.0-fast**     | - Đầu vào không có video: 37.00 - Đầu vào có video: 22.00        | Chưa hỗ trợ                    |
| **doubao-seedance-1.5-pro**      | - Có âm thanh: 16.00 - Không có âm thanh: 8.00                         | - Có âm thanh: 8.00 - Không có âm thanh: 4.00   |
| **doubao-seedance-1.0-pro**      | 15.00                                              | 7.50                        |
| **doubao-seedance-1.0-pro-fast** | 4.20                                               | 2.10                        |
| **doubao-seedance-1-0-lite**     | 10.00                                              | 5.00                        |

### Quy tắc tính phí và mô tả ước tính Token:

- **Điều kiện tính phí**: Chỉ tính phí cho video được tạo thành công. Video tạo thất bại do kiểm duyệt v.v. không tính phí.
- **Công thức ước tính giá video**: `Đơn giá theo token × lượng sử dụng token`
- **Ước tính token Seedance 2.0 / 2.0-fast**: `(Thời lượng video đầu vào + Thời lượng video đầu ra) × Rộng × Cao × Tốc độ khung hình / 1024`
  - *Lưu ý: Khi đầu vào có video, có giới hạn lượng sử dụng token tối thiểu (xem bảng dưới), nếu lượng ước tính < giới hạn tối thiểu, tính phí theo giới hạn tối thiểu.*
- **Ước tính token Seedance 1.x**: `(Rộng × Cao × Tốc độ khung hình × Thời lượng) / 1024`
- **Công thức ước tính video Draft (chỉ 480p)**: `Lượng sử dụng token video bình thường × Hệ số quy đổi`
  - *Lưu ý: Hệ số quy đổi token của `doubao-seedance-1.5-pro` là: không có âm thanh 0.7; có âm thanh 0.6.*
- **Lượng sử dụng chính xác**: Dựa trên trường `usage` trong thông tin trả về sau khi gọi API.

## 2. Ví dụ giá

### doubao-seedance-2.0 & 2.0-fast

#### Đầu vào không có video

| **Độ phân giải** | **Tỷ lệ khung hình** | **Thời lượng đầu ra (giây)** | **doubao-seedance-2.0 (nhân dân tệ/cái)** | **doubao-seedance-2.0-fast (nhân dân tệ/cái)** |
| ---------- | ---------- | ---------------- | ------------------------------- | ------------------------------------ |
| **480p**   | 16:9       | 5                | 2.31                            | 1.86                                 |
| **720p**   | 16:9       | 5                | 4.97                            | 4.00                                 |

#### Đầu vào có video

| **Độ phân giải** | **Tỷ lệ khung hình** | **Thời lượng đầu vào (giây)** | **Thời lượng đầu ra (giây)** | **doubao-seedance-2.0 (nhân dân tệ/cái)** | **doubao-seedance-2.0-fast (nhân dân tệ/cái)** |
| ---------- | ---------- | ---------------- | ---------------- | ------------------------------- | ------------------------------------ |
| **480p**   | 16:9       | 2~15             | 5                | 2.53~5.62                       | 1.99~4.42                            |
| **720p**   | 16:9       | 2~15             | 5                | 5.44~12.10                      | 4.28~9.50                            |

> Giá thấp nhất tương ứng với đầu vào 2~4 giây, giá cao nhất tương ứng với đầu vào 15 giây.

#### Giới hạn lượng sử dụng token tối thiểu khi đầu vào có video (tỷ lệ khung hình 16:9)

| **Thời lượng đầu ra (giây)** | **Tokens tối thiểu - 480p** | **Tokens tối thiểu - 720p** |
| ---------------- | ---------------------- | ---------------------- |
| 4                | 70,308                 | 151,200                |
| 5                | 90,396                 | 194,400                |
| 6                | 100,440                | 216,000                |
| 7                | 120,528                | 259,200                |
| 8                | 140,616                | 302,400                |
| 9                | 150,660                | 324,000                |
| 10               | 170,748                | 367,200                |
| 11               | 190,836                | 410,400                |
| 12               | 200,880                | 432,000                |
| 13               | 220,968                | 475,200                |
| 14               | 241,056                | 518,400                |
| 15               | 251,100                | 540,000                |

### doubao-seedance-1.5-pro

| **Độ phân giải** | **Tỷ lệ khung hình** | **Thời lượng (giây)** | **Giá video có âm thanh (nhân dân tệ/cái)** | **Giá video Draft có âm thanh (nhân dân tệ/cái)** | **Giá video không có âm thanh (nhân dân tệ/cái)** | **Giá video Draft không có âm thanh (nhân dân tệ/cái)** |
| ---------- | ---------- | ------------ | ------------------------ | ------------------------------ | ------------------------ | ------------------------------ |
| **480p**   | 16:9       | 5            | 0.80                     | 0.48                           | 0.40                     | 0.28                           |
| **720p**   | 16:9       | 5            | 1.73                     | Không hỗ trợ                         | 0.86                     | Không hỗ trợ                         |
| **1080p**  | 16:9       | 5            | 3.89                     | Không hỗ trợ                         | 1.94                     | Không hỗ trợ                         |

# Mô tả tính phí mô hình tạo ảnh (Seedream)

Mô hình tạo ảnh tính phí theo **số lượng ảnh đầu ra thành công** (nhân dân tệ/tấm).

## 1. Bảng giá theo số lượng

| **Tên mô hình**                 | **Đơn giá (nhân dân tệ/tấm)** |
| ---------------------------- | ---------------- |
| **doubao-seedream-5.0-lite** | 0.22             |
| **doubao-seedream-5.0**      | 0.22             |
| **doubao-seedream-4.5**      | 0.25             |
| **doubao-seedream-4.0**      | 0.20             |
| **doubao-seedream-3.0-t2i**  | 0.259            |

### Mô tả quy tắc tính phí:

- **Điều kiện tính phí**: Tính phí theo số lượng ảnh đầu ra thành công. Ảnh không được xuất ra thành công do kiểm duyệt v.v. không tính phí.
- **Cảnh ảnh nhóm**: Tính phí theo số lượng ảnh thực tế được tạo.

# Mô tả tính phí mô hình ngôn ngữ lớn (tạo văn bản)

Mô hình ngôn ngữ lớn tính phí sau theo token, công thức chi phí: `Đơn giá đầu vào × token đầu vào + Đơn giá đầu ra × token đầu ra`.

Một số mô hình tính phí theo phân đoạn độ dài đầu vào, đơn giá token khác nhau ở các khoảng khác nhau.

## Suy luận trực tuyến

> Chỉ liệt kê các mô hình thường dùng của ArcReel, danh sách đầy đủ xem [Trang định giá Volcano Ark](https://www.volcengine.com/pricing?product=ark_bd&tab=1).

| **Tên mô hình**              | **Điều kiện độ dài đầu vào (nghìn token)** | **Đầu vào (nhân dân tệ/million token)** | **Đầu ra (nhân dân tệ/million token)** |
| ------------------------- | --------------------------- | ----------------------- | ----------------------- |
| **doubao-seed-2.0-pro**   | [0, 32]                     | 3.20                    | 16.00                   |
| ^^                        | (32, 128]                   | 4.80                    | 24.00                   |
| ^^                        | (128, 256]                  | 9.60                    | 48.00                   |
| **doubao-seed-2.0-lite**  | [0, 32]                     | 0.60                    | 3.60                    |
| ^^                        | (32, 128]                   | 0.90                    | 5.40                    |
| ^^                        | (128, 256]                  | 1.80                    | 10.80                   |
| **doubao-seed-2.0-mini**  | [0, 32]                     | 0.20                    | 2.00                    |
| ^^                        | (32, 128]                   | 0.40                    | 4.00                    |
| ^^                        | (128, 256]                  | 0.80                    | 8.00                    |
| **doubao-seed-1.8**       | [0, 32]                     | 0.80                    | 2.00 ~ 8.00             |
| ^^                        | (32, 128]                   | 1.20                    | 16.00                   |
| ^^                        | (128, 256]                  | 2.40                    | 24.00                   |

> - doubao-seed-1.8 trong khoảng đầu vào [0,32], giá đầu ra phân biệt thêm theo độ dài đầu ra: khi đầu ra [0, 0.2] nghìn token là 2.00, vượt quá là 8.00.
> - Ví dụ tính phí theo phân đoạn: Yêu cầu đầu vào 200k tokens, thỏa mãn điều kiện (128, 256], tất cả token tính phí theo đơn giá khoảng đó.

## Suy luận hàng loạt

Giá suy luận hàng loạt khoảng **50%** suy luận trực tuyến, phù hợp cho kịch bản xử lý hàng loạt không nhạy cảm với độ trễ.

| **Tên mô hình**              | **Điều kiện độ dài đầu vào (nghìn token)** | **Đầu vào (nhân dân tệ/million token)** | **Đầu ra (nhân dân tệ/million token)** |
| ------------------------- | --------------------------- | ----------------------- | ----------------------- |
| **doubao-seed-2.0-pro**   | [0, 32]                     | 1.60                    | 8.00                    |
| ^^                        | (32, 128]                   | 2.40                    | 12.00                   |
| ^^                        | (128, 256]                  | 4.80                    | 24.00                   |
| **doubao-seed-2.0-lite**  | [0, 32]                     | 0.30                    | 1.80                    |
| ^^                        | (32, 128]                   | 0.45                    | 2.70                    |
| ^^                        | (128, 256]                  | 0.90                    | 5.40                    |
| **doubao-seed-2.0-mini**  | [0, 32]                     | 0.10                    | 1.00                    |
| ^^                        | (32, 128]                   | 0.20                    | 2.00                    |
| ^^                        | (128, 256]                  | 0.40                    | 4.00                    |
| **doubao-seed-1.8**       | [0, 32]                     | 0.40                    | 1.00 ~ 4.00             |
| ^^                        | (32, 128]                   | 0.60                    | 8.00                    |
| ^^                        | (128, 256]                  | 1.20                    | 12.00                   |
