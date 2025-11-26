# 🔬 CÔNG NGHỆ PHÂN LOẠI BÌNH LUẬN - CHI TIẾT KỸ THUẬT

## 📚 TỔNG QUAN CÔNG NGHỆ

### **Công nghệ chính:**
- **Machine Learning Framework**: **scikit-learn** (Python)
- **Phương pháp**: **Text Classification** (Supervised Learning)
- **Mô hình**: **Pipeline** kết hợp TF-IDF Vectorization + Classifier
- **Thư viện hỗ trợ**: **underthesea** (Vietnamese NLP), **joblib** (Model serialization)

---

## 🏗️ KIẾN TRÚC MÔ HÌNH

### **1. Sentiment Analysis Model (3 lớp)**
```
Input: Bình luận text
  ↓
Preprocessing (TextProcessor)
  ↓
TF-IDF Vectorization (chuyển text → số)
  ↓
Classifier (SVM/Naive Bayes/Logistic Regression)
  ↓
Output: positive | negative | neutral
```

### **2. Emotion Classification Model (5 lớp)**
```
Input: Bình luận text
  ↓
Preprocessing (TextProcessor)
  ↓
TF-IDF Vectorization
  ↓
Classifier
  ↓
Output: happy | sad | angry | suggestion | love
```

---

## 🔧 CHI TIẾT CÔNG NGHỆ

### **A. TEXT PREPROCESSING (Tiền xử lý văn bản)**

**Mục đích**: Chuẩn hóa text để model dễ học hơn

**Các bước:**

#### **1. Lowercase Conversion**
```python
# Input: "Video NÀY RẤT HAY!"
# Output: "video này rất hay!"
text = text.lower()
```

#### **2. Remove URLs & Emails**
```python
# Input: "Xem thêm tại https://youtube.com/watch?v=abc"
# Output: "Xem thêm tại "
text = re.sub(r'http\S+|www\S+', '', text)
text = re.sub(r'\S+@\S+', '', text)
```

#### **3. Remove Extra Whitespace**
```python
# Input: "Video    này    rất    hay"
# Output: "Video này rất hay"
text = re.sub(r'\s+', ' ', text)
text = text.strip()
```

**Ví dụ thực tế:**
```python
# Comment gốc:
"Video này RẤT HAY!!! Xem tại https://youtube.com/watch?v=abc    Tuyệt vời!"

# Sau preprocessing:
"video này rất hay!!! xem tại tuyệt vời!"
```

---

### **B. TF-IDF VECTORIZATION (Chuyển đổi text → số)**

**TF-IDF là gì?**
- **TF (Term Frequency)**: Tần suất từ xuất hiện trong document
- **IDF (Inverse Document Frequency)**: Độ hiếm của từ trong toàn bộ corpus
- **Mục đích**: Chuyển text thành vector số để ML model có thể xử lý

**Ví dụ minh họa:**

#### **Bước 1: Tạo Vocabulary từ Training Data**
```python
# Giả sử có 3 comments trong training data:
comments = [
    "video này rất hay",
    "video này không hay",
    "video này bình thường"
]

# Vocabulary (từ điển):
vocabulary = {
    "video": 0,
    "này": 1,
    "rất": 2,
    "hay": 3,
    "không": 4,
    "bình": 5,
    "thường": 6
}
```

#### **Bước 2: Tính TF-IDF cho mỗi comment**
```python
from sklearn.feature_extraction.text import TfidfVectorizer

vectorizer = TfidfVectorizer(
    max_features=5000,      # Tối đa 5000 từ quan trọng nhất
    ngram_range=(1, 2),     # Unigram + Bigram (1 từ, 2 từ)
    min_df=2,               # Từ phải xuất hiện ít nhất 2 lần
    max_df=0.95             # Bỏ qua từ xuất hiện > 95% documents
)

# Fit và transform
X = vectorizer.fit_transform(comments)

# Kết quả: Mỗi comment → vector số (sparse matrix)
# Ví dụ comment "video này rất hay":
# [0.5, 0.3, 0.8, 0.6, 0.0, 0.0, 0.0, ...]
#  ↑     ↑    ↑    ↑
# video này rất hay
```

