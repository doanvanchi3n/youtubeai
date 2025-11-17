# Hướng Dẫn Setup Google OAuth

## 🔧 Cấu Hình Google OAuth

### Bước 1: Tạo Google OAuth Client ID

1. Truy cập [Google Cloud Console](https://console.cloud.google.com/)
2. Tạo project mới hoặc chọn project hiện có
3. Enable **Google+ API**:
   - Vào **APIs & Services** > **Library**
   - Tìm "Google+ API" và click **Enable**

4. Tạo OAuth 2.0 Client ID:
   - Vào **APIs & Services** > **Credentials**
   - Click **Create Credentials** > **OAuth client ID**
   - Nếu chưa có OAuth consent screen, tạo mới:
     - User Type: **External** (hoặc Internal nếu dùng Google Workspace)
     - App name: **YouTube AI Analytics**
     - User support email: Email của bạn
     - Developer contact: Email của bạn
   - Tạo OAuth Client ID:
     - Application type: **Web application**
     - Name: **YouTube AI Analytics Web Client**
     - **Authorized JavaScript origins**: 
       - `http://localhost:5173`
       - `http://localhost:3000` (nếu cần)
     - **Authorized redirect URIs**:
       - `http://localhost:5173`
       - `http://localhost:3000` (nếu cần)

5. Copy **Client ID** (dạng: `123456789-abcdefghijklmnop.apps.googleusercontent.com`)

### Bước 2: Cấu Hình Backend

**File**: `backend/src/main/resources/application.properties`

```properties
# Google OAuth
google.client-id=YOUR_CLIENT_ID_HERE
```

Thay `YOUR_CLIENT_ID_HERE` bằng Client ID bạn vừa copy.

### Bước 3: Cấu Hình Frontend

**File**: `frontend/.env` (tạo mới nếu chưa có)

```env
VITE_GOOGLE_CLIENT_ID=YOUR_CLIENT_ID_HERE
```

Thay `YOUR_CLIENT_ID_HERE` bằng Client ID bạn vừa copy.

**Lưu ý**: Sau khi thêm `.env`, cần restart dev server:
```bash
# Stop server (Ctrl+C)
# Start lại
npm run dev
```

### Bước 4: Test

1. Chạy backend:
```bash
cd backend
mvn spring-boot:run
```

2. Chạy frontend:
```bash
cd frontend
npm run dev
```

3. Mở browser: `http://localhost:5173/login`
4. Click "Đăng nhập với Google"
5. Chọn tài khoản Google
6. Cho phép quyền truy cập

---

## ⚠️ Troubleshooting

### Lỗi: "Google Client ID chưa được cấu hình"
- Kiểm tra file `.env` trong frontend có đúng không
- Đảm bảo biến bắt đầu với `VITE_`
- Restart dev server sau khi thêm `.env`

### Lỗi: "Token Google không hợp lệ"
- Kiểm tra Google Client ID trong backend `application.properties`
- Đảm bảo Client ID giống nhau ở cả frontend và backend
- Kiểm tra Authorized JavaScript origins đã thêm `http://localhost:5173` chưa

### Lỗi: "Cannot continue with google.com"
- Kiểm tra OAuth consent screen đã được cấu hình chưa
- Đảm bảo Google+ API đã được enable
- Kiểm tra Authorized redirect URIs

### Lỗi: CORS
- Đảm bảo backend SecurityConfig đã config CORS cho `http://localhost:5173`
- Kiểm tra backend đang chạy trên port 8080

---

## 🔐 Production Setup

Khi deploy lên production:

1. Thêm domain vào **Authorized JavaScript origins**:
   - `https://yourdomain.com`
   - `https://www.yourdomain.com`

2. Thêm domain vào **Authorized redirect URIs**:
   - `https://yourdomain.com`
   - `https://www.yourdomain.com`

3. Cập nhật `.env` và `application.properties` với Client ID production

4. Đảm bảo HTTPS được sử dụng (Google OAuth yêu cầu HTTPS cho production)

---

## 📝 Lưu Ý

- **Development**: Có thể dùng `http://localhost`
- **Production**: Phải dùng `https://`
- Client ID phải giống nhau ở frontend và backend
- Sau khi thay đổi `.env`, cần restart dev server

---

**Chúc bạn setup thành công! 🎉**


