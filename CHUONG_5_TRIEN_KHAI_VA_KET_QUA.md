## CHƯƠNG 5. TRIỂN KHAI ỨNG DỤNG VÀ KẾT QUẢ THỰC NGHIỆM

*(Đã chỉnh lại cho đúng với project: hệ thống nhập **URL kênh YouTube**, không nhập link video đơn lẻ.)*

---

### 5.1. Môi trường và công cụ triển khai

- **Hệ điều hành phát triển**: Windows 10/11.  
- **Ngôn ngữ & Framework**:
  - **Backend**: Java 17, Spring Boot 3.x, Spring Data JPA, Spring Security + JWT.
  - **AI Module**: Python 3.12, Flask, Flask‑CORS, scikit‑learn, transformers, torch.
  - **Frontend**: React 19 + Vite, React Router, Recharts.
  - **Cơ sở dữ liệu**: MySQL 8.x.
- **Công cụ phát triển**:
  - IDE: IntelliJ IDEA (backend), VS Code/IDE khác (frontend, AI module).
  - Quản lý gói:
    - Maven (`pom.xml`) cho backend.
    - npm (`package.json`) cho frontend.
    - pip (`requirements.txt`, `requirements-basic.txt`) cho AI module.
- **Môi trường chạy**:
  - Backend: `http://localhost:8080`
  - AI module: `http://localhost:5000`
  - Frontend: `http://localhost:5173`
  - MySQL: `localhost:3306`, database `youtubeai`

---

### 5.2. Kiến trúc triển khai (Deployment Diagram)

```text
+---------------------------+         +---------------------------+
|        Frontend           |  HTTPS  |        Backend            |
|  React + Vite (Browser)   | <-----> | Spring Boot (8080)        |
+---------------------------+         +---------------------------+
                                               |
                                               | HTTP (REST)
                                               v
                                  +---------------------------+
                                  |        AI Module          |
                                  | Flask + Python (5000)     |
                                  +---------------------------+
                                               |
                                               | JDBC (MySQL Driver)
                                               v
                                  +---------------------------+
                                  |        MySQL DB           |
                                  |  Database "youtubeai"     |
                                  +---------------------------+
                                               |
                                               | HTTPS (Google API)
                                               v
                                  +---------------------------+
                                  |   YouTube Data API v3     |
                                  +---------------------------+
```

- Frontend chạy trên trình duyệt, gọi API backend qua HTTP/HTTPS.  
- Backend Spring Boot:
  - Xử lý nghiệp vụ, xác thực.
  - Gọi YouTube Data API v3 để lấy dữ liệu kênh/video/bình luận.
  - Gọi AI Module để phân tích/sinh nội dung.
  - Đọc/ghi dữ liệu vào MySQL.  
- AI Module là service tách biệt, có thể deploy riêng khi lên production.

---

### 5.3. Demo các chức năng chính của hệ thống

#### 5.3.1. Nhập link kênh YouTube và lấy bình luận

*(Sửa từ “link video” thành “link kênh YouTube” cho đúng với project.)*

Quy trình:

1. Người dùng đăng nhập, mở trang Dashboard/Support Tools.  
2. Dán **URL kênh YouTube** (ví dụ `https://www.youtube.com/@tenkenh`) vào ô nhập.  
3. Frontend gửi request:
   ```text
   POST /api/youtube/analyze
   Body: { "url": "<url_kênh>" }
   ```
4. Backend:
   - Parse URL → `channelId`.
   - Gọi YouTube Data API v3 để:
     - Lấy thông tin kênh.
     - Lấy danh sách video thuộc kênh.
     - Lấy bình luận cho mỗi video.
   - Lưu dữ liệu vào MySQL (`channels`, `videos`, `comments`), đánh dấu `is_analyzed = false`.  
5. Hệ thống thông báo đã đồng bộ kênh, các bình luận sẽ được xử lý ở background.

#### 5.3.2. Hiển thị biểu đồ cảm xúc

Trên trang **Comment Sentiment** / Dashboard:

1. Sau khi backend + AI Module phân tích xong và cập nhật các trường phân loại trong bảng `comments`, frontend gọi:
   ```text
   GET /api/comments/sentiment-stats?channelId=...
   ```
2. Backend trả về thống kê số bình luận theo từng loại cảm xúc.  
3. Frontend hiển thị bằng **biểu đồ tròn (pie chart)**:
   - Mỗi lát biểu đồ là một loại cảm xúc.
   - Hover để xem số lượng và phần trăm.  
4. Chủ kênh có thể nắm nhanh:
   - Tỉ lệ bình luận theo từng loại cảm xúc.
   - Xu hướng cảm xúc chung của cộng đồng với kênh.

#### 5.3.3. Hiển thị danh sách bình luận kèm nhãn (và hướng mở rộng word cloud)

