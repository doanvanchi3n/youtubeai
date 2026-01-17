# PHÂN TÍCH CHỨC NĂNG PROJECT YOUTUBE AI

**Người phân tích:** Hệ thống Review Tự động  
**Ngày:** 2024  
**Mục đích:** Tài liệu hướng dẫn đọc hiểu project và giải thích code

---

## 1. TỔNG QUAN PROJECT

### 1.1. Project này dùng để làm gì?

**YouTube AI Analytics** là hệ thống phân tích và gợi ý nội dung cho YouTube channels sử dụng AI. Hệ thống giúp:

- **Phân tích kênh YouTube**: Đồng bộ dữ liệu từ YouTube API (video, comments, analytics)
- **Phân tích cảm xúc bình luận**: Sử dụng AI (PhoBERT/scikit-learn) để phân loại sentiment và emotion
- **Gợi ý nội dung AI**: Tạo tiêu đề, mô tả, hashtags, topics cho video YouTube
- **Chatbot AI**: Trợ lý AI chuyên về YouTube content, có thể tư vấn và tạo nội dung
- **Thống kê và báo cáo**: Dashboard với biểu đồ, metrics, xu hướng

### 1.2. Kiến trúc hệ thống

```
Frontend (React + Vite)
    ↓ HTTP/REST
Backend (Spring Boot)
    ↓ HTTP/REST
AI Module (Python Flask)
    ↓ API calls
External Services (YouTube API, HuggingFace, Google Gemini, Google Trends)
```

**Các module chính:**
- **Frontend**: React UI, giao diện người dùng
- **Backend**: Spring Boot REST API, xử lý business logic, database
- **AI Module**: Python Flask service, xử lý AI/ML (sentiment, content generation, chatbot)

---

## 2. DANH SÁCH CÁC CHỨC NĂNG CHÍNH

### 2.1. Chức năng 1: Đồng bộ và Phân tích Kênh YouTube
- **Mục đích**: Lấy dữ liệu từ YouTube API và lưu vào database
- **Đầu vào**: URL kênh YouTube (channel URL)
- **Đầu ra**: Dữ liệu kênh, video, comments đã được lưu vào database

### 2.2. Chức năng 2: Phân tích Sentiment & Emotion
- **Mục đích**: Phân loại cảm xúc của bình luận (tích cực/tiêu cực/trung lập, vui/buồn/công kích/góp ý/yêu thích)
- **Đầu vào**: Text bình luận hoặc danh sách bình luận
- **Đầu ra**: Sentiment label, emotion label, confidence score

### 2.3. Chức năng 3: Tạo Gợi ý Nội Dung AI (AI Suggestions)
- **Mục đích**: Tạo tiêu đề, mô tả SEO, hashtags, topics, trends cho video YouTube
- **Đầu vào**: Keywords, description, channel context (optional)
- **Đầu ra**: Titles (10 suggestions), description (300-600 chars), hashtags (20 tags), topics, trends

### 2.4. Chức năng 4: AI Chatbot
- **Mục đích**: Chatbot chuyên về YouTube content, tư vấn và tạo nội dung
- **Đầu vào**: Messages (conversation history), context (keywords, description)
- **Đầu ra**: Reply từ AI (text response)

### 2.5. Chức năng 5: Dashboard & Analytics
- **Mục đích**: Hiển thị thống kê, biểu đồ, metrics của kênh
- **Đầu vào**: Channel ID, date range (optional)
- **Đầu ra**: Metrics (views, subscribers, engagement), charts, top videos

### 2.6. Chức năng 6: Community Insights
- **Mục đích**: Phân tích cộng đồng (topics, keywords, sentiment distribution)
- **Đầu vào**: Channel ID
- **Đầu ra**: Topics, keywords, sentiment stats, topic suggestions

### 2.7. Chức năng 7: Authentication & Authorization
- **Mục đích**: Xác thực người dùng, quản lý session, phân quyền
- **Đầu vào**: Email/password (Login), User info (Register), Google token (Google OAuth)
- **Đầu ra**: JWT token, User info

### 2.8. Chức năng 8: Scheduled Jobs & Batch Processing
- **Mục đích**: Xử lý các tác vụ định kỳ và batch processing cho AI analysis
- **Đầu vào**: Pending jobs, unanalyzed comments, channels cần sync
- **Đầu ra**: Processed jobs, analyzed comments, synced channels

---

## 3. PHÂN TÍCH CHI TIẾT TỪNG CHỨC NĂNG

---

### 3.1. CHỨC NĂNG 1: ĐỒNG BỘ VÀ PHÂN TÍCH KÊNH YOUTUBE

#### 3.1.1. Điểm bắt đầu

**Người dùng kích hoạt:**
- Frontend: User nhập URL kênh YouTube vào form → Click "Phân tích"
- File khởi đầu: [`frontend/src/pages/Dashboard/Dashboard.jsx`](frontend/src/pages/Dashboard/Dashboard.jsx)

**API endpoint được gọi:**
- `POST /api/youtube/analyze`
- Controller: [`backend/src/main/java/com/example/backend/controller/ChannelController.java`](backend/src/main/java/com/example/backend/controller/ChannelController.java)
- Method: `analyzeUrl()`

#### 3.1.2. Luồng xử lý bên trong

**Bước 1: Frontend gửi request**
- File: [`frontend/src/services/dashboardService.js`](frontend/src/services/dashboardService.js)
- Function: `analyzeUrl(url)` → Gọi `POST /api/youtube/analyze`

**Bước 2: Backend Controller nhận request**
- File: [`backend/src/main/java/com/example/backend/controller/ChannelController.java`](backend/src/main/java/com/example/backend/controller/ChannelController.java)
- Method: `analyzeUrl()` → Validate token → Gọi `AnalyzeJobService.createJob()`

**Bước 3: Tạo AnalyzeJob (Async Job)**
- File: [`backend/src/main/java/com/example/backend/service/AnalyzeJobService.java`](backend/src/main/java/com/example/backend/service/AnalyzeJobService.java)
- Method: `createJob()` → Tạo job với status PENDING → Lưu vào database

**Bước 5: Parse URL và lấy thông tin kênh**
- File: [`backend/src/main/java/com/example/backend/util/YouTubeUrlParser.java`](backend/src/main/java/com/example/backend/util/YouTubeUrlParser.java)
- Method: `parse(url)` → Trả về `ParsedUrl` (type: CHANNEL/CHANNEL_HANDLE/CHANNEL_USERNAME/VIDEO)

**Bước 6: Gọi YouTube API để lấy thông tin kênh**
- File: [`backend/src/main/java/com/example/backend/service/YouTubeApiService.java`](backend/src/main/java/com/example/backend/service/YouTubeApiService.java)
- Method: `getChannelById()` / `getChannelByHandle()` / `getChannelByUsername()` → Trả về `YouTubeChannelInfo`

**Bước 7: Lưu/Update Channel vào database**
- File: [`backend/src/main/java/com/example/backend/service/YouTubeAnalysisService.java`](backend/src/main/java/com/example/backend/service/YouTubeAnalysisService.java)
- Method: `upsertChannel()` → Lưu hoặc update channel trong database

**Bước 8: Lấy danh sách video từ kênh**
- File: [`backend/src/main/java/com/example/backend/service/YouTubeAnalysisService.java`](backend/src/main/java/com/example/backend/service/YouTubeAnalysisService.java)
- Method: `fetchChannelVideos()` → Gọi `YouTubeApiService.getAllVideosFromUploads()` hoặc `getVideosByChannel()`

**Bước 9: Đồng bộ dữ liệu video và comments**
- File: [`backend/src/main/java/com/example/backend/service/YouTubeAnalysisService.java`](backend/src/main/java/com/example/backend/service/YouTubeAnalysisService.java)
- Method: `syncChannelData()` → 
  - `storeVideos()`: Lưu video vào database
  - `storeComments()`: Lấy comments từ YouTube API và lưu vào database (nếu `includeComments = true`)
  - `updateAnalytics()`: Cập nhật analytics theo ngày

**Bước 10: Trả về response**
- Response: `AnalyzeUrlResponse` với channel ID, status, message

#### 3.1.3. Giải thích từng hàm quan trọng

**1. `ChannelController.analyzeUrl()`**
- **Mục đích**: Entry point cho API endpoint `/api/youtube/analyze`
- **Tham số**: `@RequestBody AnalyzeUrlRequest` (chứa URL), `@RequestHeader Authorization` (JWT token)
- **Giá trị trả về**: `ResponseEntity<AnalyzeJobResponse>`
- **Vai trò**: Validate token, tạo job, trả về job ID để frontend có thể poll status

**2. `YouTubeUrlParser.parse(url)`**
- **Mục đích**: Parse URL YouTube thành loại và ID
- **Tham số**: `String url` (ví dụ: "https://www.youtube.com/@channel" hoặc "https://www.youtube.com/channel/UC...")
- **Giá trị trả về**: `ParsedUrl` (type, id)
- **Vai trò**: Xác định loại URL để gọi đúng API method

