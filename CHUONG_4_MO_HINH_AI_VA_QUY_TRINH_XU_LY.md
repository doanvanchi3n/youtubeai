## CHƯƠNG 4. MÔ HÌNH TRÍ TUỆ NHÂN TẠO VÀ QUY TRÌNH XỬ LÝ

Đây là chương tập trung mô tả chi tiết **phần AI/NLP** của hệ thống: cách thu thập dữ liệu, xây dựng và huấn luyện mô hình phân tích cảm xúc, cũng như quy trình suy luận (inference) khi mô hình được tích hợp vào ứng dụng web.

---

### 4.1. Thu thập và chuẩn bị dữ liệu

#### 4.1.1. Nguồn dữ liệu: bình luận từ YouTube

Nguồn dữ liệu chính của hệ thống là **bình luận (comments)** từ các video thuộc **kênh YouTube** mà người dùng nhập URL trong hệ thống:

- Người dùng nhập **URL kênh YouTube** (channel URL / handle).
- Backend Spring Boot dùng YouTube Data API v3 để:
  - Lấy thông tin kênh (channelId, tiêu đề, mô tả, avatar, …).
  - Lấy danh sách video thuộc kênh.
  - Lấy danh sách bình luận cho từng video.
- Các bình luận được lưu vào bảng `comments` trong MySQL, bao gồm:
  - `content`: nội dung bình luận (tiếng Việt).
  - `author_name`, `author_avatar`.
  - `video_id` (video thuộc kênh), `like_count`, `published_at`.
  - Trạng thái phân tích: `is_analyzed`, `sentiment`, `emotion`, `sentiment_score`, `analyzed_at`.

Tập dữ liệu ban đầu phục vụ cho việc **huấn luyện mô hình** được trích xuất từ các bình luận này, sau đó được gán nhãn thủ công (hoặc bán tự động) để tạo thành **dataset sentiment/emotion tiếng Việt cho YouTube**.

#### 4.1.2. Cách sử dụng YouTube Data API v3 để lấy bình luận

Quy trình sử dụng YouTube Data API v3:

1. **Lấy channelId từ URL kênh**  
   - Backend phân tích URL mà user nhập, chuyển sang `channelId` hợp lệ.
   - Nếu người dùng nhập handle (ví dụ: `https://www.youtube.com/@tenkenh`), hệ thống dùng API để tra cứu ra `channelId`.

2. **Lấy danh sách video của kênh**  
   - Gọi endpoint `search` hoặc `playlistItems` để lấy danh sách video thuộc kênh.
   - Sau đó dùng `videos.list` để lấy thêm chi tiết (view, like, comment count…).

3. **Lấy bình luận cho từng video**  
   - Gọi endpoint `commentThreads.list` với `videoId`.
   - Lặp qua các `nextPageToken` để lấy hết bình luận (hoặc giới hạn theo cấu hình).
   - Mỗi comment thread được lưu thành một bản ghi trong bảng `comments`.

4. **Lưu vào CSDL**  
   - Với mỗi bình luận:
     - Lưu nội dung và metadata.
     - Đặt `is_analyzed = false` để đánh dấu **chưa phân tích cảm xúc**.
   - Từ đó, **AI module** sẽ dùng các bản ghi này để:
     - Trích xuất tập dữ liệu huấn luyện.
     - Phân tích sentiment/emotion ở chế độ chạy thật (inference).

#### 4.1.3. Lọc và làm sạch dữ liệu thô (loại spam, link, quảng cáo)

Trong thực tế, bình luận YouTube chứa rất nhiều **spam, link, quảng cáo, chuỗi ký tự vô nghĩa**. Việc lọc và làm sạch được thực hiện theo hai lớp:

- **Lọc ở mức dữ liệu thô (trước khi huấn luyện):**
  - Bỏ qua các bình luận:
    - Chỉ chứa link (`http://`, `https://`, `www.`).
    - Quá ngắn, không mang nội dung (ví dụ: chỉ có emoji rời rạc, “.”, “???”).
    - Có dấu hiệu spam rõ ràng (lặp lại nhiều lần cùng nội dung, chứa từ khóa quảng cáo).
  - Có thể sử dụng các tiêu chí đơn giản:
    - Độ dài tối thiểu (ví dụ ≥ 5–10 ký tự sau khi loại bỏ khoảng trắng).
    - Tỉ lệ ký tự chữ cái / ký tự tổng (để loại bỏ chuỗi ký tự vô nghĩa).