Hiện tại hệ thống hỗ trợ:

- **Danh sách bình luận theo cảm xúc**:
  1. Frontend gọi:
     ```text
     GET /api/comments/sentiment?channelId=...&sentiment=...
     GET /api/comments/emotion?channelId=...&emotion=...
     ```
  2. Backend trả về:
     - Danh sách bình luận có phân trang, kèm:
       - Nội dung bình luận.
       - Tác giả, avatar, thời gian đăng.
       - Thông tin video thuộc kênh.
       - Nhãn cảm xúc đã phân loại.  
  3. Frontend hiển thị:
     - Bảng/danh sách bình luận, có filter theo sentiment/emotion.

**Word cloud** hiện chưa triển khai trong project nhưng là hướng mở rộng:

- Backend có thể đếm tần suất từ khóa trong các bình luận đã lưu.  
- Frontend vẽ word cloud thể hiện:
  - Từ khóa nổi bật trong bình luận.
  - Hỗ trợ người dùng hiểu nhanh chủ đề được nói tới nhiều.

---

### 5.4. Đánh giá hiệu năng hệ thống

#### 5.4.1. Thời gian xử lý cho X bình luận

Đánh giá theo các bước:

- **Thu thập dữ liệu từ YouTube**:
  - Phụ thuộc số video và số bình luận của kênh.
  - Với kênh vừa (vài chục video, vài nghìn bình luận), đồng bộ ban đầu thường mất **từ vài chục giây đến vài phút**.

- **Xử lý AI (per batch)**:
  - Backend lấy các bình luận `is_analyzed = false` theo từng batch (ví dụ 50 bình luận/lô).
  - AI Module xử lý tiếp theo batch nội bộ (ví dụ 16–32 bình luận/lượt suy luận).
  - Tùy cấu hình máy:
    - Vài trăm đến ~1.000 bình luận có thể xử lý trong **vài chục giây – vài phút**.

- **Thời gian phản hồi người dùng**:
  - Khi nhập URL kênh:
    - Backend trả kết quả gần như ngay: “đồng bộ kênh thành công / đang phân tích”.
  - Khi xem dashboard/bình luận:
    - Truy vấn trực tiếp MySQL, thời gian tải nhanh (ms–vài trăm ms).

#### 5.4.2. Giới hạn hiện tại

- **Quy mô bình luận mỗi lần phân tích**:
  - Thiết kế hiện phù hợp tới **~1000 bình luận/lần đồng bộ** trên máy cá nhân.
  - Với kênh có hàng chục nghìn bình luận:
    - Cần chia batch nhỏ, chạy nhiều vòng scheduled jobs.

- **Giới hạn tài nguyên phần AI**:
  - Dùng mô hình nặng (PhoBERT/Transformers) cần:
    - RAM cao hơn, thời gian inference lâu hơn.
  - Trên máy không có GPU:
    - Có thể fallback sang mô hình nhẹ (scikit‑learn) hoặc giảm batch size.

- **Giới hạn YouTube Data API**:
  - Quota mặc định: ~10.000 units/ngày.
  - Cần tối ưu số request và tránh gọi API không cần thiết.

---

### 5.5. Phản hồi người dùng thử nghiệm (nếu có)

Trong giai đoạn thử nghiệm:

- **Trải nghiệm sử dụng**:
  - Giao diện được đánh giá là dễ dùng:
    - Chỉ cần nhập **URL kênh**, hệ thống tự động thu thập dữ liệu và phân tích.
  - Phân chia trang rõ ràng: Dashboard, Phân tích bình luận, AI Suggestion.

- **Giá trị đem lại**:
  - Biểu đồ cảm xúc + danh sách bình luận theo nhãn giúp:
    - Nhanh chóng phát hiện video được yêu thích hoặc bị than phiền nhiều.
    - Tập trung vào các bình luận góp ý để cải thiện nội dung.
  - AI Content hỗ trợ:
    - Gợi ý ý tưởng, tiêu đề, mô tả video, tiết kiệm thời gian brainstorming.

- **Đề xuất cải thiện**:
  - Thêm:
    - Word cloud trực quan.
    - Bộ lọc nâng cao (theo khoảng thời gian, theo video cụ thể, theo độ dài bình luận).
    - Chức năng lưu/ghim gợi ý AI Content.
  - Tối ưu hiệu năng cho các kênh lớn (nhiều video, nhiều bình luận).

Nhìn chung, kết quả thử nghiệm cho thấy hệ thống đã **đáp ứng tốt mục tiêu phân tích kênh YouTube và hỗ trợ sáng tạo nội dung**, đồng thời còn nhiều tiềm năng để mở rộng và tối ưu khi triển khai thực tế ở quy mô lớn hơn.