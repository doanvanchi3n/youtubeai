## CHƯƠNG 2. CƠ SỞ LÝ THUYẾT VÀ CÔNG NGHỆ SỬ DỤNG

### 2.1. Tổng quan về xử lý ngôn ngữ tự nhiên (NLP)

#### 2.1.1. Khái niệm NLP

**Xử lý ngôn ngữ tự nhiên (Natural Language Processing – NLP)** là lĩnh vực kết hợp giữa khoa học máy tính, trí tuệ nhân tạo và ngôn ngữ học, nghiên cứu cách để máy tính có thể **hiểu, phân tích, sinh và tương tác** với ngôn ngữ của con người.  
Trong bối cảnh hệ thống **YouTube AI Analytics**, NLP được sử dụng để:

- **Phân tích cảm xúc (sentiment)** của bình luận YouTube: tích cực, tiêu cực, trung lập.
- **Phân loại cảm xúc chi tiết (emotion)**: vui vẻ, buồn, tức giận, góp ý, yêu thích.
- **Trích xuất từ khóa, chủ đề** từ nội dung bình luận/video.
- Hỗ trợ **gợi ý nội dung, phân tích cộng đồng** cho chủ kênh YouTube.

NLP cho tiếng Việt có những thách thức riêng như: dấu câu, đa nghĩa, từ ghép, tiếng lóng, emoji, ký tự đặc biệt… Do đó hệ thống kết hợp cả **các mô hình truyền thống (TF‑IDF + scikit‑learn)** và **mô hình hiện đại PhoBERT (Transformer chuyên cho tiếng Việt)** để đạt độ chính xác tốt hơn.

#### 2.1.2. Các bước tiền xử lý văn bản

Trong dự án, bước tiền xử lý được hiện thực trong lớp `TextProcessor` (AI module Python), với các bước cơ bản sau:

- **Chuẩn hóa chữ thường (lowercasing)**  
  Chuyển toàn bộ văn bản về dạng chữ thường để giảm độ đa dạng từ vựng:  
  - Ví dụ: `"Video NÀY RẤT HAY!"` → `"video này rất hay!"`.

- **Loại bỏ URL, email và ký tự không cần thiết**  
  - Loại bỏ liên kết: `http://...`, `https://...`, `www...`
  - Loại bỏ email: `ten@domain.com`  
  → Giúp mô hình tập trung vào nội dung bình luận thay vì thông tin kỹ thuật.

- **Chuẩn hóa khoảng trắng**  
  - Gộp nhiều khoảng trắng liên tiếp thành một khoảng trắng.
  - Loại bỏ khoảng trắng đầu/cuối câu.  
  - Ví dụ: `"Video    này    rất    hay"` → `"video này rất hay"`.

- **Tách từ (tokenization)**  
  - Hệ thống sử dụng tokenization đơn giản bằng tách theo khoảng trắng.
  - Có thể kết hợp thêm thư viện **underthesea** cho các tác vụ NLP tiếng Việt nâng cao (gợi ý trong tài liệu).

- **Loại bỏ stopword (tùy chọn)**  
  - Các từ ít mang nghĩa nội dung (the, a, and, …; với tiếng Việt có thể là “là, thì, mà, …”) có thể loại bỏ để tăng tập trung vào từ khóa chính.

Sau tiền xử lý, câu bình luận được đưa vào **bộ vector hóa TF‑IDF** (cho mô hình truyền thống) hoặc **tokenizer của PhoBERT** (cho mô hình Transformer) để chuyển thành dạng số phục vụ huấn luyện và suy luận.

---

### 2.2. Phân tích cảm xúc (Sentiment Analysis)

#### 2.2.1. Khái niệm và bài toán phân loại cảm xúc

**Phân tích cảm xúc (Sentiment Analysis)** là bài toán xác định **thái độ, quan điểm** của người dùng đối với một đối tượng (video, kênh, sản phẩm, dịch vụ, …) thông qua văn bản (bình luận, review, bài đăng, …).

Trong đề tài:

- **Bài toán 1 – Phân loại sentiment**:  
  - Đầu vào: văn bản bình luận YouTube (tiếng Việt).  
  - Đầu ra: 1 trong **3 lớp**:  
    - **positive** (tích cực),  
    - **negative** (tiêu cực),  
    - **neutral** (trung lập).  

- **Bài toán 2 – Phân loại emotion chi tiết**:  
  - Đầu ra: 1 trong **5 lớp cảm xúc**:
    - **happy** (vui vẻ),
    - **sad** (buồn),
    - **angry** (tức giận/công kích),
    - **suggestion** (góp ý),
    - **love** (yêu thích/cảm ơn).

