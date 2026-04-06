## Liên kết tham khảo giá chính thức

[AI Studio](https://ai.google.dev/gemini-api/docs/pricing.md.txt)
[Vertex AI](https://r.jina.ai/https://cloud.google.com/vertex-ai/generative-ai/pricing)

## 🎬 Bảng giá tạo video Veo 3.1 / Veo 3.1 Fast (tính phí theo giây)

> Giá AI Studio và Vertex AI nhất quán

### Veo 3.1 (Standard)

| Độ phân giải       | Có âm thanh không | Đơn giá ($/giây) | Chi phí video 8 giây |
| ------------ | ---------- | ------------ | ------------ |
| 720p / 1080p | Có âm thanh     | 0.40         | 3.20         |
| 720p / 1080p | Không có âm thanh     | 0.20         | 1.60         |
| 4K           | Có âm thanh     | 0.60         | 4.80         |
| 4K           | Không có âm thanh     | 0.40         | 3.20         |

------

### Veo 3.1 Fast (Giá thấp / Nhanh hơn)

| Độ phân giải       | Có âm thanh không | Đơn giá ($/giây) | Chi phí video 8 giây |
| ------------ | ---------- | ------------ | ------------ |
| 720p / 1080p | Có âm thanh     | 0.15         | 1.20         |
| 720p / 1080p | Không có âm thanh     | 0.10         | 0.80         |
| 4K           | Có âm thanh     | 0.35         | 2.80         |
| 4K           | Không có âm thanh     | 0.30         | 2.40         |

------

## 🖼️ Bảng giá tạo ảnh (token → ảnh đơn)

> Quy tắc quy đổi token (định nghĩa chính thức):
> **Chi phí ảnh đơn = số token × đơn giá / 1,000,000**

------

### gemini-3-pro-image-preview

#### AI Studio

##### Ảnh đầu vào (làm ảnh tham khảo)

| Mục     | Số token   | Đơn giá           | Chi phí đơn ảnh         |
| -------- | ---------- | -------------- | ---------------- |
| Ảnh đầu vào | 560 tokens | $2 / 1M tokens | **$0.0011 / tấm** |

##### Ảnh đầu ra

| Độ phân giải đầu ra | Số token    | Đơn giá             | Chi phí đơn ảnh        |
| ---------- | ----------- | ---------------- | --------------- |
| 1K / 2K    | 1120 tokens | $120 / 1M tokens | **$0.134 / tấm** |
| 4K         | 2000 tokens | $120 / 1M tokens | **$0.24 / tấm**  |

#### Vertex AI Standard

##### Ảnh đầu vào (làm ảnh tham khảo)

| Mục     | Số token   | Đơn giá                         | Chi phí đơn ảnh         |
| -------- | ---------- | ---------------------------- | ---------------- |
| Ảnh đầu vào | 560 tokens | $2 / 1M tokens (≤200K ctx)  | **$0.0011 / tấm** |
| Ảnh đầu vào | 560 tokens | $4 / 1M tokens (>200K ctx)  | **$0.0022 / tấm** |

##### Ảnh đầu ra

| Độ phân giải đầu ra | Số token    | Đơn giá             | Chi phí đơn ảnh        |
| ---------- | ----------- | ---------------- | --------------- |
| 1K / 2K    | 1120 tokens | $120 / 1M tokens | **$0.134 / tấm** |
| 4K         | 2000 tokens | $120 / 1M tokens | **$0.24 / tấm**  |

------

### gemini-3.1-flash-image-preview

#### AI Studio

##### Ảnh đầu vào (làm ảnh tham khảo)

| Mục     | Số token    | Đơn giá              | Chi phí đơn ảnh           |
| -------- | ----------- | ----------------- | ------------------ |
| Ảnh đầu vào | 1120 tokens | $0.25 / 1M tokens | **$0.00028 / tấm**  |

##### Ảnh đầu ra

| Độ phân giải đầu ra | Số token    | Đơn giá            | Chi phí đơn ảnh         |
| ---------- | ----------- | --------------- | ---------------- |
| 512px      | 747 tokens  | $60 / 1M tokens | **$0.045 / tấm**  |
| 1K         | 1120 tokens | $60 / 1M tokens | **$0.067 / tấm**  |
| 2K         | 1680 tokens | $60 / 1M tokens | **$0.101 / tấm**  |
| 4K         | 2520 tokens | $60 / 1M tokens | **$0.151 / tấm**  |

#### Vertex AI Standard

##### Ảnh đầu vào (làm ảnh tham khảo)

| Mục     | Số token    | Đơn giá              | Chi phí đơn ảnh           |
| -------- | ----------- | ----------------- | ------------------ |
| Ảnh đầu vào | 1120 tokens | $0.50 / 1M tokens | **$0.00056 / tấm**  |

##### Ảnh đầu ra

| Độ phân giải đầu ra | Số token    | Đơn giá            | Chi phí đơn ảnh         |
| ---------- | ----------- | --------------- | ---------------- |
| 512px      | 747 tokens  | $60 / 1M tokens | **$0.045 / tấm**  |
| 1K         | 1120 tokens | $60 / 1M tokens | **$0.067 / tấm**  |
| 2K         | 1680 tokens | $60 / 1M tokens | **$0.101 / tấm**  |
| 4K         | 2520 tokens | $60 / 1M tokens | **$0.151 / tấm**  |

------

## 📊 Tóm tắt so sánh giá

### So sánh chi phí ảnh đầu ra đơn

| Mô hình | Độ phân giải | AI Studio | Vertex Standard |
| ---- | ------ | --------- | --------------- |
| gemini-3-pro | 1K/2K | $0.134 | $0.134 |
| gemini-3-pro | 4K | $0.24 | $0.24 |
| gemini-3.1-flash | 512px | $0.045 | $0.045 |
| gemini-3.1-flash | 1K | $0.067 | $0.067 |
| gemini-3.1-flash | 2K | $0.101 | $0.101 |
| gemini-3.1-flash | 4K | $0.151 | $0.151 |

> Chi phí ảnh 2K gemini-3.1-flash khoảng **75%** gemini-3-pro ($0.101 vs $0.134)
