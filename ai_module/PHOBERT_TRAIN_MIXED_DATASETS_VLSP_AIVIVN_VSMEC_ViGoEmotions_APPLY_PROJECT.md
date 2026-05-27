# Fine-tune PhoBERT trên nhiều dataset (Sentiment + Emotion) và đưa vào project

File này hướng dẫn bạn train:
- Sentiment: **VLSP2016 (3 lớp)** + **AIVIVN2019 (2 lớp)** + **Synthetic Vietnamese Students' Feedback** (tùy chọn, mặc định bật khi preprocess)
- Emotion: **VSMEC** + **ViGoEmotions (fine-grained + neutral)**

Rồi export model để project bạn load bằng:
- `ai_module/app/data/models/phobert_sentiment/` (num_labels = 3)
- `ai_module/app/data/models/phobert_emotion/` (num_labels = 5)

---

## 1) Project đang cần nhãn gì?

Trong `ai_module/app/services/sentiment_service.py`:

- Sentiment labels (3 nhãn, đúng thứ tự index):
  - `["negative", "neutral", "positive"]`
- Emotion labels (5 nhãn, đúng thứ tự index):
  - `["sad", "angry", "suggestion", "happy", "love"]`

Nên khi export model bạn cần:
- `num_labels=3` cho sentiment
- `num_labels=5` cho emotion
- `id2label/label2id` phải khớp các nhãn trên

---

## 2) Sentiment training: VLSP2016 + AIVIVN2019

### 2.1 Mapping nhãn AIVIVN (vì AIVIVN chỉ có pos/neg)

AIVIVN 2019 thường là nhị phân:
- `positive` -> `positive`
- `negative` -> `negative`

Không có `neutral` => trung lập vẫn đến từ VLSP2016 (3 lớp).

### 2.2 Ý tưởng training ghép dataset

1. Load image.png (3 lớp) từ HuggingFace.
2. Load AIVIVN2019 (csv từ Kaggle).
3. Load Synthetic Feedback (chỉ câu tiếng Việt).
4. Ghép lại thành 1 dataset chung với cột:
   - `text`
   - `label` (string trong tập `negative/neutral/positive`).
5. Fine-tune `vinai/phobert-base` với `num_labels=3`.

### 2.3 Notebook cell mẫu (sentiment 3 lớp)

#### Cell A: load VLSP2016
```python
from datasets import load_dataset

ds_vlsp = load_dataset("ura-hcmut/vlsp2016")
print(ds_vlsp)
print(ds_vlsp["train"].column_names)
print(ds_vlsp["train"][0])
```

Bạn cần xác nhận 2 cột text/label. Thường là:
- `Data` (text)
- `Class` (negative/neutral/positive)

#### Cell B: map VLSP -> label string project
```python
TEXT_COL = "Data"
LABEL_COL = "Class"

def map_vlsp_labels(example):
    # project expects negative/neutral/positive
    return {"label": example[LABEL_COL]}

train_vlsp = ds_vlsp["train"].map(map_vlsp_labels)
test_vlsp  = ds_vlsp["test"].map(map_vlsp_labels)
```

#### Cell C: load AIVIVN từ Kaggle (tuỳ file bạn dùng)
```python
import pandas as pd
from datasets import Dataset

# ví dụ: df_aivivn = pd.read_csv("/kaggle/input/.../train.csv")
df_aivivn = pd.read_csv("/kaggle/input/<...>/train.csv")  # TODO

# TODO chỉnh cột text/label theo dataset của bạn
TEXT_COL_AIV = "text"   # ví dụ
LABEL_COL_AIV = "label" # ví dụ

def map_aivivn_label(x):
    # AIVIVN (file Kaggle bạn tải): 0=negative, 1=positive
    if x == 0:
        return "negative"
    else:
        return "positive"

df_aivivn["label"] = df_aivivn[LABEL_COL_AIV].apply(map_aivivn_label)
df_aivivn = df_aivivn[[TEXT_COL_AIV, "label"]].rename(columns={TEXT_COL_AIV: "text"})

ds_aivivn = Dataset.from_pandas(df_aivivn, preserve_index=False)
```

#### Cell D: ghép dataset và train
```python
label_list_project = ["negative", "neutral", "positive"]
label2id = {l:i for i,l in enumerate(label_list_project)}
id2label = {i:l for l,i in label2id.items()}

from transformers import AutoTokenizer, AutoModelForSequenceClassification
tokenizer = AutoTokenizer.from_pretrained("vinai/phobert-base", use_fast=True)

def to_train_format(batch):
    return {"text": batch[TEXT_COL]}  # nếu bạn đã rename về text thì không cần

# gợi ý: chuẩn hoá về ds có cột: text, label
# train_vlsp: cần rename Data->text, label->label
# ds_aivivn: đã là text, label

# TODO: implement rename_columns() đúng theo df bạn load
```

