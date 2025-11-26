## CHƯƠNG 3. PHÂN TÍCH BÀI TOÁN VÀ THIẾT KẾ HỆ THỐNG

### 3.1. Mô tả bài toán phân tích cảm xúc bình luận YouTube

#### 3.1.1. Đầu vào, đầu ra của hệ thống

**Đầu vào của hệ thống:**

- **URL kênh YouTube** (channel URL / channel handle) do người dùng nhập trên giao diện web. Hệ thống KHÔNG nhận URL video riêng lẻ, mà luôn phân tích **toàn bộ kênh** (hoặc phạm vi video lấy được từ kênh đó).
- **Thông tin tài khoản người dùng** đăng nhập hệ thống (JWT token): cho phép gắn dữ liệu phân tích với đúng user và kênh mà họ quản lý.
- **Dữ liệu YouTube công khai** lấy qua YouTube Data API v3:
  - Thông tin kênh (`channelId`, tên kênh, avatar, mô tả, …).
  - Danh sách video thuộc kênh (tiêu đề, thumbnail, thống kê view/like/comment).
  - Danh sách bình luận của từng video thuộc kênh (nội dung comment, tác giả, thời gian đăng, số like, …).

**Đầu ra của hệ thống:**

- **Kết quả phân tích cảm xúc cho từng bình luận** của các video trong kênh:
  - Nhãn **sentiment**: `positive`, `negative`, `neutral`.
  - Nhãn **emotion**: `happy`, `sad`, `angry`, `suggestion`, `love`.
  - **Điểm tin cậy (confidence)** ∈ \([0, 1]\).
- **Các thống kê tổng hợp ở mức kênh và video** để hiển thị trên dashboard:
  - Phân bố số lượng bình luận theo sentiment / emotion (biểu đồ tròn, thống kê số lượng).
  - Top video trong kênh theo mức độ tích cực/tiêu cực, top video nhiều tương tác.
  - Số lượng bình luận chưa phân tích, đã phân tích theo thời gian.
- **Giao diện hiển thị trên frontend (React)**:
  - Danh sách bình luận đã gắn nhãn, có thể **lọc theo cảm xúc**, phân trang.
  - Biểu đồ trực quan hoá cảm xúc cộng đồng của **cả kênh**.
  - Các khối thống kê/tổng quan hỗ trợ chủ kênh ra quyết định.

#### 3.1.2. Yêu cầu chức năng

Từ bài toán trên, hệ thống cần đáp ứng các **yêu cầu chức năng chính** sau:

- **CF1 – Nhập và phân tích kênh YouTube:**
  - Người dùng nhập **URL kênh YouTube** trên giao diện.
  - Hệ thống backend parse URL, gọi YouTube Data API v3 để:
    - Lấy thông tin kênh và danh sách video thuộc kênh.
    - Lấy danh sách bình luận cho các video của kênh.
  - Lưu dữ liệu vào cơ sở dữ liệu MySQL.

- **CF2 – Phân tích cảm xúc bình luận (Sentiment & Emotion):**
  - Tự động phát hiện các bình luận **chưa được phân tích** (`is_analyzed = false`).
  - Gửi batch bình luận sang **AI module (Flask + PhoBERT/scikit-learn)**.
  - Nhận lại kết quả `sentiment`, `emotion`, `confidence` và cập nhật vào DB.

- **CF3 – Lọc và xem bình luận theo cảm xúc:**
  - Giao diện cho phép người dùng:
    - Lọc bình luận **tích cực / tiêu cực / trung lập**.
    - Lọc bình luận theo các loại emotion (vui vẻ, buồn, công kích, góp ý, yêu thích).
  - Hỗ trợ **phân trang**, hiển thị thông tin video (thuộc kênh), tác giả, thời gian đăng.

- **CF4 – Thống kê và trực quan hóa cảm xúc ở mức kênh:**
  - Backend cung cấp API trả về:
    - Số lượng bình luận theo từng loại sentiment/emotion cho một **kênh cụ thể**.
  - Frontend vẽ biểu đồ (pie chart, thống kê) để người dùng nắm được **bức tranh tổng quan cảm xúc của kênh**.

