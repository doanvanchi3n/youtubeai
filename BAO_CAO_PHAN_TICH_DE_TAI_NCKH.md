# BÁO CÁO PHÂN TÍCH, PHẢN BIỆN VÀ ĐỀ XUẤT HƯỚNG NGHIÊN CỨU KHOA HỌC
## Hệ thống YouTube AI Analytics – Phân tích cảm xúc & hành vi bình luận

**Phiên bản:** 1.0  
**Ngày:** 30/01/2025  
**Phạm vi:** Đánh giá hệ thống hiện tại, hạn chế kỹ thuật, giải pháp cải tiến, chức năng hỗ trợ phụ huynh, định hướng nghiên cứu và kết luận khoa học.

---

# 1. PHÂN TÍCH HỆ THỐNG HIỆN TẠI

## 1.1. Mục tiêu cốt lõi của hệ thống

**YouTube AI Analytics** là hệ thống phân tích và gợi ý nội dung cho kênh YouTube bằng AI. Mục tiêu cốt lõi:

- **Thu thập và đồng bộ** dữ liệu từ YouTube API (kênh, video, bình luận, analytics).
- **Phân tích cảm xúc (sentiment) và hành vi (emotion)** của bình luận bằng ML/NLP (PhoBERT hoặc scikit-learn).
- **Gợi ý nội dung** (tiêu đề, mô tả, hashtags, topics) và **chatbot AI** hỗ trợ creator.
- **Báo cáo thống kê** qua Dashboard và Community Insights.

Hệ thống hướng tới **người quản lý kênh YouTube** (creator/doanh nghiệp); có thể mở rộng sang **phụ huynh** khi áp dụng cho kênh hoặc nội dung liên quan đến trẻ.

---

## 1.2. Các chức năng hiện có

| # | Chức năng | Mô tả ngắn |
|---|-----------|------------|
| 1 | Đồng bộ kênh YouTube | Nhập URL kênh → lấy channel, videos, comments từ YouTube API → lưu DB |
| 2 | Phân tích Sentiment & Emotion | Phân loại bình luận: sentiment (positive/negative/neutral), emotion (happy/sad/angry/suggestion/love) |
| 3 | Gợi ý nội dung AI | Tạo tiêu đề, mô tả SEO, hashtags, topics, trends (HuggingFace/LLM) |
| 4 | AI Chatbot | Chat trợ lý nội dung YouTube (Gemini ưu tiên, HuggingFace dự phòng) |
| 5 | Dashboard & Analytics | Metrics, trends, top videos, sentiment tổng quan |
| 6 | Community Insights | Topics, keywords, phân bố sentiment/emotion |
| 7 | Authentication | Đăng ký/đăng nhập, JWT, Google OAuth |
| 8 | Scheduled Jobs & Batch | AnalyzeJobWorker, ScheduledAnalysisService (batch sentiment), DataSyncService |

---

## 1.3. Phân loại chức năng theo nhóm

### Thu thập dữ liệu
- **Đồng bộ kênh:** Parse URL (channel/video) → YouTube API (channels, playlistItems, videos, commentThreads) → lưu channel, videos, comments.
- **Scheduled sync:** DataSyncService đồng bộ kênh theo cron (mặc định 3:30 AM).
- **Nguồn:** Chỉ YouTube Data API v3; không có crawl/stream ngoài API.

### Xử lý dữ liệu
- **Lưu/chuẩn hóa:** Backend (Spring Boot) lưu vào MySQL (channels, videos, comments, analytics, video_topics, keywords).
- **Batch job:** AnalyzeJobWorker xử lý job phân tích URL; ScheduledAnalysisService lấy comment chưa phân tích (50/batch) gửi sang AI Module.
- **Tiền xử lý text:** TextProcessor (lowercase, remove URL/email, normalize space); chưa có chuẩn hóa tiếng Việt, slang, emoji chuyên sâu.

