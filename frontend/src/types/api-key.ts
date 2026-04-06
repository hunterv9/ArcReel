/** Siêu dữ liệu API Key (dùng cho hiển thị danh sách, không chứa đầy đủ key). */
export interface ApiKeyInfo {
  id: number;
  name: string;
  key_prefix: string;
  created_at: string;
  expires_at: string | null;
  last_used_at: string | null;
}

/** Phản hồi khi tạo API Key (chứa đầy đủ key, chỉ hiển thị một lần duy nhất lúc tạo). */
export interface CreateApiKeyResponse {
  id: number;
  name: string;
  key: string;
  key_prefix: string;
  created_at: string;
  expires_at: string | null;
}
