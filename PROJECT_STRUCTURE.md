# Project Structure Overview

## Tổng Quan Dự Án

YouTube AI Analytics - Hệ thống phân tích và gợi ý nội dung cho YouTube channels sử dụng AI.

## Cấu Trúc Tổng Thể

```
youtubeai/
├── frontend/              # React + Vite frontend
├── backend/               # Spring Boot backend
├── ai_module/             # Python Flask AI service
├── database/              # Database schema và scripts
├── CHUC_NANG_UI.md        # Mô tả chức năng UI
├── LUONG_QUY_TRINH_LAY_DU_LIEU.md  # Luồng quy trình
└── PROJECT_STRUCTURE.md   # File này
```

## Database

### Schema
- **File**: `database/schema.sql`
- **Database**: MySQL (`youtubeai`)
- **Tables**: 9 bảng chính + 3 views

### Các Bảng Chính:
1. `users` - Người dùng
2. `user_preferences` - Preferences (dark mode, language)
3. `channels` - Kênh YouTube
4. `videos` - Video YouTube
5. `comments` - Bình luận
6. `analytics` - Analytics theo ngày
7. `video_topics` - Chủ đề video
8. `video_topic_mapping` - Mapping video-topic
9. `keywords` - Từ khóa từ bình luận

### Xem chi tiết:
- `database/README.md` - Documentation đầy đủ
- `database/schema.sql` - SQL schema

## Backend (Spring Boot)

### Cấu Trúc
- **Package**: `com.example.backend`
- **Framework**: Spring Boot 3.5.6
- **Database**: MySQL với JPA/Hibernate
- **Security**: Spring Security + JWT

### Các Package Chính:
- `config/` - Configuration classes
- `controller/` - REST Controllers
- `service/` - Business logic
- `repository/` - Data access layer
- `model/` - Entity models
- `dto/` - Data Transfer Objects
- `security/` - Security & JWT
- `util/` - Utilities
- `exception/` - Exception handling
- `task/` - Scheduled tasks

### Xem chi tiết:
- `backend/STRUCTURE.md` - Cấu trúc đầy đủ
- `backend/src/main/java/com/example/backend/util/YouTubeUrlParser.java` - Example utility

## AI Module (Python Flask)

### Cấu Trúc
- **Framework**: Flask 3.1.2
- **ML Libraries**: scikit-learn, numpy, pandas
- **NLP**: underthesea (Vietnamese NLP)

### Các Module Chính:
- `app/api/` - API endpoints
- `app/services/` - Business logic
- `app/models/` - ML models
- `app/utils/` - Utilities
- `app/data/` - Data files (models, vocabularies)
- `app/scripts/` - Training scripts

### API Endpoints:
- `POST /api/analyze-sentiment` - Phân tích sentiment
- `POST /api/extract-keywords` - Trích xuất keywords
- `POST /api/classify-topics` - Phân loại topics
- `POST /api/generate-content` - Tạo nội dung
- `POST /api/analytics/*` - Analytics endpoints

### Xem chi tiết:
- `ai_module/STRUCTURE.md` - Cấu trúc đầy đủ
- `ai_module/main.py` - Entry point
- `ai_module/app/` - Application code

## Frontend (React)

### Cấu Trúc
- **Framework**: React + Vite
- **Routing**: React Router
- **State Management**: Context API

### Các Trang Chính:
- `pages/Dashboard/` - Dashboard
- `pages/VideoAnalytics/` - Video Analytics
- `pages/CommentSentiment/` - Comment Sentiment
- `pages/CommunityInsights/` - Community Insights
- `pages/AISuggestion/` - AI Suggestions
- `pages/Settings/` - Settings

### Components:
- `components/AppLayout/` - Main layout
- `components/Panel/` - Panel component
- `components/FilterTabs/` - Filter tabs

## Luồng Dữ Liệu

### 1. User nhập URL
```
Frontend → Backend → YouTube API → Database
```

### 2. Phân tích AI
```
Backend → AI Module → ML Models → Results → Database
```

### 3. Hiển thị dữ liệu
```
Frontend → Backend API → Database → Frontend
```

Xem chi tiết: `LUONG_QUY_TRINH_LAY_DU_LIEU.md`

## Setup & Installation

### 1. Database
```bash
# Tạo database
mysql -u root -p
CREATE DATABASE youtubeai CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# Import schema
mysql -u root -p youtubeai < database/schema.sql
```

### 2. Backend
```bash
cd backend
# Cập nhật application.properties với database credentials
mvn clean install
mvn spring-boot:run
```

### 3. AI Module
```bash
cd ai_module
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate    # Windows
pip install -r requirements.txt
python main.py
```

### 4. Frontend
```bash
cd frontend
npm install
npm run dev
```

## Environment Variables

### Backend (`application.properties`)
```properties
spring.datasource.url=jdbc:mysql://localhost:3306/youtubeai
spring.datasource.username=root
spring.datasource.password=
jwt.secret=your-secret-key
youtube.api.key=your-youtube-api-key
ai.module.url=http://localhost:5000
```

### AI Module (`.env`)
```env
FLASK_ENV=development
PORT=5000
SENTIMENT_MODEL_PATH=app/data/models/sentiment_model.pkl
EMOTION_MODEL_PATH=app/data/models/emotion_model.pkl
TOPIC_MODEL_PATH=app/data/models/topic_model.pkl
CORS_ORIGINS=http://localhost:8080,http://localhost:5173
```

## API Documentation

### Backend APIs
- Base URL: `http://localhost:8080/api`
- Authentication: JWT Bearer token

### AI Module APIs
- Base URL: `http://localhost:5000/api`
- CORS enabled

Xem chi tiết endpoints trong:
- `CHUC_NANG_UI.md` - Section "Tóm Tắt API Endpoints"

## Development Workflow

1. **Database**: Tạo schema và migrate
2. **Backend**: Implement controllers, services, repositories
3. **AI Module**: Train models và implement services
4. **Frontend**: Implement UI components và integrate APIs
5. **Testing**: Unit tests, integration tests
6. **Deployment**: Configure production environment

## Next Steps

1. ✅ Database schema - Hoàn thành
2. ✅ Project structure - Hoàn thành
3. ⏳ Implement backend entities và repositories
4. ⏳ Implement backend services và controllers
5. ⏳ Train AI models
6. ⏳ Implement AI services
7. ⏳ Integrate frontend với backend APIs
8. ⏳ Testing và optimization

## Resources

- [Database Schema](database/README.md)
- [Backend Structure](backend/STRUCTURE.md)
- [AI Module Structure](ai_module/STRUCTURE.md)
- [UI Functions](CHUC_NANG_UI.md)
- [Data Flow](LUONG_QUY_TRINH_LAY_DU_LIEU.md)