**3. `YouTubeApiService.getChannelById(channelId)`**
- **Mục đích**: Gọi YouTube Data API v3 để lấy thông tin kênh
- **Tham số**: `String channelId`
- **Giá trị trả về**: `YouTubeChannelInfo` (title, description, subscriberCount, viewCount, uploadsPlaylistId, ...)
- **Vai trò**: Lấy metadata của kênh từ YouTube

**4. `YouTubeAnalysisService.upsertChannel(user, channelInfo)`**
- **Mục đích**: Lưu hoặc update channel trong database
- **Tham số**: `User user`, `YouTubeChannelInfo channelInfo`
- **Giá trị trả về**: `Channel` (entity đã lưu)
- **Vai trò**: Đảm bảo channel được lưu với user đúng, update nếu đã tồn tại

**5. `YouTubeAnalysisService.syncChannelData(channel, channelInfo, videos, includeComments)`**
- **Mục đích**: Đồng bộ toàn bộ dữ liệu (video, comments, analytics) vào database
- **Tham số**: `Channel channel`, `YouTubeChannelInfo channelInfo`, `List<YouTubeVideoInfo> videos`, `boolean includeComments`
- **Giá trị trả về**: `void`
- **Vai trò**: Orchestrate việc lưu video, comments, và update analytics

**6. `YouTubeAnalysisService.storeVideos(channel, videos)`**
- **Mục đích**: Lưu danh sách video vào database
- **Tham số**: `Channel channel`, `List<YouTubeVideoInfo> videos`
- **Giá trị trả về**: `List<Video>` (entities đã lưu)
- **Vai trò**: Xóa video cũ (nếu có), lưu video mới, đảm bảo không duplicate

**7. `YouTubeAnalysisService.storeComments(video, comments)`**
- **Mục đích**: Lưu comments của video vào database
- **Tham số**: `Video video`, `List<YouTubeCommentInfo> comments`
- **Giá trị trả về**: `void`
- **Vai trò**: Lưu comments với `is_analyzed = false` để sau này AI Module phân tích

#### 3.1.4. Kết thúc chức năng

- **Kết quả cuối cùng**: 
  - Channel, videos, comments đã được lưu vào database
  - Job status = SUCCESS (hoặc COMPLETED)
  - Frontend có thể query dữ liệu để hiển thị

- **Hệ thống phản hồi**:
  - Trả về `AnalyzeJobResponse` với job ID
  - Frontend poll `GET /api/youtube/analyze/{jobId}` để check status
  - Khi status = SUCCESS, frontend có thể load dashboard

#### 3.1.5. Sơ đồ luồng

```
User nhập URL kênh
    ↓
Frontend: Dashboard.jsx → dashboardService.analyzeUrl(url)
    ↓
POST /api/youtube/analyze
    ↓
ChannelController.analyzeUrl()
    ↓
AnalyzeJobService.createJob() → Tạo job PENDING
    ↓
YouTubeAnalysisService.analyzeUrl()
    ↓
YouTubeUrlParser.parse(url) → Xác định loại URL
    ↓
YouTubeApiService.getChannelById/handle/username() → Lấy channel info
    ↓
YouTubeAnalysisService.upsertChannel() → Lưu channel vào DB
    ↓
YouTubeApiService.getAllVideosFromUploads() → Lấy danh sách video
    ↓
YouTubeAnalysisService.syncChannelData()
    ├─→ storeVideos() → Lưu video vào DB
    ├─→ storeComments() → Lấy comments từ YouTube API → Lưu vào DB
    └─→ updateAnalytics() → Cập nhật analytics
    ↓
Trả về AnalyzeUrlResponse (success)
```

---

### 3.2. CHỨC NĂNG 2: PHÂN TÍCH SENTIMENT & EMOTION

#### 3.2.1. Điểm bắt đầu

**Người dùng kích hoạt:**
- Frontend: User vào trang "Comment Sentiment" → Hệ thống tự động phân tích comments chưa được phân tích
- Hoặc: User gửi text để phân tích real-time

**API endpoint được gọi:**
- `POST /api/ai/sentiment/analyze-sentiment` (single text)
- `POST /api/ai/sentiment/analyze-sentiment/batch` (multiple texts)
- AI Module: [`ai_module/app/api/sentiment.py`](ai_module/app/api/sentiment.py)

#### 3.2.2. Luồng xử lý bên trong

**Bước 1: Backend nhận request phân tích comments**
- File: [`backend/src/main/java/com/example/backend/controller/CommentController.java`](backend/src/main/java/com/example/backend/controller/CommentController.java)
- Method: `getSentimentStats()` → Lấy comments chưa phân tích → Gọi AI Module

**Bước 2: Backend gọi AI Module**
- File: [`backend/src/main/java/com/example/backend/service/SentimentAnalysisService.java`](backend/src/main/java/com/example/backend/service/SentimentAnalysisService.java) (nếu có)
- Hoặc: Gọi trực tiếp `POST http://localhost:5000/api/analyze-sentiment/batch`

**Bước 3: AI Module nhận request**
- File: [`ai_module/app/api/sentiment.py`](ai_module/app/api/sentiment.py)
- Endpoint: `/analyze-sentiment` hoặc `/analyze-sentiment/batch`
- Function: `analyze_sentiment()` hoặc `analyze_sentiment_batch()`

**Bước 4: SentimentService xử lý**
- File: [`ai_module/app/services/sentiment_service.py`](ai_module/app/services/sentiment_service.py)
- Method: `analyze(text)` hoặc `analyze_batch(texts)`

**Bước 5: Chọn model (PhoBERT hoặc scikit-learn)**
- File: [`ai_module/app/services/sentiment_service.py`](ai_module/app/services/sentiment_service.py)
- Method: `_load_phobert_models()` → Load PhoBERT models nếu có
- Fallback: Sử dụng scikit-learn models nếu PhoBERT không có

**Bước 6: Preprocessing text**
- File: [`ai_module/app/utils/text_processor.py`](ai_module/app/utils/text_processor.py)
- Method: `preprocess(text)` → Normalize, remove special chars, lowercase

**Bước 7: Phân tích Sentiment**
- File: [`ai_module/app/services/sentiment_service.py`](ai_module/app/services/sentiment_service.py)
- Method: `_analyze_sentiment_phobert(text)` hoặc `_analyze_sentiment_sklearn(text)`
- Output: Sentiment label (positive/negative/neutral), confidence

**Bước 8: Phân tích Emotion**
- File: [`ai_module/app/services/sentiment_service.py`](ai_module/app/services/sentiment_service.py)
- Method: `_analyze_emotion_phobert(text)` hoặc `_analyze_emotion_sklearn(text)`
- Output: Emotion label (happy/sad/angry/suggestion/love), confidence

**Bước 9: Trả về kết quả**
- Response: `{sentiment: "positive", emotion: "happy", confidence: 0.95}`

**Bước 10: Backend cập nhật database**
- File: [`backend/src/main/java/com/example/backend/service/CommentService.java`](backend/src/main/java/com/example/backend/service/CommentService.java) (nếu có)
- Update `Comment` entity: `sentiment`, `emotion`, `is_analyzed = true`

#### 3.2.3. Giải thích từng hàm quan trọng

**1. `SentimentService.analyze(text)`**
- **Mục đích**: Phân tích sentiment và emotion của một text
- **Tham số**: `str text` (bình luận)
- **Giá trị trả về**: `Dict[str, Any]` với keys: `sentiment`, `emotion`, `confidence`
- **Vai trò**: Entry point cho sentiment analysis, tự động chọn model (PhoBERT hoặc scikit-learn)

**2. `SentimentService._analyze_sentiment_phobert(text)`**
- **Mục đích**: Phân tích sentiment sử dụng PhoBERT model
- **Tham số**: `str text`
- **Giá trị trả về**: `str` (positive/negative/neutral)
- **Vai trò**: Sử dụng transformer model để có độ chính xác cao hơn

**3. `SentimentService._analyze_emotion_phobert(text)`**
- **Mục đích**: Phân tích emotion sử dụng PhoBERT model
- **Tham số**: `str text`
- **Giá trị trả về**: `str` (happy/sad/angry/suggestion/love)
- **Vai trò**: Phân loại cảm xúc chi tiết hơn sentiment

**4. `TextProcessor.preprocess(text)`**
- **Mục đích**: Chuẩn hóa text trước khi phân tích
- **Tham số**: `str text`
- **Giá trị trả về**: `str` (text đã được normalize)
- **Vai trò**: Đảm bảo text format nhất quán, loại bỏ noise

#### 3.2.4. Kết thúc chức năng

- **Kết quả cuối cùng**: 
  - Comments đã được phân tích và cập nhật trong database
  - Frontend có thể hiển thị sentiment distribution, emotion chart

