# Fine-tune PhoBERT trên Kaggle với VLSP 2016 (sentiment 3 lớp) và áp dụng vào project

Mục tiêu:
- Train sentiment 3 lớp `negative/neutral/positive` trên dataset `VLSP2016 Sentiment Analysis`
- Export theo format HuggingFace để project `ai_module` load bằng `transformers.AutoModelForSequenceClassification.from_pretrained(...)`
- Copy model vào đúng thư mục và chạy kiểm tra.

---

## 1) Chuẩn bị

### Dataset (khuyến nghị)
Trên HuggingFace, dataset VLSP2016 sentiment là:
- `ura-hcmut/vlsp2016`

Dataset có các split:
- `train`
- `test`

Schema trên viewer thường là:
- cột nhãn: `Class` (string: `negative`, `neutral`, `positive`)
- cột text: `Data` (string)

> Trong notebook Kaggle, bạn nên `print(ds.column_names)` để chắc chắn.

### Bật GPU trên Kaggle
- Trong Kaggle Notebook: chọn GPU T4/P100 nếu có.

---

## 2) Tạo notebook Kaggle mới

Trong Kaggle:
- New Notebook
- chọn Runtime dùng Python
- bật GPU

Tạo các cell theo thứ tự dưới đây.

---

## 3) Cài dependencies

```python
!pip -q install transformers datasets accelerate evaluate torch
```

---

## 4) Load dataset VLSP2016

```python
from datasets import load_dataset

ds = load_dataset("ura-hcmut/vlsp2016")
print(ds)
print("Train columns:", ds["train"].column_names)
print("Test columns:", ds["test"].column_names)
print("Sample:", ds["train"][0])
```

Nếu output cho thấy text là `Data` và label là `Class` thì tiếp tục như hướng dẫn.
Nếu tên cột khác, bạn chỉ cần đổi lại ở các bước bên dưới.

---

## 5) Chuẩn hóa label đúng với project của bạn

Project `ai_module/app/services/sentiment_service.py` đang dùng thứ tự:
- `sentiment_labels = ["negative", "neutral", "positive"]`

Vì vậy bạn cần ép mapping index theo đúng thứ tự đó.

```python
from transformers import AutoTokenizer, AutoModelForSequenceClassification

label_list_project = ["negative", "neutral", "positive"]
label2id = {l:i for i,l in enumerate(label_list_project)}
id2label = {i:l for l,i in label2id.items()}

print("label2id:", label2id)
```

Chuẩn bị map từng dòng trong dataset:

```python
TEXT_COL = "Data"   # nếu khác thì sửa ở đây
LABEL_COL = "Class" # nếu khác thì sửa ở đây

def map_label(batch):
    # batch[...]
    label_str = batch[LABEL_COL]
    # label_str phải thuộc {negative, neutral, positive}
    return {"labels": label2id[label_str]}

train_ds = ds["train"]
test_ds = ds["test"]

train_ds = train_ds.map(map_label)
test_ds = test_ds.map(map_label)
```

Kiểm tra nhanh:

```python
print(train_ds[0])
print("unique labels:", set(train_ds["labels"]))
```

---

## 6) Tokenize bằng PhoBERT tokenizer

```python
model_name = "vinai/phobert-base"
tokenizer = AutoTokenizer.from_pretrained(model_name, use_fast=True)

def tokenize_fn(batch):
    return tokenizer(
        batch[TEXT_COL],
        truncation=True,
        padding=False,
        max_length=256
    )

train_tok = train_ds.map(tokenize_fn, batched=True)
test_tok = test_ds.map(tokenize_fn, batched=True)

# Transformers Trainer thường cần cột: input_ids, attention_mask, labels
cols_to_keep = ["input_ids", "attention_mask", "labels"]
train_tok = train_tok.remove_columns([c for c in train_tok.column_names if c not in cols_to_keep])
test_tok = test_tok.remove_columns([c for c in test_tok.column_names if c not in cols_to_keep])
```

