# BÁO CÁO CÔNG VIỆC — HUẤN LUYỆN MÔ HÌNH PhoBERT

**Dự án:** YouTube AI — Phân tích cảm xúc & sắc thái bình luận tiếng Việt  
**Ngày báo cáo:** 27/05/2026  
**Người thực hiện:** [Điền tên nhóm / sinh viên]

---

## 1. Mục tiêu công việc

Xây dựng pipeline huấn luyện hai mô hình **PhoBERT** (`vinai/phobert-base`) phục vụ hệ thống YouTube AI:

| Task | Số lớp | Nhãn |
|------|--------|------|
| **Sentiment** (sắc thái) | 3 | `negative`, `neutral`, `positive` |
| **Emotion** (cảm xúc) | 5 | `sad`, `angry`, `suggestion`, `happy`, `love` |

Mô hình sau khi train được đưa vào `ai_module/app/data/models/` để phân tích bình luận YouTube qua API/backend.

---

## 2. Các công việc đã thực hiện

### 2.1. Thu thập và tổ chức dữ liệu thô

Tải các bộ dataset tiếng Việt từ Kaggle về thư mục `ai_module/data/raw/kaggle_downloads/`:

- **VLSP2016_SA** — sentiment
- **AIVIVN2019** — sentiment
- **Synthetic Vietnamese Students' Feedback** — sentiment
- **UIT-VSMEC (VSMEC)** — emotion
- **ViGoEmotions** — emotion

### 2.2. Tiền xử lý dữ liệu (Data Processing)

Viết và chạy script: `ai_module/app/scripts/preprocess_training_data.py`

**Pipeline:**

1. Chuẩn hóa nhãn theo `label_config` của project
2. Làm sạch văn bản: Unicode NFC, lowercase, loại URL/email, giới hạn 256 ký tự
3. Lọc nhiễu, văn bản quá ngắn, không phải tiếng Việt
4. Khử trùng lặp exact + near-duplicate (ratio 0.92)
5. Loại rò rỉ dữ liệu giữa train / val / test
6. Cân bằng lớp trên tập train → `train_balanced.csv`

**Kết quả:** `ai_module/data/processed/` (thư mục `sentiment/`, `emotion/`, `label_config.json`, `preprocessing_report.json`)

### 2.3. Upload dataset lên Kaggle

Đóng gói dữ liệu đã xử lý thành dataset Kaggle: **`youtubeai-phobert-processed-v1`** để huấn luyện trên GPU.

### 2.4. Huấn luyện trên Kaggle (GPU T4)

- Base model: `vinai/phobert-base`
- **Sentiment:** tối đa 6 epoch
- **Emotion:** tối đa 8 epoch
- Early stopping: `patience = 3`, metric = **val F1 macro**
- `batch_size = 16`, `learning_rate = 2e-5`, `max_length = 128`
- Chuẩn hóa text giống `TextProcessor` của project khi inference

### 2.5. Tạo script notebook Kaggle (3 cell)

| Cell | File | Chức năng |
|------|------|-----------|
| 1 | `kaggle_cell1_check_dataset.py` | Kiểm tra cấu trúc dataset |
| 2 | `kaggle_cell2_train_phobert.py` | Train, test, lưu model + zip |
| 3 | `kaggle_cell3_plot_training_status.py` | Vẽ biểu đồ, xuất báo cáo ảnh/zip |

Hướng dẫn chi tiết: `KAGGLE_TRAIN_PHOBERT_SENTIMENT_EMOTION.md`

### 2.6. Xử lý lỗi kỹ thuật

- Sửa `Trainer(..., tokenizer=...)` → `processing_class` (transformers mới)
- Sửa lỗi `__file__` không tồn tại trên Kaggle notebook (Cell 3)
- Tự động tìm đường dẫn dataset trong `/kaggle/input`

### 2.7. Triển khai model về máy local

Tải output từ Kaggle, copy `phobert_sentiment/` và `phobert_emotion/` vào `ai_module/app/data/models/`.

---

## 3. Thống kê dữ liệu sau tiền xử lý