**Ví dụ cụ thể:**
```python
# Comment: "Video này rất hay"
# Vector (simplified):
{
    "video": 0.3,    # TF-IDF score
    "này": 0.2,
    "rất": 0.5,      # Từ "rất" quan trọng (tăng cường ý nghĩa)
    "hay": 0.8,      # Từ "hay" rất quan trọng (từ khóa chính)
    "video_này": 0.4,  # Bigram
    "rất_hay": 0.9     # Bigram quan trọng nhất
}
```

---

### **C. CLASSIFIER (Bộ phân loại)**

**Các thuật toán phổ biến:**

#### **1. Naive Bayes (MultinomialNB)**
- **Ưu điểm**: Nhanh, hiệu quả với text classification
- **Cách hoạt động**: Tính xác suất từng lớp dựa trên Bayes Theorem

```python
from sklearn.naive_bayes import MultinomialNB

model = MultinomialNB(alpha=1.0)  # alpha = smoothing parameter
model.fit(X_train, y_train)        # X_train: TF-IDF vectors, y_train: labels

# Predict
prediction = model.predict(X_test)
# Output: "positive"
```

#### **2. Support Vector Machine (SVM)**
- **Ưu điểm**: Chính xác cao, xử lý tốt với nhiều features
- **Cách hoạt động**: Tìm đường biên tối ưu để phân tách các lớp

```python
from sklearn.svm import SVC

model = SVC(kernel='linear', C=1.0)
model.fit(X_train, y_train)
```

#### **3. Logistic Regression**
- **Ưu điểm**: Nhanh, dễ interpret, cho probability scores
- **Cách hoạt động**: Sử dụng sigmoid function để tính xác suất

```python
from sklearn.linear_model import LogisticRegression

model = LogisticRegression(max_iter=1000)
model.fit(X_train, y_train)

# Predict với probability
probabilities = model.predict_proba(X_test)
# Output: [0.1, 0.8, 0.1] → 80% positive, 10% negative, 10% neutral
```

---

## 📊 VÍ DỤ THỰC TẾ - TỪNG BƯỚC

### **Ví dụ 1: Phân tích Sentiment**

#### **Input:**
```python
comment = "Video này quá tuyệt vời! Cảm ơn bạn rất nhiều ❤️"
```

#### **Bước 1: Preprocessing**
```python
from app.utils.text_processor import TextProcessor

processor = TextProcessor()
processed = processor.preprocess(comment)

# Kết quả:
# "video này quá tuyệt vời! cảm ơn bạn rất nhiều ❤️"
```

#### **Bước 2: Vectorization**
```python
# Model đã được train, có sẵn vectorizer
# Transform comment thành vector
vector = vectorizer.transform([processed])

# Vector (simplified):
# {
#   "video": 0.2,
#   "này": 0.1,
#   "tuyệt": 0.7,      # Từ tích cực mạnh
#   "vời": 0.6,
#   "cảm_ơn": 0.8,     # Bigram tích cực
#   "rất": 0.4,
#   "nhiều": 0.3,
#   "tuyệt_vời": 0.9   # Bigram rất tích cực
# }
```

#### **Bước 3: Prediction**
```python
# Sentiment Model
sentiment_model = model_loader.get_sentiment_model()

# Predict
sentiment = sentiment_model.predict(vector)[0]
# Output: "positive"

# Predict với probability
proba = sentiment_model.predict_proba(vector)[0]
# Output: [0.05, 0.90, 0.05]
#         ↑     ↑     ↑
#      negative positive neutral
# Confidence: 90% positive
```

#### **Bước 4: Emotion Classification**
```python
# Emotion Model
emotion_model = model_loader.get_emotion_model()

emotion = emotion_model.predict(vector)[0]
# Output: "love" (vì có "cảm ơn", "❤️")

proba = emotion_model.predict_proba(vector)[0]
# Output: [0.1, 0.1, 0.1, 0.1, 0.6]
#         ↑    ↑    ↑    ↑    ↑
#      happy sad angry suggestion love
# Confidence: 60% love
```

#### **Kết quả cuối cùng:**
```json
{
  "sentiment": "positive",
  "emotion": "love",
  "confidence": 0.75  // (0.90 + 0.60) / 2
}
```

---

### **Ví dụ 2: Comment tiêu cực**

#### **Input:**
```python
comment = "Video này chán quá, không hay gì cả 😞"
```

#### **Bước 1: Preprocessing**
```python
processed = "video này chán quá, không hay gì cả 😞"
```

