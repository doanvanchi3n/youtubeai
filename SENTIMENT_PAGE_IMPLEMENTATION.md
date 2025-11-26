# 📋 QUY TRÌNH VÀ CÔNG NGHỆ - PAGE SENTIMENT

## 🎯 MỤC TIÊU
Sau khi lấy được dữ liệu kênh qua URL, thực hiện các chức năng:
1. **Lọc bình luận theo cảm xúc** (Sentiment: Tích cực, Tiêu cực, Trung lập)
2. **Thống kê từng loại cảm xúc** (Emotion: Vui vẻ, Buồn chán, Công kích, Góp ý, Yêu thích)
3. **Top 3 video nhiều like nhất**
4. **Biểu đồ cảm xúc** (Biểu đồ tròn - Pie Chart)

---

## 🏗️ KIẾN TRÚC HỆ THỐNG

### **Stack Công Nghệ:**
- **Backend**: Java Spring Boot (REST API)
- **AI Module**: Python Flask (NLP Analysis)
- **Frontend**: React + Vite
- **Database**: MySQL
- **ML Models**: scikit-learn (Sentiment & Emotion Classification)

### **Luồng Dữ Liệu:**
```
YouTube API → Backend (Java) → Database (MySQL)
                                    ↓
                            AI Module (Python Flask)
                                    ↓
                            Backend (Java) → Frontend (React)
```

---

## 📊 QUY TRÌNH CHI TIẾT

### **BƯỚC 1: Thu thập và Lưu trữ Comments**
**Khi nào:** Khi user nhập URL kênh và đồng bộ dữ liệu

**Công nghệ:**
- YouTube Data API v3
- Spring Boot Service (`YouTubeAnalysisService`)

**Quy trình:**
1. Backend gọi YouTube API để lấy danh sách video của kênh
2. Với mỗi video, lấy comments (giới hạn theo config: `youtube.sync.comments-per-video`)
3. Lưu comments vào database với:
   - `is_analyzed = false`
   - `sentiment = null`
   - `emotion = null`

**File liên quan:**
- `backend/src/main/java/com/example/backend/service/YouTubeAnalysisService.java`
- `backend/src/main/java/com/example/backend/model/Comment.java`

---

### **BƯỚC 2: Phân tích Sentiment & Emotion (NLP)**
**Khi nào:** Sau khi comments được lưu vào database (Async)

**Công nghệ:**
- Python Flask API (`ai_module`)
- scikit-learn models (Sentiment & Emotion)
- HTTP REST API (Backend gọi AI Module)

**Quy trình:**
1. Backend tìm tất cả comments chưa phân tích (`is_analyzed = false`)
2. Gửi batch comments đến AI Module qua HTTP POST:
   ```
   POST http://localhost:5000/api/analyze-sentiment/batch
   Body: { "texts": ["comment1", "comment2", ...] }
   ```
3. AI Module xử lý:
   - Preprocess text (loại bỏ noise, normalize)
   - Predict sentiment (positive/negative/neutral)
   - Predict emotion (happy/sad/angry/suggestion/love)
   - Tính confidence score
4. Backend nhận kết quả và cập nhật database:
   - `sentiment` = "positive" | "negative" | "neutral"
   - `emotion` = "happy" | "sad" | "angry" | "suggestion" | "love"
   - `sentiment_score` = confidence (0-1)
   - `is_analyzed = true`
   - `analyzed_at` = current timestamp

**File liên quan:**
- `ai_module/app/services/sentiment_service.py`
- `ai_module/app/api/sentiment.py`
- `backend/src/main/java/com/example/backend/service/` (cần tạo `SentimentAnalysisService`)

---

### **BƯỚC 3: Tạo API Endpoints cho Frontend**
**Công nghệ:**
- Spring Boot REST Controller
- JPA Repository (Query methods)

**Các Endpoints cần tạo:**

#### **3.1. Lọc bình luận theo Sentiment**
```
GET /api/comments/sentiment?channelId={channelId}&sentiment={sentiment}
```
- `sentiment`: "positive" | "negative" | "neutral"
- Response: List comments với đầy đủ thông tin (author, content, video title, time)

#### **3.2. Lọc bình luận theo Emotion**
```
GET /api/comments/emotion?channelId={channelId}&emotion={emotion}
```
- `emotion`: "happy" | "sad" | "angry" | "suggestion" | "love"
- Response: List comments

#### **3.3. Thống kê Sentiment/Emotion**
```
GET /api/comments/sentiment-stats?channelId={channelId}
```
- Response:
```json
{
  "sentiment": {
    "positive": 150,
    "negative": 30,
    "neutral": 120
  },
  "emotion": {
    "happy": 100,
    "sad": 20,
    "angry": 10,
    "suggestion": 80,
    "love": 90
  }
}
```

