# Luồng Quy Trình Lấy Dữ Liệu Qua URL

## Tổng Quan

Quy trình này mô tả cách hệ thống xử lý khi người dùng nhập URL YouTube (kênh hoặc video) và lấy dữ liệu để phân tích.

---

## Sơ Đồ Luồng Tổng Quan

```
[User nhập URL] 
    ↓
[Frontend: Validate & Gửi Request]
    ↓
[Backend: Validate URL & Parse]
    ↓
[Backend: Kiểm tra Database]
    ↓
[Backend: Gọi YouTube API]
    ↓
[Backend: Lưu vào Database]
    ↓
[Backend: Gọi AI Module (Async)]
    ↓
[Backend: Trả về Response]
    ↓
[Frontend: Hiển thị Dữ liệu]
```

---

## Chi Tiết Từng Bước

### Bước 1: User Nhập URL (Frontend)

**Vị trí**: `Dashboard.jsx` - Search Panel

**Hành động**:
- User nhập URL vào input field: `"Enter URL"`
- User nhấn Enter hoặc click nút Search

**Code Example**:
```jsx
// Dashboard.jsx
const [url, setUrl] = useState('')
const [loading, setLoading] = useState(false)

const handleSearch = async () => {
  if (!url.trim()) return
  
  setLoading(true)
  try {
    const response = await fetch('/api/youtube/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ url: url.trim() })
    })
    const data = await response.json()
    // Xử lý response...
  } catch (error) {
    // Xử lý lỗi...
  } finally {
    setLoading(false)
  }
}
```

**Input Validation (Frontend)**:
- Kiểm tra URL không rỗng
- Kiểm tra format cơ bản (có chứa "youtube.com" hoặc "youtu.be")

---

### Bước 2: Frontend Gửi Request Đến Backend

**API Endpoint**: `POST /api/youtube/analyze`

**Request Body**:
```json
{
  "url": "https://www.youtube.com/channel/UCxxxxx"
}
```

**Headers**:
```
Content-Type: application/json
Authorization: Bearer {jwt_token}
```

**Xử lý**:
- Frontend gửi HTTP POST request
- Kèm theo JWT token để xác thực
- Hiển thị loading state

---

### Bước 3: Backend Nhận Request & Validate

**Vị trí**: `YouTubeController.java`

**Xử lý**:
1. **Xác thực User**:
   ```java
   @PostMapping("/api/youtube/analyze")
   public ResponseEntity<?> analyzeUrl(@RequestBody AnalyzeRequest request, 
                                       Authentication auth) {
       // Lấy user từ authentication
       User user = userService.getCurrentUser(auth);
   }
   ```

2. **Validate URL Format**:
   ```java
   // Kiểm tra URL hợp lệ
   if (!isValidYouTubeUrl(request.getUrl())) {
       return ResponseEntity.badRequest()
           .body(new ErrorResponse("Invalid YouTube URL"));
   }
   ```

3. **Parse URL để lấy Channel ID hoặc Video ID**:
   ```java
   YouTubeUrlParser parser = new YouTubeUrlParser();
   ParsedUrl parsed = parser.parse(request.getUrl());
   
   // parsed.getType() -> "channel" | "video"
   // parsed.getId() -> channel ID hoặc video ID
   ```

**Các Pattern URL Hỗ Trợ**:
- Channel: `https://www.youtube.com/channel/UCxxxxx`
- Channel: `https://www.youtube.com/c/ChannelName`
- Channel: `https://www.youtube.com/@username`
- Video: `https://www.youtube.com/watch?v=xxxxx`
- Video: `https://youtu.be/xxxxx`

---

### Bước 4: Backend Kiểm Tra Database

**Mục đích**: Tránh gọi YouTube API không cần thiết nếu dữ liệu đã có

**Xử lý**:
```java
// Kiểm tra channel đã tồn tại chưa
Channel existingChannel = channelRepository
    .findByChannelId(parsed.getChannelId())
    .orElse(null);

if (existingChannel != null) {
    // Kiểm tra dữ liệu có cũ không (ví dụ: > 24 giờ)
    if (isDataFresh(existingChannel.getLastUpdated())) {
        // Trả về dữ liệu từ database
        return ResponseEntity.ok(buildResponse(existingChannel));
    }
}
```