### Phân tích AI (emotion / sentiment / behavior)
- **Sentiment:** 3 lớp (positive, negative, neutral). PhoBERT fine-tune (ưu tiên) hoặc scikit-learn TF-IDF + classifier (fallback).
- **Emotion:** 5 lớp (happy, sad, angry, suggestion, love). Cùng kiến trúc PhoBERT/sklearn.
- **Rule-based điều chỉnh:** contrast (“nhưng/chứ” + tiêu cực), toxicity, keyword counting (sentiment_keywords.py) để override/boost kết quả model.
- **Batch inference:** 50 comment/batch (Backend) → AI Module; PhoBERT batch 16 (cấu hình).

### Lưu trữ
- **MySQL:** 9 bảng chính (users, user_preferences, channels, videos, comments, analytics, video_topics, video_topic_mapping, keywords) + 3 view.
- **Comments:** sentiment, emotion, sentiment_score, is_analyzed, analyzed_at.
- Không có Redis/cache, không có NoSQL hay data lake.

### Giao diện & thông báo
- **Frontend:** React + Vite; trang Dashboard, Video Analytics, Comment Sentiment, Community Insights, AI Suggestion (form + chatbot), Settings.
- **API:** REST; JWT cho auth; không có WebSocket/SSE cho real-time; trạng thái job phân tích qua polling (GET analyze job).

---

# 2. ĐÁNH GIÁ HẠN CHẾ & VẤN ĐỀ KỸ THUẬT

## 2.1. Hiệu năng & dữ liệu

### a) Dữ liệu load chậm khi hệ thống chạy

**Nguyên nhân kỹ thuật:**
- **Đồng bộ đồng bộ:** Toàn bộ channel (videos + comments) xử lý trong một request; YouTube API gọi tuần tự (channel → playlist → videos → comments từng video) → thời gian phụ thuộc số video và comment.
- **Không cache:** Dashboard/trends/sentiment đọc trực tiếp từ MySQL, không cache (Redis/Memcached) → mỗi lần load lại query nặng (aggregate views, JOIN).
- **Polling job:** Frontend poll job status (analyze URL) với interval cố định → cảm giác “chờ lâu” dù backend đã tách async.
- **AI Module:** PhoBERT inference trên CPU (hoặc GPU) với batch 16; 50 comment/batch từ Backend → nhiều round-trip HTTP nếu gửi từng batch nhỏ.

**Mức độ ảnh hưởng:** **Cao** với kênh nhiều video (>50) và nhiều comment (>1000). User thấy loading kéo dài 30s– vài phút.

**So sánh:** Hệ thống tương tự (Social Blade, Tubular) thường dùng cache và pre-aggregation; nhiều nền tảng tách “sync” và “view” (trả về ngay dữ liệu đã có, sync nền).

---

### b) Khối lượng dữ liệu lớn khi phân tích hành vi / cảm xúc

**Nguyên nhân kỹ thuật:**
- **Batch cố định:** 50 comment/lần (ScheduledAnalysisService); 16 comment/batch PhoBERT. Hàng chục nghìn comment → hàng nghìn batch → thời gian chạy dài, queue tích lũy.
- **Không giới hạn theo thời gian:** Lấy “unanalyzed” không ưu tiên theo video mới nhất hoặc thời gian → có thể xử lý comment cũ trước.
- **Single AI instance:** Một process Flask; không horizontal scaling → throughput bị giới hạn bởi 1 máy.
- **Ghi DB từng comment:** Backend cập nhật từng comment sau batch → nhiều transaction, lock/contention khi scale.

**Mức độ ảnh hưởng:** **Cao** khi số comment chưa phân tích > 5.000–10.000; **Trung bình** với < 2.000 comment.

**So sánh:** Pipeline sentiment công nghiệp thường dùng queue (Kafka/RabbitMQ), worker pool, batch lớn hơn và bulk update DB.

---

### c) Nguy cơ MySQL bị quá tải / đầy dữ liệu

**Nguyên nhân kỹ thuật:**
- **Một schema cho mọi thứ:** Dữ liệu thô (comment text, metadata) và dữ liệu đã phân tích (sentiment, emotion) cùng bảng `comments` → bảng phình khi số comment lớn.
- **Không partition theo thời gian:** Bảng `comments`, `analytics` không partition theo `date`/`published_at` → query full scan khi filter theo kênh + thời gian.
- **Index:** Có idx (video_id, sentiment, emotion, is_analyzed) nhưng thiếu composite phù hợp cho query “theo kênh + ngày + sentiment”.
- **Không retention:** Không có chính sách archive/xóa comment cũ → dung lượng tăng vô hạn.
- **Connection pool:** Mặc định Spring Boot; dưới tải cao (nhiều job + API) có thể hết connection.

