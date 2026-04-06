# Tính năng mô hình tạo video Seedance và Hướng dẫn phát triển Python

Mô hình Seedance có khả năng hiểu ngữ nghĩa xuất sắc, có thể tạo nhanh các đoạn video chất lượng cao dựa trên nội dung đa phương thức như văn bản, hình ảnh, video, âm thanh do người dùng nhập. Bài viết này giới thiệu các khả năng cơ bản chung của mô hình tạo video và hướng dẫn bạn sử dụng Python để gọi Video Generation API tạo video.

## 1. Tổng quan khả năng mô hình

Bảng này hiển thị tất cả các khả năng mà các mô hình Seedance hỗ trợ, thuận tiện cho bạn so sánh và lựa chọn.

| **Khả năng**              | **Seedance 2.0**             | **Seedance 2.0 fast**             | **Seedance 1.5 pro**             | **Seedance 1.0 pro**             | **Seedance 1.0 pro fast**             | **Seedance 1.0 lite i2v**             | **Seedance 1.0 lite t2v**             |
| ----------------------- | ---------------------------- | --------------------------------- | -------------------------------- | -------------------------------- | ------------------------------------- | ------------------------------------- | ------------------------------------- |
| **Model ID**            | `doubao-seedance-2-0-260128` | `doubao-seedance-2-0-fast-260128` | `doubao-seedance-1-5-pro-251215` | `doubao-seedance-1-0-pro-250528` | `doubao-seedance-1-0-pro-fast-251015` | `doubao-seedance-1-0-lite-i2v-250428` | `doubao-seedance-1-0-lite-t2v-250428` |
| **Văn bản sang video**            | ✅                           | ✅                                | ✅                               | ✅                               | ✅                                    | ✅                                    | ✅                                    |
| **Ảnh sang video-khung đầu**       | ✅                           | ✅                                | ✅                               | ✅                               | ✅                                    | ✅                                    | -                                     |
| **Ảnh sang video-khung đầu cuối**     | ✅                           | ✅                                | ✅                               | ✅                               | -                                     | ✅                                    | -                                     |
| **Tham chiếu đa phương thức(ảnh/video)** | ✅                           | ✅                                | -                                | -                                | -                                     | ✅ (chỉ ảnh)                           | -                                     |
| **Chỉnh sửa/mở rộng video**       | ✅                           | ✅                                | -                                | -                                | -                                     | -                                     | -                                     |
| **Tạo video có âm thanh**        | ✅                           | ✅                                | ✅                               | -                                | -                                     | -                                     | -                                     |
| **Tăng cường tìm kiếm mạng**        | ✅                           | ✅                                | -                                | -                                | -                                     | -                                     | -                                     |
| **Chế độ Draft**     | -                            | -                                 | ✅                               | -                                | -                                     | -                                     | -                                     |
| **Trả về khung cuối video**        | ✅                           | ✅                                | ✅                               | ✅                               | ✅                                    | ✅                                    | ✅                                    |
| **Độ phân giải đầu ra**          | 480p, 720p                   | 480p, 720p                        | 480p, 720p, 1080p                | 480p, 720p, 1080p                | 480p, 720p, 1080p                     | 480p, 720p, 1080p                     | 480p, 720p, 1080p                     |
| **Thời lượng đầu ra(giây)**        | 4~15                         | 4~15                              | 4~12                             | 2~12                             | 2~12                                  | 2~12                                  | 2~12                                  |
| **Suy luận trực tuyến RPM**        | 600                          | 600                               | 600                              | 600                              | 600                                   | 300                                   | 300                                   |
| **Số lượng đồng thời**              | 10                           | 10                                | 10                               | 10                               | 10                                    | 5                                     | 5                                     |
| **Suy luận ngoại tuyến(Flex)**      | -                            | -                                 | ✅ (5000 tỷ TPD)                  | ✅ (5000 tỷ TPD)                  | ✅ (5000 tỷ TPD)                       | ✅ (2500 tỷ TPD)                       | ✅ (2500 tỷ TPD)                       |

_(Lưu ý: ✅ biểu thị hỗ trợ, - biểu thị không hỗ trợ hoặc tính năng chưa mở)_

## 2. Quy trình nhập môn cho người mới

> **Gợi ý**: Trước khi gọi API, hãy đảm bảo đã cài đặt Python SDK: `pip install 'volcengine-python-sdk[ark]'`, và cấu hình biến môi trường `ARK_API_KEY`.

Tạo video là một **quá trình bất đồng bộ**:

1. Sau khi gọi thành công giao diện tạo, API trả về ID tác vụ (`task_id`).
2. Thăm dò giao diện truy vấn, cho đến khi trạng thái tác vụ trở thành `succeeded` (hoặc sử dụng Webhook để nhận thông báo).
3. Sau khi tác vụ hoàn thành, trích xuất `content.video_url` để tải xuống tệp MP4.