---

## 7) Fine-tune PhoBERT (sequence classification)

```python
import numpy as np
from transformers import TrainingArguments, Trainer

model = AutoModelForSequenceClassification.from_pretrained(
    model_name,
    num_labels=3,
    id2label=id2label,
    label2id=label2id
)

def compute_metrics(eval_pred):
    logits, labels = eval_pred
    preds = np.argmax(logits, axis=-1)
    acc = (preds == labels).mean()
    return {"accuracy": acc}

output_dir = "phobert_vlsp2016_sentiment_export"

args = TrainingArguments(
    output_dir=output_dir,
    learning_rate=2e-5,
    per_device_train_batch_size=16,
    per_device_eval_batch_size=32,
    num_train_epochs=3,
    weight_decay=0.01,
    evaluation_strategy="epoch",
    save_strategy="epoch",
    load_best_model_at_end=True,
    metric_for_best_model="accuracy",
    logging_steps=50,
    fp16=True,  # nếu GPU hỗ trợ; nếu lỗi thì tắt
    report_to="none"
)

trainer = Trainer(
    model=model,
    args=args,
    train_dataset=train_tok,
    eval_dataset=test_tok,
    tokenizer=tokenizer,
    compute_metrics=compute_metrics
)

trainer.train()
```

---

## 8) Export model/tokenizer để đưa vào project

Sau khi train xong:

```python
trainer.save_model(output_dir)
tokenizer.save_pretrained(output_dir)

import os
print("Exported to:", output_dir)
print("Files:", os.listdir(output_dir)[:30])
```

Bạn cần đảm bảo folder export có các file tối thiểu:
- `config.json`
- weights: `pytorch_model.bin` hoặc `model.safetensors`
- tokenizer: `tokenizer_config.json` + `vocab.txt` (hoặc các file tokenizer khác)

Sau đó Kaggle:
- zip folder `output_dir`
- tải về máy

---

## 9) Copy vào project `ai_module`

Trong máy local:

1) Giải nén model export ra folder.
2) Copy toàn bộ folder export vào:

`ai_module/app/data/models/phobert_sentiment/`

> Lưu ý: Code project chỉ bật PhoBERT nếu:
> - `phobert_sentiment` tồn tại
> - `phobert_emotion` tồn tại

Nếu bạn chưa train emotion riêng thì **giữ nguyên** `phobert_emotion` hiện có (base hoặc model cũ), không xóa.

---

## 10) Kiểm tra PhoBERT đã load đúng chưa

```bash
cd ai_module
source .venv/bin/activate
python check_phobert_models.py
```

Bạn cần thấy ít nhất:
- `✅ Sentiment model is complete!` (không báo thiếu config/weights/tokenizer)
- `✅ Emotion model is complete!` (nếu vẫn dùng base emotion thì nó vẫn phải tồn tại)

---

## 11) Chạy thử phân loại / áp dụng cho project

Chạy AI module:
```bash
python main.py
```

Sau đó backend sẽ tự gọi AI module để phân tích comments (scheduler).

Nếu bạn muốn test nhanh 1 endpoint:
- `POST /api/analyze-sentiment`
- hoặc `POST /api/analyze-sentiment/batch`

---

## Ghi chú quan trọng (để tránh “train xong nhưng project không dùng”)

- Nếu Kaggle chỉ xuất ra **một file `.pt`** (không có `config.json`/tokenizer) thì project của bạn **không thể load** theo `from_pretrained()`.
- Bạn cần export theo HuggingFace format đúng như bước 8.

---

## Nếu bạn muốn mình chỉnh đúng 100% theo notebook của bạn

Bạn gửi giúp mình 2 thứ:
1) Trong notebook Kaggle, `ds["train"].column_names` trả về cái gì (ảnh/chữ)
2) Trong folder output export bạn có các file tên gì (list 5-10 file)

Mình sẽ chỉ đúng bạn cần copy file nào và sửa cột nào trong notebook.

