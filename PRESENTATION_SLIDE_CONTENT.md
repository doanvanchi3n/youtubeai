# Slide Deck Outline – YouTube AI Analytics

> Gợi ý nội dung slide thuyết trình (có thể tinh chỉnh theo thời lượng và phong cách đội nhóm). Mỗi bullet tượng trưng cho 1 slide hoặc nhóm slide.

## 1. Giới thiệu chung
- **Bối cảnh**: Sự bùng nổ nội dung YouTube, khó kiểm soát bình luận và đổi mới nội dung.
- **Mục tiêu dự án**: Phân tích bình luận tiếng Việt & hỗ trợ sáng tạo cho creator bằng AI.
- **Phạm vi**: Kênh YouTube công khai, gồm phân tích NL P + AI Suggestion + Dashboard quản trị.

## 2. Chức năng nổi bật
- **Dashboard theo dõi kênh**: Metrics, xu hướng tương tác, video nổi bật.
- **Comment Sentiment & Emotion**: Lọc bình luận, biểu đồ cảm xúc, top video theo cảm xúc.
- **AI Suggestion**: Nhập từ khóa/mô tả → gợi ý ý tưởng, tiêu đề, mô tả.
- **Admin Portal**: Quản lý user, job phân tích, log hệ thống, cấu hình AI/YouTube API.

## 3. Kiến trúc hệ thống
- **Frontend (React + Vite)** ↔ **Backend (Spring Boot)** ↔ **AI Module (Flask)** ↔ **MySQL** ↔ **YouTube Data API**.
- Nêu rõ cơ chế: Frontend gửi yêu cầu → Backend kiểm soát & lưu → AI Module xử lý NLP → DB lưu trữ.
- Nhấn mạnh **scheduled jobs** (phân tích bình luận batch) và **API bảo mật (JWT)**.

## 4. Công nghệ & mô hình AI
- NLP: TF–IDF + scikit-learn (baseline), PhoBERT (Transformer) cho sentiment/emotion.
- AI Content: transformers + prompt-based generation cho tiêu đề/mô tả.
- Hệ sinh thái: Spring Boot, React, Flask, MySQL, YouTube Data API, JWT, Docker (nếu có).
- Liên hệ đến các tài liệu hướng dẫn setup (PHOBERT_SETUP_GUIDE, YOUTUBE_API_SETUP, …).

## 5. Luồng xử lý chính (diagrams)
- **Activity**: Nhập URL kênh → đồng bộ → phân tích → hiển thị.
- **Sequence**: User/Frontend ↔ Backend ↔ YouTube API ↔ AI Module ↔ DB.
- **State**: Bình luận (New → Analyzed), Job (Created → Completed), User Admin (Active ↔ Locked).
- **Admin flow**: Dashboard admin → xem log → retry job → cập nhật cấu hình.

## 6. Demo & Kết quả
- Minh hoạ các màn hình: Dashboard, CommentSentiment, VideoAnalytics, AI Suggestion, Admin.
- Thời gian xử lý: thu thập + phân tích ~1000 bình luận trong vài phút (tùy tài nguyên).
- AI Suggestion tạo ra 5–10 gợi ý trong vài giây.
- Feedback người dùng thử nghiệm + ví dụ insight thực tế.

## 7. Hạn chế & Hướng phát triển
- Hạn chế hiện tại:
  - **Biểu đồ view/comment/like chỉ là snapshot**: mỗi lần phân tích chỉ lấy dữ liệu thời điểm đó, chưa lưu lịch sử → user phải phân tích hằng ngày mới thấy trend dài hạn.
  - **AI Content mới dừng ở mô hình nhẹ nội bộ**: chưa tích hợp LLM trả phí (Gemini/OpenAI) do giới hạn thời gian và chi phí, vì vậy câu chữ/gợi ý chưa phong phú như chatbot thương mại.
  - **PhoBERT vẫn nhầm một số teencode/emoji**: cần thêm dữ liệu train slang, xử lý sarcasm; mô hình nặng gây khó khăn khi deploy máy yếu.
  - Phụ thuộc quota YouTube API, chưa hỗ trợ đa nền tảng (TikTok/Facebook).
- Hướng mở rộng:
  - Lưu lịch sử view/comment/like tự động (cron) để vẽ trend, dự đoán tương lai.
  - Tích hợp LLM mạnh (Gemini/OpenAI hoặc mô hình Việt) cho AI Content, hỗ trợ nhiều giọng văn.
  - Phát hiện spam/toxic/hate speech, phân tích mỉa mai.
  - Đa ngôn ngữ, đa nền tảng & mobile app quản trị.

## 8. Kết luận & Q&A
- Tóm tắt giá trị: hỗ trợ data-driven cho creator, quản trị dễ dàng, mở rộng AI Content.
- Nhấn mạnh đóng góp kỹ thuật: kết hợp NLP tiếng Việt + kiến trúc đa dịch vụ.
- Mời đặt câu hỏi / demo trực tiếp.

---
**Gợi ý khi trình bày**:  
- Mỗi slide nên có 1 ý chính, hình minh họa (diagram, screenshot).  
- Slide demo: chèn ảnh màn hình thật hoặc video ngắn.  
- Chia rõ vai trò thành viên nếu cần (một slide riêng).  