- **CF5 – Quản lý người dùng và kênh:**
  - Đăng ký/đăng nhập, xác thực bằng **JWT** (Spring Security).
  - Mỗi user gắn với một hoặc nhiều **kênh YouTube** mà họ đã yêu cầu phân tích.
  - Chỉ xem được dữ liệu phân tích thuộc về các kênh của mình (phân quyền).

- **CF6 – Tự động đồng bộ và cập nhật dữ liệu:**
  - Nhiệm vụ nền (scheduled jobs) tự động:
    - Lấy thêm video/bình luận mới thuộc các kênh đã đăng ký.
    - Phân tích các bình luận mới mà không làm gián đoạn trải nghiệm người dùng.

#### 3.1.3. Yêu cầu phi chức năng (hiệu năng, độ trễ, độ chính xác)

- **Hiệu năng và độ trễ:**
  - Thao tác **nhập URL kênh và khởi tạo phân tích** phải phản hồi nhanh:
    - Backend nhận URL kênh, lưu job phân tích, trả về trạng thái ban đầu (ví dụ: “Đang đồng bộ kênh”) mà không bắt người dùng chờ toàn bộ quá trình.
  - Quá trình phân tích sentiment/emotion được xử lý **bất đồng bộ** (Spring `@Async`, scheduled tasks).
  - AI module hỗ trợ **batch processing**, mỗi lần xử lý nhiều bình luận để giảm số lượng request.

- **Khả năng mở rộng (scalability):**
  - Kiến trúc tách biệt **backend** (Java) và **AI module** (Python), có thể deploy độc lập.
  - Cơ sở dữ liệu MySQL được thiết kế với **index** phù hợp (trên `channel_id`, `video_id`, `sentiment`, `emotion`, `is_analyzed`) để truy vấn nhanh theo kênh.

- **Độ chính xác:**
  - Khi có thể cài đặt đầy đủ, hệ thống sử dụng **PhoBERT** fine‑tune cho sentiment/emotion, cho độ chính xác cao đối với tiếng Việt.
  - Trường hợp môi trường hạn chế (không cài được `torch`), hệ thống **fallback về scikit‑learn** (TF‑IDF + classifier) nhưng vẫn đảm bảo kết quả chấp nhận được.
  - Kết quả phân tích lưu kèm **điểm tin cậy**, giúp đánh giá độ chắc chắn của dự đoán.

- **Tính ổn định và bảo mật:**
  - Backend sử dụng Spring Boot, Spring Security, JWT để đảm bảo **bảo mật API**.
  - Quản lý **quota YouTube API** và xử lý lỗi (quota exceeded, rate limit, …).
  - Tách log lỗi AI module và backend để dễ theo dõi, debug.

---

### 3.2. Phân tích yêu cầu người dùng

Nhóm người dùng chính là:

- **Chủ kênh YouTube / người làm nội dung** muốn:
  - Hiểu rõ **cảm xúc cộng đồng** đối với **cả kênh** và từng video trong kênh.
  - Nắm được **video nào trong kênh được yêu thích / bị phàn nàn nhiều**, từ đó điều chỉnh nội dung.
  - Xem nhanh **các bình luận tiêu cực hoặc góp ý** để có phản hồi/kế hoạch cải thiện nội dung.

- **Quản trị viên hệ thống (admin)**:
  - Quản lý người dùng, phân quyền.
  - Kiểm soát cấu hình hệ thống (API key YouTube, URL AI module, …).
  - Giám sát hoạt động phân tích (số lượng job, lỗi, hiệu năng).

Từ đó, yêu cầu người dùng có thể tóm tắt:

- **RU1 – Dễ sử dụng:**
  - Giao diện web trực quan, **chỉ cần nhập URL kênh YouTube** là có thể bắt đầu phân tích.
  - Các kết quả được hiển thị bằng **bảng + biểu đồ**, có filter rõ ràng theo sentiment/emotion.