#### **Bước 2: Vectorization**
```python
# Vector highlights:
# {
#   "chán": 0.8,        # Từ tiêu cực mạnh
#   "không": 0.6,       # Phủ định
#   "hay": 0.3,         # Nhưng bị phủ định
#   "chán_quá": 0.9,    # Bigram tiêu cực
#   "không_hay": 0.7    # Bigram phủ định
# }
```

#### **Bước 3: Prediction**
```python
sentiment = "negative"  # Confidence: 85%
emotion = "sad"         # Confidence: 70%
```

---

### **Ví dụ 3: Comment trung lập**

#### **Input:**
```python
comment = "Có thể cải thiện phần âm thanh một chút"
```

#### **Kết quả:**
```python
sentiment = "neutral"   # Không tích cực, không tiêu cực
emotion = "suggestion"   # Đưa ra góp ý
```

---

## 🎓 QUY TRÌNH TRAINING MODEL

### **Bước 1: Chuẩn bị Training Data**

**Format CSV:**
```csv
text,label
"Video này rất hay",positive
"Video này không hay",negative
"Có thể cải thiện",neutral
"Tuyệt vời quá",positive
...
```

**Ví dụ dataset:**
```python
# Sentiment Training Data (3 classes)
sentiment_data = [
    ("Video này rất hay", "positive"),
    ("Tuyệt vời quá", "positive"),
    ("Video này không hay", "negative"),
    ("Chán quá", "negative"),
    ("Có thể cải thiện", "neutral"),
    ("Bình thường", "neutral"),
    # ... hàng nghìn examples
]

# Emotion Training Data (5 classes)
emotion_data = [
    ("Video này rất hay", "happy"),
    ("Cảm ơn bạn", "love"),
    ("Chán quá", "sad"),
    ("Tức giận", "angry"),
    ("Có thể cải thiện", "suggestion"),
    # ... hàng nghìn examples
]
```

### **Bước 2: Training Pipeline**

```python
from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.model_selection import train_test_split

# Tách features và labels
X = [text for text, label in data]
y = [label for text, label in data]

# Tách train/test
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# Tạo pipeline
pipeline = Pipeline([
    ('tfidf', TfidfVectorizer(
        max_features=5000,
        ngram_range=(1, 2),
        min_df=2,
        max_df=0.95
    )),
    ('classifier', MultinomialNB(alpha=1.0))
])

# Training
pipeline.fit(X_train, y_train)

# Evaluate
accuracy = pipeline.score(X_test, y_test)
print(f"Accuracy: {accuracy:.2%}")

# Save model
import joblib
joblib.dump(pipeline, 'sentiment_model.pkl')
```

### **Bước 3: Model Evaluation**

```python
from sklearn.metrics import classification_report, confusion_matrix

# Predict test set
y_pred = pipeline.predict(X_test)

# Classification Report
print(classification_report(y_test, y_pred))

# Output:
#               precision    recall  f1-score   support
#     negative       0.85      0.82      0.83       200
#      neutral       0.78      0.80      0.79       150
#     positive       0.88      0.90      0.89       250
#     accuracy                           0.85       600
#    macro avg       0.84      0.84      0.84       600
```

---

## 💻 CODE IMPLEMENTATION TRONG DỰ ÁN

### **File: `ai_module/app/services/sentiment_service.py`**

```python
from app.models.model_loader import ModelLoader
from app.utils.text_processor import TextProcessor

model_loader = ModelLoader()
text_processor = TextProcessor()

class SentimentService:
    def analyze(self, text):
        # 1. Preprocess
        processed_text = text_processor.preprocess(text)
        # "Video này RẤT HAY!!!" → "video này rất hay!!!"
        
        # 2. Get models
        sentiment_model = model_loader.get_sentiment_model()
        emotion_model = model_loader.get_emotion_model()
        
        # 3. Predict sentiment
        sentiment_pred = sentiment_model.predict([processed_text])[0]
        # Output: "positive"
        
        sentiment_proba = sentiment_model.predict_proba([processed_text])[0]
        # Output: [0.05, 0.90, 0.05] → max = 0.90
        sentiment_confidence = max(sentiment_proba)
        
        # 4. Predict emotion
        emotion_pred = emotion_model.predict([processed_text])[0]
        # Output: "happy"
        
        emotion_proba = emotion_model.predict_proba([processed_text])[0]
        emotion_confidence = max(emotion_proba)
        
        # 5. Return result
        return {
            'sentiment': sentiment_pred,      # "positive"
            'emotion': emotion_pred,          # "happy"
            'confidence': (sentiment_confidence + emotion_confidence) / 2
        }
```