#### **3.4. Top 3 video nhiều like nhất**
```
GET /api/videos/top-liked?channelId={channelId}&limit=3
```
- Response: List 3 videos với `like_count` cao nhất
- Bao gồm: videoId, title, thumbnailUrl, likeCount

#### **3.5. Biểu đồ cảm xúc (Pie Chart Data)**
```
GET /api/comments/emotion-chart?channelId={channelId}
```
- Response:
```json
{
  "labels": ["Vui vẻ", "Buồn chán", "Công kích", "Góp ý", "Yêu thích"],
  "data": [100, 20, 10, 80, 90],
  "colors": ["#4CAF50", "#2196F3", "#F44336", "#FF9800", "#E91E63"]
}
```

**File cần tạo/sửa:**
- `backend/src/main/java/com/example/backend/controller/CommentController.java` (hiện tại đang trống)
- `backend/src/main/java/com/example/backend/service/CommentService.java` (mới)
- `backend/src/main/java/com/example/backend/repository/CommentRepository.java` (đã có, cần thêm methods)

---

### **BƯỚC 4: Xây dựng Frontend (React)**
**Công nghệ:**
- React Hooks (useState, useEffect)
- Fetch API hoặc Axios
- Chart.js hoặc Recharts (cho biểu đồ tròn)

**Quy trình:**

#### **4.1. Component: Lọc bình luận theo Sentiment**
- Sử dụng `FilterTabs` component (đã có)
- Khi chọn tab (Tích cực/Tiêu cực/Trung lập):
  - Gọi API: `GET /api/comments/sentiment?channelId={id}&sentiment={sentiment}`
  - Map response: `positive` → "Tích cực", `negative` → "Tiêu cực", `neutral` → "Trung lập"
  - Hiển thị danh sách comments với:
    - Avatar, tên tác giả
    - Thời gian (format: "2 giờ trước")
    - Tên video
    - Nội dung comment

#### **4.2. Component: Thống kê từng loại cảm xúc**
- Sử dụng `FilterTabs` với các emotion filters
- Khi chọn emotion:
  - Gọi API: `GET /api/comments/emotion?channelId={id}&emotion={emotion}`
  - Map response: `happy` → "Vui vẻ", `sad` → "Buồn chán", etc.
  - Hiển thị danh sách comments tương tự

#### **4.3. Component: Top 3 video nhiều like nhất**
- Gọi API: `GET /api/videos/top-liked?channelId={id}&limit=3`
- Hiển thị:
  - Thumbnail video
  - Title (truncate nếu dài)
  - Icon like + số lượng like (format: 12K)

#### **4.4. Component: Biểu đồ cảm xúc (Pie Chart)**
- Gọi API: `GET /api/comments/emotion-chart?channelId={id}`
- Sử dụng thư viện chart:
  - **Option 1**: Chart.js + react-chartjs-2
  - **Option 2**: Recharts (PieChart component)
- Hiển thị biểu đồ tròn với:
  - Labels: Vui vẻ, Buồn chán, Công kích, Góp ý, Yêu thích
  - Màu sắc tương ứng
  - Tooltip hiển thị số lượng và phần trăm

**File cần sửa:**
- `frontend/src/pages/CommentSentiment/CommentSentiment.jsx` (đã có UI, cần tích hợp API)
- `frontend/src/services/commentService.js` (mới - API client)

---

## 🔧 CÔNG NGHỆ CHI TIẾT

### **1. Backend (Java Spring Boot)**

#### **Dependencies cần có:**
```xml
<!-- pom.xml -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-jpa</artifactId>
</dependency>
```

#### **Service Layer:**
- `CommentService`: Business logic cho comments
- `SentimentAnalysisService`: Gọi AI Module API (HTTP Client)
- `VideoService`: Lấy top videos

#### **Repository Methods cần thêm:**
```java
// CommentRepository.java
List<Comment> findByChannelIdAndSentiment(Long channelId, String sentiment);
List<Comment> findByChannelIdAndEmotion(Long channelId, String emotion);
List<Comment> findTopLikedCommentsByChannelId(Long channelId, Pageable pageable);

@Query("SELECT c.emotion, COUNT(c) FROM Comment c WHERE c.video.channel.id = :channelId GROUP BY c.emotion")
List<Object[]> countEmotionByChannelId(Long channelId);
```

---

### **2. AI Module (Python Flask)**

#### **Dependencies:**
```txt
# requirements.txt
flask==3.1.2
scikit-learn==1.7.2
numpy==2.3.3
pandas==2.3.3
joblib==1.5.2
```