- **Hệ thống phản hồi**:
  - Trả về JSON với sentiment, emotion, confidence
  - Frontend hiển thị biểu đồ, thống kê

#### 3.2.5. Sơ đồ luồng

```
User vào trang Comment Sentiment
    ↓
Frontend: CommentSentiment.jsx → Load comments
    ↓
Backend: CommentController.getSentimentStats()
    ↓
Lấy comments chưa phân tích (is_analyzed = false)
    ↓
POST http://localhost:5000/api/analyze-sentiment/batch
    ↓
AI Module: sentiment.py → analyze_sentiment_batch()
    ↓
SentimentService.analyze_batch(texts)
    ↓
Với mỗi text:
    ├─→ TextProcessor.preprocess(text)
    ├─→ SentimentService._analyze_sentiment_phobert/sklearn(text)
    └─→ SentimentService._analyze_emotion_phobert/sklearn(text)
    ↓
Trả về results: [{sentiment, emotion, confidence}, ...]
    ↓
Backend: Update Comment entities (sentiment, emotion, is_analyzed = true)
    ↓
Frontend: Hiển thị biểu đồ, thống kê
```

---

### 3.3. CHỨC NĂNG 3: TẠO GỢI Ý NỘI DUNG AI (AI SUGGESTIONS)

#### 3.3.1. Điểm bắt đầu

**Người dùng kích hoạt:**
- Frontend: User vào trang "AI Suggestion" → Nhập keywords/description → Click "Tạo gợi ý"
- File: [`frontend/src/pages/AISuggestion/AISuggestion.jsx`](frontend/src/pages/AISuggestion/AISuggestion.jsx)

**API endpoint được gọi:**
- `POST /api/ai/suggestions`
- Controller: [`backend/src/main/java/com/example/backend/controller/AIController.java`](backend/src/main/java/com/example/backend/controller/AIController.java)
- Method: `generateSuggestions()`

#### 3.3.2. Luồng xử lý bên trong

**Bước 1: Frontend gửi request**
- File: [`frontend/src/services/aiService.js`](frontend/src/services/aiService.js)
- Function: `generateSuggestions(payload)` → Gọi `POST /api/ai/suggestions`

**Bước 2: Backend Controller nhận request**
- File: [`backend/src/main/java/com/example/backend/controller/AIController.java`](backend/src/main/java/com/example/backend/controller/AIController.java)
- Method: `generateSuggestions()` → Validate token → Gọi `AIService.generateSuggestions()`

**Bước 3: AIService xử lý request**
- File: [`backend/src/main/java/com/example/backend/service/AIService.java`](backend/src/main/java/com/example/backend/service/AIService.java)
- Method: `generateSuggestions(userId, request)`
  - `sanitizeKeywords()`: Loại bỏ duplicate, giới hạn 25 keywords
  - `resolveChannelIfNeeded()`: Lấy channel context nếu `useChannelContext = true`
  - `loadVideoContext()`: Lấy video context từ cache hoặc YouTube API
  - `buildPayload()`: Tạo payload cho AI Module
  - `callAiModule()`: Gọi AI Module endpoint

**Bước 4: AI Module nhận request**
- File: [`ai_module/app/api/content.py`](ai_module/app/api/content.py)
- Endpoint: `/generate-suggestions`
- Function: `generate_suggestions()` → Gọi `ContentService.generate_suggestions()`

**Bước 5: ContentService xử lý**
- File: [`ai_module/app/services/content_service.py`](ai_module/app/services/content_service.py)
- Method: `generate_suggestions(data)`
  - Extract keywords từ description nếu không có keywords
  - `_fetch_google_trends()`: Lấy Google Trends
  - `_fetch_youtube_trends()`: Lấy YouTube autocomplete trends
  - `_generate_titles()`: Tạo tiêu đề (10 suggestions)
  - `_generate_description()`: Tạo mô tả SEO (300-600 chars)
  - `_generate_hashtags()`: Tạo hashtags (20 tags)
  - `_generate_topics()`: Tạo topics

**Bước 6: Generate Titles**
- File: [`ai_module/app/services/content_service.py`](ai_module/app/services/content_service.py)
- Method: `_generate_titles(keywords, description, context)`
  - Build prompt cho HuggingFace
  - `_call_huggingface()`: Gọi HuggingFace API
  - Parse response → Trả về 10 titles

**Bước 7: Generate Description**
- File: [`ai_module/app/services/content_service.py`](ai_module/app/services/content_service.py)
- Method: `_generate_description(keywords, description, context)`
  - Build prompt cho HuggingFace
  - `_call_huggingface()`: Gọi HuggingFace API
  - Parse response → Trả về description 300-600 chars

**Bước 8: Generate Hashtags**
- File: [`ai_module/app/services/content_service.py`](ai_module/app/services/content_service.py)
- Method: `_generate_hashtags(keywords, description, context)`
  - Combine keywords, trends, context
  - Generate 20 hashtags

**Bước 9: Generate Topics & Trends**
- File: [`ai_module/app/services/content_service.py`](ai_module/app/services/content_service.py)
- Method: `_fetch_google_trends()`, `_fetch_youtube_trends()`
  - Gọi Google Trends API (pytrends)
  - Gọi YouTube Autocomplete API
  - Trả về trending topics

**Bước 10: Trả về response**
- AI Module trả về JSON: `{titles, description, hashtags, topics, trends, generatedAt}`
- Backend transform thành `AISuggestionResponse`
- Frontend hiển thị kết quả

#### 3.3.3. Giải thích từng hàm quan trọng

**1. `AIService.generateSuggestions(userId, request)`**
- **Mục đích**: Orchestrate việc tạo AI suggestions
- **Tham số**: `Long userId`, `AISuggestionRequest request` (keywords, description, useChannelContext, ...)
- **Giá trị trả về**: `AISuggestionResponse` (titles, description, hashtags, topics, trends, context)
- **Vai trò**: Validate input, load context, gọi AI Module, transform response

**2. `AIService.loadVideoContext(channel, request)`**
- **Mục đích**: Lấy video context từ cache hoặc YouTube API
- **Tham số**: `Channel channel`, `AISuggestionRequest request`
- **Giá trị trả về**: `List<YouTubeVideoInfo>` (tối đa 15 videos)
- **Vai trò**: Cung cấp context về video của kênh để AI tạo suggestions phù hợp hơn

**3. `ContentService.generate_suggestions(data)`**
- **Mục đích**: Tạo AI suggestions (titles, description, hashtags, topics, trends)
- **Tham số**: `Dict[str, Any] data` (keywords, description, channel, videos, locale)
- **Giá trị trả về**: `Dict[str, Any]` với keys: titles, description, hashtags, topics, trends, generatedAt
- **Vai trò**: Entry point cho AI content generation trong AI Module

**4. `ContentService._generate_titles(keywords, description, context)`**
- **Mục đích**: Tạo 10 tiêu đề video YouTube
- **Tham số**: `List[str] keywords`, `str description`, `Dict context`
- **Giá trị trả về**: `List[str]` (10 titles)
- **Vai trò**: Sử dụng HuggingFace API để generate titles, có fallback nếu API fail

**5. `ContentService._call_huggingface(prompt, max_length)`**
- **Mục đích**: Gọi HuggingFace Inference API để generate text
- **Tham số**: `str prompt`, `int max_length`
- **Giá trị trả về**: `str` (generated text)
- **Vai trò**: Core function để gọi AI model, có retry logic và fallback models

**6. `ContentService._fetch_google_trends(keywords)`**
- **Mục đích**: Lấy Google Trends data
- **Tham số**: `List[str] keywords`
- **Giá trị trả về**: `List[str]` (trending topics)
- **Vai trò**: Cung cấp trending data để suggestions phù hợp với xu hướng

#### 3.3.4. Kết thúc chức năng

- **Kết quả cuối cùng**: 
  - 10 titles, 1 description, 20 hashtags, topics, trends
  - Context snapshot (keywords, channel, videos)

- **Hệ thống phản hồi**:
  - Trả về `AISuggestionResponse` JSON
  - Frontend hiển thị kết quả trong UI, user có thể copy/sử dụng

#### 3.3.5. Sơ đồ luồng

```
User nhập keywords/description → Click "Tạo gợi ý"
    ↓
Frontend: AISuggestion.jsx → aiService.generateSuggestions(payload)
    ↓
POST /api/ai/suggestions
    ↓
AIController.generateSuggestions() → Validate token
    ↓
AIService.generateSuggestions(userId, request)
    ├─→ sanitizeKeywords() → Loại bỏ duplicate
    ├─→ resolveChannelIfNeeded() → Lấy channel nếu cần
    ├─→ loadVideoContext() → Lấy video context (cache hoặc YouTube API)
    └─→ buildPayload() → Tạo payload
    ↓
POST http://localhost:5000/api/generate-suggestions
    ↓
AI Module: content.py → generate_suggestions()
    ↓
ContentService.generate_suggestions(data)
    ├─→ _fetch_google_trends() → Lấy Google Trends
    ├─→ _fetch_youtube_trends() → Lấy YouTube trends
    ├─→ _generate_titles() → Gọi HuggingFace API → 10 titles
    ├─→ _generate_description() → Gọi HuggingFace API → Description
    ├─→ _generate_hashtags() → Generate 20 hashtags
    └─→ _generate_topics() → Generate topics
    ↓
Trả về JSON: {titles, description, hashtags, topics, trends}
    ↓
AIService.buildResponse() → Transform thành AISuggestionResponse
    ↓
Frontend: Hiển thị kết quả trong UI
```