**Mức độ ảnh hưởng:** **Trung bình–Cao** khi chạy lâu (> 6 tháng) với nhiều kênh và comment; **Cao** nếu không có backup và retention.

**So sánh:** Hệ thống analytics thường tách: hot data (MySQL/Postgres), cold/aggregate (Data Lake / warehouse), và có lifecycle (archive/delete).

---

## 2.2. Phân tích emotion / sentiment – Sai ngữ nghĩa, không phù hợp ngữ cảnh Việt / ngôn ngữ mạng

### a) Vì sao mô hình hiện tại dễ sai

- **PhoBERT base:** Pre-train trên văn bản chuẩn (tin tức, văn học). Bình luận YouTube nhiều slang, viết tắt, teencode, emoji, lỗi chính tả → distribution shift → độ chính xác giảm.
- **Fine-tune (nếu có):** Nếu training data ít hoặc không đại diện (ít slang, ít câu phủ định/đảo ngữ) → model học bias, sai với “éo hay”, “chán đời”, “vl hay”.
- **TF-IDF + sklearn (fallback):** Bag-of-words, không nắm thứ tự và ngữ cảnh; “không hay” và “hay” có thể gần nhau về vector nếu thiếu bigram/negation handling.
- **Emotion 5 lớp cố định:** happy/sad/angry/suggestion/love không phủ hết trạng thái (lo lắng, thất vọng nhẹ, trung lập cảm xúc) → ép lớp gây sai.
- **Rule-based:** Keyword và contrast giúp một phần nhưng từ điển hữu hạn; slang/ẩn dụ mới (“bá cháy”, “cringe”) chưa được cover.

---

### b) Thiếu bước tiền xử lý nào

- **Chuẩn hóa tiếng Việt:** Không normalize dấu (Unicode NFC), không chuẩn hóa “o”/“ơ”, “d”/“đ” trong một số context.
- **Slang / viết tắt:** Chưa có từ điển slang → chuẩn hóa (vd: “dc” → “được”, “ko” → “không”, “tl” → “trả lời”) hoặc map sang form chuẩn trước khi đưa vào model.
- **Emoji / biểu tượng:** Chỉ một số emoji trong keyword; chưa có bước map emoji → sentiment/emotion (vd: 😢→ sad, 🔥→ positive intensity).
- **Loại bỏ nhiễu:** Chưa loại bỏ hoặc replace reply dạng “@user”, hashtag #tag, ký tự lặp (“!!!!”, “????”), link đã remove nhưng còn placeholder.
- **Negation / đảo ngữ:** “không hay”, “chẳng tốt” chưa được đánh dấu rõ ràng (negation scope) cho model.
- **Sentence segmentation:** Comment dài nhiều câu; không tách câu → model nhận cả đoạn → có thể trung hòa sentiment (câu đầu dương, câu sau âm).

---

### c) Hạn chế rule-based và model đơn giản

- **Rule-based:** Phụ thuộc từ khóa; dễ bỏ sót từ mới, ẩn dụ, đa nghĩa (“sướng” trong “sướng quá” vs “sướng mắt”). Conflict giữa rule và model (rule override) có thể làm sai một số case model đúng.
- **Model đơn giản (sklearn):** TF-IDF + classifier không hiểu ngữ cảnh dài; không có representation câu → hạn chế với câu phức tạp.
- **Thiếu ensemble / confidence gating:** Chưa có cơ chế “khi confidence model thấp thì ưu tiên rule hoặc human review”; mọi kết quả đều được ghi thẳng.

---

# 3. ĐỀ XUẤT GIẢI PHÁP CẢI TIẾN (GÓC NGHIÊN CỨU)

## 3.1. Xử lý dữ liệu lớn

### a) Chiến lược lưu trữ thay thế / bổ sung MySQL

