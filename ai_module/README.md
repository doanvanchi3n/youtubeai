# AI Module - YouTube Analytics

Python Flask service for AI-powered analysis of YouTube data.

## Setup

1. **Create virtual environment**:
```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate    # Windows
```

2. **Install dependencies**:
```bash
pip install -r requirements.txt
```

3. **Configure environment**:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Run the application**:
```bash
python main.py
```

The service will run on `http://localhost:5000`

## API Endpoints

- `GET /health` - Health check
- `POST /api/analyze-sentiment` - Analyze sentiment
- `POST /api/extract-keywords` - Extract keywords
- `POST /api/classify-topics` - Classify topics
- `POST /api/generate-content` - Generate content
- `POST /api/analytics/optimal-posting-time` - Optimal posting time

## Training Models

Train sentiment model:
```bash
python app/scripts/train_sentiment.py --data app/data/training_data/sentiment_data.csv
```

Train emotion model:
```bash
python app/scripts/train_emotion.py --data app/data/training_data/emotion_data.csv
```

Train topic model:
```bash
python app/scripts/train_topic.py --data app/data/training_data/topic_data.csv
```

## Structure

See `STRUCTURE.md` for detailed structure documentation.