### Sentiment

| Chỉ số | Giá trị |
|--------|---------|
| Nguồn | VLSP + AIVIVN + Synthetic |
| Train (cân bằng) | **32.604** mẫu |
| Test | **4.200** mẫu |
| Số lớp | 3 |

### Emotion

| Chỉ số | Giá trị |
|--------|---------|
| Nguồn | VSMEC + ViGoEmotions |
| Train (cân bằng) | **28.150** mẫu |
| Test | **2.660** mẫu |
| Số lớp | 5 |

---

## 4. Cấu hình huấn luyện

```
model_name:        vinai/phobert-base
max_length:        128
batch_size:        16
learning_rate:     2e-5
weight_decay:      0.01
warmup_ratio:      0.1
max_grad_norm:     1.0
early_stopping:    patience=3, metric=val F1 macro
sentiment_epochs:  6
emotion_epochs:    8
```

- Train trên: `train_balanced.csv`
- Chọn model theo: `val.csv` (F1 macro)
- Báo cáo cuối trên: `test.csv`

---

## 5. Kết quả huấn luyện

> **Nguồn số liệu (không tự bịa):**
> - Chỉ số **theo epoch (val)** → `sentiment_training_logs.csv`, `emotion_training_logs.csv`
> - **Best epoch + val F1** → ghi trong `*_classification_report.txt` và `training_meta.json`
> - Chỉ số **test set (từng lớp)** → `sentiment_classification_report.txt`, `emotion_classification_report.txt`

### 5.1. Sentiment — chỉ số theo epoch (validation)

Model chọn epoch có **eval_f1** cao nhất trên **val set** (không phải train).

| Epoch | train_f1 | eval_f1 | eval_acc | eval_loss | train_loss |
|-------|----------|---------|----------|-----------|------------|
| 1 | 0.8760 | 0.7616 | 0.7606 | 1.1801 | 0.6765 |
| 2 | 0.9155 | 0.7850 | 0.7833 | 1.1731 | 0.4652 |
| 3 | 0.9507 | 0.7993 | 0.7984 | 1.2914 | 0.2919 |
| **4** | **0.9715** | **0.8051** | **0.8069** | 1.3700 | 0.1814 |
| 5 | 0.9801 | 0.8037 | 0.8069 | 1.5915 | 0.1279 |
| 6 | 0.9837 | 0.8031 | 0.8059 | 1.7175 | 0.1105 |

→ **Best epoch = 4** (eval_f1 = **0.8051**). Train chạy đủ 6 epoch (early stopping không kích hoạt vì patience=3 nhưng epoch 4–6 eval_f1 chỉ dao động quanh 0.803).

### 5.2. Sentiment — kết quả test set (model epoch 4)

| Lớp | Precision | Recall | F1-score | Support |
|-----|-----------|--------|----------|---------|
| negative | 0.8399 | 0.8607 | 0.8501 | 1694 |
| neutral | 0.6399 | 0.6143 | 0.6268 | 350 |
| positive | 0.8947 | 0.8831 | 0.8889 | 2156 |
| **Accuracy** | | | **0.8517** | 4200 |
| **Macro avg** | 0.7915 | 0.7860 | **0.7886** | 4200 |

*(Nguồn: `sentiment_classification_report.txt`)*

### 5.3. Emotion — chỉ số theo epoch (validation)

| Epoch | train_f1 | eval_f1 | eval_acc | eval_loss | train_loss |
|-------|----------|---------|----------|-----------|------------|
| 1 | 0.7533 | 0.5424 | 0.5962 | 2.0440 | 1.3813 |
| 2 | 0.8906 | 0.5708 | 0.6472 | 2.0677 | 0.6768 |
| 3 | 0.9363 | 0.5754 | 0.6600 | 2.2290 | 0.4102 |
| **4** | **0.9621** | **0.5809** | **0.6675** | 2.4331 | 0.2460 |
| 5 | 0.9786 | 0.5740 | 0.6626 | 2.7119 | 0.1483 |
| 6 | 0.9852 | 0.5702 | 0.6581 | 3.2256 | 0.0992 |
| 7 | 0.9914 | 0.5784 | 0.6634 | 3.4059 | 0.0649 |

