# Fine-tune PhoBERT trên Kaggle và đưa vào project

Tài liệu này hướng dẫn bạn:
1. Chuẩn bị dataset CSV (chỉ tích cực/tiêu cực hoặc có neutral)
2. Fine-tune `vinai/phobert-base` bằng `transformers.Trainer`
3. Export model ra đúng dạng HuggingFace (`config.json`, weights, tokenizer)
4. Copy vào project để `ai_module/app/services/sentiment_service.py` tự load
5. Chạy test bằng `check_phobert_models.py`
6. (Quan trọng) Trường hợp dataset chỉ có 2 lớp: “positive/negative” → cần điều chỉnh code của project để tránh map nhãn sai

---

## 0) Project của bạn đang load PhoBERT như thế nào?

Trong `ai_module/app/services/sentiment_service.py`, code load PhoBERT theo 2 đường dẫn:

- `app/data/models/phobert_sentiment`
- `app/data/models/phobert_emotion`

Hệ thống chỉ bật PhoBERT khi **cả 2 thư mục đều tồn tại**:
```py
if os.path.exists(sentiment_model_path) and os.path.exists(emotion_model_path):
    self.use_phobert = True
```

Vì vậy:
- Nếu bạn **chỉ train sentiment**, bạn vẫn phải giữ `phobert_emotion` (base model/đã có sẵn) để không bị fallback sang scikit-learn.

---

## 1) Chuẩn bị dataset trên Kaggle

Giả sử file CSV của bạn có các cột:
- `prod` (product)
- `com` (comment text)
- `rat` (nhãn/đánh giá)

Bạn cần chuyển `rat` thành label cho bài toán sentiment.

### 1.1 Trường hợp A: dataset của bạn đã là nhị phân (chỉ tích/tiêu)

Ví dụ `rat` chỉ có 2 giá trị (0/1 hoặc âm/dương). Bạn chỉ cần map thẳng.

Ví dụ mapping phổ biến:
- `rat <= 2` → `negative`
- `rat >= 4` → `positive`
- `rat == 3` → có thể loại (hoặc map thành neutral nếu bạn muốn train 3 lớp)

### 1.2 Trường hợp B: `rat` là rating 1..5

Nếu bạn chỉ train tích/tiêu (không train neutral), cách đơn giản là:
- giữ những dòng `rat <= 2` (negative)
- giữ những dòng `rat >= 4` (positive)
- xóa dòng `rat == 3` để đúng “2 lớp”

---

## 2) Notebook Kaggle: fine-tune PhoBERT sentiment (2 lớp)

Trong Kaggle, ở ô “Set up” cài dependency:

```python
!pip -q install transformers datasets evaluate accelerate torch
```

### 2.1 Import và load CSV

```python
import pandas as pd

csv_path = "/kaggle/input/<ten-folder-cua-ban>/final_train_dataset.csv"
df = pd.read_csv(csv_path)
df.head()
```

### 2.2 Tạo label `negative/positive`

Ví dụ nếu `rat` là 1..5:

```python
def map_label(r):
    if r <= 2:
        return "negative"
    if r >= 4:
        return "positive"
    return None  # loại neutral

df["label"] = df["rat"].apply(map_label)
df = df.dropna(subset=["label"]).reset_index(drop=True)
df["label"].value_counts()
```

### 2.3 Chuẩn bị HuggingFace Dataset

```python
from datasets import Dataset

train_ds = Dataset.from_pandas(df[["com", "label"]], preserve_index=False)
train_ds = train_ds.rename_column("com", "text")
```

### 2.4 Tokenize và mô hình

```python
from transformers import AutoTokenizer, AutoModelForSequenceClassification

model_name = "vinai/phobert-base"
tokenizer = AutoTokenizer.from_pretrained(model_name)

label_list = ["negative", "positive"]
label2id = {l:i for i,l in enumerate(label_list)}
id2label = {i:l for l,i in label2id.items()}

num_labels = 2

def tokenize_fn(batch):
    return tokenizer(
        batch["text"],
        truncation=True,
        padding="max_length",
        max_length=256
    )

train_ds = train_ds.map(tokenize_fn, batched=True)
train_ds = train_ds.map(lambda b: {"labels": label2id[b["label"]]}, batched=False)
```

### 2.5 Fine-tune bằng Trainer