---

### 3.4. CHỨC NĂNG 4: AI CHATBOT

#### 3.4.1. Điểm bắt đầu

**Người dùng kích hoạt:**
- Frontend: User vào trang "AI Suggestion" → Tab "AI Chat Bot" → Nhập message → Click "Gửi"
- File: [`frontend/src/pages/AISuggestion/AISuggestion.jsx`](frontend/src/pages/AISuggestion/AISuggestion.jsx)

**API endpoint được gọi:**
- `POST /api/ai/chat`
- Controller: [`backend/src/main/java/com/example/backend/controller/AIController.java`](backend/src/main/java/com/example/backend/controller/AIController.java)
- Method: `chat()`

#### 3.4.2. Luồng xử lý bên trong

**Bước 1: Frontend gửi request**
- File: [`frontend/src/services/aiService.js`](frontend/src/services/aiService.js)
- Function: `chat(messages, context)` → Gọi `POST /api/ai/chat`

**Bước 2: Backend Controller nhận request**
- File: [`backend/src/main/java/com/example/backend/controller/AIController.java`](backend/src/main/java/com/example/backend/controller/AIController.java)
- Method: `chat()` → Validate token → Gọi `AIService.chat()`

**Bước 3: AIService proxy request**
- File: [`backend/src/main/java/com/example/backend/service/AIService.java`](backend/src/main/java/com/example/backend/service/AIService.java)
- Method: `chat(userId, request)` → Gọi `POST http://localhost:5000/api/chat`

**Bước 4: AI Module nhận request**
- File: [`ai_module/app/api/chat.py`](ai_module/app/api/chat.py)
- Endpoint: `/chat`
- Function: `chat()` → Validate messages → Gọi `ChatService.generate_chat_reply()`

**Bước 5: ChatService xử lý**
- File: [`ai_module/app/services/chat_service.py`](ai_module/app/services/chat_service.py)
- Method: `generate_chat_reply(messages, context)`
  - Build conversation với system prompt
  - `_build_context_message()`: Thêm context (keywords, description) vào conversation
  - `_call_gemini_chat()`: Gọi Google Gemini API (ưu tiên)
  - Fallback: `_call_huggingface_chat()` nếu Gemini fail
  - `_should_call_tool()`: Kiểm tra xem có cần gọi tool (generate titles/description/hashtags) không
  - `_handle_tool_call()`: Gọi tool nếu cần

**Bước 6: Gọi Google Gemini API**
- File: [`ai_module/app/services/chat_service.py`](ai_module/app/services/chat_service.py)
- Method: `_call_gemini_chat(conversation)`
  - Convert conversation format → Gemini format
  - `genai.GenerativeModel.start_chat()` → Start chat session với history
  - `chat.send_message()` → Gửi message và nhận response

**Bước 7: Fallback to HuggingFace (nếu Gemini fail)**
- File: [`ai_module/app/services/chat_service.py`](ai_module/app/services/chat_service.py)
- Method: `_call_huggingface_chat()` (trong ContentService)
  - Format messages thành prompt
  - Gọi HuggingFace API
  - Parse response

**Bước 8: Tool Calling (nếu AI yêu cầu)**
- File: [`ai_module/app/services/chat_service.py`](ai_module/app/services/chat_service.py)
- Method: `_should_call_tool(reply)` → Pattern matching để detect tool request
- Method: `_handle_tool_call(reply, context)` → Gọi `ContentService` methods (generate_titles, generate_description, generate_hashtags)

**Bước 9: Trả về response**
- Response: `{reply: "..."}`

**Bước 10: Frontend cập nhật conversation**
- Frontend: Thêm user message và assistant reply vào `messages` state
- Lưu vào localStorage để persist conversation history

#### 3.4.3. Giải thích từng hàm quan trọng

**1. `ChatService.generate_chat_reply(messages, context)`**
- **Mục đích**: Generate reply từ AI chatbot
- **Tham số**: `List[Dict[str, str]] messages` (conversation history), `Dict context` (keywords, description, locale)
- **Giá trị trả về**: `Dict[str, Any]` với key `reply` (text response)
- **Vai trò**: Orchestrate việc gọi AI (Gemini/HuggingFace), handle tool calling, build conversation

**2. `ChatService._call_gemini_chat(conversation)`**
- **Mục đích**: Gọi Google Gemini API để generate reply
- **Tham số**: `List[Dict[str, str]] conversation` (với system prompt và history)
- **Giá trị trả về**: `str` (reply text)
- **Vai trò**: Sử dụng Gemini model (gemini-2.5-flash-lite) để có conversation quality tốt

**3. `ChatService._build_context_message(context)`**
- **Mục đích**: Build context message từ keywords và description
- **Tham số**: `Dict context` (keywords, description, locale)
- **Giá trị trả về**: `str` (context message) hoặc `None`
- **Vai trò**: Cung cấp context cho AI để reply phù hợp với user's intent

**4. `ChatService._should_call_tool(reply)`**
- **Mục đích**: Kiểm tra xem AI reply có yêu cầu gọi tool không
- **Tham số**: `str reply` (AI reply text)
- **Giá trị trả về**: `bool`
- **Vai trò**: Simple pattern matching để detect intent (ví dụ: "tạo tiêu đề", "generate titles")

**5. `ChatService._handle_tool_call(reply, context)`**
- **Mục đích**: Gọi tool function (generate titles/description/hashtags) và trả về kết quả
- **Tham số**: `str reply`, `Dict context`
- **Giá trị trả về**: `str` (tool result) hoặc `None`
- **Vai trò**: Execute tool và format result để AI có thể trình bày lại cho user

#### 3.4.4. Kết thúc chức năng

- **Kết quả cuối cùng**: 
  - AI reply được trả về
  - Conversation history được cập nhật (frontend + localStorage)

- **Hệ thống phản hồi**:
  - Trả về `AIChatResponse` với `reply` field
  - Frontend hiển thị reply trong chat UI

#### 3.4.5. Sơ đồ luồng

```
User nhập message → Click "Gửi"
    ↓
Frontend: AISuggestion.jsx → handleSendMessage()
    ↓
aiService.chat(messages, context)
    ↓
POST /api/ai/chat
    ↓
AIController.chat() → Validate token
    ↓
AIService.chat(userId, request) → Proxy to AI Module
    ↓
POST http://localhost:5000/api/chat
    ↓
AI Module: chat.py → chat()
    ↓
ChatService.generate_chat_reply(messages, context)
    ├─→ Build conversation với system prompt
    ├─→ _build_context_message() → Thêm context
    ├─→ _call_gemini_chat() → Gọi Gemini API (ưu tiên)
    │   └─→ Fallback: _call_huggingface_chat() nếu Gemini fail
    ├─→ _should_call_tool() → Kiểm tra tool request
    └─→ _handle_tool_call() → Gọi tool nếu cần (generate_titles/description/hashtags)
    ↓
Trả về {reply: "..."}
    ↓
Frontend: Cập nhật messages state → Lưu vào localStorage
    ↓
Hiển thị reply trong chat UI
```

---

### 3.5. CHỨC NĂNG 5: DASHBOARD & ANALYTICS

#### 3.5.1. Điểm bắt đầu

**Người dùng kích hoạt:**
- Frontend: User vào trang "Dashboard" (trang chủ)
- File: [`frontend/src/pages/Dashboard/Dashboard.jsx`](frontend/src/pages/Dashboard/Dashboard.jsx)

**API endpoints được gọi:**
- `GET /api/dashboard/metrics`
- `GET /api/dashboard/trends`
- `GET /api/dashboard/top-videos`
- `GET /api/dashboard/sentiment`
- Controller: [`backend/src/main/java/com/example/backend/controller/DashboardController.java`](backend/src/main/java/com/example/backend/controller/DashboardController.java)

#### 3.5.2. Luồng xử lý bên trong

**Bước 1: Frontend load Dashboard**
- File: [`frontend/src/pages/Dashboard/Dashboard.jsx`](frontend/src/pages/Dashboard/Dashboard.jsx)
- `useEffect()` → Gọi các API endpoints

**Bước 2: Backend Controller nhận requests**
- File: [`backend/src/main/java/com/example/backend/controller/DashboardController.java`](backend/src/main/java/com/example/backend/controller/DashboardController.java)
- Methods: `getMetrics()`, `getTrends()`, `getTopVideos()`, `getSentiment()`

