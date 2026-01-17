# HƯỚNG DẪN TÍCH HỢP GOOGLE GEMINI API

## ✅ ĐÃ HOÀN THÀNH

1. ✅ Cài đặt `google-generativeai` library
2. ✅ Tích hợp Gemini API vào `chat_service.py`
3. ✅ Update `requirements.txt`
4. ✅ Tạo test script `test_gemini.py`

---

## 📝 BƯỚC TIẾP THEO: THÊM API KEY VÀO .ENV

Bạn cần thêm API key vào file `.env`:

1. Mở file `ai_module/.env`
2. Thêm dòng sau:
   ```
   GOOGLE_GEMINI_API_KEY=AIzaSyCW3km8BxBfEKFsI-7wcT2l3Mi06w5a544
   ```

Hoặc chạy lệnh này (Windows PowerShell):
```powershell
cd ai_module
Add-Content .env "`nGOOGLE_GEMINI_API_KEY=AIzaSyCW3km8BxBfEKFsI-7wcT2l3Mi06w5a544"
```

---

## 🧪 TEST KẾT NỐI

Sau khi thêm API key, chạy test:

```bash
cd ai_module
python test_gemini.py
```

**Kết quả mong đợi:**
```
✅ API Key found!
✅ SUCCESS! Gemini API hoạt động!
✅ KẾT QUẢ: Gemini API đã sẵn sàng sử dụng!
```

---

## 🚀 SỬ DỤNG

Sau khi test thành công:

1. **Start AI Module:**
   ```bash
   cd ai_module
   python main.py
   ```

2. **Start Backend và Frontend**

3. **Vào tab "AI Chat Bot"** trong frontend

4. **Test chatbot:**
   - "Xin chào"
   - "Tạo 10 tiêu đề về Naruto"
   - "Tạo mô tả SEO"
   - "Tạo hashtags"

---

## 💡 LƯU Ý

- ✅ **Free Tier**: 1,500 requests/ngày miễn phí
- ✅ **Fallback**: Nếu Gemini fail, sẽ tự động fallback về HuggingFace
- ✅ **Tool Calling**: Vẫn hoạt động bình thường
- ✅ **Conversation History**: Được lưu trong localStorage

---

## 🎯 KẾT QUẢ

Chatbot giờ đã sử dụng **Google Gemini API** (miễn phí, ổn định, hỗ trợ tiếng Việt tốt)!

**Bạn có thể test ngay bây giờ!** 🚀