- **RU2 – Thông tin hữu ích ở mức kênh:**
  - Không chỉ hiển thị nhãn cảm xúc từng bình luận, mà còn:
    - Thống kê tổng quan cảm xúc của **toàn bộ bình luận trong kênh**.
    - Top video trong kênh theo cảm xúc tích cực/tiêu cực.
    - Nhóm các bình luận “góp ý” để chủ kênh dễ cải thiện nội dung.

- **RU3 – Thời gian phản hồi hợp lý:**
  - Khi đồng bộ **kênh mới**, hệ thống phải báo trạng thái rõ ràng.
  - Sau một khoảng thời gian hợp lý (vài phút với kênh lớn), dữ liệu phân tích phải có để người dùng xem trên dashboard.

- **RU4 – Tính cá nhân hóa và bảo mật:**
  - Mỗi user chỉ xem được dữ liệu kênh của mình (gắn với tài khoản).
  - Thông tin đăng nhập, token được bảo vệ, tránh lộ khóa API hoặc dữ liệu riêng tư.

---

### 3.3. Kiến trúc tổng thể hệ thống

#### 3.3.1. Sơ đồ kiến trúc hệ thống

Kiến trúc tổng thể của hệ thống (phân tích theo **URL kênh**) có thể mô tả như sau:

- **Frontend (React + Vite)**  
  - Giao diện web cho người dùng, chạy trên trình duyệt.
  - Gọi các API từ backend thông qua HTTP/HTTPS.

- **Backend (Spring Boot)**  
  - Cung cấp REST API cho frontend.
  - Tích hợp YouTube Data API v3 để:
    - Nhận **URL kênh**, parse ra `channelId`.
    - Lấy danh sách video và bình luận cho kênh đó.
  - Gửi bình luận sang AI module để phân tích, lưu kết quả vào MySQL.
  - Thực hiện xác thực, phân quyền, quản lý người dùng.

- **AI Module (Python Flask)**  
  - Microservice độc lập, chuyên xử lý NLP:
    - Phân tích sentiment/emotion cho bình luận của các video trong kênh.
    - Trích xuất từ khóa, phân loại chủ đề (mở rộng).
  - Sử dụng PhoBERT hoặc scikit‑learn.

- **Cơ sở dữ liệu (MySQL)**  
  - Lưu trữ người dùng, kênh, video, bình luận, kết quả phân tích, thống kê.

Luồng kết nối chính:

```text
User (Browser)
     ↓
Frontend (React) – nhập URL kênh
     ↓  HTTP (JWT)
Backend (Spring Boot)
     ├─→ YouTube Data API v3 (lấy dữ liệu kênh, video, comments)
     ├─→ AI Module (Flask, PhoBERT/scikit-learn)
     └─→ MySQL (lưu trữ)
```

#### 3.3.2. Vai trò từng thành phần

- **Frontend (React):**
  - Cung cấp giao diện:
    - Nhập **URL kênh YouTube**.
    - Xem danh sách bình luận đã phân tích cho kênh.
    - Lọc bình luận theo cảm xúc.
    - Xem biểu đồ thống kê cảm xúc theo kênh và video.
  - Gọi đến các API backend:
    - `/api/youtube/analyze` (khởi tạo phân tích kênh).
    - `/api/comments/sentiment`, `/api/comments/emotion`, `/api/comments/sentiment-stats`, …

- **Backend (Spring Boot):**
  - **Xử lý nghiệp vụ**:
    - Parse URL kênh, lấy `channelId`, đồng bộ dữ liệu kênh và video.
    - Lấy bình luận cho các video trong kênh.
    - Gửi batch comments sang AI module, nhận kết quả và cập nhật DB.
    - Áp dụng logic phân quyền, chỉ trả về dữ liệu đúng user/kênh.
  - **Cầu nối** giữa Frontend – AI Module – Database.

- **AI Module (Model/NLP Service):**
  - Thực thi các mô hình NLP:
    - PhoBERT (Transformers + PyTorch) khi có đủ tài nguyên.
    - TF‑IDF + classifier (scikit‑learn) khi chạy ở chế độ nhẹ.
  - Cung cấp API đơn giản:
    - Đầu vào: danh sách văn bản bình luận từ **các video trong kênh**.
    - Đầu ra: sentiment, emotion, confidence cho từng bình luận.