- **Tiền xử lý ở mức text (trước khi đưa vào mô hình):**
  - Loại bỏ URL, email, chuẩn hóa khoảng trắng (như đã mô tả ở chương 2).
  - Giữ lại emoji vì chúng mang thông tin cảm xúc quan trọng (❤️, 😞, 😡…).

Việc lọc tốt giúp mô hình **ít bị nhiễu**, tăng chất lượng dữ liệu huấn luyện và hiệu quả khi triển khai.

---

### 4.2. Gán nhãn dữ liệu cảm xúc

#### 4.2.1. Quy tắc gán nhãn Positive / Negative / Neutral

Đối với bài toán **sentiment 3 lớp**, hệ thống sử dụng bộ nhãn:

- **Positive (Tích cực)**  
  - Bình luận thể hiện lời khen, hài lòng, cảm ơn, yêu thích nội dung:
    - Ví dụ: “Video quá hay”, “Cảm ơn bạn rất nhiều”, “Rất hữu ích”, “Tuyệt vời ạ”.
- **Negative (Tiêu cực)**  
  - Bình luận phàn nàn, chê bai, không hài lòng:
    - Ví dụ: “Chán quá”, “Video tệ”, “Âm thanh quá nhỏ, nghe không được”, “Lãng phí thời gian”.
- **Neutral (Trung lập)**  
  - Bình luận mang tính thông tin, hỏi đáp, góp ý nhẹ, không thiên hẳn về khen/chê:
    - Ví dụ: “Bạn dùng phần mềm gì để edit?”, “Có thể cải thiện âm thanh một chút”, “Video này dài 10 phút”.

Ngoài ra, hệ thống còn gán nhãn **emotion 5 lớp** (happy, sad, angry, suggestion, love) để nắm bắt sắc thái chi tiết hơn, nhưng **nhãn sentiment 3 lớp** là lõi cho bài toán phân tích tổng quan tích cực/tiêu cực hay trung lập.

#### 4.2.2. Quy trình gán nhãn (phân chia, kiểm tra chéo, thống nhất)

Quy trình gán nhãn (thiết kế lý thuyết, áp dụng khi xây dựng dataset):

1. **Chuẩn bị tập bình luận thô:**
   - Lấy ngẫu nhiên một tập bình luận từ nhiều kênh và chủ đề khác nhau.
   - Lọc bỏ spam, bình luận vô nghĩa.

2. **Phân chia cho nhiều người gán nhãn (annotator):**
   - Mỗi annotator được giao một danh sách bình luận.
   - Họ đọc và gán nhãn sentiment (positive/negative/neutral) và emotion (happy/sad/angry/suggestion/love) theo quy tắc đã định.

3. **Kiểm tra chéo (double-annotation):**
   - Một phần dữ liệu được gán nhãn bởi **ít nhất hai người**.
   - Tính độ đồng thuận (inter-annotator agreement), ví dụ bằng Cohen’s Kappa.

4. **Thống nhất nhãn:**
   - Với các trường hợp mâu thuẫn, tổ chức thảo luận hoặc có annotator trưởng (lead) quyết định nhãn cuối cùng.
   - Cập nhật guideline gán nhãn nếu phát hiện các mẫu khó/biên giới.

Dữ liệu sau khi gán nhãn đạt chất lượng được đưa vào mô hình để training baseline (TF‑IDF + classifier) và fine‑tune PhoBERT.

#### 4.2.3. Thống kê phân bố nhãn

Để đảm bảo mô hình không bị **lệch lớp (class imbalance)**, cần theo dõi phân bố nhãn:

- Ví dụ (mang tính minh họa):
  - Sentiment:
    - Positive: ~40%
    - Negative: ~30%
    - Neutral: ~30%
  - Emotion:
    - Happy: 25%
    - Sad: 15%
    - Angry: 10%
    - Suggestion: 25%
    - Love: 25%

Nếu một lớp quá ít (ví dụ “angry” rất ít), có thể:

- Tăng cường thu thập dữ liệu chứa lớp đó.
- Dùng kỹ thuật xử lý mất cân bằng (class weighting, oversampling) trong training.

---

### 4.3. Tiền xử lý văn bản cho mô hình NLP

#### 4.3.1. Chuẩn hóa tiếng Việt, xử lý teencode, emoji

Trong dataset bình luận YouTube tiếng Việt, xuất hiện rất nhiều:

