HƯỚNG DẪN THIẾT LẬP MÔI TRƯỜNG CHẠY DỰ ÁN youtubeai
> Đây là file tổng quan, gom các bước chính để dựng hệ thống.
> Chi tiết từng phần công nghệ xem thêm:
> - PROJECT_STRUCTURE.md – cấu trúc dự án
> - SETUP_INSTRUCTIONS.md – checklist tổng
> - YOUTUBE_API_SETUP.md – cấu hình YouTube Data API v3
> - PHOBERT_SETUP_GUIDE.md – cài PhoBERT & mô hình NLP
> - SENTIMENT_SYSTEM_OVERVIEW.md, SENTIMENT_ANALYSIS_TECHNOLOGY.md, SENTIMENT_PAGE_IMPLEMENTATION.md – chi tiết hệ thống phân tích bình luận
> - AUTH_SETUP_GUIDE.md, AUTH_IMPLEMENTATION_GUIDE.md – xác thực & phân quyền
> - GOOGLE_OAUTH_SETUP.md – đăng nhập Google OAuth
> - CHUC_NANG_UI.md – mô tả từng màn hình UI
1. Yêu cầu chung
Hệ điều hành: Windows 10/11 (hoặc Linux/macOS đều được).
Cần cài sẵn:
Git
Java 17+ (JDK)
Node.js 18+ (kèm npm)
Python 3.10+ (khuyến nghị 3.12)
MySQL 8.x
2. Clone source
Muốn xem tổng quan kiến trúc và thư mục: đọc PROJECT_STRUCTURE.md.
3. Thiết lập cơ sở dữ liệu MySQL
Tạo database:
Import schema:
(Tuỳ chọn) Chạy thêm các script trong database/ (tạo admin, sửa role, reset mật khẩu…) theo database/README.md.
4. Cấu hình Backend (Spring Boot)
4.1. Chỉnh application.properties
Mở backend/src/main/resources/application.properties:
Hướng dẫn chi tiết hơn: AUTH_SETUP_GUIDE.md, AUTH_IMPLEMENTATION_GUIDE.md.
4.2. Cấu hình YouTube Data API v3
Làm theo YOUTUBE_API_SETUP.md:
Tạo project trên Google Cloud Console.
Bật YouTube Data API v3.
Tạo API Key và dán vào youtube.api.key.
API này dùng để:
Lấy thông tin kênh.
Lấy danh sách video.
Lấy bình luận để phân tích.
4.3. (Tuỳ chọn) Cấu hình Google OAuth
Nếu muốn login bằng Google:
Xem GOOGLE_OAUTH_SETUP.md + AUTH_SETUP_GUIDE.md.
Tạo OAuth client, chỉnh lại redirect URL và cấu hình tương ứng trong backend + frontend.
4.4. Chạy backend
Backend chạy tại: http://localhost:8080.
5. Thiết lập AI Module (NLP, PhoBERT, AI Suggestion)
Thư mục: ai_module/ – đây là service Flask xử lý NLP:
Phân tích bình luận (sentiment/emotion, topic…).
AI Suggestion / AI Content (gợi ý ý tưởng, tiêu đề, mô tả video).
5.1. Tạo virtualenv và cài thư viện
5.2. Tạo file .env cho AI module
Quan trọng: .env chứa secret, KHÔNG commit lên git (đã có .gitignore chặn).
Tạo file ai_module/.env:
> Mô tả chi tiết hệ thống NLP và pipeline xem:
> SENTIMENT_SYSTEM_OVERVIEW.md, SENTIMENT_ANALYSIS_TECHNOLOGY.md, SENTIMENT_PAGE_IMPLEMENTATION.md.
5.3. Cài đặt PhoBERT (tuỳ chọn – để tăng độ chính xác)
Nếu bạn muốn dùng PhoBERT:
Xem hướng dẫn chi tiết trong PHOBERT_SETUP_GUIDE.md.
Cách nhanh:
Script sẽ:
Tạo thư mục model.
Tải base PhoBERT.
Tạo cấu trúc phobert_sentiment/ và phobert_emotion/ (base, chưa fine-tune).
Hoặc bạn có thể copy các model đã fine-tune sẵn vào:
ai_module/app/data/models/phobert_sentiment/
ai_module/app/data/models/phobert_emotion/
5.4. Chạy AI module
Service chạy tại: http://localhost:5000.
Các endpoint chính:
/health – kiểm tra sống/chết.
/api/analyze-sentiment / /api/analyze-sentiment/batch – phân tích bình luận (xem SENTIMENT_SYSTEM_OVERVIEW.md).
/api/generate-content – AI Suggestion (gợi ý ý tưởng, tiêu đề, mô tả).
Test nhanh AI Suggestion bằng PowerShell:
Nếu trả về JSON gợi ý → AI Suggestion đã OK.
6. Thiết lập Frontend (React + Vite)
Thư mục: frontend/
6.1. Cài dependencies
6.2. Cấu hình API base URL (nếu cần)
Kiểm tra file frontend/src/services/apiClient.js (hoặc tương đương), base URL thường là:
Nếu backend chạy cổng khác, sửa lại cho phù hợp.
6.3. Chạy frontend
Frontend chạy tại: http://localhost:5173.
Các trang chính:
Dashboard – tổng quan kênh.
CommentSentiment – danh sách bình luận + biểu đồ.
VideoAnalytics – phân tích video.
CommunityInsights – thống kê cộng đồng.
AISuggestion – AI Suggestion / AI Content (nhập mô tả → gợi ý nội dung).
Admin – quản trị, cấu hình hệ thống.
> Chi tiết giao diện & luồng sử dụng: xem CHUC_NANG_UI.md.
7. Kết nối các thành phần
Để hệ thống hoạt động đầy đủ, thứ tự chạy:
MySQL: database youtubeai đang chạy.
AI Module:
Backend:
Frontend:
Mở trình duyệt: http://localhost:5173.
8. Kiểm tra nhanh các tính năng chính
8.1. Phân tích bình luận YouTube
Đăng nhập (theo hướng dẫn AUTH_SETUP_GUIDE.md).
Vào Dashboard / trang “Support Tools”, nhập URL kênh YouTube.
Hệ thống:
Gọi YouTube Data API v3 để lấy video + bình luận.
Lưu vào MySQL, chạy tác vụ nền gọi AI module phân tích.
Mở trang Comment Sentiment:
Xem biểu đồ cảm xúc.
Lọc danh sách bình luận theo tiêu chí.
8.2. AI Suggestion / AI Content
Vào trang AI Suggestion.
Nhập:
Từ khóa/niche kênh.
Mô tả nội dung muốn làm.
Frontend gọi backend → backend gọi AI module /api/generate-content.
Hệ thống trả về:
Ý tưởng video.
Gợi ý tiêu đề, mô tả (tuỳ cấu hình).
Bạn có thể copy/chỉnh sửa và dùng trực tiếp cho kênh YouTube.
9. Lưu ý quan trọng khi làm việc với repo
Không commit file nặng & bí mật:
PhoBERT weights (*.safetensors) đã được ignore trong .gitignore.
Các file .env (root, ai_module/.env, v.v.) cũng đã được ignore.
Nếu thay đổi cấu hình, nên:
Cập nhật vào các file hướng dẫn tương ứng (PHOBERT_SETUP_GUIDE.md, YOUTUBE_API_SETUP.md, …) để nhóm khác dễ nắm.