- **Phân tầng dữ liệu:**
  - **Hot:** MySQL – dữ liệu gần đây (vd 90 ngày), metrics dashboard, sentiment/emotion đã phân tích.
  - **Warm:** Có thể dùng MySQL partition hoặc bảng riêng – comment/video 3–12 tháng, aggregate theo tuần/tháng.
  - **Cold / archive:** Export sang Object Storage (S3/MinIO) dạng Parquet/JSON; hoặc Data Lake (Hudi/Iceberg) cho nghiên cứu, audit.
- **NoSQL bổ sung (tùy chọn):**
  - **MongoDB/Elasticsearch:** Lưu comment thô (text, metadata) và kết quả phân tích; phục vụ tìm kiếm và filter nhanh theo sentiment/emotion/keyword.
  - **Redis:** Cache metrics dashboard (views, sentiment stats) TTL 5–15 phút; cache job status để giảm DB read.
- **Tách dữ liệu thô và đã phân tích:**
  - Bảng `comments_raw`: id, video_id, author, content, published_at (chỉ thô).
  - Bảng `comment_analysis`: comment_id, sentiment, emotion, score, analyzed_at, model_version. Giảm kích thước bảng chính, dễ đổi schema phân tích.

### b) Batch / streaming

- **Batch:** Tăng batch size (vd 100–200 comment) cho Backend → AI Module; AI Module giữ batch 16–32 cho PhoBERT để tránh OOM. Bulk update DB (UPDATE ... WHERE id IN (...)) thay vì từng record.
- **Queue:** Dùng message queue (RabbitMQ/Kafka): Backend đẩy “comment_ids” hoặc text vào queue; AI workers consume và ghi kết quả; Backend hoặc job riêng cập nhật DB từ queue kết quả.
- **Streaming (hướng nghiên cứu):** Thu thập comment qua webhook (nếu có) hoặc poll YouTube API theo sự kiện → đẩy vào Kafka → pipeline sentiment real-time; phù hợp cho mở rộng “cảnh báo sớm” cho phụ huynh.

### c) Tách dữ liệu thô và dữ liệu đã phân tích

- Như trên: `comments_raw` + `comment_analysis`; có thể thêm `analysis_jobs` (job_id, range comment_id, status, created_at) để trace và replay.

---

## 3.2. Tiền xử lý NLP cho emotion/sentiment

### a) Chuẩn hóa từ vựng

- **Unicode:** Chuẩn hóa NFC; map một số ký tự lạ về bảng chữ Việt chuẩn.
- **Từ điển slang/viết tắt:** Xây bảng map (vd: “dc”→“được”, “ko”→“không”, “tl”→“trả lời”, “vk”→“vợ”, “ck”→“chồng”) áp dụng trước hoặc sau tokenize.
- **Đồng nhất từ:** Dùng underthesea hoặc từ điển đồng nghĩa để chuẩn hóa biến thể (“rất hay” / “cực hay” / “siêu hay” → cùng rep nếu cần).

### b) Xử lý tiếng lóng, viết tắt

- **Bước 1:** Slang dictionary replace (giữ lại form chuẩn để model học).
- **Bước 2:** Emoji → token đặc biệt hoặc từ (vd: ❤️→ “_positive_”, 😢→ “_sad_”) để model/rule dùng.
- **Bước 3:** Normalize lặp ký tự (“!!!!” → “!”) để giảm noise.

### c) Loại bỏ nhiễu

- Remove hoặc chuẩn hóa: @mention, #hashtag (có thể giữ dạng token), URL (đã có), số điện thoại, block ký tự không ngôn ngữ.
- Lọc comment quá ngắn (vd < 2 từ) hoặc toàn ký tự đặc biệt → đánh dấu “skip” hoặc “neutral”.

### d) Pipeline tiền xử lý gợi ý (thứ tự)