- **Teencode, viết tắt**: “k”, “ko”, “hok”, “vcl”, “vl”, “cx”, …
- **Emoji và biểu tượng cảm xúc**: ❤️, 😞, 😡, 😂, 😍…
- **Chữ viết không dấu, sai chính tả, viết hoa lộn xộn**.

Quy trình tiền xử lý (đã/đang được áp dụng trong `TextProcessor` và có thể mở rộng thêm):

- **Bước 1 – Chuẩn hóa chữ thường và khoảng trắng:**
  - `text.lower()`, loại khoảng trắng thừa, loại URL, email.
- **Bước 2 – Giữ lại emoji:**
  - Không loại bỏ emoji vì chúng mang thông tin cảm xúc.
- **Bước 3 – Bản đồ teencode (có thể mở rộng):**
  - Xây dựng từ điển thay thế teencode phổ biến:
    - “ko”, “kh”, “k” → “không”.
    - “hok” → “không”.
    - “vl”, “vcl” → biểu cảm mạnh (có thể xem là rất tích cực hoặc rất tiêu cực tùy ngữ cảnh).
- **Bước 4 – Xử lý ký tự lặp:**
  - Chuẩn hóa chuỗi kiểu “hay quaaaaaa”, “đẹppppp” → “hay quá”, “đẹp”.
  - Giới hạn số lần lặp liên tiếp.

Mức độ tiền xử lý được cân chỉnh sao cho **không làm mất thông tin cảm xúc**, nhưng vẫn giúp mô hình dễ học hơn.

#### 4.3.2. Tokenization với PhoBERT/BERT

Đối với mô hình chính PhoBERT, việc tokenization được thực hiện bằng **tokenizer của PhoBERT**:

- Sử dụng `AutoTokenizer.from_pretrained("vinai/phobert-base")`.
- Tokenizer dựa trên **BPE (Byte-Pair Encoding)**, chia câu thành các **subword** phù hợp với tiếng Việt.
- Bước xử lý:
  - Nhận câu văn bản (sau tiền xử lý).
  - Mã hóa thành:
    - `input_ids`: dãy ID token.
    - `attention_mask`: mặt nạ đánh dấu token thực vs padding.
    - (tuỳ chọn) `token_type_ids`.
  - Giới hạn độ dài: `max_length` (ví dụ 256 token).

Tokenization là bước cầu nối giữa văn bản thuần và **mô hình Transformer PhoBERT**, cho phép mô hình hiểu được cấu trúc và ngữ nghĩa của câu.

---

### 4.4. Các mô hình baseline

#### 4.4.1. Biểu diễn TF‑IDF

Baseline của hệ thống sử dụng mô hình **TF‑IDF + classifier** (scikit‑learn):

- **TF‑IDF Vectorizer:**
  - Chuyển bình luận thành vector số, trong đó mỗi chiều tương ứng với 1 từ/cụm từ (n‑gram).
  - Tham số (ví dụ):
    - `max_features`: 5.000–10.000 từ phổ biến nhất.
    - `ngram_range`: (1, 2) – sử dụng unigram và bigram.
    - `min_df`: 2 – loại từ quá hiếm.
    - `max_df`: 0.95 – loại từ xuất hiện ở quá nhiều tài liệu.
- **Ý nghĩa:**
  - Từ mang nhiều thông tin (như “tuyệt vời”, “chán quá”, “không hay”) có trọng số TF‑IDF cao.
  - Từ xuất hiện khắp nơi (“là”, “và”) có trọng số thấp.

#### 4.4.2. Mô hình Logistic Regression / SVM

Trên vector TF‑IDF, có thể sử dụng nhiều classifier khác nhau:

- **Logistic Regression:**
  - Mô hình tuyến tính, cho đầu ra là **xác suất** từng lớp.
  - Ưu điểm:
    - Dễ huấn luyện, tốc độ nhanh.
    - Kết quả trực tiếp dùng làm confidence score.

- **SVM (Support Vector Machine):**
  - Tìm siêu phẳng phân tách các lớp với margin tối đa.
  - Hiệu quả cao trên dữ liệu chiều cao như TF‑IDF.
  - Có thể dùng kernel tuyến tính để đơn giản hóa.

- **Naive Bayes (MultinomialNB) – baseline đơn giản:**
  - Phù hợp với mô hình “bag-of-words”.
  - Rất nhanh, cho baseline dễ triển khai.

Trong AI module, các mô hình này được triển khai bằng **scikit‑learn**, lưu thành file `.pkl` (ví dụ `sentiment_model.pkl`, `emotion_model.pkl`) và dùng làm **fallback** khi không có PhoBERT.