**Logic**:
- Nếu channel đã có trong DB và dữ liệu còn "fresh" (< 24h) → Trả về ngay
- Nếu channel chưa có hoặc dữ liệu cũ → Tiếp tục gọi YouTube API

---

### Bước 5: Backend Gọi YouTube Data API v3

**Service**: `YouTubeApiService.java`

**Xử lý**:

#### 5.1. Lấy Thông Tin Kênh
```java
public ChannelInfo fetchChannelInfo(String channelId) {
    // Gọi YouTube API
    YouTube youtube = new YouTube.Builder(
        HTTP_TRANSPORT, 
        JSON_FACTORY, 
        getCredential()
    ).build();
    
    YouTube.Channels.List request = youtube.channels()
        .list("snippet,statistics,contentDetails")
        .setId(channelId)
        .setKey(API_KEY);
    
    ChannelListResponse response = request.execute();
    Channel channel = response.getItems().get(0);
    
    return ChannelInfo.builder()
        .channelId(channelId)
        .title(channel.getSnippet().getTitle())
        .description(channel.getSnippet().getDescription())
        .avatarUrl(channel.getSnippet().getThumbnails().getDefault().getUrl())
        .subscriberCount(channel.getStatistics().getSubscriberCount())
        .videoCount(channel.getStatistics().getVideoCount())
        .viewCount(channel.getStatistics().getViewCount())
        .build();
}
```

#### 5.2. Lấy Danh Sách Video
```java
public List<VideoInfo> fetchChannelVideos(String channelId) {
    // Lấy uploads playlist ID
    String uploadsPlaylistId = getUploadsPlaylistId(channelId);
    
    // Lấy danh sách video từ playlist
    YouTube.PlaylistItems.List request = youtube.playlistItems()
        .list("snippet,contentDetails")
        .setPlaylistId(uploadsPlaylistId)
        .setMaxResults(50L)
        .setKey(API_KEY);
    
    // Lấy video IDs
    List<String> videoIds = extractVideoIds(request.execute());
    
    // Lấy chi tiết video
    YouTube.Videos.List videoRequest = youtube.videos()
        .list("snippet,statistics,contentDetails")
        .setId(String.join(",", videoIds))
        .setKey(API_KEY);
    
    return parseVideoList(videoRequest.execute());
}
```

#### 5.3. Lấy Bình Luận (Cho từng video)
```java
public List<CommentInfo> fetchVideoComments(String videoId) {
    YouTube.CommentThreads.List request = youtube.commentThreads()
        .list("snippet,replies")
        .setVideoId(videoId)
        .setMaxResults(100L)
        .setOrder("relevance")
        .setKey(API_KEY);
    
    CommentThreadListResponse response = request.execute();
    return parseComments(response);
}
```

**Rate Limiting**:
- YouTube API có quota limit (10,000 units/day mặc định)
- Mỗi request tốn quota khác nhau:
  - `channels.list`: 1 unit
  - `videos.list`: 1 unit
  - `commentThreads.list`: 1 unit
  - `playlistItems.list`: 1 unit

**Xử lý Rate Limit**:
```java
if (quotaExceeded) {
    // Queue request để xử lý sau
    // Hoặc trả về lỗi yêu cầu thử lại sau
    throw new QuotaExceededException("API quota exceeded. Please try again later.");
}
```

---

### Bước 6: Backend Lưu Dữ Liệu Vào Database

**Service**: `DataSyncService.java`

**Xử lý**:

#### 6.1. Lưu/Lấy Channel
```java
@Transactional
public Channel saveChannel(ChannelInfo channelInfo, User user) {
    Channel channel = channelRepository
        .findByChannelId(channelInfo.getChannelId())
        .orElse(new Channel());
    
    channel.setChannelId(channelInfo.getChannelId());
    channel.setUser(user);
    channel.setName(channelInfo.getTitle());
    channel.setAvatarUrl(channelInfo.getAvatarUrl());
    channel.setSubscriberCount(channelInfo.getSubscriberCount());
    channel.setLastUpdated(LocalDateTime.now());
    
    return channelRepository.save(channel);
}
```