1. **Decode & normalize:** UTF-8, NFC, lowercase (nếu dùng cho sklearn; với PhoBERT có thể giữ hoa cho entity).
2. **Remove noise:** URL, email, @mention, #tag (hoặc replace bằng token).
3. **Slang & viết tắt:** Replace theo từ điển.
4. **Emoji:** Map sang token sentiment/emotion hoặc từ tương đương.
5. **Chuẩn hóa dấu & lặp:** Normalize dấu tiếng Việt; giảm lặp ký tự.
6. **Negation marking (optional):** Đánh dấu scope phủ định (“không X” → “NOT_X”) cho model hoặc rule.
7. **Sentence split (optional):** Tách câu với underthesea; phân tích từng câu rồi aggregate (max/weighted) cho cả comment.
8. **Tokenize:** PhoBERT tokenizer trực tiếp; sklearn thì dùng output bước 1–7 rồi TF-IDF.

Pipeline này có thể viết thành module `VietnameseCommentPreprocessor` và so sánh ablation (bỏ từng bước) để đo đóng góp từng bước → có thể viết vào báo cáo/paper.

---

# 4. ĐỀ XUẤT CHỨC NĂNG HỖ TRỢ PHỤ HUYNH (BẮT BUỘC)

**Lưu ý vai trò “con”:** Trong toàn bộ phần này, **“con” được hiểu là người xem (viewer)** trên YouTube — tức là con xem video, có thể để lại bình luận trên video của người khác, chứ **không** phải vai trò người sáng tạo nội dung (creator/channel owner). Phụ huynh theo dõi **nội dung con xem** và **cách con tương tác** (bình luận con viết) để hỗ trợ an toàn và wellbeing. Các chức năng dưới đây là đề xuất mở rộng cho bối cảnh “con = người xem”.

---

## 4.1. Đánh giá môi trường nội dung con xem

| Thành phần | Mô tả |
|------------|--------|
| **Mục tiêu** | Giúp phụ huynh biết **mức độ tích cực/tiêu cực của cộng đồng** xung quanh nội dung con xem. Phụ huynh đánh dấu các kênh hoặc video mà con thường xem; hệ thống phân tích sentiment/emotion của bình luận trên những video đó. |
| **Đầu vào** | (1) Danh sách kênh hoặc video mà phụ huynh cho là “con đang xem” (nhập URL hoặc chọn từ lịch sử đã đồng bộ); (2) Khoảng thời gian; (3) Dữ liệu comment đã phân tích trên các video đó. |
| **Đầu ra** | Chỉ số “môi trường”: ví dụ “Kênh/video con xem có khoảng X% bình luận tích cực, Y% tiêu cực”; “Cộng đồng xung quanh nội dung này: phần lớn vui vẻ / góp ý / có tỷ lệ công kích cao”; có thể kèm biểu đồ pie/bar. |
| **Giá trị thực tiễn** | Phụ huynh nhận diện con đang tiếp xúc với cộng đồng lành mạnh hay nhiều bình luận tiêu cực/độc hại; làm cơ sở để trò chuyện hoặc giới hạn nội dung. |
| **Ý nghĩa nghiên cứu** | Ứng dụng sentiment aggregation theo “content consumed” (nội dung được tiêu thụ); có thể nghiên cứu tương quan giữa loại nội dung và “độ lành mạnh” cộng đồng bình luận. |

---

## 4.2. Theo dõi xu hướng cảm xúc từ bình luận con viết (khi xem)

| Thành phần | Mô tả |
|------------|--------|
| **Mục tiêu** | Theo dõi **cảm xúc thể hiện qua chính bình luận con để lại** khi xem video (comment con viết trên video của người khác). Phụ huynh thấy xu hướng: con đang tích cực, trung tính hay tiêu cực khi tương tác. |
| **Đầu vào** | (1) Liên kết tài khoản “con” (vd tài khoản YouTube của con qua OAuth hoặc danh sách comment do phụ huynh/con cung cấp); (2) Khoảng thời gian (tuần/tháng); (3) Dữ liệu comment do con viết đã có sentiment/emotion và timestamp. |
| **Đầu ra** | Biểu đồ đường/bar: tỷ lệ positive/negative/neutral theo tuần từ **bình luận con viết**; tỷ lệ emotion (happy/sad/angry/…) theo tuần; có thể kèm số lượng comment. |
| **Giá trị thực tiễn** | Nhận diện giai đoạn con thể hiện nhiều cảm xúc tiêu cực hoặc buồn/giận qua bình luận; mở ra đối thoại kịp thời. |
| **Ý nghĩa nghiên cứu** | Sentiment time series từ “user-generated content” của chính người xem; có thể đánh giá tương quan với sự kiện (học tập, bạn bè) nếu có metadata. |