→ **Best epoch = 4** (eval_f1 = **0.5809**). Train 7 epoch (cấu hình tối đa 8).

### 5.4. Emotion — kết quả test set (model epoch 4)

| Lớp | Precision | Recall | F1-score | Support |
|-----|-----------|--------|----------|---------|
| sad | 0.6736 | 0.7301 | 0.7007 | 667 |
| angry | 0.7202 | 0.6652 | 0.6916 | 681 |
| suggestion | 0.3397 | 0.3447 | 0.3422 | 206 |
| happy | 0.7083 | 0.7294 | 0.7187 | 972 |
| love | 0.5306 | 0.3881 | 0.4483 | 134 |
| **Accuracy** | | | **0.6662** | 2660 |
| **Macro avg** | 0.5945 | 0.5715 | **0.5803** | 2660 |

*(Nguồn: `emotion_classification_report.txt`)*

### 5.5. Nhận xét

- **Sentiment** đạt kết quả tốt (~85% accuracy), sẵn sàng tích hợp vào hệ thống.
- **Emotion** khó hơn do đa lớp và mất cân bằng; lớp `suggestion` và `love` còn yếu.
- Có dấu hiệu **overfitting**: train F1 tăng cao trong khi eval loss tăng — nên cân nhắc giảm epoch hoặc tăng regularization.

**Hình confusion matrix:**

- `app/models/phobert_models_for_youtubeai/sentiment_confusion_matrix.png`
- `app/models/phobert_models_for_youtubeai/emotion_confusion_matrix.png`

---

## 6. Các file đầu ra quan trọng

```
ai_module/
├── data/processed/                          # Dữ liệu train/val/test
├── kaggle_cell1_check_dataset.py            # Cell 1 Kaggle
├── kaggle_cell2_train_phobert.py            # Cell 2 Kaggle
├── kaggle_cell3_plot_training_status.py     # Cell 3 Kaggle
├── KAGGLE_TRAIN_PHOBERT_SENTIMENT_EMOTION.md
└── app/models/
    ├── phobert_sentiment/                   # Model sentiment (HF format)
    ├── phobert_emotion/                     # Model emotion (HF format)
    └── phobert_models_for_youtubeai/        # Log, CM, report, .pt
        ├── sentiment_training_logs.csv
        ├── emotion_training_logs.csv
        ├── sentiment_classification_report.txt
        ├── emotion_classification_report.txt
        ├── sentiment_confusion_matrix.png
        ├── emotion_confusion_matrix.png
        ├── best_sentiment_phobert.pt
        └── best_emotion_phobert.pt
```

**Từ Kaggle tải về:**

- `phobert_models_for_youtubeai.zip` — gói model + log
- `training_report_youtubeai.zip` — biểu đồ + báo cáo (Cell 3)

---

## 7. Quy trình triển khai vào project

1. Train xong trên Kaggle → tải `phobert_models_for_youtubeai.zip`
2. Giải nén, copy `phobert_sentiment/` và `phobert_emotion/` vào `ai_module/app/data/models/`
3. Chạy `check_phobert_models.py` để kiểm tra load model
4. Chạy `test_api.py` / khởi động backend
5. Kiểm tra trên giao diện web phân tích bình luận

---

## 8. Việc tiếp theo đề xuất

- [ ] Bổ sung dữ liệu cho các lớp emotion yếu (`suggestion`, `love`)
- [ ] Giảm overfitting (giảm epoch, tăng weight decay, dropout)
- [ ] Đánh giá trên bình luận YouTube thực tế (domain test)
- [ ] Tích hợp và kiểm thử end-to-end trên giao diện web
- [ ] Hoàn thiện báo cáo NCKH: mô tả dataset, phương pháp, bảng kết quả, hình confusion matrix

---

*Báo cáo này dùng để tham khảo khi viết báo cáo nhóm / NCKH. Có thể copy trực tiếp các bảng và mục vào slide hoặc tài liệu Word.*