**Bước 3: DashboardService xử lý**
- File: [`backend/src/main/java/com/example/backend/service/DashboardService.java`](backend/src/main/java/com/example/backend/service/DashboardService.java)
- Methods:
  - `getMetrics(userId, channelId)` → Lấy metrics (views, subscribers, engagement)
  - `getTrends(userId, channelId, days)` → Lấy trends (view growth, subscriber growth)
  - `getTopVideos(userId, channelId, limit)` → Lấy top videos
  - `getSentiment(userId, channelId)` → Lấy sentiment stats

**Bước 4: Query database**
- Repositories: `ChannelRepository`, `VideoRepository`, `AnalyticsRepository`, `CommentRepository`
- Query data từ database

**Bước 5: Tính toán metrics**
- Aggregate data: Sum views, count videos, calculate engagement rate, etc.

**Bước 6: Trả về response**
- Response: JSON với metrics, trends, top videos, sentiment stats

**Bước 7: Frontend hiển thị**
- Render charts, metrics cards, tables

#### 3.5.3. Giải thích từng hàm quan trọng

**1. `DashboardService.getMetrics(userId, channelId)`**
- **Mục đích**: Lấy tổng quan metrics của kênh
- **Tham số**: `Long userId`, `String channelId` (optional)
- **Giá trị trả về**: `DashboardMetrics` (totalViews, totalSubscribers, totalVideos, engagementRate, ...)
- **Vai trò**: Aggregate data từ database để hiển thị tổng quan

**2. `DashboardService.getTrends(userId, channelId, days)`**
- **Mục đích**: Lấy trends (view growth, subscriber growth) theo thời gian
- **Tham số**: `Long userId`, `String channelId`, `int days`
- **Giá trị trả về**: `List<TrendData>` (date, views, subscribers)
- **Vai trò**: Cung cấp data cho line chart

**3. `DashboardService.getTopVideos(userId, channelId, limit)`**
- **Mục đích**: Lấy top videos (theo views, likes, comments)
- **Tham số**: `Long userId`, `String channelId`, `int limit`
- **Giá trị trả về**: `List<VideoInfo>` (top videos)
- **Vai trò**: Hiển thị top performing videos

#### 3.5.4. Kết thúc chức năng

- **Kết quả cuối cùng**: 
  - Dashboard hiển thị metrics, charts, top videos, sentiment stats

- **Hệ thống phản hồi**:
  - Trả về JSON với các metrics
  - Frontend render UI với charts và cards

#### 3.5.5. Sơ đồ luồng

```
User vào trang Dashboard
    ↓
Frontend: Dashboard.jsx → useEffect() → Gọi các API
    ├─→ GET /api/dashboard/metrics
    ├─→ GET /api/dashboard/trends
    ├─→ GET /api/dashboard/top-videos
    └─→ GET /api/dashboard/sentiment
    ↓
DashboardController → Validate token
    ↓
DashboardService
    ├─→ getMetrics() → Query database → Aggregate → Trả về metrics
    ├─→ getTrends() → Query Analytics table → Trả về trends
    ├─→ getTopVideos() → Query Video table → Sort by views → Trả về top videos
    └─→ getSentiment() → Query Comment table → Aggregate sentiment → Trả về stats
    ↓
Frontend: Render charts, metrics cards, tables
```

---

### 3.6. CHỨC NĂNG 6: COMMUNITY INSIGHTS

#### 3.6.1. Điểm bắt đầu

**Người dùng kích hoạt:**
- Frontend: User vào trang "Community Insights"
- File: [`frontend/src/pages/CommunityInsights/CommunityInsights.jsx`](frontend/src/pages/CommunityInsights/CommunityInsights.jsx)

**API endpoints được gọi:**
- `GET /api/community/topics`
- `GET /api/community/keywords`
- `GET /api/community/sentiment-distribution`
- `GET /api/community/topic-suggestions`
- Controller: [`backend/src/main/java/com/example/backend/controller/CommunityController.java`](backend/src/main/java/com/example/backend/controller/CommunityController.java)

#### 3.6.2. Luồng xử lý bên trong

**Bước 1: Frontend load Community Insights**
- File: [`frontend/src/pages/CommunityInsights/CommunityInsights.jsx`](frontend/src/pages/CommunityInsights/CommunityInsights.jsx)
- `useEffect()` → Gọi các API endpoints

**Bước 2: Backend Controller nhận requests**
- File: [`backend/src/main/java/com/example/backend/controller/CommunityController.java`](backend/src/main/java/com/example/backend/controller/CommunityController.java)
- Methods: `getTopics()`, `getKeywords()`, `getSentimentDistribution()`, `getTopicSuggestions()`

**Bước 3: CommunityService xử lý (nếu có)**
- Hoặc: Query trực tiếp từ repositories
- Query `VideoTopic`, `Keyword`, `Comment` tables

**Bước 4: Aggregate data**
- Group by topics, keywords, sentiment
- Calculate statistics

**Bước 5: Trả về response**
- Response: JSON với topics, keywords, sentiment distribution, topic suggestions

**Bước 6: Frontend hiển thị**
- Render charts, word clouds, tables

#### 3.6.3. Giải thích từng hàm quan trọng

**1. `CommunityController.getTopics()`**
- **Mục đích**: Lấy danh sách topics từ comments/videos
- **Tham số**: `@RequestHeader Authorization`, `@RequestParam channelId` (optional)
- **Giá trị trả về**: `List<TopicInfo>` (topics với count)
- **Vai trò**: Hiển thị topics phổ biến trong cộng đồng

**2. `CommunityController.getKeywords()`**
- **Mục đích**: Lấy keywords từ comments
- **Tham số**: `@RequestHeader Authorization`, `@RequestParam channelId` (optional)
- **Giá trị trả về**: `List<KeywordInfo>` (keywords với frequency)
- **Vai trò**: Hiển thị keywords phổ biến

**3. `CommunityController.getSentimentDistribution()`**
- **Mục đích**: Lấy phân bố sentiment (positive/negative/neutral)
- **Tham số**: `@RequestHeader Authorization`, `@RequestParam channelId` (optional)
- **Giá trị trả về**: `SentimentDistribution` (counts cho mỗi sentiment)
- **Vai trò**: Hiển thị pie chart sentiment

#### 3.6.4. Kết thúc chức năng

- **Kết quả cuối cùng**: 
  - Community Insights hiển thị topics, keywords, sentiment distribution

- **Hệ thống phản hồi**:
  - Trả về JSON với data
  - Frontend render UI với charts

#### 3.6.5. Sơ đồ luồng

```
User vào trang Community Insights
    ↓
Frontend: CommunityInsights.jsx → Gọi các API
    ├─→ GET /api/community/topics
    ├─→ GET /api/community/keywords
    ├─→ GET /api/community/sentiment-distribution
    └─→ GET /api/community/topic-suggestions
    ↓
CommunityController → Validate token
    ↓
Query database (VideoTopic, Keyword, Comment tables)
    ├─→ Aggregate topics → Trả về topics với count
    ├─→ Aggregate keywords → Trả về keywords với frequency
    ├─→ Aggregate sentiment → Trả về sentiment distribution
    └─→ Generate topic suggestions → Trả về suggestions
    ↓
Frontend: Render charts, word clouds, tables
```

---

### 3.7. CHỨC NĂNG 7: AUTHENTICATION & AUTHORIZATION

#### 3.7.1. Điểm bắt đầu

**Người dùng kích hoạt:**
- Frontend: User vào trang "Login" → Nhập email/password → Click "Đăng nhập" hoặc "Đăng ký"
- Hoặc: User click "Đăng nhập bằng Google"
- File: [`frontend/src/pages/Login/Login.jsx`](frontend/src/pages/Login/Login.jsx)

**API endpoints được gọi:**
- `POST /api/auth/register` (Đăng ký)
- `POST /api/auth/login` (Đăng nhập)
- `POST /api/auth/google` (Google OAuth)
- `GET /api/auth/me` (Lấy thông tin user hiện tại)
- Controller: [`backend/src/main/java/com/example/backend/controller/AuthController.java`](backend/src/main/java/com/example/backend/controller/AuthController.java)

#### 3.7.2. Luồng xử lý bên trong

**Bước 1: Frontend gửi request**
- File: [`frontend/src/services/authService.js`](frontend/src/services/authService.js)
- Functions: `register()`, `login()`, `googleLogin()` → Gọi các API endpoints

**Bước 2: Backend Controller nhận request**
- File: [`backend/src/main/java/com/example/backend/controller/AuthController.java`](backend/src/main/java/com/example/backend/controller/AuthController.java)
- Methods: `register()`, `login()`, `googleAuth()`, `getCurrentUser()`

**Bước 3: AuthService xử lý**