**Lưu ý kỹ thuật:** Việc lấy bình luận do “con” viết phụ thuộc YouTube API và quyền truy cập (vd OAuth của tài khoản con, hoặc parent nhập thủ công danh sách). Cần làm rõ consent và quyền riêng tư.

---

## 4.3. Cảnh báo sớm: môi trường độc hại hoặc bình luận con có dấu hiệu bất thường

| Thành phần | Mô tả |
|------------|--------|
| **Mục tiêu** | Cảnh báo trong hai trường hợp: (1) **Môi trường:** kênh/video con xem có tỷ lệ bình luận tiêu cực hoặc từ khóa nguy cơ cao; (2) **Bình luận của con:** bình luận con viết có từ khóa nhạy cảm hoặc sentiment/emotion bất thường (vd đột biến negative/angry). |
| **Đầu vào** | (1) Ngưỡng (vd % negative > 40% trong 7 ngày trên video con xem; hoặc % negative từ bình luận con > 50%); (2) Danh sách từ khóa nguy cơ (tự làm hại, bắt nạt, …) cấu hình được; (3) Dữ liệu comment (của video con xem và/hoặc của con) đã phân tích + thời gian. |
| **Đầu ra** | Cảnh báo (in-app + optional email/push): “Nội dung con xem tuần qua có nhiều bình luận tiêu cực (X%), cao hơn trung bình”; “Phát hiện từ khóa nhạy cảm trong bình luận con: …”; “Xu hướng bình luận của con tuần qua thiên tiêu cực”. |
| **Giá trị thực tiễn** | Hỗ trợ can thiệp sớm (trò chuyện, giới hạn nội dung, tìm hỗ trợ chuyên môn); không thay thế chuyên gia tâm lý. |
| **Ý nghĩa nghiên cứu** | Early warning system kép: “môi trường” + “hành vi người xem”; có thể nghiên cứu độ nhạy/độ đặc hiệu và false positive. |

---

## 4.4. Báo cáo trực quan cho phụ huynh (con = người xem)

| Thành phần | Mô tả |
|------------|--------|
| **Mục tiêu** | Báo cáo định kỳ (tuần/tháng) cho phụ huynh bằng ngôn ngữ đơn giản, ít thuật ngữ kỹ thuật, tập trung vào **nội dung con xem** và **cách con tương tác**. |
| **Đầu vào** | Dữ liệu sentiment/emotion đã aggregate: (1) theo kênh/video con xem (“môi trường”); (2) theo bình luận con viết (nếu có); (3) Thời gian; template báo cáo. |
| **Đầu ra** | PDF/trang web: “Tuần này, nội dung con xem có khoảng X% bình luận tích cực, Y% trung tính, Z% tiêu cực”; “Cảm xúc thường thấy trong cộng đồng đó: vui vẻ, góp ý, …”; “Bình luận con để lại: phần lớn tích cực/trung tính/…” (nếu có); “So với tuần trước: tăng/giảm …”; biểu đồ đơn giản (pie/bar). |
| **Giá trị thực tiễn** | Phụ huynh không cần hiểu “sentiment”, “emotion label”; dễ chia sẻ với chuyên gia nếu cần. |
| **Ý nghĩa nghiên cứu** | Human-centred design cho dashboard analytics trong bối cảnh “viewer”; có thể đánh giá mức độ hiểu và hài lòng của phụ huynh (survey). |

---

## 4.5. Gợi ý hành động cho phụ huynh (phù hợp khi con là người xem)

