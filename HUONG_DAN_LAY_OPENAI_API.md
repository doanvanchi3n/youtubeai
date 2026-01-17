# HƯỚNG DẪN LẤY OPENAI API KEY

## 📋 BƯỚC 1: ĐĂNG KÝ TÀI KHOẢN OPENAI

1. Truy cập: **https://platform.openai.com/**
2. Click **"Sign Up"** hoặc **"Log In"**
3. Đăng ký bằng:
   - Email (Gmail, Outlook, ...)
   - Hoặc Google account
   - Hoặc Microsoft account

---

## 💳 BƯỚC 2: NẠP TIỀN (CREDITS)

1. Vào **https://platform.openai.com/account/billing**
2. Click **"Add payment method"** hoặc **"Add credits"**
3. Chọn số tiền nạp:
   - **Tối thiểu: $5** (~125,000 VND)
   - Có thể nạp $10, $20, $50, $100...
4. Nhập thông tin thẻ:
   - Số thẻ (Visa/Mastercard)
   - Ngày hết hạn
   - CVV
   - Tên chủ thẻ
   - Địa chỉ

### Lưu ý:
- ✅ **Không cần nạp trước**: Có thể dùng thử miễn phí trước (có credit $5 miễn phí cho tài khoản mới)
- ✅ **Pay-as-you-go**: Chỉ trả khi dùng
- ✅ **Có thể set spending limit**: Giới hạn số tiền tối đa/tháng

---

## 🔑 BƯỚC 3: TẠO API KEY

1. Vào **https://platform.openai.com/api-keys**
2. Click **"Create new secret key"**
3. Đặt tên cho key (ví dụ: "YouTube AI Chatbot")
4. Click **"Create secret key"**
5. **QUAN TRỌNG**: Copy API key ngay lập tức (chỉ hiện 1 lần!)
   - Format: `sk-proj-...` hoặc `sk-...` (dài ~50-100 ký tự)

---

## 📝 BƯỚC 4: GỬI API KEY CHO TÔI

Sau khi có API key, bạn có thể:

**Option 1: Gửi trực tiếp trong chat**
```
API Key: sk-proj-xxxxxxxxxxxxx...
```

**Option 2: Tạo file `.env` và gửi cho tôi**
Tạo file `ai_module/.env` với nội dung:
```
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxx...
```

**Option 3: Chỉ gửi phần đầu và cuối (an toàn hơn)**
```
API Key: sk-proj-...xxxxx
```
(Tôi sẽ hỏi bạn phần còn lại khi cần)

---

## ⚠️ LƯU Ý BẢO MẬT

- ✅ **KHÔNG** commit API key vào Git
- ✅ **KHÔNG** chia sẻ API key công khai
- ✅ File `.env` đã có trong `.gitignore` (an toàn)
- ✅ Có thể tạo nhiều API keys cho các mục đích khác nhau
- ✅ Có thể xóa/regenerate key bất cứ lúc nào

---

## 💰 GIÁ CẢ CHI TIẾT

### GPT-4o-mini (Khuyến nghị - Rẻ nhất!)
- **Input**: $0.15 / 1M tokens ≈ **3,750 VND / 1M tokens** ⭐
- **Output**: $0.60 / 1M tokens ≈ **15,000 VND / 1M tokens**

### GPT-3.5-turbo (Rẻ, nhưng đắt hơn GPT-4o-mini)
- **Input**: $0.50 / 1M tokens ≈ **12,500 VND / 1M tokens**
- **Output**: $1.50 / 1M tokens ≈ **37,500 VND / 1M tokens**

### Ước tính sử dụng (GPT-4o-mini):
- 1 cuộc chat (~500 input + 200 output tokens) ≈ **0.12 VND**
- 1,000 cuộc chat ≈ **120 VND**
- 10,000 cuộc chat ≈ **1,200 VND**
- 100,000 cuộc chat ≈ **12,000 VND**

**→ Rẻ hơn Claude Haiku 40%!** 🎉

---

## 🎯 SAU KHI CÓ API KEY

Sau khi bạn gửi API key, tôi sẽ:
1. ✅ Cài đặt `openai` library
2. ✅ Tích hợp GPT-4o-mini vào `chat_service.py`
3. ✅ Thay thế HuggingFace bằng OpenAI
4. ✅ Giữ nguyên tool calling và fallback
5. ✅ Test và verify hoạt động

---

## 📞 HỖ TRỢ

Nếu gặp vấn đề:
- **Không thể đăng ký**: Thử email khác hoặc VPN
- **Không có thẻ tín dụng**: Có thể dùng thẻ ảo (Visa/Mastercard ảo)
- **API key không hoạt động**: Kiểm tra đã copy đầy đủ chưa
- **Credit miễn phí**: Tài khoản mới thường có $5 credit miễn phí

---

## ✅ CHECKLIST

- [ ] Đăng ký tài khoản OpenAI
- [ ] Nạp credits (tối thiểu $5) hoặc dùng credit miễn phí
- [ ] Tạo API key
- [ ] Copy và lưu API key an toàn
- [ ] Gửi API key cho tôi (hoặc tạo file `.env`)

**Sẵn sàng! Gửi API key cho tôi khi bạn đã có!** 🚀

---

## 🔗 LINK NHANH

- **Đăng ký**: https://platform.openai.com/
- **API Keys**: https://platform.openai.com/api-keys
- **Billing**: https://platform.openai.com/account/billing
- **Documentation**: https://platform.openai.com/docs