#### **Models:**
- Sentiment Model: Phân loại 3 lớp (positive/negative/neutral)
- Emotion Model: Phân loại 5 lớp (happy/sad/angry/suggestion/love)
- Models được train và lưu trong `ai_module/app/data/models/`

#### **API Endpoints:**
- `POST /api/analyze-sentiment` - Phân tích 1 comment
- `POST /api/analyze-sentiment/batch` - Phân tích nhiều comments (hiệu quả hơn)

---

### **3. Frontend (React)**

#### **Dependencies cần cài:**
```bash
npm install axios
npm install recharts  # hoặc chart.js + react-chartjs-2
```

#### **State Management:**
- Sử dụng React Context (`DataContext`) để lưu channelId hiện tại
- Local state cho filters và data

#### **API Client:**
```javascript
// services/commentService.js
export const getCommentsBySentiment = (channelId, sentiment) => {
  return apiClient.get(`/comments/sentiment`, {
    params: { channelId, sentiment }
  });
};

export const getCommentsByEmotion = (channelId, emotion) => {
  return apiClient.get(`/comments/emotion`, {
    params: { channelId, emotion }
  });
};

export const getSentimentStats = (channelId) => {
  return apiClient.get(`/comments/sentiment-stats`, {
    params: { channelId }
  });
};

export const getEmotionChartData = (channelId) => {
  return apiClient.get(`/comments/emotion-chart`, {
    params: { channelId }
  });
};
```

---

## 📝 MAPPING DỮ LIỆU

### **Sentiment Mapping:**
- Database → UI:
  - `positive` → "Tích cực"
  - `negative` → "Tiêu cực"
  - `neutral` → "Trung lập"

### **Emotion Mapping:**
- Database → UI:
  - `happy` → "Vui vẻ" 😊
  - `sad` → "Buồn chán" 😞
  - `angry` → "Công kích" 😡
  - `suggestion` → "Góp ý" 💬
  - `love` → "Yêu thích" ❤️

---

## ⚡ TỐI ƯU HÓA

### **1. Batch Processing:**
- Gửi nhiều comments cùng lúc đến AI Module (batch API)
- Giảm số lượng HTTP requests

### **2. Caching:**
- Cache sentiment stats trong Redis (optional)
- Cache top videos (TTL: 5 phút)

### **3. Pagination:**
- Comments list nên có pagination (20 items/page)
- Backend: `Pageable` parameter

### **4. Async Processing:**
- Phân tích sentiment chạy async (không block user)
- Sử dụng `@Async` trong Spring Boot

---

## 🚀 THỨ TỰ TRIỂN KHAI

### **Phase 1: Backend API**
1. ✅ Tạo `CommentService` với các methods query
2. ✅ Tạo `SentimentAnalysisService` (gọi AI Module)
3. ✅ Implement `CommentController` với tất cả endpoints
4. ✅ Test API với Postman/curl

### **Phase 2: AI Integration**
1. ✅ Đảm bảo AI Module đang chạy (port 5000)
2. ✅ Test batch API với sample comments
3. ✅ Tạo scheduled job để phân tích comments chưa được analyze

### **Phase 3: Frontend**
1. ✅ Tạo `commentService.js` (API client)
2. ✅ Update `CommentSentiment.jsx`:
   - Tích hợp API cho lọc sentiment
   - Tích hợp API cho lọc emotion
   - Tích hợp API cho top videos
   - Tích hợp biểu đồ tròn
3. ✅ Format thời gian (relative time: "2 giờ trước")
4. ✅ Format số lượng (12K, 1.2M)

### **Phase 4: Testing & Polish**
1. ✅ Test end-to-end flow
2. ✅ Xử lý loading states
3. ✅ Xử lý error states
4. ✅ Responsive design

---

## 📌 LƯU Ý QUAN TRỌNG

1. **ChannelId**: Frontend cần lấy từ context hoặc URL params
2. **Error Handling**: Xử lý trường hợp AI Module không khả dụng
3. **Performance**: Nếu có nhiều comments, cần pagination
4. **Data Sync**: Comments mới cần được phân tích tự động (scheduled job)
5. **UI/UX**: Loading spinner khi đang fetch data, empty state khi không có data

---

## 🔗 TÀI LIỆU THAM KHẢO

- [Spring Boot REST API](https://spring.io/guides/gs/rest-service/)
- [Chart.js Documentation](https://www.chartjs.org/docs/latest/)
- [Recharts Documentation](https://recharts.org/)
- [scikit-learn Text Classification](https://scikit-learn.org/stable/tutorial/text_analytics/working_with_text_data.html)