#### 6.2. Lưu Videos
```java
@Transactional
public void saveVideos(List<VideoInfo> videos, Channel channel) {
    for (VideoInfo videoInfo : videos) {
        Video video = videoRepository
            .findByVideoId(videoInfo.getVideoId())
            .orElse(new Video());
        
        video.setChannel(channel);
        video.setVideoId(videoInfo.getVideoId());
        video.setTitle(videoInfo.getTitle());
        video.setDescription(videoInfo.getDescription());
        video.setThumbnailUrl(videoInfo.getThumbnailUrl());
        video.setViewCount(videoInfo.getViewCount());
        video.setLikeCount(videoInfo.getLikeCount());
        video.setCommentCount(videoInfo.getCommentCount());
        video.setPublishedAt(videoInfo.getPublishedAt());
        
        videoRepository.save(video);
    }
}
```

#### 6.3. Lưu Comments (Async)
```java
@Async
public CompletableFuture<Void> saveCommentsAsync(String videoId) {
    List<CommentInfo> comments = youtubeApiService.fetchVideoComments(videoId);
    
    Video video = videoRepository.findByVideoId(videoId)
        .orElseThrow();
    
    for (CommentInfo commentInfo : comments) {
        Comment comment = new Comment();
        comment.setVideo(video);
        comment.setCommentId(commentInfo.getCommentId());
        comment.setAuthorName(commentInfo.getAuthorName());
        comment.setAuthorAvatar(commentInfo.getAuthorAvatar());
        comment.setContent(commentInfo.getContent());
        comment.setLikeCount(commentInfo.getLikeCount());
        comment.setPublishedAt(commentInfo.getPublishedAt());
        
        // Sentiment và emotion sẽ được cập nhật sau khi AI xử lý
        commentRepository.save(comment);
    }
    
    return CompletableFuture.completedFuture(null);
}
```

---

### Bước 7: Backend Gọi AI Module (Async)

**Service**: `AIService.java`

**Xử lý**:

#### 7.1. Gửi Comments Đến AI Module
```java
@Async
public void analyzeCommentsAsync(Long channelId) {
    // Lấy tất cả comments chưa được phân tích
    List<Comment> comments = commentRepository
        .findUnanalyzedCommentsByChannelId(channelId);
    
    if (comments.isEmpty()) return;
    
    // Gửi batch đến AI module
    String aiServiceUrl = "http://localhost:5000/api/analyze-sentiment";
    
    for (Comment comment : comments) {
        try {
            // Gọi AI module
            SentimentAnalysisRequest request = new SentimentAnalysisRequest(
                comment.getContent()
            );
            
            RestTemplate restTemplate = new RestTemplate();
            SentimentAnalysisResponse response = restTemplate.postForObject(
                aiServiceUrl,
                request,
                SentimentAnalysisResponse.class
            );
            
            // Cập nhật comment
            comment.setSentiment(response.getSentiment()); // positive/negative/neutral
            comment.setEmotion(response.getEmotion()); // happy/sad/angry/suggestion/love
            comment.setSentimentScore(response.getConfidence());
            comment.setAnalyzedAt(LocalDateTime.now());
            
            commentRepository.save(comment);
            
        } catch (Exception e) {
            log.error("Error analyzing comment: " + comment.getId(), e);
        }
    }
}
```

#### 7.2. AI Module (Python) Xử Lý
```python
# ai_module/main.py
from flask import Flask, request, jsonify
from sentiment_analyzer import SentimentAnalyzer

app = Flask(__name__)
analyzer = SentimentAnalyzer()

@app.route('/api/analyze-sentiment', methods=['POST'])
def analyze_sentiment():
    data = request.json
    text = data.get('text')
    
    # Phân tích sentiment
    result = analyzer.analyze(text)
    
    return jsonify({
        'sentiment': result['sentiment'],  # positive/negative/neutral
        'emotion': result['emotion'],       # happy/sad/angry/suggestion/love
        'confidence': result['confidence']
    })
```

