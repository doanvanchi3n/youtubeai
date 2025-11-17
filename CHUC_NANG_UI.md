# Mô Tả Chức Năng Cần Có Để Đáp Ứng UI

## 1. Dashboard (Trang Chủ)

### 1.1. Tìm kiếm YouTube URL
- **Chức năng**: Nhập URL kênh YouTube hoặc video YouTube
- **Xử lý**: 
  - Validate URL format (YouTube channel hoặc video URL)
  - Extract channel ID hoặc video ID từ URL
  - Lưu trữ thông tin kênh/video để phân tích
- **API cần có**: 
  - `POST /api/youtube/analyze` - Phân tích URL và lấy dữ liệu từ YouTube API

### 1.2. Hiển thị Metrics Tổng Quan
- **Chức năng**: Hiển thị 4 thẻ số liệu
  - Total Likes: Tổng số lượt thích
  - Total Comments: Tổng số bình luận
  - Videos: Tổng số video
  - Views: Tổng số lượt xem
- **API cần có**:
  - `GET /api/dashboard/metrics?channelId={id}` - Lấy tổng hợp metrics

### 1.3. Biểu Đồ Views, Likes & Comments Theo Thời Gian
- **Chức năng**: Biểu đồ đường (line chart) hiển thị xu hướng theo thời gian
- **Dữ liệu cần**: 
  - Mảng các điểm thời gian (date)
  - Số lượng views, likes, comments tương ứng
- **API cần có**:
  - `GET /api/dashboard/trends?channelId={id}&startDate={date}&endDate={date}` - Lấy dữ liệu xu hướng

### 1.4. Top 5 Video Có Tương Tác Cao Nhất
- **Chức năng**: Danh sách 5 video có engagement cao nhất
- **Dữ liệu cần cho mỗi video**:
  - Thumbnail URL
  - Video title
  - Số lượt like
  - Số lượt view
  - Số lượt comment
  - Video ID (để link đến video)
- **API cần có**:
  - `GET /api/videos/top-engaging?channelId={id}&limit=5` - Lấy top video theo engagement

### 1.5. Biểu Đồ Phân Tích Cảm Xúc Bình Luận
- **Chức năng**: Biểu đồ tròn (pie chart) phân loại sentiment
- **Dữ liệu cần**: 
  - Số lượng bình luận tích cực
  - Số lượng bình luận tiêu cực
  - Số lượng bình luận trung lập
- **API cần có**:
  - `GET /api/comments/sentiment-summary?channelId={id}` - Tổng hợp sentiment

---

## 2. Video Analytics (Phân Tích Video)

### 2.1. Thông Tin Kênh
- **Chức năng**: Hiển thị thông tin kênh YouTube
- **Dữ liệu cần**:
  - Avatar kênh
  - Tên kênh
  - Số lượng subscribers
  - Số lượng video
- **API cần có**:
  - `GET /api/channel/info?channelId={id}` - Lấy thông tin kênh

### 2.2. Biểu Đồ Tốc Độ Tăng View
- **Chức năng**: Biểu đồ đường hiển thị tốc độ tăng trưởng views
- **Dữ liệu cần**: 
  - Mảng các điểm thời gian
  - Số lượng views tăng thêm mỗi ngày/tuần/tháng
- **API cần có**:
  - `GET /api/analytics/view-growth?channelId={id}&period={daily|weekly|monthly}` - Lấy dữ liệu tăng trưởng

### 2.3. Biểu Đồ Tương Tác Theo Thời Gian (Có Tabs)
- **Chức năng**: Biểu đồ đường với 3 tab: View, Like, Comment
- **Dữ liệu cần**: 
  - Dữ liệu views theo thời gian
  - Dữ liệu likes theo thời gian
  - Dữ liệu comments theo thời gian
- **API cần có**:
  - `GET /api/analytics/interactions?channelId={id}&type={view|like|comment}&startDate={date}&endDate={date}` - Lấy dữ liệu tương tác