**3.1. Register (Đăng ký):**
- File: [`backend/src/main/java/com/example/backend/service/AuthService.java`](backend/src/main/java/com/example/backend/service/AuthService.java)
- Method: `register(request)`
  - Kiểm tra email đã tồn tại chưa
  - Hash password với `PasswordEncoder` (BCrypt)
  - Tạo User mới với role "USER"
  - Tạo UserPreferences mặc định
  - Generate JWT token
  - Trả về `AuthResponse` (token + user info)

**3.2. Login (Đăng nhập):**
- File: [`backend/src/main/java/com/example/backend/service/AuthService.java`](backend/src/main/java/com/example/backend/service/AuthService.java)
- Method: `login(request)`
  - Tìm user theo email
  - Kiểm tra tài khoản bị khóa
  - Verify password với `PasswordEncoder.matches()`
  - Generate JWT token
  - Trả về `AuthResponse` (token + user info)

**3.3. Google OAuth:**
- File: [`backend/src/main/java/com/example/backend/service/AuthService.java`](backend/src/main/java/com/example/backend/service/AuthService.java)
- Method: `googleAuth(request)`
  - Verify Google ID token với `GoogleIdTokenVerifier`
  - Extract thông tin từ token (googleId, email, name, picture)
  - Tìm user theo googleId hoặc email
  - Nếu chưa có → Tạo user mới
  - Nếu có → Update thông tin (googleId, avatarUrl)
  - Generate JWT token
  - Trả về `AuthResponse` (token + user info)

**Bước 4: JWT Token Generation**
- File: [`backend/src/main/java/com/example/backend/security/JwtTokenProvider.java`](backend/src/main/java/com/example/backend/security/JwtTokenProvider.java)
- Method: `generateToken(userId, email, role)`
  - Tạo JWT token với claims: userId, email, role
  - Set expiration time (mặc định 24 giờ)
  - Sign với secret key (HS512 algorithm)

**Bước 5: Frontend lưu token**
- File: [`frontend/src/context/AuthContext.jsx`](frontend/src/context/AuthContext.jsx)
- Lưu token vào `localStorage`
- Lưu user info vào `localStorage`
- Update AuthContext state

**Bước 6: Sử dụng token cho các request tiếp theo**
- Frontend: Thêm `Authorization: Bearer <token>` header vào mọi request
- Backend: Validate token với `JwtTokenProvider.validateToken()`
- Extract userId, email, role từ token

#### 3.7.3. Giải thích từng hàm quan trọng

**1. `AuthService.register(request)`**
- **Mục đích**: Đăng ký user mới
- **Tham số**: `RegisterRequest request` (username, email, password)
- **Giá trị trả về**: `AuthResponse` (token, user info)
- **Vai trò**: Tạo user, hash password, generate JWT token

**2. `AuthService.login(request)`**
- **Mục đích**: Đăng nhập user
- **Tham số**: `LoginRequest request` (email, password)
- **Giá trị trả về**: `AuthResponse` (token, user info)
- **Vai trò**: Verify credentials, generate JWT token

**3. `AuthService.googleAuth(request)`**
- **Mục đích**: Xác thực với Google OAuth
- **Tham số**: `GoogleAuthRequest request` (Google ID token)
- **Giá trị trả về**: `AuthResponse` (token, user info)
- **Vai trò**: Verify Google token, create/update user, generate JWT token

**4. `JwtTokenProvider.generateToken(userId, email, role)`**
- **Mục đích**: Tạo JWT token
- **Tham số**: `Long userId`, `String email`, `String role`
- **Giá trị trả về**: `String` (JWT token)
- **Vai trò**: Tạo signed JWT token với claims

**5. `JwtTokenProvider.validateToken(token)`**
- **Mục đích**: Validate JWT token
- **Tham số**: `String token`
- **Giá trị trả về**: `boolean` (true nếu valid)
- **Vai trò**: Verify token signature và expiration

**6. `PasswordEncoder.encode(password)` / `PasswordEncoder.matches(rawPassword, encodedPassword)`**
- **Mục đích**: Hash và verify password
- **Công nghệ**: BCrypt (Spring Security)
- **Vai trò**: Bảo mật password, không lưu plain text

#### 3.7.4. Kết thúc chức năng

- **Kết quả cuối cùng**: 
  - User đã đăng nhập/đăng ký thành công
  - JWT token được lưu ở frontend
  - User có thể truy cập protected routes

- **Hệ thống phản hồi**:
  - Trả về `AuthResponse` với token và user info
  - Frontend lưu token và redirect đến dashboard

#### 3.7.5. Sơ đồ luồng

**Luồng Đăng ký:**
```
User nhập thông tin → Click "Đăng ký"
    ↓
Frontend: Login.jsx → authService.register(userData)
    ↓
POST /api/auth/register
    ↓
AuthController.register() → Validate request
    ↓
AuthService.register(request)
    ├─→ Kiểm tra email đã tồn tại
    ├─→ PasswordEncoder.encode(password) → Hash password
    ├─→ Tạo User entity (role: "USER")
    ├─→ Tạo UserPreferences mặc định
    └─→ JwtTokenProvider.generateToken() → Generate JWT
    ↓
Trả về AuthResponse (token, user info)
    ↓
Frontend: Lưu token vào localStorage → Redirect đến dashboard
```

**Luồng Đăng nhập:**
```
User nhập email/password → Click "Đăng nhập"
    ↓
Frontend: Login.jsx → authService.login(email, password)
    ↓
POST /api/auth/login
    ↓
AuthController.login() → Validate request
    ↓
AuthService.login(request)
    ├─→ Tìm user theo email
    ├─→ Kiểm tra tài khoản bị khóa
    ├─→ PasswordEncoder.matches() → Verify password
    └─→ JwtTokenProvider.generateToken() → Generate JWT
    ↓
Trả về AuthResponse (token, user info)
    ↓
Frontend: Lưu token vào localStorage → Redirect đến dashboard
```

**Luồng Google OAuth:**
```
User click "Đăng nhập bằng Google"
    ↓
Frontend: Google Sign-In → Lấy Google ID token
    ↓
POST /api/auth/google
    ↓
AuthController.googleAuth() → Validate request
    ↓
AuthService.googleAuth(request)
    ├─→ GoogleIdTokenVerifier.verify() → Verify Google token
    ├─→ Extract thông tin (googleId, email, name, picture)
    ├─→ Tìm user theo googleId/email
    ├─→ Tạo mới hoặc update user
    └─→ JwtTokenProvider.generateToken() → Generate JWT
    ↓
Trả về AuthResponse (token, user info)
    ↓
Frontend: Lưu token vào localStorage → Redirect đến dashboard
```

#### 3.7.6. Công nghệ sử dụng

- **JWT (JSON Web Token)**: 
  - Library: `io.jsonwebtoken` (JJWT)
  - Algorithm: HS512 (HMAC SHA-512)
  - Claims: userId, email, role
  - Expiration: 24 giờ (configurable)

- **Password Hashing**:
  - Spring Security `BCryptPasswordEncoder`
  - BCrypt algorithm với salt tự động

- **Google OAuth 2.0**:
  - Google API Client Library
  - `GoogleIdTokenVerifier` để verify ID token
  - Client ID từ Google Cloud Console

- **Security**:
  - Spring Security framework
  - CORS configuration
  - Protected routes với JWT validation

---

### 3.8. CHỨC NĂNG 8: SCHEDULED JOBS & BATCH PROCESSING

#### 3.8.1. Điểm bắt đầu

**Hệ thống kích hoạt:**
- Scheduled jobs chạy tự động theo lịch định kỳ
- Không cần user interaction

**Các scheduled jobs:**
1. **AnalyzeJobWorker**: Xử lý pending analyze jobs (mỗi 3 giây)
2. **ScheduledAnalysisService**: Phân tích comments chưa được phân tích (mỗi 60 giây)
3. **DataSyncService**: Đồng bộ channels hàng ngày (3:30 AM mỗi ngày)
4. **VideoStatsHistoryService**: Lưu video stats history (3:00 AM mỗi ngày)

#### 3.8.2. Luồng xử lý bên trong

**JOB 1: AnalyzeJobWorker - Xử lý Analyze Jobs**

**Bước 1: Scheduled task chạy định kỳ**
- File: [`backend/src/main/java/com/example/backend/service/AnalyzeJobWorker.java`](backend/src/main/java/com/example/backend/service/AnalyzeJobWorker.java)
- Annotation: `@Scheduled(fixedDelayString = "${analysis.job.poll-interval-ms:3000}")`
- Method: `processPendingJobs()` → Chạy mỗi 3 giây (configurable)

**Bước 2: Lấy pending job**
- Method: `analyzeJobService.getNextPendingJob()`
- Query database: Tìm job đầu tiên với status = PENDING, sắp xếp theo `createdAt` ASC