Mỗi dự đoán còn đi kèm **điểm tin cậy (confidence)** \([0, 1]\), giúp backend lưu lại vào MySQL (`sentiment_score`) để thống kê, vẽ biểu đồ và lọc bình luận trên giao diện React.

#### 2.2.2. Các hướng tiếp cận phổ biến

Các hướng tiếp cận cho bài toán sentiment gồm:

- **Tiếp cận dựa trên từ điển cảm xúc (lexicon-based)**  
  - Xây dựng danh sách từ/cụm từ cùng trọng số cảm xúc (tích cực/tiêu cực).  
  - Điểm cảm xúc của câu = tổng (hoặc trung bình) trọng số các từ xuất hiện.  
  - Ưu điểm: đơn giản, dễ giải thích.  
  - Nhược điểm: khó bao phủ tiếng lóng, ngữ cảnh, mỉa mai.

- **Tiếp cận học máy truyền thống (Machine Learning với đặc trưng TF‑IDF)**  
  - Bước 1: Tiền xử lý văn bản (chuẩn hóa, loại URL, …).  
  - Bước 2: Chuyển văn bản thành vector số bằng **TF‑IDF**.  
  - Bước 3: Huấn luyện các bộ phân loại như **Naive Bayes, SVM, Logistic Regression**.  
  - Trong dự án, phần fallback sử dụng **scikit‑learn** với pipeline:  
    **TF‑IDF Vectorizer → Classifier (MultinomialNB / Logistic Regression / SVM)**  
  - Ưu điểm:  
    - Dễ triển khai, chạy nhanh, phù hợp khi chưa có GPU.  
  - Nhược điểm:  
    - Hiệu quả phụ thuộc mạnh vào feature engineering, khó nắm ngữ nghĩa sâu, ngữ cảnh dài.

- **Tiếp cận học sâu (Deep Learning – LSTM/BiLSTM, CNN)**  
  - Dùng các mạng nơ-ron tuần tự (LSTM/BiLSTM) hoặc CNN để học trực tiếp từ chuỗi embedding.  
  - Có khả năng nắm được thứ tự từ và ngữ cảnh tốt hơn mô hình truyền thống.  
  - Tuy nhiên trong project hiện tại **chưa triển khai LSTM/BiLSTM thực tế**, mà tập trung vào:
    - **Mô hình truyền thống TF‑IDF + classifier**, và
    - **Mô hình Transformer PhoBERT** (chi tiết ở mục 2.4).

- **Tiếp cận dựa trên Transformer / BERT / PhoBERT**  
  - Sử dụng **mô hình ngôn ngữ tiền huấn luyện (pre-trained)** như BERT/PhoBERT, sau đó **fine-tune** trên dữ liệu sentiment/emotion tiếng Việt.  
  - Đây là hướng tiếp cận chính cho **PhoBERT** trong hệ thống này, cho phép đạt độ chính xác cao hơn đáng kể so với mô hình truyền thống trên dữ liệu tiếng Việt.

---

### 2.3. Mô hình học máy cho NLP

#### 2.3.1. Mô hình truyền thống (TF‑IDF, SVM, Logistic Regression, Naive Bayes)

Trong hệ thống, lớp AI module Python hỗ trợ một **chế độ fallback dựa trên scikit‑learn**, sử dụng các mô hình truyền thống cho NLP:

- **Biểu diễn văn bản bằng TF‑IDF**  
  - Mỗi bình luận được biểu diễn dưới dạng vector TF‑IDF:  
    - **TF (Term Frequency)**: tần suất từ trong bình luận.  
    - **IDF (Inverse Document Frequency)**: độ hiếm của từ trong toàn bộ tập dữ liệu.  
  - Kết hợp n‑gram (unigram, bigram) để mô hình nắm bắt cụm từ như “rất hay”, “không hay”, “chán quá”, …

- **Naive Bayes (MultinomialNB)**  
  - Giả định đơn giản hóa về độc lập giữa các từ.  
  - Thích hợp cho bài toán phân loại văn bản nhiều chiều.  
  - Thường cho kết quả tốt, huấn luyện nhanh, ít tham số.

- **Support Vector Machine (SVM)**  
  - Tìm siêu phẳng (hyperplane) tối ưu phân tách các lớp trong không gian vector TF‑IDF.  
  - Thường cho **độ chính xác cao** với dữ liệu văn bản có số chiều lớn.

- **Logistic Regression**  
  - Mô hình tuyến tính dự đoán xác suất mỗi lớp thông qua hàm sigmoid/softmax.  
  - Cho phép xuất ra **probability** cho từng lớp, dễ diễn giải và dùng làm trọng số tin cậy.