### 2.4. Gợi Ý Thời Điểm Đăng Video Hiệu Quả
- **Chức năng**: Phân tích và đề xuất thời điểm tốt nhất để đăng video
- **Dữ liệu cần**: 
  - Các khung giờ trong ngày
  - Các ngày trong tuần
  - Mức độ tương tác dự kiến
- **API cần có**:
  - `GET /api/analytics/optimal-posting-time?channelId={id}` - Phân tích thời điểm tối ưu

---

## 3. Comment Sentiment (Phân Tích Cảm Xúc Bình Luận)

### 3.1. Lọc Bình Luận Theo Cảm Xúc
- **Chức năng**: Filter theo 3 loại: Tích cực, Tiêu cực, Trung lập
- **Dữ liệu cần cho mỗi bình luận**:
  - Avatar người bình luận
  - Tên người bình luận
  - Thời gian đăng
  - Tiêu đề video liên quan
  - Nội dung bình luận
  - Sentiment label (positive/negative/neutral)
- **API cần có**:
  - `GET /api/comments?channelId={id}&sentiment={positive|negative|neutral}&page={page}&size={size}` - Lấy bình luận theo sentiment

### 3.2. Lọc Bình Luận Theo Loại Cảm Xúc Chi Tiết
- **Chức năng**: Filter theo 5 loại cảm xúc:
  - 😊 Vui vẻ
  - 😞 Buồn chán
  - 😡 Công kích
  - 💬 Góp ý
  - ❤️ Yêu thích
- **Dữ liệu cần**: Tương tự như 3.1 nhưng có thêm emotion label
- **API cần có**:
  - `GET /api/comments?channelId={id}&emotion={happy|sad|angry|suggestion|love}&page={page}&size={size}` - Lấy bình luận theo emotion

### 3.3. Top 3 Bình Luận Nhiều Like Nhất
- **Chức năng**: Hiển thị 3 bình luận có nhiều like nhất
- **Dữ liệu cần**:
  - Thumbnail video
  - Tiêu đề video
  - Số lượng like của bình luận
- **API cần có**:
  - `GET /api/comments/top-liked?channelId={id}&limit=3` - Lấy top bình luận

### 3.4. Biểu Đồ Cảm Xúc
- **Chức năng**: Biểu đồ tròn hiển thị phân bố các loại cảm xúc
- **Dữ liệu cần**: Số lượng bình luận cho mỗi loại cảm xúc
- **API cần có**:
  - `GET /api/comments/emotion-distribution?channelId={id}` - Phân bố cảm xúc

---

## 4. Community Insights (Thông Tin Cộng Đồng)

### 4.1. Tổng Số Bình Luận
- **Chức năng**: Hiển thị tổng số bình luận
- **API cần có**:
  - `GET /api/community/total-comments?channelId={id}` - Lấy tổng số bình luận

### 4.2. Danh Sách Chủ Đề Video
- **Chức năng**: Hiển thị các chủ đề/topic được đề cập trong video
- **Dữ liệu cần**: Mảng các topic names
- **API cần có**:
  - `GET /api/videos/topics?channelId={id}` - Lấy danh sách chủ đề

### 4.3. Thống Kê Cảm Xúc Tổng Quan
- **Chức năng**: Biểu đồ tròn phân loại tích cực/tiêu cực/trung lập
- **API cần có**:
  - `GET /api/comments/sentiment-distribution?channelId={id}` - Phân bố sentiment

### 4.4. Danh Sách Từ Khóa Được Nhắc Nhiều
- **Chức năng**: Hiển thị các từ khóa/keywords xuất hiện nhiều trong bình luận
- **Dữ liệu cần**: Mảng các keyword strings
- **API cần có**:
  - `GET /api/comments/keywords?channelId={id}&limit={n}` - Lấy top keywords

### 4.5. Gợi Ý Chủ Đề
- **Chức năng**: AI đề xuất chủ đề video mới dựa trên phân tích
- **Dữ liệu cần**: Mảng các topic suggestions
- **API cần có**:
  - `GET /api/ai/topic-suggestions?channelId={id}` - Lấy gợi ý chủ đề từ AI

