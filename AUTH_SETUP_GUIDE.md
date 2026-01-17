
## 🔧 Cấu Hình Cần Thiết

### 1. Database Migration

Cần update database schema để thêm các cột mới:

```sql
ALTER TABLE users 
ADD COLUMN role VARCHAR(20) DEFAULT 'USER',
ADD COLUMN locked BOOLEAN DEFAULT FALSE,
ADD COLUMN google_id VARCHAR(255) NULL;

-- Tạo admin user (password: admin123)
-- Hash: $2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy
UPDATE users SET role = 'ADMIN' WHERE email = 'admin@example.com';
```

### 2. Backend Configuration

**File**: `backend/src/main/resources/application.properties`

```properties
# JWT Configuration
jwt.secret=your-super-secret-key-minimum-256-bits-for-hs512-algorithm-please-change-this-in-production-environment
jwt.expiration=86400000

# Google OAuth
google.client-id=YOUR_GOOGLE_CLIENT_ID_HERE
```

### 3. Google OAuth Setup

1. Truy cập [Google Cloud Console](https://console.cloud.google.com/)
2. Tạo project mới hoặc chọn project hiện có
3. Enable Google+ API
4. Tạo OAuth 2.0 Client ID:
   - Application type: Web application
   - Authorized JavaScript origins: `http://localhost:5173`
   - Authorized redirect URIs: `http://localhost:5173`
5. Copy Client ID và paste vào `application.properties`

### 4. Frontend Configuration

**File**: `frontend/.env` (tạo mới nếu chưa có)

```env
VITE_GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID_HERE
```

---

## 🚀 Cách Chạy

### Backend:
```bash
cd backend
mvn clean install
mvn spring-boot:run
```

### Frontend:
```bash
cd frontend
npm install
npm run dev
```

---

## 📝 API Endpoints

### Register
```
POST /api/auth/register
Body: {
  "username": "string",
  "email": "string",
  "password": "string"
}
```

### Login
```
POST /api/auth/login
Body: {
  "email": "string",
  "password": "string"
}
```

### Google Auth
```
POST /api/auth/google
Body: {
  "token": "google_id_token"
}
```

### Get Current User
```
GET /api/auth/me
Headers: Authorization: Bearer <token>
```

### Logout
```
POST /api/auth/logout
Headers: Authorization: Bearer <token>
```

---

## 🔐 Roles

- **USER**: Người dùng thường (mặc định khi đăng ký)
- **PREMIUM**: Người dùng premium (có thể thêm sau)
- **ADMIN**: Quản trị viên (chỉ set thủ công trong database)

---

## 🎯 Flow

### Đăng Ký:
1. User nhập thông tin → Validation
2. Gọi API `/api/auth/register`
3. Backend tạo user với role="USER"
4. Tạo UserPreferences mặc định
5. Generate JWT token
6. Lưu token vào localStorage
7. Redirect đến `/dashboard`

### Đăng Nhập:
1. User nhập email + password → Validation
2. Gọi API `/api/auth/login`
3. Backend verify password
4. Generate JWT token
5. Lưu token vào localStorage
6. Redirect:
   - Nếu role="ADMIN" → `/admin`
   - Nếu role="USER" → `/dashboard`

### Google OAuth:
1. User click "Đăng nhập với Google"
2. Google Sign-In popup
3. User chọn account
4. Google trả về ID token
5. Gọi API `/api/auth/google` với token
6. Backend verify token với Google
7. Tìm hoặc tạo user
8. Generate JWT token
9. Lưu token và redirect

---

## ⚠️ Lưu Ý

1. **JWT Secret**: Phải đổi trong production
2. **Google Client ID**: Cần setup trong Google Cloud Console
3. **CORS**: Đã config cho `http://localhost:5173`
4. **Password**: Được hash bằng BCrypt
5. **Token Expiration**: 24 giờ (có thể thay đổi)

---

## 🐛 Troubleshooting

### Lỗi: "Email đã được sử dụng"
- User đã tồn tại, thử đăng nhập thay vì đăng ký

### Lỗi: "Token Google không hợp lệ"
- Kiểm tra Google Client ID đã đúng chưa
- Kiểm tra Google Sign-In đã load chưa

### Lỗi: "User not found" khi getCurrentUser
- Token có thể đã hết hạn
- Thử đăng nhập lại

### Lỗi: CORS
- Kiểm tra backend đã chạy chưa
- Kiểm tra CORS config trong SecurityConfig

---

**Chúc bạn implement thành công! 🎉**

