# HƯỚNG DẪN TẠO GOOGLE GEMINI API KEY

## 📋 BƯỚC 1: VÀO TRANG API KEYS

1. Truy cập: **https://aistudio.google.com/api-keys**
2. Bạn sẽ thấy nút **"Create API key"** (có icon dấu +)
3. Click vào nút đó

---

## 🔑 BƯỚC 2: CHỌN PROJECT

Sau khi click "Create API key", sẽ có popup/modal hiện ra với 2 options:

### Option 1: "Create API key in new project" (Khuyến nghị ⭐)
- ✅ **Chọn cái này nếu bạn mới bắt đầu**
- Tạo project mới tự động
- Project sẽ có tên mặc định (có thể đổi sau)
- **Đơn giản nhất, không cần chọn gì thêm**

### Option 2: "Create API key in existing project"
- Chọn cái này nếu bạn đã có project sẵn
- Sẽ có dropdown "Choose an imported project"
- **Nếu bạn thấy dropdown này:**

#### Cách chọn:
1. **Nếu bạn đã có project "youtubeAi" hoặc "youtubeai":**
   - ✅ Chọn project đó (để gom tất cả API keys vào 1 project)

2. **Nếu bạn không chắc hoặc mới bắt đầu:**
   - ✅ Quay lại, chọn **"Create API key in new project"** thay vì
   - Hoặc chọn project đầu tiên trong danh sách

3. **Nếu không có project nào:**
   - ✅ Bắt buộc phải chọn "Create API key in new project"

**→ Khuyến nghị: Chọn "Create API key in new project"** (đơn giản nhất, không cần suy nghĩ)

---

## 📝 BƯỚC 3: ĐẶT TÊN PROJECT (Nếu chọn tạo mới)

Nếu bạn chọn "Create API key in new project":
- Có thể để tên mặc định, hoặc
- Đặt tên dễ nhớ: `youtube-ai-chatbot` hoặc `youtubeai`

**Lưu ý:**
- Tên project không ảnh hưởng đến API key
- Có thể đổi tên sau

---

## ✅ BƯỚC 4: XÁC NHẬN VÀ TẠO KEY

1. Click **"Create API key"** hoặc **"Create"**
2. API key sẽ được tạo ngay lập tức
3. **QUAN TRỌNG**: Copy API key ngay!
   - Format: `AIzaSy...` (dài ~40 ký tự)
   - Chỉ hiện 1 lần, không xem lại được!

---

## 🔒 BƯỚC 5: LƯU API KEY AN TOÀN

Sau khi copy API key:

**Option 1: Tạo file `.env`**
Tạo file `ai_module/.env` với nội dung:
```
GOOGLE_GEMINI_API_KEY=AIzaSyxxxxxxxxxxxxx...
```

**Option 2: Lưu vào password manager**
- 1Password, LastPass, hoặc
- Ghi chú an toàn

**Option 3: Gửi cho tôi ngay**
- Paste API key vào chat
- Tôi sẽ tích hợp vào code

---

## ⚠️ LƯU Ý QUAN TRỌNG

### 1. API Key chỉ hiện 1 lần
- ✅ Copy ngay khi tạo
- ❌ Không thể xem lại sau
- ✅ Có thể tạo key mới nếu mất

### 2. Bảo mật API Key
- ✅ **KHÔNG** commit vào Git
- ✅ **KHÔNG** chia sẻ công khai
- ✅ File `.env` đã có trong `.gitignore` (an toàn)

### 3. Free Tier
- ✅ 1,500 requests/ngày miễn phí
- ✅ Không cần thẻ tín dụng
- ✅ Có thể dùng ngay

---

## 🎯 SAU KHI CÓ API KEY

Sau khi bạn có API key, gửi cho tôi và tôi sẽ:
1. ✅ Cài đặt `google-generativeai` library
2. ✅ Tích hợp Gemini vào `chat_service.py`
3. ✅ Thay thế HuggingFace bằng Gemini
4. ✅ Giữ nguyên tool calling và fallback
5. ✅ Test và verify hoạt động

---

## 📸 HÌNH ẢNH MÔ TẢ

Khi click "Create API key", bạn sẽ thấy:

```
┌─────────────────────────────────────┐
│  Create API key                     │
├─────────────────────────────────────┤
│                                     │
│  ○ Create API key in new project   │
│    (Recommended)                    │
│                                     │
│  ○ Create API key in existing       │
│    project                          │
│    [Dropdown: Select project...]    │
│                                     │
│  [Cancel]  [Create API key]         │
└─────────────────────────────────────┘
```

**→ Chọn "Create API key in new project" → Click "Create API key"**

---

## ✅ CHECKLIST

- [ ] Vào https://aistudio.google.com/api-keys
- [ ] Click "Create API key"
- [ ] Chọn "Create API key in new project"
- [ ] Click "Create API key"
- [ ] Copy API key ngay lập tức
- [ ] Lưu API key an toàn (file `.env` hoặc gửi cho tôi)

**Sẵn sàng! Sau khi có API key, gửi cho tôi ngay!** 🚀

---

## 🔗 LINK NHANH

- **API Keys**: https://aistudio.google.com/api-keys
- **AI Studio**: https://aistudio.google.com/
- **Documentation**: https://ai.google.dev/docs