**Pipeline điển hình trong dự án (fallback)**:

- **Tiền xử lý** → **TF‑IDF Vectorizer** → **Classifier (MultinomialNB / Logistic Regression / SVM)**  
- Kết quả:  
  - `sentiment` ∈ {positive, negative, neutral}  
  - `emotion` ∈ {happy, sad, angry, suggestion, love}  
  - `confidence` = trung bình độ tin cậy giữa hai mô hình.

Các mô hình này được triển khai bằng thư viện **scikit‑learn** và được tích hợp vào API Flask `/api/analyze-sentiment` để backend Spring Boot có thể gọi.

#### 2.3.2. Mô hình LSTM/BiLSTM (khái quát, không triển khai trong project)

**LSTM (Long Short-Term Memory)** và **BiLSTM (Bidirectional LSTM)** là các biến thể của mạng nơ-ron hồi quy (RNN) được thiết kế để ghi nhớ phụ thuộc dài hạn trong chuỗi:

- **LSTM** sử dụng các cổng (input, forget, output) để kiểm soát thông tin lưu/loại bỏ trong “ô nhớ” (cell state).
- **BiLSTM** kết hợp hai LSTM:
  - Một LSTM đọc chuỗi theo chiều **từ trái sang phải**.
  - Một LSTM đọc chuỗi theo chiều **từ phải sang trái**.  
  → Cho phép mô hình nắm bắt ngữ cảnh hai chiều xung quanh mỗi từ.

Trong phạm vi đề tài này, **LSTM/BiLSTM được dùng như nền tảng lý thuyết** cho học sâu trong NLP; **hệ thống thực tế không triển khai LSTM/BiLSTM**, mà chuyển sang sử dụng **Transformer (PhoBERT)** – một kiến trúc hiện đại hơn, hiệu quả hơn cho bài toán xử lý bình luận tiếng Việt.

---

### 2.4. Mô hình Transformer và PhoBERT

#### 2.4.1. Kiến trúc tổng quan Transformer

**Transformer** là kiến trúc mạng nơ-ron sâu được giới thiệu trong bài báo “Attention Is All You Need” (Vaswani et al., 2017), dựa hoàn toàn trên cơ chế **self-attention**, không dùng RNN hay CNN.

Các thành phần chính:

- **Self-Attention**  
  - Mỗi từ trong câu được ánh xạ thành 3 vector: **Query (Q)**, **Key (K)**, **Value (V)**.  
  - Mức độ “chú ý” giữa các từ được tính bằng điểm tương đồng giữa Q và K, sau đó dùng trọng số này để tổng hợp V.  
  - Cho phép mô hình học được **ngữ cảnh toàn câu** một cách song song, hiệu quả.

- **Multi-Head Attention**  
  - Thay vì một self-attention đơn, Transformer sử dụng nhiều “head” song song, mỗi head học được một kiểu quan hệ/ngữ nghĩa khác nhau.

- **Feed-Forward Network (FFN)**  
  - Sau lớp attention, mỗi vị trí đi qua một mạng nơ-ron tuyến tính 2 tầng, giống nhau cho mọi vị trí.

- **Positional Encoding**  
  - Vì self-attention không có thông tin thứ tự, Transformer thêm vector **positional encoding** vào embedding để mô hình biết vị trí tương đối của từ.

- **Encoder–Decoder Stack**  
  - Bản gốc dùng encoder cho bài toán hiểu văn bản, decoder cho sinh văn bản.  
  - Các mô hình như BERT/PhoBERT sử dụng **cụm encoder** để học biểu diễn ngữ nghĩa của câu.

Ưu điểm:

- Học được **phụ thuộc dài hạn** trong câu tốt hơn RNN/LSTM.  
- **Song song hóa cao**, tận dụng GPU tốt → tốc độ nhanh.  
- Trở thành nền tảng cho các mô hình ngôn ngữ hiện đại (BERT, GPT, PhoBERT, …).

#### 2.4.2. PhoBERT cho tiếng Việt

**PhoBERT** là mô hình BERT được **VinAI Research** huấn luyện riêng cho tiếng Việt:

- **Kiến trúc**: dựa trên BERT (Transformer encoder), sử dụng **subword BPE** phù hợp với tiếng Việt.
- **Dữ liệu huấn luyện**: hàng tỷ từ tiếng Việt thu thập từ nhiều nguồn (tin tức, mạng xã hội, v.v.).
- **Mục tiêu**: học được biểu diễn ngữ nghĩa sâu cho tiếng Việt, tương thích với thư viện **Hugging Face Transformers**.