**AI Processing**:
- Sử dụng ML model để phân tích sentiment
- Phân loại emotion
- Trả về confidence score

---

### Bước 8: Backend Trả Về Response

**Response Structure**:
```java
@PostMapping("/api/youtube/analyze")
public ResponseEntity<AnalyzeResponse> analyzeUrl(@RequestBody AnalyzeRequest request) {
    // ... xử lý ...
    
    AnalyzeResponse response = AnalyzeResponse.builder()
        .channelId(channel.getChannelId())
        .channelName(channel.getName())
        .status("success")
        .message("Data fetched successfully")
        .dataAvailable(true)
        .lastUpdated(channel.getLastUpdated())
        .build();
    
    return ResponseEntity.ok(response);
}
```

**Response JSON**:
```json
{
  "status": "success",
  "message": "Data fetched successfully",
  "channelId": "UCxxxxx",
  "channelName": "Channel Name",
  "dataAvailable": true,
  "lastUpdated": "2024-01-15T10:30:00",
  "metrics": {
    "totalVideos": 150,
    "totalViews": 1000000,
    "totalLikes": 50000,
    "totalComments": 10000
  }
}
```

**Error Response**:
```json
{
  "status": "error",
  "message": "Invalid YouTube URL",
  "code": "INVALID_URL"
}
```

---

### Bước 9: Frontend Nhận Response & Cập Nhật UI

**Xử lý**:
```jsx
// Dashboard.jsx
const handleSearch = async () => {
  setLoading(true)
  try {
    const response = await fetch('/api/youtube/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ url })
    })
    
    const data = await response.json()
    
    if (data.status === 'success') {
      // Lưu channelId vào context/state
      setChannelId(data.channelId)
      
      // Fetch metrics để hiển thị
      await fetchDashboardMetrics(data.channelId)
      
      // Hiển thị thông báo thành công
      showNotification('Data loaded successfully!')
    } else {
      // Hiển thị lỗi
      showError(data.message)
    }
  } catch (error) {
    showError('Failed to fetch data')
  } finally {
    setLoading(false)
  }
}
```

