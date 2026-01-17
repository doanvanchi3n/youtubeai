# HƯỚNG DẪN KẾT NỐI HUGGINGFACE API

## 🔍 KIỂM TRA VẤN ĐỀ

### Bước 1: Chạy script kiểm tra

```bash
cd ai_module
python check_huggingface_connection.py
```

Script này sẽ:
- ✅ Kiểm tra token có tồn tại không
- ✅ Test kết nối với các models
- ✅ Hiển thị lỗi chi tiết nếu có

---

## 📝 CÁCH LẤY VÀ CẤU HÌNH TOKEN

### 1. Lấy HuggingFace API Token

1. Đăng ký/Đăng nhập tại: https://huggingface.co/
2. Vào Settings → Access Tokens: https://huggingface.co/settings/tokens
3. Tạo token mới:
   - Click "New token"
   - Chọn quyền: **Read** (đủ cho Inference API)
   - Copy token (chỉ hiển thị 1 lần!)

### 2. Cấu hình Token

**Tạo file `.env` trong thư mục `ai_module/`:**

```bash
cd ai_module
touch .env
```

**Thêm vào file `.env`:**

```env
HUGGINGFACE_API_TOKEN=hf_your_token_here
HUGGINGFACE_CHAT_MODEL=meta-llama/Llama-3.1-8B-Instruct
```

**Lưu ý:**
- Thay `hf_your_token_here` bằng token thật của bạn
- Không commit file `.env` vào git (đã có trong .gitignore)

---

## 🐛 DEBUG CÁC LỖI THƯỜNG GẶP

### Lỗi 1: "No HuggingFace token"

**Nguyên nhân:** Token chưa được set trong `.env`

**Giải pháp:**
1. Kiểm tra file `.env` có tồn tại trong `ai_module/`
2. Kiểm tra có dòng `HUGGINGFACE_API_TOKEN=...`
3. Restart AI Module sau khi thêm token

---

### Lỗi 2: Status 401 - Authentication failed

**Nguyên nhân:** Token không hợp lệ hoặc đã hết hạn

**Giải pháp:**
1. Tạo token mới tại https://huggingface.co/settings/tokens
2. Cập nhật token trong `.env`
3. Restart AI Module

---

### Lỗi 3: Status 503 - Model is loading

**Nguyên nhân:** Model đang được load lần đầu (mất 10-30 giây)

**Giải pháp:**
1. Đợi vài giây rồi thử lại
2. Hệ thống tự động thử model khác
3. Model sẽ được cache sau lần đầu load

---

### Lỗi 4: Status 429 - Rate limit exceeded

**Nguyên nhân:** Quá nhiều requests trong thời gian ngắn

**Giải pháp:**
1. Đợi vài phút rồi thử lại
2. HuggingFace free tier có giới hạn requests/phút
3. Có thể upgrade lên paid tier nếu cần

---

### Lỗi 5: Connection Error / Timeout

**Nguyên nhân:** 
- Mạng không ổn định
- HuggingFace API đang bảo trì
- Firewall block

**Giải pháp:**
1. Kiểm tra kết nối internet
2. Thử lại sau vài phút
3. Kiểm tra firewall/proxy settings

---

## ✅ KIỂM TRA SAU KHI CẤU HÌNH

### 1. Restart AI Module

```bash
cd ai_module
python main.py
```

Bạn sẽ thấy log:
```
✓ ContentService initialized with AI capabilities
  - HuggingFace model: meta-llama/Llama-3.1-8B-Instruct
```

Nếu thấy:
```
⚠ HuggingFace: Not configured (using fallback)
```
→ Token chưa được load đúng

### 2. Test qua script

```bash
python check_huggingface_connection.py
```

Nếu thành công, bạn sẽ thấy:
```
✅ Token found: hf_xxxxx...
✅ SUCCESS! Response: ...
```

### 3. Test qua API

```bash
curl -X POST http://localhost:5000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "Xin chào"}
    ]
  }'
```

---

## 🔧 FALLBACK MECHANISM

Nếu HuggingFace API không hoạt động, hệ thống sẽ:

1. **Tự động thử các models khác** (Mistral, Phi-3, FLAN-T5)
2. **Sử dụng tool calling** để tạo titles/description/hashtags trực tiếp
3. **Hiển thị message hữu ích** hướng dẫn user

---

## 📞 CẦN HỖ TRỢ?

Nếu vẫn gặp vấn đề:

1. **Chạy script debug:**
   ```bash
   python check_huggingface_connection.py
   ```

2. **Kiểm tra logs của AI Module:**
   - Xem console output khi start
   - Tìm các dòng có ❌ hoặc ⚠️

3. **Kiểm tra Backend logs:**
   - Xem có error khi gọi `/api/ai/chat` không

4. **Test trực tiếp HuggingFace API:**
   - Vào https://huggingface.co/docs/api-inference/index
   - Test với token của bạn

---

## 💡 TIPS

- **Free tier có giới hạn:** ~30 requests/phút
- **Model loading:** Lần đầu load model mất 10-30s
- **Token security:** Không share token công khai
- **Alternative:** Có thể dùng OpenAI/Claude API nếu HuggingFace không ổn định