### Bước 1: Tạo tác vụ tạo video

```
import os
from volcenginesdkarkruntime import Ark

client = Ark(api_key=os.environ.get("ARK_API_KEY"))

if __name__ == "__main__":
    resp = client.content_generation.tasks.create(
        model="doubao-seedance-2-0-260128",
        content=[
            {
                "type": "text",
                "text": "Cô gái ôm con cáo, cô gái mở mắt, nhìn nhẹ nhàng vào ống kính, con cáo ôm thân thiện, ống kính từ từ kéo ra, tóc cô gái bị gió thổi, có thể nghe thấy tiếng gió"
            },
            {
                "type": "image_url",
                "image_url": {
                    "url": "https://ark-project.tos-cn-beijing.volces.com/doc_image/i2v_foxrgirl.png"
                }
            }
        ],
        generate_audio=True,
        ratio="adaptive",
        duration=5,
        watermark=False,
    )
    print(f"Task Created: {resp.id}")
```

### Bước 2: Truy vấn trạng thái tác vụ

```
import os
from volcenginesdkarkruntime import Ark

client = Ark(api_key=os.environ.get("ARK_API_KEY"))

if __name__ == "__main__":
    # Thay bằng ID trả về khi bạn tạo tác vụ
    resp = client.content_generation.tasks.get(task_id="cgt-2025****")
    print(resp)

    if resp.status == "succeeded":
        print(f"Video URL: {resp.content.video_url}")
```

## 3. Phát triển thực chiến kịch bản (Python)

### 3.1 Tạo video từ văn bản thuần túy (Text-to-Video)

Tạo video dựa trên prompt do người dùng nhập, kết quả có tính ngẫu nhiên lớn, có thể dùng để kích thích cảm hứng sáng tạo.

```
import os
import time
from volcenginesdkarkruntime import Ark

client = Ark(api_key=os.environ.get("ARK_API_KEY"))

create_result = client.content_generation.tasks.create(
    model="doubao-seedance-2-0-260128",
    content=[
        {
            "type": "text",
            "text": "Phong cách thực tế, dưới bầu trời xanh trong nắng, một cánh đồng hoa cúc trắng lớn, ống kính từ từ kéo gần, cuối cùng định hình vào cận cảnh một bông hoa cúc, trên cánh hoa có vài giọt sương trong trẻo"
        }
    ],
    ratio="16:9",
    duration=5,
    watermark=True,
)

# Thăm dò lấy kết quả
task_id = create_result.id
while True:
    get_result = client.content_generation.tasks.get(task_id=task_id)
    if get_result.status == "succeeded":
        print(f"Tác vụ thành công! Địa chỉ tải video: {get_result.content.video_url}")
        break
    elif get_result.status == "failed":
        print(f"Tác vụ thất bại: {get_result.error}")
        break
    else:
        print(f"Đang xử lý ({get_result.status})... Đợi 10 giây")
        time.sleep(10)
```

### 3.2 Ảnh sang video - Dựa trên khung đầu (Image-to-Video)

Chỉ định hình ảnh khung đầu của video, mô hình tạo video liền mạch dựa trên hình ảnh đó. Thiết lập `generate_audio=True` có thể đồng thời tạo âm thanh.

```
# Xây dựng danh sách content
content = [
    {
        "type": "text",
        "text": "Cô gái ôm con cáo, ống kính từ từ kéo ra, tóc bị gió thổi, có thể nghe thấy tiếng gió"
    },
    {
        "type": "image_url",
        "image_url": {
            "url": "https://ark-project.tos-cn-beijing.volces.com/doc_image/i2v_foxrgirl.png"
        }
    }
]

create_result = client.content_generation.tasks.create(
    model="doubao-seedance-2-0-260128",
    content=content,
    generate_audio=True, # Bật tạo âm thanh
    ratio="adaptive",
    duration=5,
    watermark=True,
)
```

### 3.3 Ảnh sang video - Dựa trên khung đầu cuối

Tạo video liền mạch nối khung đầu và khung cuối bằng cách chỉ định hình ảnh bắt đầu và kết thúc của video.

```
content = [
    {
        "type": "text",
        "text": "Cô gái trong hình对着 ống kính nói 'cà chua', quay ống kính 360 độ"
    },
    {
        "type": "image_url",
        "image_url": {
            "url": "https://ark-project.tos-cn-beijing.volces.com/doc_image/seepro_first_frame.jpeg"
        },
        "role": "first_frame" # Chỉ định vai trò là khung đầu
    },
    {
        "type": "image_url",
        "image_url": {
            "url": "https://ark-project.tos-cn-beijing.volces.com/doc_image/seepro_last_frame.jpeg"
        },
        "role": "last_frame"  # Chỉ định vai trò là khung cuối
    }
]

create_result = client.content_generation.tasks.create(
    model="doubao-seedance-2-0-260128",
    content=content,
    ratio="adaptive",
    duration=5
)
```