- **Database (MySQL):**
  - Lưu **dữ liệu thô**:
    - `channels` (kênh người dùng đã phân tích).
    - `videos` (video thuộc từng kênh).
    - `comments` (bình luận thuộc mỗi video).
  - Lưu **dữ liệu phân tích**:
    - Nhãn sentiment/emotion, điểm tin cậy, thời gian phân tích.
  - Lưu thông tin user, cấu hình, thống kê để backend truy vấn nhanh và frontend hiển thị.

---

### 3.4. Quy trình xử lý bình luận trên hệ thống

#### 3.4.1. Luồng dữ liệu: User → API → AI → Dashboard

Luồng dữ liệu theo **URL kênh** có thể mô tả theo các bước:

1. **User nhập URL kênh YouTube trên frontend**
   - Frontend gửi request:
     ```text
     POST /api/youtube/analyze
     Body: { "url": "https://www.youtube.com/@tenkenh..." }
     ```
   - Kèm theo **JWT token** để xác định user.

2. **Backend phân tích URL kênh, gọi YouTube Data API v3**
   - Sử dụng `YouTubeUrlParser` để lấy `channelId` từ URL kênh.
   - Gọi API YouTube để:
     - Lấy thông tin kênh (`channels.list`).
     - Lấy danh sách video thuộc kênh (`search` / `playlistItems` / `videos.list`).
     - Lấy danh sách bình luận của từng video (`commentThreads.list`).

3. **Lưu dữ liệu vào MySQL**
   - Lưu vào các bảng:
     - `channels` (gắn với user).
     - `videos` (gắn với channel).
     - `comments` với:
       - `content`, `author_name`, `published_at`, …
       - `is_analyzed = false`, `sentiment = NULL`, `emotion = NULL`.

4. **Scheduled job / async task phân tích sentiment/emotion**
   - Định kỳ (ví dụ mỗi 60 giây), backend:
     - Tìm **batch** bình luận `is_analyzed = false` thuộc các kênh đã được đồng bộ.
     - Gửi sang AI module qua API batch:
       ```text
       POST /api/analyze-sentiment/batch
       Body: { "texts": [ "comment1", "comment2", ... ] }
       ```
   - AI module trả về danh sách kết quả tương ứng.

5. **Backend cập nhật kết quả phân tích vào DB**
   - Với mỗi bình luận:
     - Ghi `sentiment`, `emotion`, `sentiment_score`.
     - Đặt `is_analyzed = true`, `analyzed_at = NOW()`.

6. **Frontend hiển thị kết quả trên dashboard kênh**
   - Gọi các API:
     - `GET /api/comments/sentiment-stats?channelId=...` để lấy thống kê cho kênh.
     - `GET /api/comments/sentiment` / `/emotion` để lấy danh sách bình luận đã phân tích cho kênh.
   - Hiển thị:
     - Danh sách bình luận theo filter.
     - Biểu đồ cảm xúc tổng quan của kênh.
     - Top video trong kênh, các insight liên quan.

#### 3.4.2. Quy trình sử dụng từ góc nhìn người dùng (User flow)

Từ góc nhìn một người dùng điển hình:

1. **Đăng nhập vào hệ thống**
   - Người dùng đăng nhập, nhận JWT token.
   - Frontend lưu token trong storage, dùng cho các request tiếp theo.

2. **Kết nối và phân tích kênh YouTube**
   - Người dùng vào trang Dashboard / Sentiment, nhập **URL kênh YouTube**.
   - Hệ thống:
     - Xác nhận URL kênh hợp lệ.
     - Gửi request lên backend để bắt đầu quá trình **đồng bộ kênh** và phân tích bình luận.

3. **Chờ hệ thống đồng bộ và phân tích**
   - Trong thời gian chờ:
     - Hệ thống hiển thị trạng thái (đang đồng bộ/đang phân tích).
     - Các scheduled jobs và AI module chạy ở backend để xử lý bình luận của kênh.