**Bước 3: Xử lý job**
- Method: `executeJobSafely(job)`
  - Kiểm tra job status = PENDING
  - Update job status = RUNNING
  - Gọi `youTubeAnalysisService.analyzeUrl()` để xử lý
  - Nếu thành công → Update job status = SUCCESS
  - Nếu lỗi → Update job status = FAILED với error message

**JOB 2: ScheduledAnalysisService - Batch AI Analysis**

**Bước 1: Scheduled task chạy định kỳ**
- File: [`backend/src/main/java/com/example/backend/service/ScheduledAnalysisService.java`](backend/src/main/java/com/example/backend/service/ScheduledAnalysisService.java)
- Annotation: `@Scheduled(fixedDelay = 60000)` → Chạy mỗi 60 giây
- Method: `analyzePendingComments()`

**Bước 2: Lấy comments chưa phân tích**
- Query: `commentRepository.findUnanalyzedComments(pageable)`
- Pagination: Lấy 50 comments mỗi lần (BATCH_SIZE = 50)

**Bước 3: Gọi async batch analysis**
- Method: `sentimentAnalysisService.analyzeCommentsAsync(comments)`
- Annotation: `@Async("sentimentAnalysisExecutor")` → Chạy trong thread pool riêng

**Bước 4: Batch processing trong SentimentAnalysisService**
- File: [`backend/src/main/java/com/example/backend/service/SentimentAnalysisService.java`](backend/src/main/java/com/example/backend/service/SentimentAnalysisService.java)
- Method: `analyzeCommentsAsync(comments)`
  - Extract texts từ comments
  - Gọi AI Module: `POST /api/analyze-sentiment/batch`
  - Nhận kết quả: List<AnalysisResult>
  - Update comments: sentiment, emotion, is_analyzed = true

**JOB 3: DataSyncService - Đồng bộ Channels hàng ngày**

**Bước 1: Scheduled task chạy định kỳ**
- File: [`backend/src/main/java/com/example/backend/service/DataSyncService.java`](backend/src/main/java/com/example/backend/service/DataSyncService.java)
- Annotation: `@Scheduled(cron = "${youtube.sync.cron:0 30 3 * * *}")` → 3:30 AM mỗi ngày
- Method: `syncChannelsDaily()`

**Bước 2: Lấy tất cả channels**
- Query: `channelRepository.findAll()`

**Bước 3: Refresh từng channel**
- Method: `youTubeAnalysisService.refreshChannel(channel, fetchCommentsOnSchedule)`
  - Gọi YouTube API để lấy data mới nhất
  - Update channel, videos, comments trong database

**JOB 4: VideoStatsHistoryService - Lưu Video Stats History**

**Bước 1: Scheduled task chạy định kỳ**
- File: [`backend/src/main/java/com/example/backend/service/VideoStatsHistoryService.java`](backend/src/main/java/com/example/backend/service/VideoStatsHistoryService.java)
- Annotation: `@Scheduled(cron = "0 0 3 * * *")` → 3:00 AM mỗi ngày
- Method: Lưu snapshot video stats để tracking history

#### 3.8.3. Giải thích từng hàm quan trọng

**1. `AnalyzeJobWorker.processPendingJobs()`**
- **Mục đích**: Poll và xử lý pending analyze jobs
- **Schedule**: Mỗi 3 giây (configurable)
- **Giá trị trả về**: `void`
- **Vai trò**: Đảm bảo analyze jobs được xử lý ngay khi có

**2. `ScheduledAnalysisService.analyzePendingComments()`**
- **Mục đích**: Tự động phân tích comments chưa được phân tích
- **Schedule**: Mỗi 60 giây
- **Batch size**: 50 comments mỗi lần
- **Vai trò**: Đảm bảo comments được phân tích tự động, không cần user trigger

**3. `SentimentAnalysisService.analyzeCommentsAsync(comments)`**
- **Mục đích**: Phân tích batch comments bằng AI Module
- **Tham số**: `List<Comment> comments` (tối đa 50)
- **Giá trị trả về**: `void` (async)
- **Vai trò**: Gọi AI Module batch endpoint, update comments với kết quả
- **Thread pool**: `sentimentAnalysisExecutor` (5-10 threads)

**4. `DataSyncService.syncChannelsDaily()`**
- **Mục đích**: Đồng bộ tất cả channels hàng ngày
- **Schedule**: 3:30 AM mỗi ngày (configurable)
- **Giá trị trả về**: `void`
- **Vai trò**: Đảm bảo data luôn được cập nhật từ YouTube API

**5. `AsyncConfig.sentimentAnalysisExecutor()`**
- **Mục đích**: Cấu hình thread pool cho async sentiment analysis
- **Core pool size**: 5 threads
- **Max pool size**: 10 threads
- **Queue capacity**: 100 tasks
- **Vai trò**: Quản lý concurrent execution của batch analysis

#### 3.8.4. Kết thúc chức năng

- **Kết quả cuối cùng**: 
  - Analyze jobs được xử lý tự động
  - Comments được phân tích tự động theo batch
  - Channels được đồng bộ hàng ngày
  - Video stats history được lưu

- **Hệ thống phản hồi**:
  - Jobs được log để tracking
  - Errors được log và handle gracefully
  - Status được update trong database

#### 3.8.5. Sơ đồ luồng

**Luồng AnalyzeJobWorker:**
```
Scheduled task (mỗi 3 giây)
    ↓
AnalyzeJobWorker.processPendingJobs()
    ↓
AnalyzeJobService.getNextPendingJob() → Query DB (status = PENDING)
    ↓
Nếu có job:
    ├─→ executeJobSafely(job)
    │   ├─→ Update status = RUNNING
    │   ├─→ YouTubeAnalysisService.analyzeUrl() → Xử lý job
    │   ├─→ Nếu thành công → Update status = SUCCESS
    │   └─→ Nếu lỗi → Update status = FAILED
    └─→ Lưu job vào DB
```

**Luồng Batch AI Analysis:**
```
Scheduled task (mỗi 60 giây)
    ↓
ScheduledAnalysisService.analyzePendingComments()
    ↓
CommentRepository.findUnanalyzedComments(pageable) → Lấy 50 comments
    ↓
SentimentAnalysisService.analyzeCommentsAsync(comments) [ASYNC]
    ├─→ Extract texts từ comments
    ├─→ POST http://localhost:5000/api/analyze-sentiment/batch
    ├─→ AI Module phân tích batch
    ├─→ Nhận kết quả: List<AnalysisResult>
    └─→ Update comments (sentiment, emotion, is_analyzed = true)
    ↓
Thread pool: sentimentAnalysisExecutor (5-10 threads)
```

**Luồng Data Sync:**
```
Scheduled task (3:30 AM mỗi ngày)
    ↓
DataSyncService.syncChannelsDaily()
    ↓
ChannelRepository.findAll() → Lấy tất cả channels
    ↓
Với mỗi channel:
    ├─→ YouTubeAnalysisService.refreshChannel(channel)
    │   ├─→ Gọi YouTube API → Lấy data mới nhất
    │   ├─→ Update channel metadata
    │   ├─→ Update videos
    │   └─→ Update comments (nếu fetchCommentsOnSchedule = true)
    └─→ Log kết quả
```

#### 3.8.6. Công nghệ sử dụng

- **Spring Scheduling**:
  - `@EnableScheduling` annotation
  - `@Scheduled` annotation với:
    - `fixedDelay`: Chạy sau khi job trước hoàn thành + delay
    - `fixedDelayString`: Configurable từ properties
    - `cron`: Cron expression (ví dụ: "0 30 3 * * *" = 3:30 AM mỗi ngày)

- **Spring Async**:
  - `@EnableAsync` annotation
  - `@Async` annotation để chạy method trong thread pool riêng
  - `ThreadPoolTaskExecutor` để quản lý thread pool

- **Batch Processing**:
  - Pagination với Spring Data (`Pageable`, `PageRequest`)
  - Batch size: 50 items mỗi lần
  - Async processing để không block main thread

- **Job Management**:
  - `AnalyzeJob` entity với status tracking (PENDING, RUNNING, SUCCESS, FAILED)
  - Transaction management với `@Transactional`
  - Error handling và logging

---

## 4. ĐÁNH GIÁ CHỨC NĂNG

### 4.1. Chức năng đã đầy đủ chưa?

**✅ Đầy đủ:**
- Đồng bộ kênh YouTube: ✅ Hoàn chỉnh
- Phân tích Sentiment & Emotion: ✅ Hoàn chỉnh (có PhoBERT và scikit-learn fallback)
- Tạo gợi ý nội dung AI: ✅ Hoàn chỉnh (titles, description, hashtags, topics, trends)
- AI Chatbot: ✅ Hoàn chỉnh (Gemini + HuggingFace fallback)
- Dashboard & Analytics: ✅ Hoàn chỉnh
- Community Insights: ✅ Hoàn chỉnh
- Authentication & Authorization: ✅ Hoàn chỉnh (Login, Register, Google OAuth, JWT)
- Scheduled Jobs & Batch Processing: ✅ Hoàn chỉnh (AnalyzeJobWorker, ScheduledAnalysisService, DataSyncService)