Trong hệ thống YouTube AI Analytics:

- AI module Python hỗ trợ **sử dụng PhoBERT** thông qua thư viện **`transformers` + `torch`**:
  - Dùng tokenizer PhoBERT (`vinai/phobert-base`) để mã hóa bình luận.
  - Fine-tune hai **head phân loại**:
    - **PhoBERT Sentiment Head**: 3 lớp (negative, neutral, positive).
    - **PhoBERT Emotion Head**: 5 lớp (sad, angry, suggestion, happy, love).
- Khi PhoBERT đã được setup, service:
  - **Load tokenizer**: `AutoTokenizer.from_pretrained("vinai/phobert-base")`.  
  - **Load model đã fine-tune**: từ thư mục `app/data/models/phobert_sentiment` và `phobert_emotion`.  
  - Chạy suy luận batch nhiều bình luận cùng lúc (tối ưu hiệu năng, sử dụng GPU nếu có).

Hệ thống được thiết kế theo hướng:

- **Ưu tiên**: dùng **PhoBERT** cho độ chính xác cao khi môi trường có thể cài `torch`/GPU.  
- **Fallback**: nếu không tìm thấy model PhoBERT, tự động chuyển sang **mô hình scikit‑learn** (TF‑IDF + classifier), đảm bảo hệ thống vẫn hoạt động trên môi trường nhẹ.

---

### 2.5. Các công nghệ và công cụ sử dụng trong hệ thống

Trong project, kiến trúc tổng thể gồm **Frontend (React)**, **Backend (Spring Boot)**, **AI Module (Flask + NLP)**, **Database (MySQL)** và tích hợp **YouTube Data API v3**. Dưới đây là các công nghệ chính liên quan đến chương này.

#### 2.5.1. YouTube Data API v3

- **YouTube Data API v3** cho phép hệ thống:
  - Lấy **thông tin kênh** (channel), **danh sách video**, **bình luận** từ YouTube.
  - Lấy các chỉ số **view, like, comment** để phục vụ phân tích.
- Backend Spring Boot:
  - Cấu hình **API key** trong `application.properties`:  
    - `youtube.api.key`, `youtube.api.base-url`.  
  - Xây dựng service (ví dụ `YouTubeApiService`, `YouTubeAnalysisService`) để:
    - Parse URL YouTube → channelId/videoId.
    - Gọi API `channels.list`, `videos.list`, `commentThreads.list`, …
    - Lưu dữ liệu về MySQL (`channels`, `videos`, `comments`, `analytics`).
- Dữ liệu comments sau khi được lấy về sẽ được **đẩy sang AI module** để phân tích sentiment/emotion.

#### 2.5.2. Spring Boot (Backend chính)

- **Spring Boot 3.x** là nền tảng backend chính, viết bằng Java:
  - **spring‑boot‑starter‑web**: xây dựng REST API cho frontend.
  - **spring‑boot‑starter‑data‑jpa** + **MySQL Connector**: truy cập CSDL MySQL bằng JPA/Hibernate.
  - **spring‑boot‑starter‑security + JWT**: xác thực, phân quyền, quản lý người dùng.
- Chức năng liên quan tới NLP:
  - **Đồng bộ dữ liệu từ YouTube** (lưu comments chưa phân tích).  
  - **Gửi batch comments** sang AI module qua HTTP (`RestTemplate`/`WebClient`).  
  - **Lưu kết quả phân tích** (sentiment, emotion, score, `is_analyzed`) vào bảng `comments`.  
  - Cung cấp API cho frontend:
    - Lọc bình luận theo sentiment/emotion.
    - Thống kê số lượng từng loại cảm xúc.
    - Lấy top video theo lượt thích/comment, v.v.

#### 2.5.3. Flask AI Module (Backend AI/NLP)

- **Python Flask** được dùng để xây dựng **AI Module** – một microservice tách biệt:
  - Chạy trên `http://localhost:5000`.
  - Cung cấp API:
    - `POST /api/analyze-sentiment` – phân tích một bình luận.
    - `POST /api/analyze-sentiment/batch` – phân tích batch nhiều bình luận.
    - `POST /api/extract-keywords`, `POST /api/classify-topics`, `POST /api/generate-content`, … (mở rộng).
- Sử dụng các thư viện AI/NLP:
  - **scikit‑learn**: TF‑IDF, Naive Bayes, Logistic Regression, SVM (mô hình truyền thống).
  - **transformers** + **torch**: load và fine‑tune **PhoBERT**.
  - **underthesea** (khả dụng): hỗ trợ NLP tiếng Việt (tách từ, POS tagging, …).
  - **numpy, pandas**: xử lý dữ liệu.
