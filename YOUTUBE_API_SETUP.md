# YouTube Data API v3 Setup Guide

Tài liệu này hướng dẫn quy trình tích hợp dữ liệu YouTube công khai vào hệ thống `youtubeai`. Làm lần lượt để có thể gọi API thật, lưu dữ liệu và đồng bộ với Dashboard.

---

## 1. Tạo Google Cloud Project và bật API

1. Truy cập [Google Cloud Console](https://console.cloud.google.com/) và đăng nhập với tài khoản Google.
2. Tạo Project mới (hoặc chọn project hiện có). Nên đặt tên dễ nhận biết, ví dụ `youtubeai-dev`.
3. Vào **APIs & Services → Library**.
4. Tìm **YouTube Data API v3** → **Enable**.
5. (Tuỳ chọn) Nếu muốn dùng OAuth cho các tác vụ cần quyền riêng tư, bật thêm “YouTube Analytics API”, nhưng với dữ liệu public chỉ cần YouTube Data API v3.

## 2. Tạo Credentials

### 2.1 API Key (đủ cho dữ liệu public)

1. Vào **APIs & Services → Credentials**.
2. Chọn **Create credentials → API key**.
3. Copy key vừa tạo, sau đó chỉnh **image.png** (nên giới hạn domain/IP để tránh lộ).

### 2.2 OAuth Client (tuỳ chọn)

Chỉ cần nếu bạn muốn phân tích dữ liệu private hoặc thay người dùng xác thực. Các bước tương tự `GOOGLE_OAUTH_SETUP.md`.

## 3. Cấu hình backend

1. Lưu API key vào `backend/src/main/resources/application.properties` (hoặc dùng biến môi trường):

   ```properties
   youtube.api.key=YOUR_API_KEY_HERE
   youtube.api.base-url=https://www.googleapis.com/youtube/v3
   youtube.api.quota-buffer=100          # Dự phòng quota
   ```

2. Tạo `YouTubeApiService` (hoặc hoàn thiện file hiện có) với các phương thức:

   - `getChannelById(channelId)`
   - `getChannelByUsername(username)` / `getChannelByHandle(handle)`
   - `listVideosByChannel(channelId, pageToken)`
   - `getVideosByIds(List<String> ids>)`
   - `listComments(videoId, pageToken)`

   Dùng `RestTemplate` hoặc `WebClient` (Spring) và gắn API key vào mọi request.

3. Bổ sung `YouTubeAnalysisService`/`DataSyncService` để:

   - Parse YouTube URL → xác định channel/video ID (`YouTubeUrlParser` hiện có).
   - Gọi `YouTubeApiService`.
   - Map dữ liệu về DTO nội bộ (ChannelDTO, VideoDTO, CommentDTO) và lưu vào DB (`Channel`, `Video`, `Comment`, `Analytics`).
   - Trả kết quả cho frontend (`/api/youtube/analyze`).

4. Đảm bảo `application.properties` đọc được key ở mọi môi trường (DEV/PROD). Nếu deploy, dùng biến môi trường: `YOUTUBE_API_KEY`.

## 4. Đồng bộ dữ liệu định kỳ

1. Viết `@Scheduled` job trong `DataSyncService` (ví dụ chạy mỗi 6h) để:
   - Lấy danh sách video mới của từng channel đã lưu.
   - Cập nhật view/like/comment counts (lưu vào bảng `analytics`).
   - (Tuỳ chọn) Lấy bình luận mới để phân tích sentiment.
2. Với mỗi request YouTube, đọc `nextPageToken` để lặp đến hết (hoặc dừng sau N trang tuỳ nhu cầu).
3. Theo dõi quota: YouTube Data API v3 mặc định cho 10.000 units/ngày. Ví dụ `videos.list` = 1 unit, `commentThreads.list` = 1 unit. Nên log usage để tránh vượt hạn mức.

## 5. Xử lý lỗi & retry

- Kiểm tra HTTP status:
  - `403 quotaExceeded`: dừng và đợi đến khi quota reset; gửi thông báo cho admin.
  - `403 rateLimitExceeded`: backoff (sleep, retry sau vài giây).
  - `404 notFound`: ID không còn tồn tại, đánh dấu channel/video tương ứng.
- Thêm cache layer (Redis/DB) nếu cần hạn chế gọi lại quá sớm.

## 6. Kiểm thử nhanh

1. Tạo endpoint dev tạm thời: `GET /api/dev/youtube/test?channelId=...`.
2. Gọi endpoint, xem log trả về, đảm bảo dữ liệu được lưu vào DB.
3. Mở Dashboard → confirm các API `/api/dashboard/**` đã có dữ liệu thực.

## 7. Cập nhật tài liệu và môi trường

- Bổ sung hướng dẫn này vào README chính (mục “External integrations”).
- Lưu ý: không commit API key vào repo. Dùng `.env`, Maven profile, hoặc secret manager.
- Nếu deploy lên server, đảm bảo firewall cho phép backend gọi `www.googleapis.com`.

## 8. Checklist triển khai

- [ ] Tạo Google Cloud project và API key.
- [ ] Bổ sung config vào `application.properties` / env vars.
- [ ] Implement `YouTubeApiService`.
- [ ] Implement `YouTubeAnalysisService` + `/api/youtube/analyze`.
- [ ] Đồng bộ dữ liệu (cron hoặc nút “Sync”).
- [ ] Viết log + cảnh báo khi quota gần đầy.
- [ ] Test Dashboard với dữ liệu thật.

Sau khi hoàn thành các bước trên, hệ thống sẽ tự động lấy dữ liệu public từ YouTube và hiển thị trên Dashboard/Insights. Nếu cần chi tiết code cho `YouTubeApiService`, hãy tạo issue/todo riêng để triển khai theo hướng dẫn này.