**⚠️ Cần cải thiện:**
- Error handling: Một số nơi cần improve error messages
- Performance: Có thể cache một số data để giảm API calls
- Testing: Cần thêm unit tests và integration tests

### 4.2. Điểm dễ lỗi hoặc khó hiểu

**1. HuggingFace API dependency:**
- HuggingFace API có thể thay đổi, cần có fallback tốt hơn
- Free tier có rate limits

**2. YouTube API quota:**
- YouTube API có daily quota, cần handle khi hết quota

**3. Async job processing:**
- AnalyzeJob có thể cần background worker để xử lý async

**4. Database transactions:**
- Cần đảm bảo transactions đúng khi sync data

---

## 5. TÓM TẮT ĐỂ TRÌNH BÀY

### 5.1. Tổng quan

**YouTube AI Analytics** là hệ thống phân tích và gợi ý nội dung cho YouTube channels sử dụng AI. Hệ thống gồm 3 module chính: Frontend (React), Backend (Spring Boot), và AI Module (Python Flask). Hệ thống hỗ trợ 8 chức năng chính: (1) Đồng bộ và phân tích kênh YouTube, (2) Phân tích sentiment & emotion của bình luận, (3) Tạo gợi ý nội dung AI (titles, description, hashtags), (4) AI Chatbot chuyên về YouTube content, (5) Dashboard & Analytics, (6) Community Insights, (7) Authentication & Authorization (Login, Register, Google OAuth), và (8) Scheduled Jobs & Batch Processing (tự động xử lý jobs và phân tích batch).

### 5.2. Luồng hoạt động chính

**Luồng đồng bộ kênh:**
User nhập URL → Backend parse URL → Gọi YouTube API → Lưu channel, videos, comments vào database → Trả về success.

**Luồng phân tích sentiment:**
Lấy comments chưa phân tích → Gọi AI Module → PhoBERT/scikit-learn phân tích → Cập nhật database → Hiển thị stats.

**Luồng tạo AI suggestions:**
User nhập keywords/description → Backend load context → Gọi AI Module → HuggingFace API generate → Trả về titles, description, hashtags.

**Luồng AI Chatbot:**
User chat → Backend proxy → AI Module → Gemini API (hoặc HuggingFace fallback) → Trả về reply → Cập nhật conversation history.

**Luồng Authentication:**
User đăng nhập/đăng ký → Backend verify credentials → Generate JWT token → Frontend lưu token → Sử dụng token cho các request tiếp theo.

**Luồng Scheduled Jobs:**
Scheduled tasks chạy định kỳ → Poll pending jobs/comments → Xử lý batch → Update database → Log kết quả.

### 5.3. Công nghệ sử dụng

- **Frontend**: React + Vite, React Router, Axios, localStorage
- **Backend**: Spring Boot, JPA/Hibernate, MySQL, JWT (JJWT), Spring Security, Spring Scheduling, Spring Async
- **AI Module**: Python Flask, HuggingFace API, Google Gemini API, PhoBERT, scikit-learn
- **External APIs**: YouTube Data API v3, Google Trends, YouTube Autocomplete, Google OAuth 2.0
- **Security**: JWT (HS512), BCrypt password hashing, Google OAuth token verification
- **Scheduling**: Spring `@Scheduled` với cron expressions và fixed delays
- **Async Processing**: Spring `@Async` với ThreadPoolTaskExecutor

---

## 6. LINK ĐẾN CÁC FILE QUAN TRỌNG

### 6.1. Backend Controllers
- [`backend/src/main/java/com/example/backend/controller/AIController.java`](backend/src/main/java/com/example/backend/controller/AIController.java) - AI endpoints (suggestions, chat)
- [`backend/src/main/java/com/example/backend/controller/ChannelController.java`](backend/src/main/java/com/example/backend/controller/ChannelController.java) - YouTube channel analysis
- [`backend/src/main/java/com/example/backend/controller/DashboardController.java`](backend/src/main/java/com/example/backend/controller/DashboardController.java) - Dashboard metrics
- [`backend/src/main/java/com/example/backend/controller/CommentController.java`](backend/src/main/java/com/example/backend/controller/CommentController.java) - Comment sentiment
- [`backend/src/main/java/com/example/backend/controller/CommunityController.java`](backend/src/main/java/com/example/backend/controller/CommunityController.java) - Community insights
- [`backend/src/main/java/com/example/backend/controller/AuthController.java`](backend/src/main/java/com/example/backend/controller/AuthController.java) - Authentication endpoints (register, login, Google OAuth)

### 6.2. Backend Services
- [`backend/src/main/java/com/example/backend/service/AIService.java`](backend/src/main/java/com/example/backend/service/AIService.java) - AI service (suggestions, chat)
- [`backend/src/main/java/com/example/backend/service/YouTubeAnalysisService.java`](backend/src/main/java/com/example/backend/service/YouTubeAnalysisService.java) - YouTube analysis service
- [`backend/src/main/java/com/example/backend/service/AnalyzeJobService.java`](backend/src/main/java/com/example/backend/service/AnalyzeJobService.java) - Analyze job service
- [`backend/src/main/java/com/example/backend/service/AuthService.java`](backend/src/main/java/com/example/backend/service/AuthService.java) - Authentication service (register, login, Google OAuth)
- [`backend/src/main/java/com/example/backend/service/SentimentAnalysisService.java`](backend/src/main/java/com/example/backend/service/SentimentAnalysisService.java) - Sentiment analysis service (batch processing)
- [`backend/src/main/java/com/example/backend/service/ScheduledAnalysisService.java`](backend/src/main/java/com/example/backend/service/ScheduledAnalysisService.java) - Scheduled batch analysis service
- [`backend/src/main/java/com/example/backend/service/AnalyzeJobWorker.java`](backend/src/main/java/com/example/backend/service/AnalyzeJobWorker.java) - Scheduled job worker cho analyze jobs
- [`backend/src/main/java/com/example/backend/service/DataSyncService.java`](backend/src/main/java/com/example/backend/service/DataSyncService.java) - Scheduled data sync service

### 6.3. AI Module APIs
- [`ai_module/app/api/content.py`](ai_module/app/api/content.py) - Content generation API
- [`ai_module/app/api/chat.py`](ai_module/app/api/chat.py) - Chat API
- [`ai_module/app/api/sentiment.py`](ai_module/app/api/sentiment.py) - Sentiment analysis API

### 6.4. AI Module Services
- [`ai_module/app/services/content_service.py`](ai_module/app/services/content_service.py) - Content generation service
- [`ai_module/app/services/chat_service.py`](ai_module/app/services/chat_service.py) - Chat service
- [`ai_module/app/services/sentiment_service.py`](ai_module/app/services/sentiment_service.py) - Sentiment analysis service

### 6.5. Frontend Pages
- [`frontend/src/pages/Dashboard/Dashboard.jsx`](frontend/src/pages/Dashboard/Dashboard.jsx) - Dashboard page
- [`frontend/src/pages/AISuggestion/AISuggestion.jsx`](frontend/src/pages/AISuggestion/AISuggestion.jsx) - AI Suggestion page (form + chatbot)
- [`frontend/src/pages/CommentSentiment/CommentSentiment.jsx`](frontend/src/pages/CommentSentiment/CommentSentiment.jsx) - Comment Sentiment page
- [`frontend/src/pages/CommunityInsights/CommunityInsights.jsx`](frontend/src/pages/CommunityInsights/CommunityInsights.jsx) - Community Insights page

### 6.6. Frontend Services
- [`frontend/src/services/aiService.js`](frontend/src/services/aiService.js) - AI service (suggestions, chat)
- [`frontend/src/services/dashboardService.js`](frontend/src/services/dashboardService.js) - Dashboard service (analyze URL, get metrics, trends, videos, sentiment)
- [`frontend/src/services/authService.js`](frontend/src/services/authService.js) - Authentication service (register, login, Google OAuth)

### 6.7. Backend Security & Config
- [`backend/src/main/java/com/example/backend/security/JwtTokenProvider.java`](backend/src/main/java/com/example/backend/security/JwtTokenProvider.java) - JWT token generation và validation
- [`backend/src/main/java/com/example/backend/config/AsyncConfig.java`](backend/src/main/java/com/example/backend/config/AsyncConfig.java) - Async và scheduling configuration
- [`backend/src/main/java/com/example/backend/config/SecurityConfig.java`](backend/src/main/java/com/example/backend/config/SecurityConfig.java) - Spring Security configuration

### 6.8. Frontend Context
- [`frontend/src/context/AuthContext.jsx`](frontend/src/context/AuthContext.jsx) - Authentication context (state management)

---

**Lưu ý:** Tất cả các file trên đã được thêm comment chi tiết để giải thích code. Bạn có thể Ctrl+Click vào các link để mở file và xem comment.

