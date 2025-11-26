# 🔧 HƯỚNG DẪN SETUP PHOBERT MODELS

## 📋 Tổng quan

AI Module hỗ trợ 2 chế độ:
1. **PhoBERT** (Ưu tiên): Pre-trained model cho tiếng Việt, độ chính xác cao
2. **scikit-learn** (Fallback): Sử dụng nếu PhoBERT models chưa có

## ⚡ QUICK START (Nhanh nhất)

### Bước 1: Cài dependencies
```bash
cd ai_module
pip install transformers>=4.40.0 torch>=2.2.0
```

Hoặc trên Windows:
```bash
cd ai_module
install_phobert.bat
```

### Bước 2: Setup models tự động
```bash
cd ai_module
python setup_phobert_quick.py
```

Script này sẽ:
- Tạo thư mục models
- Download base PhoBERT
- Tạo sentiment model (3 classes)
- Tạo emotion model (5 classes)

⚠️ **Lưu ý**: Models này chưa được fine-tune, chỉ là base models. Để có độ chính xác cao hơn, cần fine-tune với training data (xem bên dưới).

---

## 🚀 Cách 1: Download Pre-trained Models (Khuyến nghị)

### Bước 1: Tạo thư mục models
```bash
cd ai_module/app/data/models
mkdir -p phobert_sentiment phobert_emotion
```

### Bước 2: Download hoặc Fine-tune Models

**Option A: Sử dụng models có sẵn (nếu có)**
```bash
# Copy models vào thư mục
cp /path/to/phobert_sentiment/* phobert_sentiment/
cp /path/to/phobert_emotion/* phobert_emotion/
```

**Option B: Fine-tune từ PhoBERT base**
```python
# File: ai_module/train_phobert.py
from transformers import AutoTokenizer, AutoModelForSequenceClassification, TrainingArguments, Trainer
from datasets import load_dataset
import torch

# Load base model
model_name = "vinai/phobert-base"
tokenizer = AutoTokenizer.from_pretrained(model_name)

# Load your training data
# Format: CSV with columns: text, label
train_dataset = load_dataset('csv', data_files='training_data/sentiment_data.csv')

# Fine-tune for sentiment (3 classes: negative, neutral, positive)
sentiment_model = AutoModelForSequenceClassification.from_pretrained(
    model_name,
    num_labels=3
)

# Training arguments
training_args = TrainingArguments(
    output_dir='./phobert_sentiment',
    num_train_epochs=3,
    per_device_train_batch_size=16,
    save_steps=500,
    logging_steps=100,
)

trainer = Trainer(
    model=sentiment_model,
    args=training_args,
    train_dataset=train_dataset['train'],
)

trainer.train()
trainer.save_model('./phobert_sentiment')

# Tương tự cho emotion model (5 classes)
```

## 🔄 Cách 2: Sử dụng scikit-learn (Fallback)

Nếu chưa có PhoBERT models, hệ thống sẽ tự động fallback về scikit-learn.

**Tạo models scikit-learn:**
```bash
cd ai_module
python app/scripts/train_sentiment.py --data app/data/training_data/sentiment_data.csv
python app/scripts/train_emotion.py --data app/data/training_data/emotion_data.csv
```

Models sẽ được lưu tại:
- `app/data/models/sentiment_model.pkl`
- `app/data/models/emotion_model.pkl`

## ✅ Kiểm tra Models

Sau khi setup, kiểm tra models:

```python
# Test script
from app.services.sentiment_service import SentimentService

service = SentimentService()
print(f"Using PhoBERT: {service.use_phobert}")

result = service.analyze("Video này rất hay!")
print(result)
```

## 📝 Environment Variables (Optional)

Có thể cấu hình đường dẫn models qua environment variables:

```bash
export PHOBERT_SENTIMENT_MODEL_PATH=app/data/models/phobert_sentiment
export PHOBERT_EMOTION_MODEL_PATH=app/data/models/phobert_emotion
```

Hoặc trong `.env`:
```
PHOBERT_SENTIMENT_MODEL_PATH=app/data/models/phobert_sentiment
PHOBERT_EMOTION_MODEL_PATH=app/data/models/phobert_emotion
```

## 🎯 Kết quả mong đợi

Khi models được load thành công, bạn sẽ thấy trong logs:
```
✓ PhoBERT models loaded successfully
```

Nếu chưa có models:
```
⚠ PhoBERT models not found at app/data/models/phobert_sentiment
  Using scikit-learn fallback
```

## 📚 Tài liệu tham khảo

- [PhoBERT GitHub](https://github.com/VinAIResearch/PhoBERT)
- [Hugging Face Transformers](https://huggingface.co/docs/transformers)
- [Fine-tuning Guide](https://huggingface.co/docs/transformers/training)