---

### 4.5. Mô hình chính: PhoBERT cho phân loại cảm xúc

#### 4.5.1. Kiến trúc mô hình PhoBERT trong bài toán

PhoBERT là mô hình **BERT-based Transformer** được huấn luyện riêng cho tiếng Việt. Trong hệ thống, PhoBERT được fine‑tune cho hai nhiệm vụ:

- **PhoBERT Sentiment Model:**
  - Đầu ra: 3 lớp (`negative`, `neutral`, `positive`).
  - Mục tiêu: phân tích sentiment tổng quan của bình luận.

- **PhoBERT Emotion Model:**
  - Đầu ra: 5 lớp (`sad`, `angry`, `suggestion`, `happy`, `love`).
  - Mục tiêu: bắt sắc thái chi tiết hơn.

Cấu trúc tổng quát:

```text
PhoBERT Encoder (pre-trained trên tiếng Việt)
     ↓
[CLS] embedding (vector biểu diễn câu)
     ↓
Dense layer + Softmax (3 lớp)  → Sentiment
     ↓
Dense layer + Softmax (5 lớp)  → Emotion
```

Trong triển khai thực tế, có thể fine‑tune thành **hai model riêng biệt**:

- `phobert_sentiment/` – model 3 lớp.
- `phobert_emotion/` – model 5 lớp.

#### 4.5.2. Sơ đồ pipeline: Comment → Tokenizer → PhoBERT → Dense → Softmax

Pipeline xử lý một bình luận:

1. **Comment (văn bản gốc)**
2. **Tiền xử lý (TextProcessor)**
   - Chuẩn hóa chữ, loại URL, giữ emoji, xử lý teencode (nếu có).
3. **Tokenizer (PhoBERT Tokenizer)**
   - Biến text thành `input_ids`, `attention_mask`.
4. **PhoBERT Encoder**
   - Tạo ra embedding cho từng token, đặc biệt là token `[CLS]`.
5. **Dense + Softmax (Sentiment Head)**
   - Áp dụng linear layer + softmax để dự đoán xác suất 3 lớp.
6. **Dense + Softmax (Emotion Head)**
   - Linear layer + softmax cho 5 lớp emotion.
7. **Output**
   - `sentiment`, `emotion`, `confidence` (trung bình hoặc lấy từ mỗi head).

Kết quả cuối cùng trả về cho backend ở dạng JSON, sau đó được lưu vào CSDL.

---

### 4.6. Quy trình huấn luyện mô hình (Training Pipeline)

> Lưu ý: Trong project, các script `train_sentiment.py`, `train_emotion.py`, `train_topic.py` đang ở dạng khung (TODO). Phần này mô tả **pipeline thiết kế** khi huấn luyện ngoài hệ thống.

#### 4.6.1. Chia tập Train / Validation / Test

Quy trình chia dữ liệu:

- **Bước 1 – Trộn ngẫu nhiên (shuffle)** dataset đã gán nhãn.
- **Bước 2 – Chia theo tỉ lệ**, ví dụ:
  - Train: 70%
  - Validation: 15%
  - Test: 15%
- Đảm bảo phân bố nhãn tương đối đều ở các tập (stratified split nếu có thể).

Tập **validation** dùng để:

- Chọn hyperparameter tốt nhất.
- Theo dõi overfitting (early stopping).  

Tập **test** chỉ dùng một lần cuối để báo cáo kết quả.

#### 4.6.2. Cấu hình hyperparameter

Một số hyperparameter tiêu biểu cho PhoBERT:

- **Batch size**: 16–32 (tùy GPU).
- **Learning rate**: thường trong khoảng \(2e^{-5}\) đến \(5e^{-5}\) (AdamW).
- **Epochs**: 3–5 epoch là phổ biến cho fine‑tune BERT/PhoBERT.
- **Max length**: 128–256 token, đủ cho đa số bình luận YouTube.
- **Weight decay**: 0.01 (tối ưu hóa regularization).

Các hyperparameter cho mô hình baseline TF‑IDF + classifier:

- `max_features`, `ngram_range`, `C` của Logistic Regression/SVM, `alpha` của Naive Bayes, v.v.  
- Có thể dùng **GridSearchCV** / **RandomizedSearchCV** để tìm cấu hình tốt.

#### 4.6.3. Hàm mất mát (Loss), bộ tối ưu (Optimizer), kỹ thuật tránh overfitting

