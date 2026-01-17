# HƯỚNG DẪN TẠO FILE .ENV TRONG POWERSHELL

## 🚀 CÁCH NHANH NHẤT

### Option 1: Dùng script tự động (Khuyến nghị)

```powershell
cd ai_module
.\setup_env.ps1
```

Script sẽ:
- Hướng dẫn bạn lấy token
- Nhập token
- Tự động tạo file `.env`

---

### Option 2: Tạo thủ công

**Bước 1: Lấy HuggingFace API Token**

1. Mở trình duyệt: https://huggingface.co/settings/tokens
2. Đăng nhập/Đăng ký (miễn phí)
3. Click **"New token"**
4. Đặt tên: `youtubeai-api`
5. Chọn quyền: **Read** (đủ cho Inference API)
6. Click **"Generate token"**
7. **Copy token ngay** (chỉ hiển thị 1 lần!)

**Bước 2: Tạo file .env trong PowerShell**

```powershell
cd ai_module
notepad .env
```

**Bước 3: Dán nội dung sau vào Notepad:**

```env
HUGGINGFACE_API_TOKEN=hf_your_token_here
HUGGINGFACE_CHAT_MODEL=meta-llama/Llama-3.1-8B-Instruct
```

**Thay `hf_your_token_here` bằng token thật của bạn!**

**Bước 4: Lưu file (Ctrl+S) và đóng Notepad**

---

### Option 3: Dùng lệnh PowerShell

```powershell
cd ai_module

# Nhập token của bạn
$token = Read-Host "Nhập HuggingFace API Token"

# Tạo file .env
@"
HUGGINGFACE_API_TOKEN=$token
HUGGINGFACE_CHAT_MODEL=meta-llama/Llama-3.1-8B-Instruct
"@ | Out-File -FilePath ".env" -Encoding UTF8
```

---

## ✅ KIỂM TRA SAU KHI TẠO

```powershell
python check_huggingface_connection.py
```

Nếu thành công, bạn sẽ thấy:
```
✅ Token found: hf_xxxxx...
✅ SUCCESS! Response: ...
```

---

## 🔍 TROUBLESHOOTING

### Lỗi: "File .env không được tìm thấy"

**Kiểm tra:**
```powershell
cd ai_module
dir .env
```

Nếu không có file, tạo lại theo hướng dẫn trên.

### Lỗi: "Token không hợp lệ"

**Kiểm tra:**
1. Token có bắt đầu bằng `hf_` không?
2. Token có khoảng trắng thừa không?
3. Đã copy đầy đủ token chưa?

**Sửa:**
```powershell
notepad .env
```
Xóa khoảng trắng thừa, đảm bảo format:
```
HUGGINGFACE_API_TOKEN=hf_xxxxxxxxxxxxx
```

### Lỗi: "Authentication failed (401)"

- Token đã hết hạn hoặc không hợp lệ
- Tạo token mới tại: https://huggingface.co/settings/tokens
- Cập nhật lại trong file `.env`

---

## 📝 LƯU Ý

- ✅ File `.env` đã có trong `.gitignore` → không commit vào git
- ✅ Token là bí mật → không share công khai
- ✅ Free tier có giới hạn ~30 requests/phút

---

## 🎯 NEXT STEPS

Sau khi setup xong:

1. **Test kết nối:**
   ```powershell
   python check_huggingface_connection.py
   ```

2. **Start AI Module:**
   ```powershell
   python main.py
   ```

3. **Test Chat API:**
   - Mở frontend
   - Vào tab "AI Chat Bot"
   - Thử chat!

