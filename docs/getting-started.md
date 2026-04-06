# Hướng dẫn nhập môn đầy đủ

Hướng dẫn này giúp bạn bắt đầu từ con số 0, sử dụng ArcReel để chuyển đổi tiểu thuyết thành video ngắn.

## Bạn sẽ học được

1. **Chuẩn bị môi trường** — Lấy khóa API
2. **Triển khai dịch vụ** — Triển khai qua Docker
3. **Quy trình đầy đủ** — Mỗi bước từ tiểu thuyết đến video
4. **Kỹ năng nâng cao** — Tạo lại, kiểm soát chi phí, phát triển cục bộ

## Thời gian dự kiến

- Chuẩn bị môi trường: 10-20 phút (chỉ cần lần đầu)
- Tạo video 1 phút: khoảng 30 phút

## Ước tính chi phí

ArcReel hỗ trợ nhiều nhà cung cấp (Gemini, Volcano Ark, Grok, OpenAI và nhà cung cấp tùy chỉnh), dưới đây là ví dụ với Gemini:

| Loại | Mô hình | Đơn giá | Mô tả |
|------|------|------|------|
| Tạo ảnh | Nano Banana Pro | $0.134/tấm (1K/2K) | Chất lượng cao, phù hợp cho thiết kế nhân vật |
| Tạo ảnh | Nano Banana 2 | $0.067/tấm (1K) | Nhanh hơn và rẻ hơn, phù hợp cho phân cảnh |
| Tạo video | Veo 3.1 | $0.40/giây (1080p có âm thanh) | Chất lượng cao |
| Tạo video | Veo 3.1 Fast | $0.15/giây (1080p có âm thanh) | Nhanh hơn và rẻ hơn |
| Tạo video | Veo 3.1 Lite | Thấp hơn | Mô hình nhẹ, chỉ có AI Studio |

> 💡 **Ví dụ** (Gemini): Một video ngắn có 10 cảnh (mỗi cảnh 8 giây)
> - Ảnh: 3 tấm thiết kế nhân vật (Pro) + 10 tấm phân cảnh (Flash) = $0.40 + $0.67 = $1.07
> - Video: 80 giây × $0.15 (chế độ Fast) = $12
> - **Tổng khoảng $13**

> 🎁 **Quyền lợi người dùng mới**: Người dùng mới Google Cloud có thể nhận **$300 tiền thưởng miễn phí**, hiệu lực trong 90 ngày, đủ để tạo nhiều video!
>
> Chi phí của các nhà cung cấp khác vui lòng tham khảo trang định giá chính thức tương ứng, ArcReel cung cấp theo dõi chi phí thời gian thực trên trang cài đặt.

---

## Chương 1: Chuẩn bị môi trường

### 1.1 Lấy khóa API nhà cung cấp tạo ảnh/video

ArcReel hỗ trợ nhiều nhà cung cấp, **cần cấu hình ít nhất một** để bắt đầu sử dụng:

| Nhà cung cấp | Địa chỉ lấy | Mô tả |
|--------|---------|------|
| **Gemini** (Google) | [AI Studio](https://aistudio.google.com/apikey) | Cần cấp độ trả phí, người dùng mới tự động nhận $300 tiền thưởng |
| **Volcano Ark** | [Volcano Engine Console](https://console.volcengine.com/ark) | Tính phí theo token/số lượng (CNY) |
| **Grok** (xAI) | [xAI Console](https://console.x.ai/) | Tính phí theo tấm/giây (USD) |
| **OpenAI** | [OpenAI Platform](https://platform.openai.com/) | Tính phí theo tấm/giây (USD) |

Bạn cũng có thể thêm **nhà cung cấp tùy chỉnh** (bất kỳ API tương thích OpenAI / Google) qua trang cài đặt sau khi triển khai.

> ⚠️ Khóa API là thông tin nhạy cảm, vui lòng bảo quản cẩn thận, không chia sẻ cho người khác hoặc tải lên kho công khai.

### 1.2 Lấy khóa API Anthropic

ArcReel tích hợp sẵn trợ lý AI dựa trên Claude Agent SDK, chịu trách nhiệm cho các khâu quan trọng như sáng tạo kịch bản, hướng dẫn hội thoại thông minh.

**Cách A: Sử dụng API chính thức Anthropic**

1. Truy cập [Anthropic Console](https://console.anthropic.com/)
2. Đăng ký tài khoản và tạo khóa API
3. Cấu hình sau trên trang cài đặt Web UI

**Cách B: Sử dụng API tương thích Anthropic bên thứ ba**

Nếu không thể truy cập trực tiếp API Anthropic, bạn có thể cấu hình trên trang cài đặt:

- **Base URL** — Điền địa chỉ dịch vụ trung chuyển hoặc API tương thích
- **Model** — Chỉ định tên mô hình sử dụng (ví dụ `claude-sonnet-4-6`)
- Có thể cấu hình riêng mô hình mặc định và mô hình Subagent cho Haiku / Sonnet / Opus

### 1.3 Chuẩn bị máy chủ

**Yêu cầu máy chủ:**

- Hệ điều hành: Linux / MacOS / Windows WSL
- Bộ nhớ: Khuyến nghị 2GB+
- Đã cài đặt Docker và Docker Compose

**Cài đặt Docker (nếu chưa cài):**

```bash
# Ubuntu / Debian
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Xác minh sau khi đăng nhập lại
docker --version
docker compose version
```

---

## Chương 2: Triển khai dịch vụ

### 2.1 Tải xuống và khởi động

#### Cách A: Triển khai mặc định (SQLite, khuyến nghị cho người mới)

```bash
# 1. Clone dự án
git clone https://github.com/ArcReel/ArcReel.git
cd ArcReel/deploy

# 2. Tạo tệp biến môi trường
cp .env.example .env

# 3. Khởi động dịch vụ
docker compose up -d
```

#### Cách B: Triển khai sản xuất (PostgreSQL, khuyến nghị cho sử dụng chính thức)

```bash
cd ArcReel/deploy/production

# Tạo tệp biến môi trường (cần đặt POSTGRES_PASSWORD)
cp .env.example .env

docker compose up -d
```

Sau khi container khởi động hoàn tất, truy cập **http://IP-của-máy-chủ-bạn:1241** trên trình duyệt

### 2.2 Cấu hình lần đầu

1. Đăng nhập bằng tài khoản mặc định (tên người dùng `admin`, mật khẩu được đặt qua `AUTH_PASSWORD` trong `.env`; nếu chưa đặt thì tự động tạo và ghi lại vào `.env` khi khởi động lần đầu)
2. Vào **Trang cài đặt** (`/settings`)
3. Cấu hình **Anthropic API Key** (điều khiển trợ lý AI), hỗ trợ Base URL và mô hình tùy chỉnh
4. Cấu hình ít nhất một **Khóa API nhà cung cấp** ảnh/video (Gemini / Volcano Ark / Grok / OpenAI), hoặc thêm nhà cung cấp tùy chỉnh
5. Điều chỉnh các tham số như lựa chọn mô hình, giới hạn tốc độ theo nhu cầu

> 💡 Tất cả mục cấu hình đều có thể sửa đổi trên trang cài đặt, không cần chỉnh thủ công tệp cấu hình.

---

## Chương 3: Quy trình đầy đủ

Các bước sau được thực hiện trong không gian làm việc Web UI.

### 3.1 Tạo dự án

1. Nhấp vào "Tạo dự án mới" trên trang danh sách dự án
2. Nhập tên dự án (ví dụ "Tiểu thuyết của tôi")
3. Tải lên tệp văn bản tiểu thuyết (định dạng .txt)

### 3.2 Tạo kịch bản phân cảnh

Mở bảng trợ lý AI ở bên phải không gian làm việc dự án, để trợ lý tạo kịch bản thông qua hội thoại:

- AI sẽ tự động phân tích nội dung tiểu thuyết, chia thành các đoạn phù hợp cho video
- Mỗi đoạn chứa mô tả hình ảnh, nhân vật xuất hiện, đạo cụ/cảnh quan quan trọng (manh mối)

**Điểm kiểm tra**: Kiểm tra cấu trúc kịch bản có hợp lý không, nhân vật và manh mối có được nhận diện đúng không.

### 3.3 Tạo ảnh thiết kế nhân vật

AI tạo ảnh thiết kế cho mỗi nhân vật, dùng để duy trì sự nhất quán về ngoại diện nhân vật trong tất cả cảnh sau này.

**Điểm kiểm tra**: Kiểm tra hình ảnh nhân vật có phù hợp với mô tả trong tiểu thuyết không, nếu không hài lòng có thể tạo lại.

### 3.4 Tạo ảnh thiết kế manh mối

AI tạo ảnh tham khảo cho các đạo cụ và yếu tố cảnh quan quan trọng (ví dụ vật phẩm, địa điểm cụ thể).

**Điểm kiểm tra**: Kiểm tra thiết kế manh mối có phù hợp với mong đợi không.

### 3.5 Tạo ảnh phân cảnh

AI tạo ảnh tĩnh cho mỗi cảnh dựa trên kịch bản, tự động tham chiếu ảnh thiết kế nhân vật và manh mối để đảm bảo nhất quán.

**Điểm kiểm tra**: Kiểm tra bố cục cảnh, sự nhất quán nhân vật, không khí có đúng không.

### 3.6 Tạo đoạn video

Ảnh phân cảnh làm khung bắt đầu, tạo đoạn video động 4-8 giây thông qua nhà cung cấp video đã chọn (Veo 3.1 / Seedance / Grok / Sora 2, v.v.).

Tác vụ tạo vào hàng đợi tác vụ bất đồng bộ, bạn có thể xem tiến độ thời gian thực trên bảng giám sát tác vụ. Kênh Image và Video độc lập song song, giới hạn tốc độ RPM đảm bảo không vượt quá hạn ngạch API.

**Điểm kiểm tra**: Xem trước mỗi đoạn video, nếu không hài lòng có thể tạo lại riêng lẻ.

### 3.7 Ghép video cuối cùng

Tất cả đoạn được ghép qua FFmpeg, thêm hiệu ứng chuyển cảnh và nhạc nền, xuất video cuối cùng.

Mặc định xuất định dạng **9:16 dọc**, phù hợp để đăng lên nền tảng video ngắn.

---

## Chương 4: Kỹ năng nâng cao

### 4.1 Lịch sử phiên bản và hoàn tác

Mỗi lần tạo lại tài liệu, hệ thống tự động lưu lịch sử phiên bản. Trong chế độ xem dòng thời gian không gian làm việc, có thể duyệt lịch sử phiên bản và hoàn tác bằng một cú nhấp chuột.

### 4.2 Kiểm soát chi phí

**Xem thống kê chi phí:**

Trên trang cài đặt có thể xem số lần gọi API và chi tiết chi phí.

**Mẹo giảm chi phí:**

- Kiểm tra kỹ đầu ra của mỗi giai đoạn, giảm thiểu làm lại
- Tạo trước một số ít cảnh để kiểm tra hiệu quả, hài lòng rồi mới tạo hàng loạt
- Sử dụng chế độ Fast khi tạo video có thể tiết kiệm khoảng 60% chi phí
- Ảnh phân cảnh dùng mô hình Flash, ảnh thiết kế nhân vật dùng mô hình Pro

### 4.3 Nhập/xuất dự án

Dự án hỗ trợ đóng gói lưu trữ, thuận tiện cho sao lưu và di chuyển:

- **Xuất**: Đóng gói toàn bộ dự án (bao gồm tất cả tài liệu) thành tệp lưu trữ
- **Nhập**: Khôi phục dự án từ tệp lưu trữ

---

## Chương 5: Câu hỏi thường gặp

### H: Docker khởi động thất bại?

1. Xác nhận dịch vụ Docker đang chạy: `systemctl status docker`
2. Kiểm tra cổng 1241 có bị chiếm dụng không: `ss -tlnp | grep 1241`
3. Xem nhật ký container: `docker compose logs` (thực hiện trong thư mục `deploy/` hoặc `deploy/production/` tương ứng)

### H: Gọi API thất bại?

1. Xác nhận Khóa API của nhà cung cấp tương ứng trên trang cài đặt được điền đúng
2. Người dùng Gemini cần xác nhận đã bật cấp độ trả phí (cấp độ miễn phí không hỗ trợ tạo ảnh/video)
3. Kiểm tra mạng máy chủ có thể truy cập dịch vụ API của nhà cung cấp tương ứng không
4. Xem lượng sử dụng API trên bảng điều khiển nhà cung cấp có vượt giới hạn không

### H: Nhân vật trông khác nhau ở các cảnh khác nhau?

1. Đảm bảo tạo ảnh thiết kế nhân vật trước
2. Kiểm tra chất lượng ảnh thiết kế nhân vật, nếu không hài lòng cần tạo lại trước
3. Hệ thống sẽ tự động sử dụng ảnh thiết kế nhân vật làm tham chiếu, đảm bảo nhất quán các cảnh sau

### H: Tạo video rất chậm?

Tạo video thường cần 1-3 phút/đoạn, đây là bình thường. Các yếu tố ảnh hưởng:

- Thời lượng video (4 giây vs 8 giây)
- Tải máy chủ API
- Tình trạng mạng

Hàng đợi tác vụ hỗ trợ xử lý song song, nhiều đoạn video có thể tạo cùng lúc.

### H: Làm gì khi tạo bị gián đoạn?

Hàng đợi tác vụ hỗ trợ tiếp tục từ điểm ngắt. Khi kích hoạt lại tạo, hệ thống sẽ tự động bỏ qua các đoạn đã hoàn thành, chỉ xử lý phần còn lại.

---

## Bước tiếp theo

Chúc mừng bạn đã hoàn thành hướng dẫn nhập môn! Tiếp theo bạn có thể:

- 💰 Xem [Mô tả chi phí Google GenAI](google-genai-docs/Google-video-anh-phi-tham-khau.md) và [Mô tả chi phí Volcano Ark](ark-docs/Volcano-Ark-phi-tham-khau.md) để hiểu chi tiết định giá
- 🐛 Gặp vấn đề? Gửi [Issue](https://github.com/ArcReel/ArcReel/issues) phản hồi
- 💬 Quét mã để tham gia nhóm trao đổi Feishu, nhận trợ giúp và tin tức mới nhất:

<img src="assets/feishu-qr.png" alt="Mã QR nhóm trao đổi Feishu" width="280">

Nếu thấy dự án hữu ích, hãy cho ⭐ Star ủng hộ nhé!