4. **Xem kết quả trên trang Comment Sentiment / Dashboard kênh**
   - Người dùng chuyển sang trang **Comment Sentiment** của kênh:
     - Xem tổng quan tỷ lệ bình luận tích cực/tiêu cực/trung lập trong kênh.
     - Lọc danh sách bình luận theo sentiment hoặc emotion cụ thể.
     - Xem chi tiết từng bình luận (nội dung, video thuộc kênh, thời gian, …).

5. **Sử dụng insight cho quyết định nội dung**
   - Chủ kênh có thể:
     - Tập trung xử lý các bình luận “góp ý” hoặc “tiêu cực”.
     - Phân tích các video được cộng đồng “yêu thích” để lên kế hoạch nội dung tương tự.
   - (Mở rộng) Sử dụng các gợi ý từ trang AI Suggestion để cải thiện chiến lược nội dung.

---

### 3.5. Thiết kế cơ sở dữ liệu

Hệ thống sử dụng **CSDL quan hệ MySQL** với nhiều bảng; trong phạm vi bài toán phân tích cảm xúc bình luận theo **kênh**, các bảng cốt lõi gồm:

- **Bảng `users`**
  - Lưu thông tin người dùng hệ thống.
  - Các trường tiêu biểu:
    - `id`, `email`, `password_hash`, `full_name`, `role`, `created_at`, …

- **Bảng `channels`**
  - Lưu thông tin **kênh YouTube** mà người dùng đã yêu cầu phân tích:
    - `id` (PK), `user_id` (FK tới `users`), `channel_id` (ID từ YouTube), `title`, `description`, `thumbnail_url`, `created_at`, …

- **Bảng `videos`**
  - Lưu thông tin video thuộc các kênh:
    - `id` (PK), `channel_id` (FK tới `channels`), `video_id` (YouTube), `title`, `published_at`, `view_count`, `like_count`, `comment_count`, …

- **Bảng `comments`** (trọng tâm cho bài toán sentiment)
  - Lưu từng bình luận lấy được từ YouTube cho các video trong kênh:
    - **Thông tin gốc:**
      - `id` (PK), `video_id` (FK tới `videos`), `comment_id` (YouTube), `author_name`, `author_avatar`, `content`, `like_count`, `published_at`.
    - **Trạng thái phân tích:**
      - `is_analyzed` (BOOLEAN): đã được phân tích hay chưa.
      - `analyzed_at` (TIMESTAMP): thời điểm hệ thống phân tích xong.
    - **Kết quả NLP:**
      - `sentiment` (VARCHAR): `positive` / `negative` / `neutral`.
      - `emotion` (VARCHAR): `happy` / `sad` / `angry` / `suggestion` / `love`.
      - `sentiment_score` (DECIMAL): điểm tin cậy của dự đoán.
  - Các **index** quan trọng:
    - `IDX_comments_video_id`
    - `IDX_comments_is_analyzed`
    - `IDX_comments_sentiment`
    - `IDX_comments_emotion`  
    → Giúp truy vấn nhanh cho các API lọc và thống kê theo kênh/video.

- **Bảng `analytics`**
  - Lưu các chỉ số tổng hợp theo ngày/kênh/video:
    - Lượt xem, lượt thích, số bình luận, các metric hỗ trợ Dashboard cho **kênh YouTube**.

- **Các bảng mở rộng khác** (tùy phần triển khai thực tế):
  - `video_topics`, `video_topic_mapping`: gắn chủ đề phân loại cho video.
  - `keywords`: từ khóa trích xuất từ bình luận, phục vụ gợi ý nội dung.

Thiết kế CSDL đảm bảo:

- **Chuẩn hoá quan hệ** giữa user – channel – video – comment.
- Tập trung vào **phân tích ở mức kênh** (không nhận URL video đơn lẻ từ người dùng).
- Cho phép **mở rộng** thêm loại mô hình NLP (topic, keyword, recommendation) mà không phá vỡ cấu trúc hiện tại.
- Hỗ trợ **truy vấn hiệu quả** cho các màn hình Dashboard, Comment Sentiment, Community Insights.

---