### 3.4 Ảnh sang video - Dựa trên ảnh tham chiếu

Mô hình có thể trích xuất chính xác các đặc điểm chính của các đối tượng trong ảnh tham chiếu (hỗ trợ nhập 1-4 tấm), và dựa trên các đặc điểm này trong quá trình tạo video khôi phục cao độ hình thái, màu sắc và kết cấu vân vải v.v. của đối tượng, đảm bảo video được tạo nhất quán với phong cách thị giác của ảnh tham chiếu.

```
content = [
    {
        "type": "text",
        "text": "Nam sinh đeo kính mặc áo thun màu xanh trong [ảnh 1] và chó corgi trong [ảnh 2], ngồi trên bãi cỏ trong [ảnh 3], video phong cách hoạt hình"
    },
    {
        "type": "image_url",
        "image_url": {
            "url": "https://ark-project.tos-cn-beijing.volces.com/doc_image/seelite_ref_1.png"
        },
        "role": "reference_image" # Chỉ định là ảnh tham chiếu
    },
    {
        "type": "image_url",
        "image_url": {
            "url": "https://ark-project.tos-cn-beijing.volces.com/doc_image/seelite_ref_2.png"
        },
        "role": "reference_image"
    },
    {
        "type": "image_url",
        "image_url": {
            "url": "https://ark-project.tos-cn-beijing.volces.com/doc_image/seelite_ref_3.png"
        },
        "role": "reference_image"
    }
]

create_result = client.content_generation.tasks.create(
    # Lưu ý: Cần chọn mô hình hỗ trợ tính năng này, ví dụ Seedance 1.0 lite i2v
    model="doubao-seedance-1-0-lite-i2v-250428",
    content=content,
    ratio="16:9",
    duration=5
)
```

### 3.5 Quản lý tác vụ video

**Truy vấn danh sách tác vụ:**

```
resp = client.content_generation.tasks.list(
    page_size=3,
    status="succeeded",
)
print(resp)
```

**Xóa hoặc hủy tác vụ:**

```
client.content_generation.tasks.delete(task_id="cgt-2025****")
```

## 4. Gợi ý prompt

Để có kết quả tạo chất lượng hơn, phù hợp hơn với mong đợi, khuyến nghị tuân thủ các nguyên tắc viết prompt sau:

- **Công thức cốt lõi: Prompt = Chủ thể + Vận động + Nền + Vận động + Ống kính + Vận động ...** \* **Trực tiếp chính xác**: Viết hiệu quả bạn muốn bằng ngôn ngữ tự nhiên ngắn gọn chính xác, thay đổi mô tả trừu tượng thành mô tả cụ thể.
- **Chiến lược từng bước**: Nếu có kỳ vọng hiệu quả tương đối rõ ràng, khuyến nghị trước dùng mô hình tạo ảnh tạo ảnh phù hợp với kỳ vọng, sau đó dùng **Ảnh sang video** để tạo đoạn video.
- **Phân biệt chủ yếu**: Chú ý xóa các phần không quan trọng, đưa nội dung quan trọng lên trước.
- **Tận dụng tính ngẫu nhiên**: Văn bản sang video thuần túy sẽ có tính ngẫu nhiên kết quả lớn, rất phù hợp để kích thích cảm hứng sáng tạo.
- **Chất lượng đầu vào**: Khi ảnh sang video, vui lòng tải lên ảnh chất lượng cao độ phân giải cao nhất có thể, chất lượng ảnh tải lên ảnh hưởng rất lớn đến hiệu quả video cuối cùng được tạo.

## 5. Tính năng phát triển nâng cao

### 5.1 Tham số quy cách đầu ra (Kiểm soát Request Body)

Trong chế độ kiểm tra mạnh, khuyến nghị trực tiếp truyền các tham số sau trong Request Body để kiểm soát quy cách video:

| **Tham số**       | **Mô tả**   | **Ví dụ giá trị hỗ trợ**                                        |
| -------------- | ---------- | ------------------------------------------------------- |
| `resolution`   | Độ phân giải đầu ra | `480p`, `720p`, `1080p`                                 |
| `ratio`        | Tỷ lệ khung hình video | `16:9`, `9:16`, `1:1`, `4:3`, `3:4`, `21:9`, `adaptive` |
| `duration`     | Thời lượng(giây)   | Loại số nguyên, ví dụ `5`                                      |
| `frames`       | Số khung tạo   | Ưu tiên dùng duration. Nếu dùng frames, phải thỏa mãn định dạng `25 + 4n`   |
| `seed`         | Hạt ngẫu nhiên   | Giá trị số nguyên, dùng để tái hiện hiệu quả tạo                                |
| `camera_fixed` | Khóa ống kính   | `true` hoặc `false`                                       |
| `watermark`    | Có mang水印 không | `true` hoặc `false`                                       |