| Thành phần | Mô tả |
|------------|--------|
| **Mục tiêu** | Từ kết quả phân tích (môi trường con xem +/hoặc bình luận con viết), hệ thống đưa ra gợi ý hành động ngắn gọn, không chẩn đoán, **phù hợp với vai trò người xem**. |
| **Đầu vào** | Rule/template theo từng “pattern”: ví dụ “môi trường nội dung con xem có nhiều tiêu cực” → “Nên trò chuyện với con về loại nội dung và cộng đồng con tham gia”; “Bình luận con có xu hướng tiêu cực” → “Có thể hỏi con về trải nghiệm trên mạng, có điều gì khiến con khó chịu không”; “Xuất hiện từ khóa nhạy cảm” → “Cân nhắc trao đổi và tìm hỗ trợ chuyên môn nếu cần”. |
| **Đầu ra** | 1–3 gợi ý dạng bullet, kèm link tài liệu (vd hướng dẫn an toàn mạng, giới hạn thời gian xem, đường dây nóng). |
| **Giá trị thực tiễn** | Giảm bối rối “biết số liệu rồi làm gì”; tăng tính ứng dụng thực tế trong bối cảnh con là người xem. |
| **Ý nghĩa nghiên cứu** | Decision support dựa trên output AI cho use case “parent of viewer”; có thể đánh giá mức độ phù hợp và an toàn của gợi ý (expert review). |

---

# 5. ĐỊNH HƯỚNG MỞ RỘNG ĐỀ TÀI NGHIÊN CỨU

## 5.1. Project nên thiên về hướng nào?

- **AI ứng dụng:** Phù hợp – trọng tâm là pipeline NLP (sentiment/emotion) + tích hợp vào sản phẩm; có thể so sánh PhoBERT vs sklearn, thêm tiền xử lý, đánh giá độ chính xác.
- **Hệ thống giám sát hành vi:** Phù hợp nếu nhấn mạnh “theo dõi xu hướng + cảnh báo” cho phụ huynh; cần làm rõ khung đạo đức và quyền riêng tư (consent, phạm vi theo dõi).
- **Hỗ trợ tâm lý – giáo dục:** Phù hợp ở mức “công cụ hỗ trợ” (gợi ý, báo cáo); **không** nên định vị là công cụ chẩn đoán hay thay thế chuyên gia tâm lý.

**Gợi ý:** Kết hợp **AI ứng dụng** + **hệ thống hỗ trợ phụ huynh** (theo dõi xu hướng, cảnh báo, báo cáo, gợi ý hành động) sẽ vừa có đóng góp kỹ thuật vừa có ý nghĩa xã hội rõ ràng.

---

## 5.2. Có nên ứng dụng Deep Learning không?

**Có.** Hiện đã dùng PhoBERT (transformer); nên giữ và mở rộng:

- **Dùng cho:** (1) Sentiment 3 lớp; (2) Emotion 5 lớp; (3) (Tùy chọn) phát hiện toxicity/nguy cơ (binary hoặc multi-label).
- **So sánh với ML truyền thống:** So sánh PhoBERT (fine-tune) vs TF-IDF + SVM/Logistic/Naive Bayes trên cùng dataset comment YouTube tiếng Việt (accuracy, F1, thời gian inference, chi phí tài nguyên). Có thể thêm ablation: với/không tiền xử lý slang, với/không rule-based adjustment.
- **Mở rộng:** Multitask (sentiment + emotion trong một model), hoặc model riêng toxicity; có thể thử PhoBERT-small để giảm latency.

---

## 5.3. Gợi ý 1–2 hướng nghiên cứu có thể viết paper / báo cáo NCKH

1. **“Cải thiện phân tích sentiment và emotion cho bình luận YouTube tiếng Việt bằng tiền xử lý slang và mô hình PhoBERT”**  
   - Nội dung: Pipeline tiền xử lý (slang, emoji, negation) + fine-tune PhoBERT; so sánh với baseline (không tiền xử lý, sklearn); đánh giá trên dataset bình luận YouTube tiếng Việt (có thể tự gán nhãn hoặc dùng dataset công khai).  
   - Đóng góp: Phương pháp tiền xử lý phù hợp domain “comment mạng”; số liệu so sánh cho tiếng Việt.