### 4.6. Biểu Đồ So Sánh Tương Tác Các Chủ Đề
- **Chức năng**: Biểu đồ cột (bar chart) so sánh engagement giữa các topic
- **Dữ liệu cần**: 
  - Tên topic
  - Số lượng views/likes/comments cho mỗi topic
- **API cần có**:
  - `GET /api/analytics/topic-comparison?channelId={id}` - So sánh tương tác theo topic

---

## 5. AI Suggestion (Gợi Ý AI)

### 5.1. Nhập Mô Tả và Tạo Nội Dung
- **Chức năng**: Người dùng nhập mô tả, AI tạo nội dung gợi ý
- **Xử lý**:
  - Nhận input mô tả từ người dùng
  - Gửi đến AI module để xử lý
  - Trả về nội dung gợi ý (có thể là: tiêu đề video, mô tả, tags, script outline, v.v.)
- **API cần có**:
  - `POST /api/ai/generate-content` - Tạo nội dung từ mô tả
    - Request body: `{ "description": "string", "type": "title|description|tags|script" }`
    - Response: `{ "content": "string", "suggestions": [...] }`

---

## 6. Settings (Cài Đặt)

### 6.1. Quản Lý Tài Khoản
- **Chức năng**: 
  - Đổi avatar
  - Cập nhật tên người dùng
  - Cập nhật email
  - Đổi mật khẩu
- **API cần có**:
  - `GET /api/user/profile` - Lấy thông tin user
  - `PUT /api/user/profile` - Cập nhật thông tin user
  - `POST /api/user/avatar` - Upload avatar
  - `PUT /api/user/password` - Đổi mật khẩu

### 6.2. Cài Đặt Giao Diện
- **Chức năng**: 
  - Bật/tắt dark mode
  - Chuyển đổi ngôn ngữ (Tiếng Việt/Tiếng Anh)
- **API cần có**:
  - `GET /api/user/preferences` - Lấy preferences
  - `PUT /api/user/preferences` - Cập nhật preferences
    - Request body: `{ "darkMode": boolean, "language": "vi|en" }`

---

## 7. Authentication (Xác Thực)

### 7.1. Đăng Nhập
- **Chức năng**: Xác thực người dùng
- **API cần có**:
  - `POST /api/auth/login` - Đăng nhập
    - Request body: `{ "email": "string", "password": "string" }`
    - Response: `{ "token": "string", "user": {...} }`

### 7.2. Đăng Xuất
- **Chức năng**: Đăng xuất và xóa session
- **API cần có**:
  - `POST /api/auth/logout` - Đăng xuất

### 7.3. Quản Lý Session
- **Chức năng**: Kiểm tra và duy trì session
- **API cần có**:
  - `GET /api/auth/me` - Lấy thông tin user hiện tại từ token

---

## 8. AI Module (Python Backend)

### 8.1. Phân Tích Sentiment
- **Chức năng**: Phân tích cảm xúc từ text bình luận
- **Input**: Text bình luận
- **Output**: 
  - Sentiment: positive/negative/neutral
  - Emotion: happy/sad/angry/suggestion/love
  - Confidence score

### 8.2. Trích Xuất Keywords
- **Chức năng**: Tìm các từ khóa quan trọng trong bình luận
- **Input**: Tập hợp bình luận
- **Output**: Danh sách keywords với frequency

### 8.3. Phân Loại Topic
- **Chức năng**: Phân loại video theo chủ đề
- **Input**: Video title, description, comments
- **Output**: Topic categories

### 8.4. Gợi Ý Nội Dung
- **Chức năng**: Tạo nội dung gợi ý từ mô tả
- **Input**: Mô tả ngắn
- **Output**: Nội dung gợi ý (title, description, tags, script)

### 8.5. Phân Tích Thời Điểm Tối Ưu
- **Chức năng**: Phân tích dữ liệu lịch sử để đề xuất thời điểm đăng video
- **Input**: Dữ liệu views/likes/comments theo thời gian
- **Output**: Khuyến nghị thời điểm đăng

---

## 9. Database Schema Cần Có

### 9.1. User Table
- id, email, password, username, avatar_url, created_at, updated_at