### 5.2 Suy luận ngoại tuyến (Flex Tier)

Đối với kịch bản không thời gian thực, cấu hình `service_tier="flex"` có thể giảm giá gọi 50%.

```
create_result = client.content_generation.tasks.create(
    model="doubao-seedance-1-5-pro-251215",
    content=[...], # Lược
    service_tier="flex",             # Bật suy luận ngoại tuyến
    execution_expires_after=172800,  # Đặt thời gian hết hạn tác vụ
)
```

### 5.3 Chế độ Draft (Draft Mode)

Giúp kiểm tra ý định prompt, điều phối ống kính v.v. với chi phí thấp. (_Lưu ý: Hiện tại chỉ Seedance 1.5 pro hỗ trợ_)

**Bước 1: Tạo draft chi phí thấp**

```
create_result = client.content_generation.tasks.create(
    model="doubao-seedance-1-5-pro-251215",
    content=[...],
    seed=20,
    duration=6,
    draft=True # Bật chế độ draft
)
# Lấy draft_task_id trả về: "cgt-2026****-pzjqb"
```

**Bước 2: Tạo video chính thức dựa trên draft**

Sau khi xác nhận draft hài lòng, sử dụng draft task id để tạo phiên bản hoàn chỉnh độ phân giải cao:

```
create_result = client.content_generation.tasks.create(
    model="doubao-seedance-1-5-pro-251215",
    content=[
        {
            "type": "draft_task",
            "draft_task": {"id": "cgt-2026****-pzjqb"} # Trích dẫn tác vụ draft
        }
    ],
    resolution="720p",
    watermark=False
)
```

### 5.4 Thông báo gọi lại trạng thái Webhook

Bằng cách thiết lập `callback_url`, có thể tránh lãng phí tài nguyên do thăm dò. Dưới đây là ví dụ dịch vụ Flask đơn giản nhận Webhook của Ark:

```
from flask import Flask, request, jsonify
import logging

app = Flask(__name__)
logging.basicConfig(level=logging.INFO)

@app.route('/webhook/callback', methods=['POST'])
def video_task_callback():
    callback_data = request.get_json()
    if not callback_data:
        return jsonify({"code": 400, "msg": "Invalid data"}), 400

    task_id = callback_data.get('id')
    status = callback_data.get('status')

    logging.info(f"Task Callback | ID: {task_id} | Status: {status}")

    if status == 'succeeded':
        # Tại đây có thể kích hoạt logic nghiệp vụ, nhập kho hoặc lấy nội dung qua API
        pass

    return jsonify({"code": 200, "msg": "Success"}), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080)
```

## 6. Giới hạn sử dụng và quy tắc cắt

### 6.1 Giới hạn đầu vào đa phương thức

- **Ảnh**: Đơn tấm <30 MB. Hỗ trợ jpeg, png, webp v.v. Tỷ lệ kích thước ở giữa `(0.4, 2.5)`, chiều dài `300 ~ 6000` px.
- **Video**: Đơn cái <50 MB. Hỗ trợ mp4, mov. Thời lượng `2~15` giây. Tốc độ khung hình `24~60` FPS.
- **Âm thanh**: Đơn cái <15 MB. Hỗ trợ wav, mp3. Thời lượng `2~15` giây.

### 6.2 Quy tắc cắt ảnh tự động (Crop Rule)

Khi `ratio` (tỷ lệ video) bạn chỉ định không nhất quán với tỷ lệ ảnh thực tế truyền vào, dịch vụ sẽ kích hoạt logic **cắt ở giữa**:

1. Nếu ảnh gốc "hẹp cao" hơn mục tiêu (tỷ lệ khung hình gốc < tỷ lệ khung hình mục tiêu), thì **theo chiều rộng làm chuẩn**, cắt trên dưới ở giữa.
2. Nếu ảnh gốc "rộng bè" hơn mục tiêu (tỷ lệ khung hình gốc > tỷ lệ khung hình mục tiêu), thì **theo chiều cao làm chuẩn**, cắt trái phải ở giữa.
> **Gợi ý**: Cố gắng truyền vào ảnh độ phân giải cao tỷ lệ gần với `ratio` mục tiêu, để có hiệu quả thành phẩm tốt nhất, tránh chủ thể chính bị cắt.

### 6.3 Vòng đời tác vụ

Dữ liệu tác vụ (như trạng thái, liên kết tải video) **chỉ giữ lại 24 giờ**, quá thời gian sẽ tự động xóa. Vui lòng sau khi xác nhận thành công qua gọi lại hoặc thăm dò, càng sớm tải xuống và chuyển lưu đến không gian lưu trữ như OSS v.v.
