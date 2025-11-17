# AI Module Structure (Python Flask)

## Cấu Trúc Thư Mục

```
ai_module/
├── main.py                          # Flask app entry point
├── requirements.txt                 # Python dependencies
├── .env                            # Environment variables
├── README.md                       # Documentation
│
├── app/                            # Main application package
│   ├── __init__.py                 # Flask app factory
│   ├── config.py                   # Configuration
│   │
│   ├── api/                        # API Routes
│   │   ├── __init__.py
│   │   ├── routes.py               # Main routes
│   │   ├── sentiment.py            # Sentiment analysis endpoints
│   │   ├── keywords.py             # Keyword extraction endpoints
│   │   ├── topics.py               # Topic classification endpoints
│   │   ├── content.py              # Content generation endpoints
│   │   └── analytics.py            # Analytics endpoints
│   │
│   ├── services/                   # Business Logic
│   │   ├── __init__.py
│   │   ├── sentiment_service.py   # Sentiment analysis service
│   │   ├── keyword_service.py     # Keyword extraction service
│   │   ├── topic_service.py       # Topic classification service
│   │   ├── content_service.py     # Content generation service
│   │   └── analytics_service.py   # Analytics service
│   │
│   ├── models/                     # ML Models
│   │   ├── __init__.py
│   │   ├── sentiment_model.py      # Sentiment analysis model
│   │   ├── emotion_model.py        # Emotion classification model
│   │   ├── topic_model.py          # Topic classification model
│   │   └── model_loader.py          # Model loading utilities
│   │
│   ├── utils/                       # Utilities
│   │   ├── __init__.py
│   │   ├── text_processor.py      # Text preprocessing
│   │   ├── vietnamese_nlp.py      # Vietnamese NLP utilities
│   │   ├── constants.py            # Constants
│   │   └── validators.py           # Input validation
│   │
│   ├── data/                       # Data files
│   │   ├── models/                 # Saved ML models
│   │   │   ├── sentiment_model.pkl
│   │   │   ├── emotion_model.pkl
│   │   │   └── topic_model.pkl
│   │   ├── vocabularies/           # Vocabulary files
│   │   │   ├── vietnamese_stopwords.txt
│   │   │   └── vietnamese_words.txt
│   │   └── training_data/           # Training datasets
│   │       ├── sentiment_data.csv
│   │       ├── emotion_data.csv
│   │       └── topic_data.csv
│   │
│   └── scripts/                     # Utility scripts
│       ├── train_sentiment.py      # Train sentiment model
│       ├── train_emotion.py        # Train emotion model
│       ├── train_topic.py          # Train topic model
│       ├── preprocess_data.py      # Preprocess training data
│       └── evaluate_model.py       # Evaluate model performance
│
├── tests/                          # Unit tests
│   ├── __init__.py
│   ├── test_sentiment.py
│   ├── test_keywords.py
│   ├── test_topics.py
│   └── test_content.py
│
└── venv/                           # Virtual environment (gitignored)
```

## Mô Tả Các Module

### app/
Main application package chứa tất cả code.

### app/api/
API routes và endpoints:
- **routes.py**: Main routes, health check
- **sentiment.py**: `/api/analyze-sentiment` - Phân tích sentiment
- **keywords.py**: `/api/extract-keywords` - Trích xuất keywords
- **topics.py**: `/api/classify-topics` - Phân loại topics
- **content.py**: `/api/generate-content` - Tạo nội dung
- **analytics.py**: `/api/analytics/*` - Analytics endpoints

### app/services/
Business logic layer:
- **sentiment_service.py**: Logic phân tích sentiment và emotion
- **keyword_service.py**: Logic trích xuất keywords
- **topic_service.py**: Logic phân loại topics
- **content_service.py**: Logic tạo nội dung (có thể dùng LLM API)
- **analytics_service.py**: Logic tính toán analytics

### app/models/
ML Models:
- **sentiment_model.py**: Sentiment analysis model (positive/negative/neutral)
- **emotion_model.py**: Emotion classification model (happy/sad/angry/suggestion/love)
- **topic_model.py**: Topic classification model
- **model_loader.py**: Utilities để load và cache models

### app/utils/
Utilities:
- **text_processor.py**: Text preprocessing (tokenization, normalization, etc.)
- **vietnamese_nlp.py**: Vietnamese NLP utilities (word segmentation, etc.)
- **constants.py**: Application constants
- **validators.py**: Input validation