- **Hàm mất mát (Loss):**
  - Sử dụng **Cross-Entropy Loss** cho cả sentiment (3 lớp) và emotion (5 lớp).
  - Nếu train hai head riêng:
    - Mỗi model có loss riêng.
  - Nếu train chung:
    - Tổng loss = `loss_sentiment + loss_emotion` (có thể nhân trọng số).

- **Bộ tối ưu (Optimizer):**
  - **AdamW** (Adam với weight decay) là lựa chọn phổ biến cho BERT-based models.
  - Kết hợp với scheduler (warmup + linear decay) để ổn định training.

- **Kỹ thuật tránh overfitting:**
  - **Early stopping** dựa trên loss/metric trên validation.
  - **Dropout** trong các layer fully-connected.
  - **Regularization (weight decay)**.
  - Data augmentation nhẹ (nếu cần): hoán đổi từ đồng nghĩa, thêm/bớt từ ít quan trọng (cần cẩn thận vì tiếng Việt).

---

### 4.7. Quy trình suy luận (Inference) trong hệ thống web

#### 4.7.1. API phân tích cảm xúc cho từng/batch bình luận

Trong hệ thống triển khai, inference diễn ra trong **AI module (Flask)**:

- **API single comment:**
  - Endpoint: `POST /api/analyze-sentiment`
  - Body:
    ```json
    { "text": "Video này rất hay!" }
    ```
  - Response:
    ```json
    {
      "sentiment": "positive",
      "emotion": "happy",
      "confidence": 0.85
    }
    ```

- **API batch comments:**
  - Endpoint: `POST /api/analyze-sentiment/batch`
  - Body:
    ```json
    {
      "texts": ["comment 1", "comment 2", "..."]
    }
    ```
  - Response:
    ```json
    {
      "results": [
        {
          "text": "comment 1",
          "sentiment": "positive",
          "emotion": "happy",
          "confidence": 0.87
        },
        {
          "text": "comment 2",
          "sentiment": "negative",
          "emotion": "sad",
          "confidence": 0.82
        }
      ]
    }
    ```

AI module:

- Load sẵn PhoBERT và/hoặc model scikit‑learn khi khởi động.
- Xử lý theo batch (ví dụ 16 bình luận/lượt) để tận dụng GPU/CPU hiệu quả.

#### 4.7.2. Tích hợp mô hình vào Backend

Trên phía backend Spring Boot:

- **Scheduled job / async service** (ví dụ `ScheduledAnalysisService`, `SentimentAnalysisService`):
  - Định kỳ lấy các bình luận `is_analyzed = false`.
  - Gửi danh sách `content` sang AI module (batch).
  - Nhận kết quả và cập nhật vào DB.

- **Flow tích hợp:**
  1. Backend gọi:
     ```text
     POST http://ai-module:5000/api/analyze-sentiment/batch
     ```
  2. AI module trả về phân tích sentiment/emotion.
  3. Backend update:
     - `sentiment`, `emotion`, `sentiment_score`, `is_analyzed = true`, `analyzed_at = now()`.

- **Lợi ích:**
  - Frontend không cần gọi trực tiếp AI module, chỉ giao tiếp với backend.
  - Backend có thể kiểm soát:
    - Retry, error handling.
    - Logging, thống kê hiệu suất AI module.

---

### 4.8. So sánh, đánh giá các mô hình

#### 4.8.1. Chỉ số đánh giá: Accuracy, Precision, Recall, F1-score

Để đánh giá mô hình sentiment/emotion, hệ thống sử dụng các chỉ số chuẩn trong phân loại:

- **Accuracy**: tỉ lệ mẫu được dự đoán đúng.
- **Precision (theo từng lớp)**: trong số các mẫu dự đoán là lớp đó, bao nhiêu là đúng.
- **Recall (theo từng lớp)**: trong số các mẫu thực sự thuộc lớp đó, mô hình tìm được bao nhiêu.
- **F1-score**: trung bình điều hòa giữa Precision và Recall, cân bằng giữa 2 yếu tố.

Có thể báo cáo:

- **Macro-average**: trung bình đều trên các lớp.
- **Weighted-average**: trung bình có trọng số theo số lượng mẫu từng lớp.

#### 4.8.2. Bảng so sánh Baseline vs PhoBERT

Bảng so sánh (minh họa):

