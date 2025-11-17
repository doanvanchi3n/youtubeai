# Hướng Dẫn Chạy Demo Admin Panel

## 🚀 Cách Chạy

### 1. Chạy Frontend Development Server

```bash
cd frontend
npm run dev
```

Server sẽ chạy tại: `http://localhost:5173` (hoặc port khác nếu 5173 đã được dùng)

### 2. Truy Cập Admin Panel

Sau khi server chạy, mở trình duyệt và truy cập các URL sau:

#### **Admin Dashboard (Trang Tổng Quan)**
```
http://localhost:5173/admin
```

#### **Quản Lý Người Dùng**
```
http://localhost:5173/admin/users
```

#### **Quản Lý Dữ Liệu**
```
http://localhost:5173/admin/data
```

#### **Quản Lý AI**
```
http://localhost:5173/admin/ai
```

#### **Cấu Hình Hệ Thống**
```
http://localhost:5173/admin/settings
```

#### **Hỗ Trợ & Logs**
```
http://localhost:5173/admin/support
```

---

## 📋 Các Trang Admin Đã Tạo

### 1. **Admin Dashboard** (`/admin`)
- ✅ 4 stat cards: Tổng users, Kênh đã phân tích, API requests, Uptime
- ✅ Trạng thái server (Backend, AI Module, Database)
- ✅ Biểu đồ API requests
- ✅ Biểu đồ tăng trưởng users
- ✅ Log lỗi gần đây
- ✅ Hoạt động gần đây

### 2. **User Management** (`/admin/users`)
- ✅ Tìm kiếm users
- ✅ Bảng danh sách users với đầy đủ thông tin
- ✅ Actions: Xem, Sửa, Khóa
- ✅ Pagination

### 3. **Data Management** (`/admin/data`)
- ✅ Tabs: Lịch sử phân tích, Quản lý kênh, Quản lý video
- ✅ Bảng lịch sử phân tích YouTube
- ✅ Actions: Xem, Refresh, Xóa

### 4. **AI Management** (`/admin/ai`)
- ✅ Tabs: Mô hình AI, Training, Từ khóa nhạy cảm
- ✅ Quản lý Sentiment & Emotion models
- ✅ Lịch sử training

### 5. **System Settings** (`/admin/settings`)
- ✅ Tabs: API Settings, Logs & Bảo Mật, Backup & Restore
- ✅ Quản lý API keys
- ✅ Rate limiting settings
- ✅ Log settings (toggle switches)
- ✅ Backup & Restore

### 6. **Support Tools** (`/admin/support`)
- ✅ Tabs: Tickets, Logs
- ✅ Danh sách support tickets
- ✅ System logs (Backend, AI Module, YouTube API)

---

## 🎨 Design Features

- ✅ Sidebar navigation với menu admin
- ✅ Topbar với thông tin admin
- ✅ Cards với border và shadow
- ✅ Tables với hover effects
- ✅ Badges cho status/roles
- ✅ Tabs navigation
- ✅ Responsive layout
- ✅ Color scheme: Teal (#26E2B3) + Dark sidebar (#202731)

---

## 📝 Lưu Ý

1. **Dữ liệu hiện tại là mock data** - Cần tích hợp với backend API
2. **Chưa có authentication** - Cần thêm route protection
3. **Chưa có modals** - Cần tạo modals cho các actions (Xem, Sửa, etc.)
4. **Chưa có form validation** - Cần thêm validation cho các forms
5. **Chưa có loading states** - Cần thêm loading indicators

---

## 🔄 So Sánh User vs Admin Routes

### User Routes (Layout thường)
- `/dashboard` - Dashboard
- `/video-analytics` - Video Analytics
- `/sentiment` - Comment Sentiment
- `/ai-content` - AI Suggestions
- `/community` - Community Insights
- `/settings` - Settings

### Admin Routes (Admin Layout)
- `/admin` - Admin Dashboard
- `/admin/users` - User Management
- `/admin/data` - Data Management
- `/admin/ai` - AI Management
- `/admin/settings` - System Settings
- `/admin/support` - Support Tools

---

## 🐛 Troubleshooting

### Lỗi: Cannot find module
```bash
cd frontend
npm install
```

### Lỗi: Port đã được sử dụng
Vite sẽ tự động chọn port khác, kiểm tra terminal để xem port mới.

### Lỗi: Component không render
Kiểm tra console browser để xem lỗi cụ thể.

---

## 📚 Next Steps

1. ✅ Tích hợp với backend API
2. ✅ Thêm authentication & authorization
3. ✅ Tạo modals cho các actions
4. ✅ Thêm form validation
5. ✅ Thêm loading states
6. ✅ Thêm error handling
7. ✅ Thêm real-time updates (nếu cần)

---

**Chúc bạn demo thành công! 🎉**