- AI Module là nơi hiện thực toàn bộ logic **tiền xử lý văn bản, vector hóa, suy luận sentiment/emotion** cho bình luận tiếng Việt.

#### 2.5.4. ReactJS (Frontend)

- **React + Vite** được dùng để xây dựng giao diện người dùng:
  - **React Router**: điều hướng giữa các trang (`Dashboard`, `VideoAnalytics`, `CommentSentiment`, `CommunityInsights`, `AISuggestion`, `Settings`, …).
  - **Context API + Hooks**: quản lý trạng thái auth, theme, dữ liệu phân tích.
  - **Recharts**: vẽ các biểu đồ thống kê (pie chart cảm xúc, biểu đồ trend).
- Với trang **Comment Sentiment**:
  - Gọi các API backend:
    - `/api/comments/sentiment` – lọc bình luận theo tích cực/tiêu cực/trung lập.
    - `/api/comments/emotion` – lọc bình luận theo từng loại cảm xúc.
    - `/api/comments/sentiment-stats` – lấy thống kê để vẽ biểu đồ cảm xúc.
  - Hiển thị:
    - Danh sách bình luận (avatar, tên tác giả, nội dung, thời gian, video tương ứng).
    - Biểu đồ phân bố cảm xúc (pie chart).
    - Top video nhiều tương tác.

#### 2.5.5. Cơ sở dữ liệu MySQL

- Hệ thống sử dụng **MySQL** làm cơ sở dữ liệu quan hệ chính:
  - Các bảng quan trọng:
    - `users`, `user_preferences`
    - `channels`, `videos`
    - `comments` (chứa trường `sentiment`, `emotion`, `sentiment_score`, `is_analyzed`, `analyzed_at`)
    - `analytics`, `video_topics`, `video_topic_mapping`, `keywords`, …
- Vai trò trong bài toán NLP:
  - Lưu **bình luận thô** lấy từ YouTube (chưa phân tích).
  - Lưu **kết quả phân tích** (sentiment/emotion) để:
    - Tái sử dụng không cần gọi lại AI module cho cùng dữ liệu.
    - Thống kê, vẽ biểu đồ, lọc dữ liệu nhanh chóng trên frontend.
  - Kết hợp với **scheduled jobs** để tìm những bình luận `is_analyzed = false` và gửi sang AI module xử lý song song.

#### 2.5.6. Thư viện AI và NLP sử dụng

Các thư viện chính trong AI module:

- **scikit‑learn**  
  - Triển khai các mô hình truyền thống:
    - **TfidfVectorizer**: trích xuất đặc trưng từ văn bản.
    - Bộ phân loại: **MultinomialNB**, **LogisticRegression**, **SVC**, …  
  - Dùng cho:
    - Sentiment model (3 lớp).
    - Emotion model (5 lớp).
    - Topic model (phân loại chủ đề video/bình luận).

- **transformers (Hugging Face)**  
  - Dùng để load tokenizer và model PhoBERT:
    - `AutoTokenizer.from_pretrained("vinai/phobert-base")`
    - `AutoModelForSequenceClassification.from_pretrained(...)`
  - Phục vụ fine‑tune sentiment/emotion cho tiếng Việt.

- **torch (PyTorch)**  
  - Framework deep learning để chạy PhoBERT:
    - Xử lý tensor, softmax, argmax, batch inference.
    - Tận dụng GPU nếu có (CUDA).

- **underthesea** (tiềm năng mở rộng)  
  - Bộ công cụ NLP tiếng Việt:
    - Tách từ, gán nhãn từ loại, phân tích câu, v.v.
  - Có thể dùng để nâng cao chất lượng tiền xử lý trong các bước tiếp theo của đề tài.

- **Các thư viện hỗ trợ khác**  
  - **numpy, pandas**: xử lý vector, ma trận, tập dữ liệu.  
  - **python‑dotenv**: quản lý biến môi trường (`.env`) cho đường dẫn model, cấu hình AI module.

---

**Tóm lại**, chương 2 đã trình bày:

- Cơ sở lý thuyết về **NLP, tiền xử lý văn bản, phân tích cảm xúc**.  
- Các **mô hình truyền thống** (TF‑IDF + scikit‑learn) và **mô hình hiện đại Transformer (PhoBERT)** cho tiếng Việt.  
- Toàn bộ **stack công nghệ** được sử dụng trong hệ thống: **YouTube Data API v3, Spring Boot, Flask AI module, ReactJS, MySQL, scikit‑learn, transformers/PhoBERT** – gắn chặt với kiến trúc và yêu cầu thực tế của project.