| Mô hình                 | Biểu diễn | Accuracy | F1-macro | Ghi chú                           |
|-------------------------|-----------|----------|----------|-----------------------------------|
| TF‑IDF + Naive Bayes    | TF‑IDF    | 0.80     | 0.78     | Baseline đơn giản, chạy rất nhanh |
| TF‑IDF + Logistic Reg.  | TF‑IDF    | 0.84     | 0.83     | Baseline mạnh, dễ triển khai      |
| TF‑IDF + SVM            | TF‑IDF    | 0.85     | 0.84     | Độ chính xác tốt, train lâu hơn   |
| PhoBERT (fine‑tune)     | PhoBERT   | 0.90+    | 0.89+    | Mô hình chính, mạnh với tiếng Việt|

Ý nghĩa:

- **Baseline TF‑IDF + classifier**:
  - Ưu: nhẹ, dễ triển khai, không phụ thuộc GPU.
  - Nhược: khó bắt được các hiện tượng phức tạp như mỉa mai, ngữ cảnh dài.

- **PhoBERT**:
  - Ưu: tận dụng hiểu biết ngôn ngữ sâu của mô hình pre-trained.
  - Nhược: nặng hơn, yêu cầu tài nguyên (nhưng có thể tối ưu bằng batch inference, GPU).

#### 4.8.3. Phân tích confusion matrix

Confusion matrix giúp hiểu chi tiết mô hình đang **nhầm lẫn giữa các lớp** như thế nào:

- Ví dụ sentiment (3 lớp):
  - Dễ nhầm:
    - `neutral` ↔ `positive` cho các câu góp ý mang sắc thái nhẹ nhàng.
    - `neutral` ↔ `negative` cho các câu phàn nàn nhẹ.

- Với emotion (5 lớp):
  - `suggestion` có thể bị nhầm thành `neutral` hoặc ngược lại.
  - `love` vs `happy` cũng dễ nhầm, vì cả hai đều tích cực.

Dựa trên confusion matrix, có thể:

- Điều chỉnh guideline gán nhãn.
- Thiết kế lại kiến trúc (ví dụ gộp một số lớp hiếm, tách lớp dễ nhầm).
- Bổ sung dữ liệu cho các cặp lớp bị nhầm lẫn nhiều.

---

### 4.9. Phân tích lỗi (Error Analysis)

#### 4.9.1. Các trường hợp mô hình dễ sai (mỉa mai, teencode, emoji…)

Một số dạng câu làm mô hình khó khăn:

- **Mỉa mai/châm biếm (sarcasm/irony):**
  - Ví dụ: “Video này đỉnh thật, xem mà muốn ngủ luôn” – bề ngoài có từ tích cực (“đỉnh thật”) nhưng lại là tiêu cực.
- **Teencode và tiếng lóng phức tạp:**
  - “Đỉnh của chóp”, “xịn xò vãi”, “cay vl”, … nếu không có đủ trong dữ liệu training, mô hình có thể không hiểu đúng.
- **Ngữ cảnh phụ thuộc nhiều vào emoji:**
  - “Cũng được 😒” – text hơi trung lập, nhưng emoji mang sắc thái bực mình/không hài lòng.
- **Câu đa nghĩa, thiếu thông tin:**
  - “Khó nói quá” – không rõ khen hay chê nếu thiếu ngữ cảnh.

#### 4.9.2. Đề xuất cải thiện

Một số hướng cải thiện trong tương lai:

- **Mở rộng và làm giàu dữ liệu huấn luyện:**
  - Thu thập thêm bình luận thực tế từ nhiều kênh, đa chủ đề.
  - Cố gắng bao phủ nhiều teencode, tiếng lóng, emoji.

- **Bổ sung bước xử lý đặc thù:**
  - Từ điển teencode/emoji với mapping cảm xúc rõ ràng.
  - Tách riêng mô-đun nhận diện mỉa mai (nếu có đủ dữ liệu).

- **Tối ưu mô hình PhoBERT:**
  - Fine‑tune riêng trên domain bình luận YouTube (domain adaptation).
  - Thử các kiến trúc nhẹ hơn (DistilPhoBERT) để tăng tốc inference.

- **Kết hợp nhiều mô hình (ensemble):**
  - Kết hợp kết quả giữa baseline TF‑IDF + Logistic Regression và PhoBERT:
    - Dùng baseline như một “sanity check” cho các trường hợp PhoBERT không chắc chắn.
    - Hoặc dùng ensemble voting/averaging.

Nhờ các phân tích lỗi và cải tiến liên tục, hệ thống **YouTube AI Analytics** có thể nâng cao dần độ chính xác và sự tin cậy của việc phân tích cảm xúc bình luận cho các kênh YouTube tiếng Việt.

---