2. **“Hệ thống theo dõi xu hướng cảm xúc và cảnh báo sớm cho phụ huynh dựa trên phân tích bình luận YouTube”**  
   - Nội dung: Kiến trúc hệ thống (thu thập → phân tích → aggregate theo thời gian → cảnh báo + báo cáo); cách xác định ngưỡng và từ khóa nhạy cảm; đánh giá usability với phụ huynh (survey, interview).  
   - Đóng góp: Ứng dụng sentiment/emotion vào wellbeing; cân bằng giữa lợi ích và quyền riêng tư/đạo đức.

---

# 6. KẾT LUẬN KHOA HỌC

## 6.1. Đánh giá tính mới – tính ứng dụng – tính khả thi

| Tiêu chí | Đánh giá | Giải thích ngắn |
|----------|----------|------------------|
| **Tính mới** | Trung bình–Khá | Kết hợp PhoBERT + rule-based + (đề xuất) tiền xử lý slang/emoji cho comment YouTube tiếng Việt chưa phổ biến trong báo cáo trong nước; hướng “hỗ trợ phụ huynh” dựa trên sentiment time series và cảnh báo là góc nhìn có thể làm mới. |
| **Tính ứng dụng** | Cao | Giải quyết nhu cầu creator (analytics, gợi ý nội dung) và mở rộng sang phụ huynh (theo dõi, cảnh báo, báo cáo); có thể triển khai thí điểm trong trường hoặc gia đình. |
| **Tính khả thi** | Cao | Công nghệ đã có (Spring Boot, Flask, PhoBERT/sklearn, React); cải tiến chủ yếu là mở rộng pipeline, lưu trữ và thêm module phụ huynh; nguồn lực sinh viên/nhóm nhỏ có thể thực hiện trong 1–2 học kỳ. |

---

## 6.2. Gợi ý cách đặt tên đề tài nghiên cứu khoa học

- **Hướng kỹ thuật:** *“Nghiên cứu cải thiện phân tích sentiment và emotion cho bình luận YouTube tiếng Việt bằng tiền xử lý ngôn ngữ mạng và mô hình PhoBERT”*.
- **Hướng ứng dụng:** *“Xây dựng hệ thống theo dõi xu hướng cảm xúc từ bình luận YouTube hỗ trợ phụ huynh”*.
- **Kết hợp:** *“Hệ thống phân tích cảm xúc bình luận YouTube tiếng Việt và ứng dụng hỗ trợ phụ huynh theo dõi trẻ”*.

---

## 6.3. Nhận xét: phù hợp cấp nào / phát triển sản phẩm

| Hướng | Nhận xét |
|-------|----------|
| **NCKH cấp khoa** | **Phù hợp.** Đủ yêu cầu: vấn đề rõ ràng (sentiment/emotion tiếng Việt, hỗ trợ phụ huynh), phương pháp (NLP + pipeline + hệ thống), đánh giá (độ chính xác, usability). Nên có dataset và so sánh baseline. |
| **NCKH cấp trường** | **Có thể đạt** nếu: (1) Có dataset gán nhãn (hoặc dùng dataset công khai) và so sánh nhiều phương pháp; (2) Có phần thử nghiệm với người dùng (phụ huynh/giáo viên); (3) Viết báo cáo/bài báo có cấu trúc chuẩn, trích dẫn đầy đủ. |
| **Startup / sản phẩm thực tế** | **Khả thi.** Sản phẩm hiện tại đã là MVP cho creator; thêm role “phụ huynh”, tính năng theo dõi + cảnh báo + báo cáo có thể là bản freemium hoặc B2B (trường học). Cần chú ý: chính sách bảo mật, consent, không quảng bá thay thế chuyên gia tâm lý. |

---

**Tóm tắt:** Hệ thống YouTube AI Analytics đã có nền tảng tốt (thu thập, phân tích sentiment/emotion, dashboard, batch job). Cần cải thiện hiệu năng (cache, queue, phân tầng dữ liệu), pipeline NLP (tiền xử lý slang/emoji/negation) và bổ sung module hỗ trợ phụ huynh (xu hướng, cảnh báo, báo cáo, gợi ý hành động). Đề tài phù hợp NCKH cấp khoa, có thể vươn lên cấp trường và có tiềm năng phát triển thành sản phẩm thực tế nếu bổ sung khung đạo đức và trải nghiệm người dùng.