### app/data/
Data files:
- **models/**: Saved ML models (pickle files)
- **vocabularies/**: Stopwords, word lists
- **training_data/**: Training datasets

### app/scripts/
Training và utility scripts:
- **train_*.py**: Scripts để train models
- **preprocess_data.py**: Preprocess training data
- **evaluate_model.py**: Evaluate model performance

## API Endpoints

### Sentiment Analysis
```
POST /api/analyze-sentiment
Body: { "text": "string" }
Response: {
    "sentiment": "positive|negative|neutral",
    "emotion": "happy|sad|angry|suggestion|love",
    "confidence": 0.95
}
```

### Batch Sentiment Analysis
```
POST /api/analyze-sentiment/batch
Body: { "texts": ["string1", "string2", ...] }
Response: {
    "results": [
        {
            "text": "string1",
            "sentiment": "positive",
            "emotion": "happy",
            "confidence": 0.95
        },
        ...
    ]
}
```

### Keyword Extraction
```
POST /api/extract-keywords
Body: { 
    "texts": ["string1", "string2", ...],
    "max_keywords": 10
}
Response: {
    "keywords": [
        {"keyword": "string", "frequency": 10},
        ...
    ]
}
```

### Topic Classification
```
POST /api/classify-topics
Body: {
    "title": "string",
    "description": "string",
    "comments": ["string1", "string2", ...]
}
Response: {
    "topics": ["topic1", "topic2", ...],
    "confidence": 0.90
}
```

### Content Generation
```
POST /api/generate-content
Body: {
    "description": "string",
    "type": "title|description|tags|script"
}
Response: {
    "content": "string",
    "suggestions": ["suggestion1", "suggestion2", ...]
}
```

### Analytics
```
POST /api/analytics/optimal-posting-time
Body: {
    "view_data": [...],
    "like_data": [...],
    "comment_data": [...]
}
Response: {
    "optimal_hours": [14, 15, 16],
    "optimal_days": ["Monday", "Tuesday"],
    "recommendations": [...]
}
```

## Dependencies

Cập nhật `requirements.txt`:

```txt
Flask==3.1.2
flask-cors==4.0.0
python-dotenv==1.0.0

# ML Libraries
scikit-learn==1.7.2
numpy==2.3.3
pandas==2.3.3
joblib==1.5.2

# NLP Libraries
underthesea==1.3.0  # Vietnamese NLP
vncorenlp==1.0.3    # Vietnamese NLP (optional)
transformers==4.40.0  # For advanced models (optional)
torch==2.1.0        # PyTorch (optional, for transformers)

# Text Processing
regex==2024.5.15
unidecode==1.3.8

# API Client (for LLM if needed)
openai==1.12.0      # OpenAI API (optional)
anthropic==0.18.1   # Claude API (optional)

# Utilities
requests==2.31.0
python-dateutil==2.9.0.post0
```

## Configuration

Tạo file `.env`:

```env
# Flask
FLASK_APP=main.py
FLASK_ENV=development
FLASK_DEBUG=True
PORT=5000

# Model Paths
SENTIMENT_MODEL_PATH=app/data/models/sentiment_model.pkl
EMOTION_MODEL_PATH=app/data/models/emotion_model.pkl
TOPIC_MODEL_PATH=app/data/models/topic_model.pkl

# API Keys (if using external APIs)
OPENAI_API_KEY=your-openai-key
ANTHROPIC_API_KEY=your-anthropic-key

# CORS
CORS_ORIGINS=http://localhost:8080,http://localhost:5173
```

## Model Training

### Sentiment Model
```bash
python app/scripts/train_sentiment.py --data app/data/training_data/sentiment_data.csv
```

### Emotion Model
```bash
python app/scripts/train_emotion.py --data app/data/training_data/emotion_data.csv
```

### Topic Model
```bash
python app/scripts/train_topic.py --data app/data/training_data/topic_data.csv
```

## Running the Application

### Development
```bash
# Activate virtual environment
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows

# Install dependencies
pip install -r requirements.txt

# Run Flask app
python main.py
# or
flask run
```

### Production
```bash
# Use gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 main:app
```

## Notes

- Models được load một lần khi app start và cache trong memory
- Sử dụng batch processing cho performance tốt hơn
- Vietnamese NLP: Có thể dùng `underthesea` hoặc `vncorenlp`
- Content generation: Có thể tích hợp với OpenAI/Claude API hoặc local LLM