> Phần train/export dùng y hệt file notebook mẫu bạn đang theo `transformers.Trainer`:
> - `num_labels=3`
> - `id2label/label2id` đúng thứ tự
> - `trainer.save_model(output_dir)` + `tokenizer.save_pretrained(output_dir)`

---

## 3) Emotion training: VSMEC + ViGoEmotions → map về 5 nhãn project

### 3.1 Nhãn project (5 lớp)
`["sad", "angry", "suggestion", "happy", "love"]`

### 3.2 Mapping VSMEC (gợi ý dễ triển khai)
VSMEC có các nhãn phổ biến: enjoyment, sadness, anger, fear, disgust, surprise, other/neutral.

Mapping gợi ý (để ra đúng 5 bucket):
- `sad`: sadness, fear
- `angry`: anger, disgust
- `happy`: enjoyment, surprise
- `love`: (nếu dataset có love-like thì map vào love; nếu không có thì có thể để trống/giữ ánh xạ)
- `suggestion`: other/neutral

Nếu VSMEC không có love: bạn vẫn phải có bucket `love` trong model → nên ánh xạ 1 phần nhãn tích cực (ví dụ enjoyment) vào `happy`, và giữ `love` làm nhãn hiếm. Kết quả sẽ ổn dần khi có thêm dataset khác.

### 3.3 Mapping ViGoEmotions (gợi ý)
ViGoEmotions có 27 emotion fine-grained + neutral.

Mapping bucket gợi ý:
- `suggestion`: neutral
- `love`: love
- `happy`: amusement, excitement, joy, desire, optimism, caring, admiration, gratitude, relief, approval, realization, surprise, curiosity, pride
- `angry`: anger, annoyance, disapproval, disgust
- `sad`: sadness, grief, disappointment, remorse, embarrassment, confusion, fear, nervousness

### 3.4 Lưu ý cực quan trọng: ViGoEmotions là multi-label
Mỗi comment có thể có **nhiều emotion**.

Trong project của bạn, PhoBERT emotion đang chạy như **multi-class** (argmax trên softmax).

=> Bạn cần chuyển multi-label sang **single-label** bằng cách chọn 1 bucket ưu tiên.

Ví dụ ưu tiên:
1. Nếu có `love` -> love
2. Else nếu có bucket `angry` -> angry
3. Else nếu có bucket `sad` -> sad
4. Else -> happy
5. Nếu chỉ có neutral -> suggestion

Bạn có thể điều chỉnh priority sau khi đánh giá.

### 3.5 Notebook cell mẫu (emotion)
Bạn sẽ:
1. load dataset VSMEC
2. load dataset ViGoEmotions
3. map label -> bucket 5 lớp
4. tạo dataset con có cột `text`, `label` (string)
5. tokenize bằng PhoBERT
6. fine-tune với `num_labels=5`
7. export model & tokenizer

---

## 4) Export để project load được

Sau train:
```python
trainer.save_model(output_dir)
tokenizer.save_pretrained(output_dir)
```

Folder export phải có ít nhất:
- `config.json`
- weights: `pytorch_model.bin` hoặc `model.safetensors`
- tokenizer: `tokenizer_config.json` và/hoặc `vocab.txt`

---

## 5) Copy vào project

Copy:
- Sentiment folder -> `ai_module/app/data/models/phobert_sentiment/`
- Emotion folder   -> `ai_module/app/data/models/phobert_emotion/`

Lưu ý: `phobert_emotion` **phải tồn tại** để bật PhoBERT mode.

---

## 6) Kiểm tra

Chạy:
```bash
cd ai_module
source .venv/bin/activate
python check_phobert_models.py
```

---

## 7) Nếu bạn muốn mình hướng dẫn “đúng 100% theo dataset bạn load”

Bạn gửi giúp mình 2 ảnh/chữ:
1. Trong notebook Kaggle: `print(ds_vlsp["train"].column_names)` và 1 dòng `ds_vlsp["train"][0]`
2. Với ViGoEmotions: `print(ds.shape)` + `ds["train"][0]` (đặc biệt là field label của multi-label)

Mình sẽ chỉnh lại phần mapping + rename cột chính xác theo dataset của bạn.

