# 🎯 HỆ THỐNG PHÂN TÍCH SENTIMENT - TỔNG QUAN TOÀN DIỆN

## 📋 MỤC LỤC
1. [Tổng quan hệ thống](#tổng-quan-hệ-thống)
2. [Kiến trúc & Công nghệ](#kiến-trúc--công-nghệ)
3. [Quy trình xử lý](#quy-trình-xử-lý)
4. [Implementation Details](#implementation-details)
5. [Tối ưu hóa & Performance](#tối-ưu-hóa--performance)
6. [API Specifications](#api-specifications)

---

## 🏗️ TỔNG QUAN HỆ THỐNG

### **Mục tiêu:**
Phân tích sentiment và emotion của comments YouTube để:
- Lọc bình luận theo cảm xúc (Tích cực/Tiêu cực/Trung lập)
- Thống kê từng loại cảm xúc (Vui vẻ, Buồn chán, Công kích, Góp ý, Yêu thích)
- Hiển thị Top 3 video nhiều like nhất
- Biểu đồ phân bố cảm xúc (Pie Chart)

### **Luồng dữ liệu tổng thể:**
```
┌─────────────┐
│   User      │ Nhập URL kênh YouTube
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│  Frontend        │ React + Vite
│  (React)        │
└──────┬──────────┘
       │ HTTP POST /api/analyze-url
       ▼
┌─────────────────┐
│  Backend         │ Spring Boot
│  (Java)         │
└──────┬──────────┘
       │
       ├──► YouTube API ──► Lấy videos & comments
       │
       ├──► MySQL Database ──► Lưu comments (is_analyzed=false)
       │
       └──► @Async Background Job ──► Phân tích comments
                │
                ▼
       ┌─────────────────┐
       │  AI Module       │ Python Flask
       │  (PhoBERT)      │
       └──────┬──────────┘
              │
              ├──► Sentiment Model ──► positive/negative/neutral
              │
              └──► Emotion Model ──► happy/sad/angry/suggestion/love
                     │
                     ▼
       ┌─────────────────┐
       │  Backend         │ Cập nhật DB
       │  (Java)         │ sentiment, emotion, is_analyzed=true
       └──────┬──────────┘
              │
              ▼
       ┌─────────────────┐
       │  Frontend        │ Hiển thị kết quả
       │  (React)        │
       └─────────────────┘
```

---

## 🛠️ KIẾN TRÚC & CÔNG NGHỆ

### **1. Frontend Layer**
**Công nghệ:**
- **Framework**: React 19 + Vite
- **State Management**: React Context + Hooks
- **HTTP Client**: Fetch API / Axios
- **Charts**: Recharts hoặc Chart.js
- **UI Components**: Custom components (Panel, FilterTabs)

**Chức năng:**
- Nhập URL kênh YouTube
- Hiển thị danh sách comments (lọc theo sentiment/emotion)
- Hiển thị thống kê và biểu đồ
- Pagination cho danh sách comments

---

### **2. Backend Layer (Java Spring Boot)**
**Công nghệ:**
- **Framework**: Spring Boot 3.x
- **ORM**: JPA/Hibernate
- **Database**: MySQL
- **Async Processing**: Spring @Async + ExecutorService
- **Scheduling**: @Scheduled (cron jobs)
- **HTTP Client**: RestTemplate / WebClient (gọi AI Module)

**Components:**
- **Controllers**: REST API endpoints
- **Services**: Business logic
- **Repositories**: Data access layer
- **Models/Entities**: Database schema
- **DTOs**: Data transfer objects

**Key Services:**
- `YouTubeAnalysisService`: Lấy dữ liệu từ YouTube API
- `CommentService`: Quản lý comments, query, filtering
- `SentimentAnalysisService`: Gọi AI Module, xử lý async
- `ScheduledAnalysisService`: Background job phân tích comments

---

### **3. AI Module Layer (Python Flask)**
**Công nghệ:**
- **Framework**: Flask 3.x
- **NLP Model**: **PhoBERT** (Vietnamese BERT)
- **Libraries**: 
  - `transformers` (Hugging Face) - Load PhoBERT
  - `torch` (PyTorch) - Deep learning framework
  - `underthesea` - Vietnamese NLP utilities
  - `numpy`, `pandas` - Data processing

**Models:**
- **Sentiment Classification**: 3 classes (positive, negative, neutral)
- **Emotion Classification**: 5 classes (happy, sad, angry, suggestion, love)

**Architecture:**
```
PhoBERT Base Model (Pre-trained)
    ↓
Fine-tuned Sentiment Head (3 classes)
    ↓
Fine-tuned Emotion Head (5 classes)
```

---

### **4. Database Layer (MySQL)**
**Tables:**
- `comments`: Lưu comments với sentiment, emotion, is_analyzed
- `videos`: Lưu thông tin video
- `channels`: Lưu thông tin kênh

**Key Fields (comments table):**
```sql
sentiment VARCHAR(20)        -- positive, negative, neutral
emotion VARCHAR(50)          -- happy, sad, angry, suggestion, love
sentiment_score DECIMAL(5,4)  -- Confidence score 0-1
is_analyzed BOOLEAN           -- Đã phân tích chưa
analyzed_at TIMESTAMP         -- Thời gian phân tích
```

---

## 🔄 QUY TRÌNH XỬ LÝ

### **PHASE 1: Thu thập dữ liệu**

#### **Bước 1.1: User nhập URL kênh**
```
Frontend → POST /api/analyze-url
Body: { "url": "https://youtube.com/channel/..." }
```

#### **Bước 1.2: Backend lấy dữ liệu từ YouTube API**
```java
YouTubeAnalysisService.analyzeUrl(userId, url)
  ├── Parse URL → Channel ID
  ├── Get channel info (YouTube API)
  ├── Get videos list (YouTube API)
  └── Get comments for each video (YouTube API)
```

#### **Bước 1.3: Lưu vào Database**
```java
// Lưu comments với is_analyzed = false
Comment comment = new Comment();
comment.setContent("Video này rất hay!");
comment.setIsAnalyzed(false);  // Chưa phân tích
comment.setSentiment(null);
comment.setEmotion(null);
commentRepository.save(comment);
```

**Kết quả:** Comments được lưu vào DB, chờ phân tích.

---

### **PHASE 2: Phân tích Sentiment & Emotion (Async)**

#### **Bước 2.1: Scheduled Job phát hiện comments chưa phân tích**
```java
@Scheduled(fixedDelay = 60000) // Mỗi 60 giây
public void analyzePendingComments() {
    List<Comment> unanalyzed = commentRepository
        .findByIsAnalyzedFalse(PageRequest.of(0, 50));
    
    if (!unanalyzed.isEmpty()) {
        analyzeCommentsAsync(unanalyzed);
    }
}
```

#### **Bước 2.2: Async Processing - Gửi batch đến AI Module**
```java
@Async
public void analyzeCommentsAsync(List<Comment> comments) {
    // 1. Chuẩn bị batch
    List<String> texts = comments.stream()
        .map(Comment::getContent)
        .collect(Collectors.toList());
    
    // 2. Gọi AI Module
    String aiUrl = "http://localhost:5000/api/analyze-sentiment/batch";
    BatchAnalysisRequest request = new BatchAnalysisRequest(texts);
    
    RestTemplate restTemplate = new RestTemplate();
    BatchAnalysisResponse response = restTemplate.postForObject(
        aiUrl, request, BatchAnalysisResponse.class
    );
    
    // 3. Cập nhật database
    for (int i = 0; i < comments.size(); i++) {
        Comment comment = comments.get(i);
        AnalysisResult result = response.getResults().get(i);
        
        comment.setSentiment(result.getSentiment());
        comment.setEmotion(result.getEmotion());
        comment.setSentimentScore(result.getConfidence());
        comment.setIsAnalyzed(true);
        comment.setAnalyzedAt(LocalDateTime.now());
        
        commentRepository.save(comment);
    }
}
```

#### **Bước 2.3: AI Module xử lý với PhoBERT**
```python
# ai_module/app/services/sentiment_service.py

from transformers import AutoModel, AutoTokenizer
import torch

class SentimentService:
    def __init__(self):
        # Load PhoBERT model
        self.model_name = "vinai/phobert-base"
        self.tokenizer = AutoTokenizer.from_pretrained(self.model_name)
        self.sentiment_model = AutoModel.from_pretrained(
            "path/to/fine-tuned-sentiment-model"
        )
        self.emotion_model = AutoModel.from_pretrained(
            "path/to/fine-tuned-emotion-model"
        )
    
    def analyze(self, text):
        # 1. Tokenize
        inputs = self.tokenizer(
            text,
            return_tensors="pt",
            padding=True,
            truncation=True,
            max_length=256
        )
        
        # 2. Predict sentiment
        with torch.no_grad():
            sentiment_output = self.sentiment_model(**inputs)
            sentiment_logits = sentiment_output.logits
            sentiment_probs = torch.softmax(sentiment_logits, dim=-1)
            sentiment_pred = torch.argmax(sentiment_probs, dim=-1).item()
            sentiment_confidence = sentiment_probs[0][sentiment_pred].item()
        
        # 3. Predict emotion
        with torch.no_grad():
            emotion_output = self.emotion_model(**inputs)
            emotion_logits = emotion_output.logits
            emotion_probs = torch.softmax(emotion_logits, dim=-1)
            emotion_pred = torch.argmax(emotion_probs, dim=-1).item()
            emotion_confidence = emotion_probs[0][emotion_pred].item()
        
        # 4. Map to labels
        sentiment_labels = ["negative", "neutral", "positive"]
        emotion_labels = ["sad", "angry", "suggestion", "happy", "love"]
        
        return {
            'sentiment': sentiment_labels[sentiment_pred],
            'emotion': emotion_labels[emotion_pred],
            'confidence': (sentiment_confidence + emotion_confidence) / 2
        }
    
    def analyze_batch(self, texts):
        # Batch processing với PhoBERT
        results = []
        batch_size = 32  # Process 32 comments at once
        
        for i in range(0, len(texts), batch_size):
            batch = texts[i:i+batch_size]
            batch_results = self._analyze_batch(batch)
            results.extend(batch_results)
        
        return results
```

**Kết quả:** Comments được phân tích và cập nhật trong DB.

---

### **PHASE 3: Hiển thị dữ liệu trên Frontend**

#### **Bước 3.1: Lọc comments theo Sentiment**
```
Frontend → GET /api/comments/sentiment?channelId=1&sentiment=positive
Backend → Query DB → Trả về danh sách comments
Frontend → Hiển thị danh sách
```

#### **Bước 3.2: Thống kê Sentiment/Emotion**
```
Frontend → GET /api/comments/sentiment-stats?channelId=1
Backend → Aggregate query → Trả về counts
Frontend → Hiển thị biểu đồ tròn
```

#### **Bước 3.3: Top 3 videos**
```
Frontend → GET /api/videos/top-liked?channelId=1&limit=3
Backend → Query videos ORDER BY like_count DESC
Frontend → Hiển thị top 3
```

---

## 💻 IMPLEMENTATION DETAILS

### **1. Backend - Spring Boot Configuration**

#### **Async Configuration**
```java
@Configuration
@EnableAsync
public class AsyncConfig {
    
    @Bean(name = "sentimentAnalysisExecutor")
    public Executor sentimentAnalysisExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(5);
        executor.setMaxPoolSize(10);
        executor.setQueueCapacity(100);
        executor.setThreadNamePrefix("sentiment-");
        executor.initialize();
        return executor;
    }
}
```

#### **Scheduled Service**
```java
@Service
@RequiredArgsConstructor
@Slf4j
public class ScheduledAnalysisService {
    
    private final CommentRepository commentRepository;
    private final SentimentAnalysisService sentimentService;
    
    @Scheduled(fixedDelay = 60000) // Mỗi 60 giây
    public void analyzePendingComments() {
        log.info("Checking for unanalyzed comments...");
        
        Pageable pageable = PageRequest.of(0, 50);
        Page<Comment> unanalyzed = commentRepository
            .findByIsAnalyzedFalse(pageable);
        
        if (unanalyzed.hasContent()) {
            log.info("Found {} unanalyzed comments", unanalyzed.getNumberOfElements());
            sentimentService.analyzeCommentsAsync(unanalyzed.getContent());
        }
    }
}
```

#### **Sentiment Analysis Service**
```java
@Service
@RequiredArgsConstructor
@Slf4j
public class SentimentAnalysisService {
    
    private final CommentRepository commentRepository;
    private final RestTemplate restTemplate;
    
    @Value("${ai.module.url:http://localhost:5000}")
    private String aiModuleUrl;
    
    @Async("sentimentAnalysisExecutor")
    public void analyzeCommentsAsync(List<Comment> comments) {
        try {
            // 1. Prepare batch
            List<String> texts = comments.stream()
                .map(Comment::getContent)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
            
            if (texts.isEmpty()) return;
            
            // 2. Call AI Module
            String url = aiModuleUrl + "/api/analyze-sentiment/batch";
            BatchAnalysisRequest request = new BatchAnalysisRequest(texts);
            
            BatchAnalysisResponse response = restTemplate.postForObject(
                url, request, BatchAnalysisResponse.class
            );
            
            if (response == null || response.getResults() == null) {
                log.error("AI Module returned null response");
                return;
            }
            
            // 3. Update comments
            List<AnalysisResult> results = response.getResults();
            for (int i = 0; i < comments.size() && i < results.size(); i++) {
                Comment comment = comments.get(i);
                AnalysisResult result = results.get(i);
                
                comment.setSentiment(result.getSentiment());
                comment.setEmotion(result.getEmotion());
                comment.setSentimentScore(BigDecimal.valueOf(result.getConfidence()));
                comment.setIsAnalyzed(true);
                comment.setAnalyzedAt(LocalDateTime.now());
                
                commentRepository.save(comment);
            }
            
            log.info("Successfully analyzed {} comments", comments.size());
            
        } catch (Exception e) {
            log.error("Error analyzing comments", e);
        }
    }
}
```

#### **Comment Service & Controller**
```java
@Service
@RequiredArgsConstructor
public class CommentService {
    
    private final CommentRepository commentRepository;
    
    public Page<Comment> getCommentsBySentiment(
            Long channelId, String sentiment, Pageable pageable) {
        return commentRepository.findByChannelIdAndSentiment(
            channelId, sentiment, pageable
        );
    }
    
    public Page<Comment> getCommentsByEmotion(
            Long channelId, String emotion, Pageable pageable) {
        return commentRepository.findByChannelIdAndEmotion(
            channelId, emotion, pageable
        );
    }
    
    public SentimentStatsDTO getSentimentStats(Long channelId) {
        // Aggregate queries
        Map<String, Long> sentimentCounts = commentRepository
            .countSentimentByChannelId(channelId);
        Map<String, Long> emotionCounts = commentRepository
            .countEmotionByChannelId(channelId);
        
        return SentimentStatsDTO.builder()
            .sentiment(sentimentCounts)
            .emotion(emotionCounts)
            .build();
    }
}
```

```java
@RestController
@RequestMapping("/api/comments")
@RequiredArgsConstructor
public class CommentController {
    
    private final CommentService commentService;
    
    @GetMapping("/sentiment")
    public ResponseEntity<Page<CommentDTO>> getCommentsBySentiment(
            @RequestParam Long channelId,
            @RequestParam String sentiment,
            @PageableDefault(size = 20) Pageable pageable) {
        
        Page<Comment> comments = commentService.getCommentsBySentiment(
            channelId, sentiment, pageable
        );
        
        Page<CommentDTO> dtos = comments.map(this::toDTO);
        return ResponseEntity.ok(dtos);
    }
    
    @GetMapping("/emotion")
    public ResponseEntity<Page<CommentDTO>> getCommentsByEmotion(
            @RequestParam Long channelId,
            @RequestParam String emotion,
            @PageableDefault(size = 20) Pageable pageable) {
        
        Page<Comment> comments = commentService.getCommentsByEmotion(
            channelId, emotion, pageable
        );
        
        Page<CommentDTO> dtos = comments.map(this::toDTO);
        return ResponseEntity.ok(dtos);
    }
    
    @GetMapping("/sentiment-stats")
    public ResponseEntity<SentimentStatsDTO> getSentimentStats(
            @RequestParam Long channelId) {
        
        SentimentStatsDTO stats = commentService.getSentimentStats(channelId);
        return ResponseEntity.ok(stats);
    }
}
```

---

### **2. AI Module - PhoBERT Implementation**

#### **Updated Sentiment Service**
```python
# ai_module/app/services/sentiment_service.py

from transformers import AutoModelForSequenceClassification, AutoTokenizer
import torch
from typing import List, Dict

class SentimentService:
    """Service using PhoBERT for sentiment and emotion analysis"""
    
    def __init__(self):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        
        # Load tokenizer
        self.tokenizer = AutoTokenizer.from_pretrained("vinai/phobert-base")
        
        # Load sentiment model (fine-tuned)
        self.sentiment_model = AutoModelForSequenceClassification.from_pretrained(
            "app/data/models/phobert_sentiment"
        ).to(self.device)
        self.sentiment_model.eval()
        
        # Load emotion model (fine-tuned)
        self.emotion_model = AutoModelForSequenceClassification.from_pretrained(
            "app/data/models/phobert_emotion"
        ).to(self.device)
        self.emotion_model.eval()
        
        # Labels
        self.sentiment_labels = ["negative", "neutral", "positive"]
        self.emotion_labels = ["sad", "angry", "suggestion", "happy", "love"]
    
    def analyze(self, text: str) -> Dict:
        """Analyze single text"""
        # Tokenize
        inputs = self.tokenizer(
            text,
            return_tensors="pt",
            padding=True,
            truncation=True,
            max_length=256
        ).to(self.device)
        
        # Predict sentiment
        with torch.no_grad():
            sentiment_output = self.sentiment_model(**inputs)
            sentiment_probs = torch.softmax(sentiment_output.logits, dim=-1)
            sentiment_pred = torch.argmax(sentiment_probs, dim=-1).item()
            sentiment_conf = sentiment_probs[0][sentiment_pred].item()
        
        # Predict emotion
        with torch.no_grad():
            emotion_output = self.emotion_model(**inputs)
            emotion_probs = torch.softmax(emotion_output.logits, dim=-1)
            emotion_pred = torch.argmax(emotion_probs, dim=-1).item()
            emotion_conf = emotion_probs[0][emotion_pred].item()
        
        return {
            'sentiment': self.sentiment_labels[sentiment_pred],
            'emotion': self.emotion_labels[emotion_pred],
            'confidence': round((sentiment_conf + emotion_conf) / 2, 4)
        }
    
    def analyze_batch(self, texts: List[str]) -> List[Dict]:
        """Analyze batch of texts efficiently"""
        results = []
        batch_size = 16  # Adjust based on GPU memory
        
        for i in range(0, len(texts), batch_size):
            batch = texts[i:i+batch_size]
            batch_results = self._analyze_batch_internal(batch)
            results.extend(batch_results)
        
        return results
    
    def _analyze_batch_internal(self, texts: List[str]) -> List[Dict]:
        """Internal batch processing"""
        # Tokenize batch
        inputs = self.tokenizer(
            texts,
            return_tensors="pt",
            padding=True,
            truncation=True,
            max_length=256
        ).to(self.device)
        
        # Predict sentiment batch
        with torch.no_grad():
            sentiment_output = self.sentiment_model(**inputs)
            sentiment_probs = torch.softmax(sentiment_output.logits, dim=-1)
            sentiment_preds = torch.argmax(sentiment_probs, dim=-1)
            sentiment_confs = torch.max(sentiment_probs, dim=-1)[0]
        
        # Predict emotion batch
        with torch.no_grad():
            emotion_output = self.emotion_model(**inputs)
            emotion_probs = torch.softmax(emotion_output.logits, dim=-1)
            emotion_preds = torch.argmax(emotion_probs, dim=-1)
            emotion_confs = torch.max(emotion_probs, dim=-1)[0]
        
        # Build results
        results = []
        for i in range(len(texts)):
            results.append({
                'text': texts[i],
                'sentiment': self.sentiment_labels[sentiment_preds[i].item()],
                'emotion': self.emotion_labels[emotion_preds[i].item()],
                'confidence': round(
                    (sentiment_confs[i].item() + emotion_confs[i].item()) / 2,
                    4
                )
            })
        
        return results
```

#### **Updated Requirements**
```txt
# ai_module/requirements.txt

# Web Framework
Flask==3.1.2
flask-cors==4.0.0

# Deep Learning & NLP
transformers==4.40.0
torch==2.1.0
underthesea==1.3.0

# Utilities
numpy==2.3.3
pandas==2.3.3
python-dotenv==1.0.0
```

---

### **3. Frontend - React Implementation**

#### **Comment Service**
```javascript
// frontend/src/services/commentService.js

import apiClient from './apiClient';

export const getCommentsBySentiment = (channelId, sentiment, page = 0, size = 20) => {
  return apiClient.get('/comments/sentiment', {
    params: { channelId, sentiment, page, size }
  });
};

export const getCommentsByEmotion = (channelId, emotion, page = 0, size = 20) => {
  return apiClient.get('/comments/emotion', {
    params: { channelId, emotion, page, size }
  });
};

export const getSentimentStats = (channelId) => {
  return apiClient.get('/comments/sentiment-stats', {
    params: { channelId }
  });
};

export const getEmotionChartData = (channelId) => {
  return apiClient.get('/comments/emotion-chart', {
    params: { channelId }
  });
};
```

#### **Updated CommentSentiment Component**
```javascript
// frontend/src/pages/CommentSentiment/CommentSentiment.jsx

import { useState, useEffect } from 'react';
import { getCommentsBySentiment, getCommentsByEmotion, getSentimentStats } from '../../services/commentService';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const sentimentFilters = ['Tích cực', 'Tiêu cực', 'Trung lập'];
const sentimentMap = {
  'Tích cực': 'positive',
  'Tiêu cực': 'negative',
  'Trung lập': 'neutral'
};

const emotionFilters = [
  { value: 'happy', label: '😊 Vui vẻ' },
  { value: 'sad', label: '😞 Buồn chán' },
  { value: 'angry', label: '😡 Công kích' },
  { value: 'suggestion', label: '💬 Góp ý' },
  { value: 'love', label: '❤️ Yêu thích' },
];

export default function CommentSentiment() {
  const [activeSentiment, setActiveSentiment] = useState(sentimentFilters[0]);
  const [activeEmotion, setActiveEmotion] = useState(emotionFilters[0].value);
  const [comments, setComments] = useState([]);
  const [emotionComments, setEmotionComments] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const channelId = 1; // Get from context/params

  useEffect(() => {
    loadSentimentComments();
  }, [activeSentiment, channelId]);

  useEffect(() => {
    loadEmotionComments();
  }, [activeEmotion, channelId]);

  useEffect(() => {
    loadStats();
  }, [channelId]);

  const loadSentimentComments = async () => {
    setLoading(true);
    try {
      const response = await getCommentsBySentiment(
        channelId,
        sentimentMap[activeSentiment]
      );
      setComments(response.data.content);
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadEmotionComments = async () => {
    setLoading(true);
    try {
      const response = await getCommentsByEmotion(channelId, activeEmotion);
      setEmotionComments(response.data.content);
    } catch (error) {
      console.error('Error loading emotion comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await getSentimentStats(channelId);
      setStats(response.data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const formatTime = (date) => {
    // Format relative time: "2 giờ trước"
    const now = new Date();
    const commentDate = new Date(date);
    const diffMs = now - commentDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    return `${diffDays} ngày trước`;
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  // Prepare chart data
  const chartData = stats?.emotion ? Object.entries(stats.emotion).map(([key, value]) => ({
    name: emotionFilters.find(e => e.value === key)?.label || key,
    value: value
  })) : [];

  const COLORS = ['#4CAF50', '#2196F3', '#F44336', '#FF9800', '#E91E63'];

  return (
    <div className={styles.screen}>
      {/* Lọc bình luận theo cảm xúc */}
      <Panel variant="light" className={styles.section}>
        <div className={styles.title}>
          <img src={chevronIcon} alt="" />
          <span>Lọc bình luận theo cảm xúc</span>
        </div>
        <FilterTabs
          items={sentimentFilters}
          active={activeSentiment}
          onChange={setActiveSentiment}
        />
        {loading ? (
          <div>Loading...</div>
        ) : (
          <div className={styles.list}>
            {comments.map((comment) => (
              <div key={comment.id} className={styles.row}>
                <div className={styles.avatar}>
                  <img src={comment.authorAvatar} alt={comment.authorName} />
                </div>
                <div className={styles.content}>
                  <div className={styles.meta}>
                    <span className={styles.author}>{comment.authorName}</span>
                    <span>{formatTime(comment.publishedAt)}</span>
                    <span className={styles.divider} />
                    <span className={styles.titleVideo}>{comment.video.title}</span>
                  </div>
                  <div className={styles.text}>{comment.content}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>

      {/* Thống kê từng loại cảm xúc */}
      <Panel variant="light" className={styles.section}>
        <div className={styles.title}>
          <img src={chevronIcon} alt="" />
          <span>Thống kê từng loại cảm xúc</span>
        </div>
        <FilterTabs
          items={emotionFilters}
          active={activeEmotion}
          onChange={setActiveEmotion}
        />
        {/* Similar list for emotion comments */}
      </Panel>

      {/* Biểu đồ cảm xúc */}
      <Panel variant="light">
        <div className={styles.title}>
          <img src={chevronIcon} alt="" />
          <span>Biểu đồ cảm xúc</span>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </Panel>
    </div>
  );
}
```

---

## ⚡ TỐI ƯU HÓA & PERFORMANCE

### **1. Batch Processing**
- **Backend**: Xử lý 50 comments/batch
- **AI Module**: Xử lý 16-32 comments/batch (tùy GPU memory)
- **Lợi ích**: Giảm số lượng HTTP requests, tăng throughput

### **2. Async Processing**
- **Spring @Async**: Không block main thread
- **Scheduled Tasks**: Tự động phát hiện comments chưa phân tích
- **Lợi ích**: User không phải chờ, hệ thống responsive

### **3. Caching**
- **Database Indexing**: Index trên `is_analyzed`, `sentiment`, `emotion`
- **Query Optimization**: Sử dụng pagination, lazy loading
- **Frontend Caching**: Cache stats trong React state

### **4. Model Optimization**
- **PhoBERT Quantization**: Giảm model size, tăng tốc độ
- **Batch Inference**: Xử lý nhiều comments cùng lúc
- **GPU Acceleration**: Sử dụng CUDA nếu có GPU

### **5. Error Handling & Retry**
```java
@Retryable(value = {Exception.class}, maxAttempts = 3)
public void analyzeCommentsAsync(List<Comment> comments) {
    // Retry logic
}
```

---

## 📡 API SPECIFICATIONS

### **Backend APIs**

#### **1. Lọc comments theo Sentiment**
```
GET /api/comments/sentiment
Params:
  - channelId: Long (required)
  - sentiment: String (positive|negative|neutral)
  - page: int (default: 0)
  - size: int (default: 20)

Response:
{
  "content": [
    {
      "id": 1,
      "authorName": "Nguyễn Văn A",
      "authorAvatar": "https://...",
      "content": "Video này rất hay!",
      "likeCount": 120,
      "sentiment": "positive",
      "emotion": "happy",
      "publishedAt": "2024-01-15T10:30:00",
      "video": {
        "id": 1,
        "title": "Video Title"
      }
    }
  ],
  "totalElements": 150,
  "totalPages": 8,
  "size": 20,
  "number": 0
}
```

#### **2. Lọc comments theo Emotion**
```
GET /api/comments/emotion
Params:
  - channelId: Long
  - emotion: String (happy|sad|angry|suggestion|love)
  - page: int
  - size: int

Response: Same format as above
```

#### **3. Thống kê Sentiment/Emotion**
```
GET /api/comments/sentiment-stats?channelId=1

Response:
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

### **AI Module APIs**

#### **1. Phân tích single comment**
```
POST /api/analyze-sentiment
Body: {
  "text": "Video này rất hay!"
}

Response: {
  "sentiment": "positive",
  "emotion": "happy",
  "confidence": 0.85
}
```

#### **2. Phân tích batch comments**
```
POST /api/analyze-sentiment/batch
Body: {
  "texts": ["comment1", "comment2", ...]
}

Response: {
  "results": [
    {
      "text": "comment1",
      "sentiment": "positive",
      "emotion": "happy",
      "confidence": 0.85
    },
    ...
  ]
}
```

---

## 🎯 TÓM TẮT

### **Công nghệ Stack:**
- **Frontend**: React + Vite + Recharts
- **Backend**: Spring Boot + JPA + MySQL + @Async
- **AI Module**: Python Flask + PhoBERT (Transformers)
- **Processing**: Async batch processing với scheduled tasks

### **Quy trình:**
1. User nhập URL → Backend lấy comments từ YouTube API
2. Lưu comments vào DB (is_analyzed=false)
3. Scheduled job phát hiện comments chưa phân tích
4. Async job gửi batch đến AI Module (PhoBERT)
5. AI Module phân tích → Trả kết quả
6. Backend cập nhật DB
7. Frontend hiển thị kết quả với filtering & charts

### **Ưu điểm:**
- ✅ Độ chính xác cao (PhoBERT pre-trained cho tiếng Việt)
- ✅ Không block user (Async processing)
- ✅ Scalable (Batch processing, pagination)
- ✅ Real-time updates (Scheduled tasks)

---

## 📚 TÀI LIỆU THAM KHẢO

- [PhoBERT - Vietnamese BERT](https://github.com/VinAIResearch/PhoBERT)
- [Spring @Async Documentation](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/scheduling/annotation/Async.html)
- [Transformers Library](https://huggingface.co/docs/transformers)
- [Recharts Documentation](https://recharts.org/)