```python
from transformers import TrainingArguments, Trainer
import numpy as np

def compute_metrics(eval_pred):
    logits, labels = eval_pred
    preds = np.argmax(logits, axis=-1)
    acc = (preds == labels).mean()
    return {"accuracy": acc}

model = AutoModelForSequenceClassification.from_pretrained(
    model_name,
    num_labels=num_labels,
    id2label=id2label,
    label2id=label2id
)

args = TrainingArguments(
    output_dir="phobert_sentiment_export",
    learning_rate=2e-5,
    per_device_train_batch_size=16,
    num_train_epochs=3,
    evaluation_strategy="epoch",
    save_strategy="epoch",
    logging_steps=50,
    load_best_model_at_end=False
)

trainer = Trainer(
    model=model,
    args=args,
    train_dataset=train_ds,
    eval_dataset=None,
    compute_metrics=compute_metrics
)

trainer.train()
```

> Bạn có thể chia train/validation nếu muốn, nhưng để “export để dùng”, cách tối thiểu vẫn làm được.

---

## 3) Export model đúng chuẩn HuggingFace (cực quan trọng)

Sau khi train xong, bạn phải `save_model` và `save_pretrained`.

```python
output_dir = "phobert_sentiment_export"
trainer.save_model(output_dir)
tokenizer.save_pretrained(output_dir)
```

Sau đó nén/Download folder `phobert_sentiment_export`.

### 3.1 Dấu hiệu export đúng

Trong folder export phải có ít nhất:
- `config.json`
- weights: `pytorch_model.bin` hoặc `model.safetensors`
- tokenizer: `tokenizer_config.json` và/hoặc `vocab.txt`

Nếu output của bạn chỉ có file dạng `.pt` (ví dụ `best_model_wav2vec2.pt`) thì **không phù hợp** với cách project bạn đang load.

---

## 4) Copy model vào project

Giải nén model export về máy, rồi copy nội dung folder:

### 4.1 Sentiment

Copy toàn bộ folder export vào:
- `ai_module/app/data/models/phobert_sentiment/`

### 4.2 Emotion

Nếu bạn chưa train emotion, hãy giữ nguyên:
- `ai_module/app/data/models/phobert_emotion/`

để đảm bảo PhoBERT mode được bật.

---

## 5) Kiểm tra PhoBERT có load được không

Chạy:

```bash
cd ai_module
source .venv/bin/activate
python check_phobert_models.py
```

Bạn cần thấy:
- `✅ Sentiment model is complete!`
- `✅ Emotion model is complete!`

Nếu thiếu `config.json` hoặc thiếu weights/tokenizer files → cần export lại.

---

## 6) (Quan trọng) Nếu bạn train chỉ 2 lớp: positive/negative thì project có thể map sai nhãn

`sentiment_service.py` hiện tại giả định sentiment có 3 nhãn:
- `["negative", "neutral", "positive"]`

Nếu model bạn export có `num_labels=2`, việc map index có thể bị lệch (vd index 1 sẽ bị coi là `neutral` thay vì `positive`).

### 6.1 Cách xử lý an toàn (khuyến nghị)

Bạn cần sửa `ai_module/app/services/sentiment_service.py` để:
1. Nhận `num_labels` từ `self.sentiment_model.config.num_labels`
2. Nếu `num_labels==2` thì map:
   - idx 0 → `negative`
   - idx 1 → `positive`
3. Gán `neutral` theo confidence threshold (ví dụ `0.65~0.75`) khi model không chắc

Sau đó emotion:
- hoặc để emotion model dự đoán bình thường
- hoặc dùng rule từ sentiment + keyword/tính độc hại (để phù hợp với bộ label emotion hiện tại của project)

> Nếu bạn muốn, bạn gửi mình đoạn CSV label mapping và bạn đang train `num_labels=2` hay `3`, mình sẽ đưa patch code đúng vị trí trong `sentiment_service.py`.

---

## 7) Checklist kết thúc

1. Kaggle export folder `phobert_sentiment_export` có `config.json` + weights + tokenizer
2. Copy vào `ai_module/app/data/models/phobert_sentiment/`
3. Giữ `ai_module/app/data/models/phobert_emotion/` (không để rỗng)
4. Chạy `check_phobert_models.py`
5. Restart `python main.py` và kiểm tra logs có load PhoBERT