#### 9.1. Fetch Metrics
```jsx
const fetchDashboardMetrics = async (channelId) => {
  const response = await fetch(`/api/dashboard/metrics?channelId=${channelId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  
  const metrics = await response.json()
  
  // Cập nhật state
  setMetrics({
    totalLikes: metrics.totalLikes,
    totalComments: metrics.totalComments,
    totalVideos: metrics.totalVideos,
    totalViews: metrics.totalViews
  })
}
```

#### 9.2. Fetch Trends Data
```jsx
const fetchTrends = async (channelId) => {
  const response = await fetch(
    `/api/dashboard/trends?channelId=${channelId}&startDate=${startDate}&endDate=${endDate}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  )
  
  const trends = await response.json()
  
  // Format data cho chart
  const chartData = formatChartData(trends)
  
  // Render chart
  renderLineChart(chartData)
}
```

---

## Luồng Xử Lý Bất Đồng Bộ (Async)

### Background Jobs

Sau khi trả về response ban đầu, hệ thống tiếp tục xử lý:

1. **Lấy Comments** (Async):
   ```
   [Response trả về] → [Background Job: Fetch Comments] → [Lưu Comments]
   ```

2. **Phân Tích AI** (Async):
   ```
   [Comments lưu] → [Background Job: Gửi đến AI Module] → [Cập nhật Sentiment/Emotion]
   ```

3. **Cập Nhật UI** (Real-time hoặc Polling):
   ```
   [Frontend Polling] → [Check AI Analysis Status] → [Update UI khi hoàn thành]
   ```

### WebSocket hoặc Server-Sent Events (Optional)

Để cập nhật real-time:
```java
@MessageMapping("/channel/{channelId}/status")
public void sendAnalysisStatus(String channelId) {
    // Gửi status updates
    messagingTemplate.convertAndSend(
        "/topic/channel/" + channelId + "/status",
        analysisStatus
    );
}
```

---

## Xử Lý Lỗi

### Các Trường Hợp Lỗi

1. **Invalid URL**:
   - Status: 400 Bad Request
   - Message: "Invalid YouTube URL format"

2. **Channel Not Found**:
   - Status: 404 Not Found
   - Message: "Channel not found"

3. **YouTube API Quota Exceeded**:
   - Status: 429 Too Many Requests
   - Message: "API quota exceeded. Please try again later."

4. **Network Error**:
   - Status: 503 Service Unavailable
   - Message: "YouTube API service unavailable"

5. **Unauthorized**:
   - Status: 401 Unauthorized
   - Message: "Authentication required"

### Retry Logic

```java
@Retryable(
    value = {QuotaExceededException.class},
    maxAttempts = 3,
    backoff = @Backoff(delay = 60000) // 1 minute
)
public ChannelInfo fetchChannelInfoWithRetry(String channelId) {
    return youtubeApiService.fetchChannelInfo(channelId);
}
```

---

## Tối Ưu Hóa

### 1. Caching
- Cache channel info trong Redis (TTL: 1 hour)
- Cache video list (TTL: 6 hours)
- Cache metrics (TTL: 15 minutes)

### 2. Batch Processing
- Lấy comments theo batch (100 comments/lần)
- Xử lý AI theo batch để tăng hiệu suất

### 3. Lazy Loading
- Chỉ lấy comments khi user vào trang Comment Sentiment
- Load videos theo trang (pagination)

### 4. Database Indexing
```sql
CREATE INDEX idx_channel_id ON channels(channel_id);
CREATE INDEX idx_video_channel ON videos(channel_id);
CREATE INDEX idx_comment_video ON comments(video_id);
CREATE INDEX idx_comment_sentiment ON comments(sentiment, emotion);
```

---

## Sequence Diagram

```
User          Frontend         Backend        YouTube API      Database      AI Module
 |               |                |                |               |              |
 |--[Nhập URL]-->|                |                |               |              |
 |               |--[POST /analyze]-->|           |               |              |
 |               |                |--[Validate]-->|               |              |
 |               |                |<--[OK]--------|               |              |
 |               |                |--[Check DB]-->|               |              |
 |               |                |<--[Not Found]-|               |              |
 |               |                |--[Fetch Channel]-->|          |              |
 |               |                |<--[Channel Data]--|           |              |
 |               |                |--[Save Channel]---->|          |              |
 |               |                |--[Fetch Videos]--->|          |              |
 |               |                |<--[Videos Data]----|           |              |
 |               |                |--[Save Videos]----->|          |              |
 |               |                |--[Response]-------->|          |              |
 |               |<--[Success]----|                |               |              |
 |               |--[Fetch Metrics]-->|           |               |              |
 |               |<--[Metrics]----|                |               |              |
 |               |--[Render UI]-->|                |               |              |
 |               |                |--[Async: Fetch Comments]------>|              |
 |               |                |<--[Comments]--------|           |              |
 |               |                |--[Save Comments]--->|          |              |
 |               |                |--[Send to AI]---------------------->|         |
 |               |                |<--[Analysis Result]-----------------|         |
 |               |                |--[Update Comments]-->|          |              |
```

---

## Tóm Tắt

1. **User nhập URL** → Frontend validate và gửi request
2. **Backend validate URL** → Parse để lấy channel/video ID
3. **Kiểm tra Database** → Tránh gọi API không cần thiết
4. **Gọi YouTube API** → Lấy channel info, videos, comments
5. **Lưu vào Database** → Persist dữ liệu
6. **Gọi AI Module** → Phân tích sentiment/emotion (async)
7. **Trả về Response** → Thông báo thành công
8. **Frontend cập nhật UI** → Hiển thị metrics và charts

**Lưu ý**: Comments và AI analysis được xử lý bất đồng bộ để không block response ban đầu.