### **File: `ai_module/app/api/sentiment.py`**

```python
from flask import Blueprint, request, jsonify
from app.services.sentiment_service import SentimentService

bp = Blueprint('sentiment', __name__)
sentiment_service = SentimentService()

@bp.route('/analyze-sentiment', methods=['POST'])
def analyze_sentiment():
    data = request.get_json()
    text = data['text']
    
    # Analyze
    result = sentiment_service.analyze(text)
    
    return jsonify(result), 200

# Example request:
# POST http://localhost:5000/api/analyze-sentiment
# Body: { "text": "Video này rất hay!" }
# Response: { "sentiment": "positive", "emotion": "happy", "confidence": 0.85 }
```

---

## 🔄 LUỒNG XỬ LÝ TRONG HỆ THỐNG

### **Khi Backend nhận comment mới:**

```
1. Backend (Java) lưu comment vào DB
   Comment {
     content: "Video này rất hay!",
     is_analyzed: false
   }

2. Backend gọi AI Module (Python Flask)
   POST http://localhost:5000/api/analyze-sentiment
   Body: { "text": "Video này rất hay!" }

3. AI Module xử lý:
   a. Preprocess: "video này rất hay!"
   b. TF-IDF Vectorization
   c. Sentiment Model → "positive" (90% confidence)
   d. Emotion Model → "happy" (80% confidence)

4. AI Module trả về:
   {
     "sentiment": "positive",
     "emotion": "happy",
     "confidence": 0.85
   }

5. Backend cập nhật DB:
   Comment {
     sentiment: "positive",
     emotion: "happy",
     sentiment_score: 0.85,
     is_analyzed: true,
     analyzed_at: "2024-01-15 10:30:00"
   }
```

---

## 📈 CẢI THIỆN ĐỘ CHÍNH XÁC

### **1. Tăng chất lượng Training Data**
- Thu thập nhiều comments thực tế từ YouTube
- Cân bằng số lượng mỗi lớp (balanced dataset)
- Label chính xác (human annotation)

### **2. Feature Engineering**
- Thêm emoji detection (❤️ → love, 😞 → sad)
- Thêm negation handling ("không hay" → negative)
- Sử dụng word embeddings (Word2Vec, FastText)

### **3. Model Tuning**
```python
# Grid Search để tìm hyperparameters tốt nhất
from sklearn.model_selection import GridSearchCV

param_grid = {
    'tfidf__max_features': [3000, 5000, 10000],
    'classifier__alpha': [0.5, 1.0, 1.5]
}

grid_search = GridSearchCV(pipeline, param_grid, cv=5)
grid_search.fit(X_train, y_train)
best_model = grid_search.best_estimator_
```

### **4. Advanced Models (Optional)**
- **Transformers**: BERT, PhoBERT (Vietnamese BERT)
- **Deep Learning**: LSTM, BiLSTM với word embeddings
- **Ensemble**: Kết hợp nhiều models

---

## 🎯 TÓM TẮT

### **Công nghệ:**
- **Framework**: scikit-learn (Python)
- **Method**: Text Classification với TF-IDF + Classifier
- **Models**: 2 models riêng biệt (Sentiment 3 lớp, Emotion 5 lớp)

### **Quy trình:**
1. **Preprocessing** → Chuẩn hóa text
2. **Vectorization** → Chuyển text → số (TF-IDF)
3. **Classification** → Model dự đoán lớp
4. **Confidence** → Tính độ tin cậy

### **Ví dụ:**
- "Video này rất hay!" → positive, happy (85% confidence)
- "Chán quá" → negative, sad (80% confidence)
- "Có thể cải thiện" → neutral, suggestion (75% confidence)

---

## 📚 TÀI LIỆU THAM KHẢO

- [scikit-learn Text Classification](https://scikit-learn.org/stable/tutorial/text_analytics/working_with_text_data.html)
- [TF-IDF Explained](https://en.wikipedia.org/wiki/Tf%E2%80%93idf)
- [Naive Bayes for Text Classification](https://scikit-learn.org/stable/modules/naive_bayes.html)
- [Vietnamese NLP with underthesea](https://github.com/undertheseanlp/underthesea)

