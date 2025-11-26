# 🚀 HƯỚNG DẪN SETUP VÀ CHẠY PAGE SENTIMENT

## ✅ Đã hoàn thành

### 1. ✅ ChannelId - Lấy từ User Context
- **Backend**: CommentController đã được cập nhật để lấy channelId từ JWT token
- **Frontend**: CommentSentiment tự động lấy channelId từ user's first channel (giống Dashboard)
- **Không cần hardcode** channelId nữa

### 2. ✅ Top Videos API
- **Backend**: Đã thêm endpoint `GET /api/comments/top-videos`
- **Frontend**: Đã tích hợp hiển thị top 3 videos với thumbnail và like count
- **Sử dụng lại** logic từ DashboardService

### 3. ⚠️ PhoBERT Models - Cần Setup

## 📋 Các bước chạy code

### Bước 1: Cài đặt Dependencies

#### Frontend
```bash
cd frontend
npm install
```

#### AI Module

**Option 1: Cài đầy đủ (bao gồm PhoBERT - nặng)**
```bash
cd ai_module
pip install -r requirements.txt
```

**Option 2: Chỉ cài scikit-learn (nhẹ hơn, đủ để chạy)**
```bash
cd ai_module
pip install -r requirements-basic.txt
```

**Lưu ý**: 
- Nếu gặp lỗi với `torch` hoặc `transformers`, dùng Option 2
- Hệ thống sẽ tự động fallback về scikit-learn nếu không có PhoBERT

### Bước 2: Setup PhoBERT Models (Tùy chọn)

**Option A: Sử dụng scikit-learn (Mặc định)**
- Không cần làm gì, hệ thống sẽ tự động fallback
- Models sẽ được tạo khi train (nếu có training data)

**Option B: Sử dụng PhoBERT (Khuyến nghị)**
```bash
cd ai_module/app/data/models
mkdir -p phobert_sentiment phobert_emotion

# Nếu có pre-trained models, copy vào:
# - phobert_sentiment/ (chứa config.json, pytorch_model.bin, etc.)
# - phobert_emotion/ (chứa config.json, pytorch_model.bin, etc.)
```

Xem chi tiết trong file `PHOBERT_SETUP_GUIDE.md`

### Bước 3: Chạy Backend
```bash
cd backend
./mvnw spring-boot:run
# hoặc
mvn spring-boot:run
```

Backend sẽ chạy tại: `http://localhost:8080`

### Bước 4: Chạy AI Module
```bash
cd ai_module
python main.py
# hoặc
flask run --port=5000
```

AI Module sẽ chạy tại: `http://localhost:5000`

### Bước 5: Chạy Frontend
```bash
cd frontend
npm run dev
```

Frontend sẽ chạy tại: `http://localhost:5173`

## 🔍 Kiểm tra hoạt động

### 1. Kiểm tra Backend APIs
```bash
# Test với token (lấy từ login)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8080/api/comments/sentiment-stats?channelId=YOUR_CHANNEL_ID
```

### 2. Kiểm tra AI Module
```bash
curl -X POST http://localhost:5000/api/analyze-sentiment \
  -H "Content-Type: application/json" \
  -d '{"text": "Video này rất hay!"}'
```

### 3. Kiểm tra Frontend
- Mở `http://localhost:5173/sentiment`
- Đăng nhập nếu chưa
- Page sẽ tự động lấy channelId và hiển thị dữ liệu

## 📝 Lưu ý quan trọng

### 1. ChannelId
- ✅ **Đã fix**: Tự động lấy từ user's first channel
- Nếu user chưa có channel, sẽ hiển thị error message
- User cần đồng bộ kênh YouTube trước (từ Dashboard)

### 2. PhoBERT Models
- ⚠️ **Cần setup**: Nếu chưa có models, hệ thống sẽ dùng scikit-learn
- Xem `PHOBERT_SETUP_GUIDE.md` để setup
- Models cần được fine-tuned cho sentiment (3 classes) và emotion (5 classes)

### 3. Top Videos
- ✅ **Đã implement**: Hiển thị top 3 videos nhiều like nhất
- Sử dụng endpoint `/api/comments/top-videos`
- Hiển thị thumbnail, title, và like count

## 🐛 Troubleshooting

### Lỗi: "Bạn chưa kết nối kênh YouTube nào"
- **Giải pháp**: Vào Dashboard, nhập URL kênh YouTube và đồng bộ

### Lỗi: "AI Module returned null response"
- **Giải pháp**: Kiểm tra AI Module đang chạy tại port 5000
- Kiểm tra logs của AI Module

### Lỗi: "PhoBERT models not found"
- **Giải pháp**: Đây là warning, không phải error
- Hệ thống sẽ tự động dùng scikit-learn
- Nếu muốn dùng PhoBERT, setup models theo `PHOBERT_SETUP_GUIDE.md`

### Comments không được phân tích
- **Giải pháp**: Kiểm tra ScheduledAnalysisService đang chạy
- Kiểm tra logs: `analyzing comments...`
- Đảm bảo AI Module đang hoạt động

## 📊 Flow hoạt động

1. User mở page Sentiment
2. Frontend lấy channelId từ user's first channel
3. Gọi API để lấy comments, stats, top videos
4. Backend query database và trả về
5. Scheduled job tự động phân tích comments chưa được analyze
6. AI Module xử lý và trả kết quả
7. Backend cập nhật database
8. Frontend hiển thị kết quả

## ✅ Checklist

- [x] Backend: CommentController với authentication
- [x] Backend: Top Videos endpoint
- [x] Backend: ChannelId resolution từ user
- [x] Frontend: Lấy channelId tự động
- [x] Frontend: Top Videos display
- [x] AI Module: PhoBERT support với fallback
- [ ] PhoBERT models setup (tùy chọn)
- [ ] Training data cho models (nếu cần)

