# Thiết kế tái cấu hình backend chia sẻ Grok & Ark

## Nền tảng

Hiện tại trong AI backend, OpenAI cung cấp hàm nhà máy `create_openai_client()` thông qua `openai_shared.py`,
Gemini cung cấp RateLimiter chia sẻ + cơ chế thử lại thông qua `gemini_shared.py`.
Nhưng ba backend image/video/text của Grok và Ark tạo client độc lập, tồn tại logic khởi tạo lặp lại,
logic kiểm tra và hằng số mã hóa cứng.

## Mục tiêu

Tạo một module chia sẻ cho mỗi Grok và Ark (`grok_shared.py` / `ark_shared.py`),
cung cấp hàm nhà máy client thống nhất, loại bỏ code lặp lại trong ba backend. Sử dụng cùng mẫu với `openai_shared.py`.

## Thiết kế

---

### 1. `lib/grok_shared.py`

Module mới, trách nhiệm:
- Cung cấp hàm nhà máy `create_grok_client(*, api_key: str) -> xai_sdk.AsyncClient`
- Thống nhất logic kiểm tra API Key và thông báo lỗi

```python
"""
Grok (xAI) module công cụ chia sẻ

Dùng lại cho text_backends / image_backends / video_backends.
"""
from __future__ import annotations
import xai_sdk

def create_grok_client(*, api_key: str) -> xai_sdk.AsyncClient:
    """Tạo xAI AsyncClient, kiểm tra và cấu hình thống nhất."""
    if not api_key:
        raise ValueError("XAI_API_KEY chưa được đặt\nVui lòng cấu hình xAI API Key trong trang cấu hình hệ thống")
    return xai_sdk.AsyncClient(api_key=api_key)
```

---

### 2. `lib/ark_shared.py`

Module mới, trách nhiệm:
- Xuất hằng số `ARK_BASE_URL` (loại bỏ 3 chỗ mã hóa cứng)
- Cung cấp hàm nhà máy `create_ark_client(*, api_key: str | None = None) -> Ark`
- Thống nhất kiểm tra API Key (hỗ trợ fallback biến môi trường) và thông báo lỗi

```python
"""
Ark (Volcano Ark) module công cụ chia sẻ

Dùng lại cho text_backends / image_backends / video_backends.
"""
from __future__ import annotations
import os

ARK_BASE_URL = "https://ark.cn-beijing.volces.com/api/v3"

def create_ark_client(*, api_key: str | None = None):
    """Tạo Ark client, kiểm tra và cấu hình thống nhất."""
    from volcenginesdkarkruntime import Ark

    resolved_key = api_key or os.environ.get("ARK_API_KEY")
    if not resolved_key:
        raise ValueError("Ark API Key chưa được cung cấp. Vui lòng cấu hình API Key trong trang「Cài đặt toàn cục → Nhà cung cấp」.")
    return Ark(base_url=ARK_BASE_URL, api_key=resolved_key)
```

### 3. Tái cấu hình backend Grok

#### image_backends/grok.py
- Xóa `import xai_sdk` và kiểm tra API Key nội tuyến
- `__init__` đổi thành `self._client = create_grok_client(api_key=api_key)`

#### video_backends/grok.py
- Tương tự: xóa `import xai_sdk` import cấp cao và kiểm tra nội tuyến
- `__init__` đổi thành `self._client = create_grok_client(api_key=api_key)`

#### text_backends/grok.py (thay đổi lớn nhất)
- Đồng bộ `xai_sdk.Client` đổi thành bất đồng bộ `xai_sdk.AsyncClient` (thông qua `create_grok_client()`)
- `asyncio.to_thread(chat.sample)` → `await chat.sample()`
- `asyncio.to_thread(chat.parse, ...)` → `await chat.parse(...)`
- Xóa `import asyncio`
- Giữ `self._xai_sdk = xai_sdk` (vẫn cần `xai_sdk.chat.system()` v.v. constructor)
- **Fallback**: Nếu chat API của AsyncClient không nhất quán với Client, quay lại `to_thread` + gọi đồng bộ

### 4. Tái cấu hình backend Ark

#### image_backends/ark.py
- Xóa `from volcenginesdkarkruntime import Ark`, đọc `os.environ`, mã hóa cứng base_url
- `__init__` đổi thành `self._client = create_ark_client(api_key=api_key)`
- Xóa trường `self._api_key` (không còn cần nữa)

#### video_backends/ark.py
- Tương tự
- Xóa trường `self._api_key`

#### text_backends/ark.py
- Client chính đổi thành `self._client = create_ark_client(api_key=api_key)`
- Hằng số cục bộ `_ARK_BASE_URL` đổi thành nhập `ARK_BASE_URL` từ `ark_shared`
- Client tương thích OpenAI giữ lại trong backend văn bản (dùng riêng cho hạ cấp Instructor)

### 5. Phần không thay đổi

- `openai_shared.py` / `gemini_shared.py` — duy trì hiện trạng
- `lib/config/` hệ thống cấu hình — không bị ảnh hưởng
- Client tương thích OpenAI của `text_backends/ark.py` — giữ lại chỗ cũ

## Danh sách thay đổi

| Tệp | Hoạt động | Mô tả |
|------|------|------|
| `lib/grok_shared.py` | Thêm mới | Hàm nhà máy |
| `lib/ark_shared.py` | Thêm mới | Hàm nhà máy + hằng số base_url |
| `lib/image_backends/grok.py` | Thay đổi | Dùng `create_grok_client()` |
| `lib/video_backends/grok.py` | Thay đổi | Dùng `create_grok_client()` |
| `lib/text_backends/grok.py` | Thay đổi | Dùng `create_grok_client()` + bất đồng bộ hóa |
| `lib/image_backends/ark.py` | Thay đổi | Dùng `create_ark_client()` |
| `lib/video_backends/ark.py` | Thay đổi | Dùng `create_ark_client()` |
| `lib/text_backends/ark.py` | Thay đổi | Client chính dùng `create_ark_client()` |

## Chiến lược kiểm tra

Tái cấu hình thuần túy, hành vi không đổi. `ruff check` + `pytest` chạy hết là được, không cần thêm test mới.
Nếu có liên quan đến mock của backend Grok/Ark, cần thích ứng đường dẫn import mới.