### 9.2. Channel Table
- id, user_id, channel_id, channel_name, avatar_url, subscriber_count, created_at, updated_at

### 9.3. Video Table
- id, channel_id, video_id, title, description, thumbnail_url, view_count, like_count, comment_count, published_at, created_at

### 9.4. Comment Table
- id, video_id, comment_id, author_name, author_avatar, content, like_count, sentiment, emotion, published_at, created_at

### 9.5. Analytics Table
- id, channel_id, date, view_count, like_count, comment_count, subscriber_count

### 9.6. Topic Table
- id, channel_id, topic_name, video_count

### 9.7. Keyword Table
- id, channel_id, keyword, frequency, created_at

---

## 10. Integration với YouTube API

### 10.1. Lấy Thông Tin Kênh
- YouTube Data API v3: `channels.list`

### 10.2. Lấy Danh Sách Video
- YouTube Data API v3: `search.list` và `videos.list`

### 10.3. Lấy Bình Luận
- YouTube Data API v3: `commentThreads.list`

### 10.4. Lấy Thống Kê Video
- YouTube Data API v3: `videos.list` với statistics

---

## 11. Các Service/Utility Functions Cần Có

### 11.1. YouTube Service
- Extract channel ID từ URL
- Extract video ID từ URL
- Validate YouTube URL
- Fetch data từ YouTube API

### 11.2. Chart Service (Frontend)
- Line chart component
- Pie chart component
- Bar chart component
- Format data cho charts

### 11.3. Date/Time Utilities
- Format dates
- Calculate time ranges
- Timezone handling

### 11.4. Data Aggregation
- Aggregate metrics theo thời gian
- Calculate growth rates
- Calculate averages

---

## Tóm Tắt API Endpoints Cần Implement

### Authentication
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

### User Management
- `GET /api/user/profile`
- `PUT /api/user/profile`
- `POST /api/user/avatar`
- `PUT /api/user/password`
- `GET /api/user/preferences`
- `PUT /api/user/preferences`

### YouTube Integration
- `POST /api/youtube/analyze`
- `GET /api/channel/info?channelId={id}`

### Dashboard
- `GET /api/dashboard/metrics?channelId={id}`
- `GET /api/dashboard/trends?channelId={id}&startDate={date}&endDate={date}`

### Videos
- `GET /api/videos/top-engaging?channelId={id}&limit={n}`
- `GET /api/videos/topics?channelId={id}`

### Comments
- `GET /api/comments?channelId={id}&sentiment={type}&emotion={type}&page={n}&size={n}`
- `GET /api/comments/sentiment-summary?channelId={id}`
- `GET /api/comments/sentiment-distribution?channelId={id}`
- `GET /api/comments/emotion-distribution?channelId={id}`
- `GET /api/comments/top-liked?channelId={id}&limit={n}`
- `GET /api/comments/keywords?channelId={id}&limit={n}`

### Analytics
- `GET /api/analytics/view-growth?channelId={id}&period={type}`
- `GET /api/analytics/interactions?channelId={id}&type={type}&startDate={date}&endDate={date}`
- `GET /api/analytics/optimal-posting-time?channelId={id}`
- `GET /api/analytics/topic-comparison?channelId={id}`

### Community
- `GET /api/community/total-comments?channelId={id}`

### AI
- `GET /api/ai/topic-suggestions?channelId={id}`
- `POST /api/ai/generate-content`

---

## Lưu Ý Kỹ Thuật

1. **Caching**: Nên cache dữ liệu từ YouTube API để tránh rate limiting
2. **Background Jobs**: Sử dụng scheduled jobs để sync dữ liệu định kỳ
3. **Pagination**: Tất cả API trả về danh sách cần có pagination
4. **Error Handling**: Xử lý lỗi khi YouTube API không available
5. **Rate Limiting**: Implement rate limiting cho API endpoints
6. **Security**: 
   - JWT authentication
   - Input validation
   - SQL injection prevention
   - XSS prevention
7. **Performance**: 
   - Database indexing
   - Query optimization
   - Lazy loading cho large datasets

