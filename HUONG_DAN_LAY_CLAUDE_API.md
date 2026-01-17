# HƯỚNG DẪN LẤY CLAUDE API KEY

## 📋 BƯỚC 1: ĐĂNG KÝ TÀI KHOẢN ANTHROPIC

1. Truy cập: **https://console.anthropic.com/**
2. Click **"Sign Up"** hoặc **"Get Started"**
3. Đăng ký bằng:
   - Email (Gmail, Outlook, ...)
   - Hoặc Google account
   - Hoặc GitHub account

---

## 💳 BƯỚC 2: THANH TOÁN (NẠP TIỀN)

### Cách 1: Credit Card (Visa/Mastercard)
1. Vào **Settings** → **Billing**
2. Click **"Add Payment Method"**
3. Nhập thông tin thẻ:
   - Số thẻ
   - Ngày hết hạn
   - CVV
   - Tên chủ thẻ
   - Địa chỉ (có thể dùng địa chỉ Việt Nam)

### Cách 2: PayPal (Nếu có)
1. Chọn **PayPal** trong phần thanh toán
2. Đăng nhập PayPal và xác nhận

### Lưu ý:
- **Không cần nạp trước**: Claude tính theo usage (pay-as-you-go)
- **Có thể set spending limit**: Giới hạn số tiền tối đa/tháng
- **Miễn phí $5 đầu tiên**: Anthropic thường có credit miễn phí cho tài khoản mới

---

## 🔑 BƯỚC 3: TẠO API KEY

1. Vào **https://console.anthropic.com/settings/keys**
2. Click **"Create Key"**
3. Đặt tên cho key (ví dụ: "YouTube AI Chatbot")
4. Click **"Create Key"**
5. **QUAN TRỌNG**: Copy API key ngay lập tức (chỉ hiện 1 lần!)
   - Format: `sk-ant-api03-...` (rất dài, ~100 ký tự)

---

## 📝 BƯỚC 4: GỬI API KEY CHO TÔI

Sau khi có API key, bạn có thể:

**Option 1: Gửi trực tiếp trong chat**
```
API Key: sk-ant-api03-xxxxxxxxxxxxx...
```

**Option 2: Tạo file `.env` và gửi cho tôi**
Tạo file `ai_module/.env` với nội dung:
```
ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxx...
```

**Option 3: Chỉ gửi phần đầu và cuối (an toàn hơn)**
```
API Key: sk-ant-api03-...xxxxx
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

### Claude Haiku (Khuyến nghị cho chatbot)
- **Input**: $0.25 / 1M tokens ≈ **6,250 VND / 1M tokens**
- **Output**: $1.25 / 1M tokens ≈ **31,250 VND / 1M tokens**

### Ước tính sử dụng:
- 1 cuộc chat (~500 input + 200 output tokens) ≈ **0.2 VND**
- 1,000 cuộc chat ≈ **200 VND**
- 10,000 cuộc chat ≈ **2,000 VND**

### So sánh:
- **HuggingFace Inference Endpoints**: ~$0.60/giờ ≈ 15,000 VND/giờ (phải trả cả khi không dùng)
- **Claude**: Chỉ trả khi có người dùng thực sự

---

## 🎯 SAU KHI CÓ API KEY

Sau khi bạn gửi API key, tôi sẽ:
1. ✅ Cài đặt `anthropic` library
2. ✅ Tích hợp Claude vào `chat_service.py`
3. ✅ Thay thế HuggingFace bằng Claude
4. ✅ Giữ nguyên tool calling và fallback
5. ✅ Test và verify hoạt động

---

## 📞 HỖ TRỢ

Nếu gặp vấn đề:
- **Không thể đăng ký**: Thử email khác hoặc VPN
- **Không có thẻ tín dụng**: Có thể dùng thẻ ảo (Visa/Mastercard ảo)
- **API key không hoạt động**: Kiểm tra đã copy đầy đủ chưa

---

## ✅ CHECKLIST

- [ ] Đăng ký tài khoản Anthropic
- [ ] Thêm phương thức thanh toán
- [ ] Tạo API key
- [ ] Copy và lưu API key an toàn
- [ ] Gửi API key cho tôi (hoặc tạo file `.env`)

**Sẵn sàng! Gửi API key cho tôi khi bạn đã có!** 🚀

