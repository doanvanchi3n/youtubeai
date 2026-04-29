# Hướng dẫn export PhoBERT train xong (Kaggle) → đưa vào project

Tài liệu này hướng dẫn bạn: sau khi fine-tune PhoBERT trên **Kaggle** xong, làm sao để **export model** và **copy vào đúng thư mục** để AI module trong project (`ai_module`) tự load và dùng cho phân loại sentiment/emotion.

---

## 0) Project của bạn đang load model ở đâu?

Trong `ai_module/app/services/sentiment_service.py`, hệ thống tìm:

- Sentiment model path mặc định:  
  `ai_module/app/data/models/phobert_sentiment`
- Emotion model path mặc định:  
  `ai_module/app/data/models/phobert_emotion`

Nếu bạn dùng `.env`/biến môi trường thì có thể ghi đè:

- `PHOBERT_SENTIMENT_MODEL_PATH`
- `PHOBERT_EMOTION_MODEL_PATH`

> Bắt buộc: thư mục sentiment và emotion đều nên tồn tại để PhoBERT mode được bật (`os.path.exists(...)` cả hai).

---

## 1) Trên Kaggle: export model đúng chuẩn HuggingFace

### 1.1 Đảm bảo bạn đang fine-tune bằng `transformers.Trainer`

Sau khi huấn luyện (train), bạn cần **save model** và **save tokenizer** vào `output_dir`.

Ví dụ (dạng khung; bạn thay `output_dir` và dataset/cấu hình theo notebook của bạn):

```python
output_dir = "phobert_sentiment_export"

# ... tạo Trainer rồi trainer.train() ...

trainer.save_model(output_dir)                # tạo config.json + weights
tokenizer.save_pretrained(output_dir)        # tạo tokenizer_config.json, vocab.txt,...
```

> Nếu bạn dùng nhiều epoch/checkpoint, hãy chọn checkpoint cuối hoặc checkpoint tốt nhất và save riêng vào 1 folder để export.

### 1.2 Kiểm tra trong Kaggle output folder có gì

Trong `output_dir` bạn cần có (thường sẽ có):
- `config.json`
- `pytorch_model.bin` **hoặc** `model.safetensors`
- `tokenizer_config.json`
- `vocab.txt`

Nếu thiếu `config.json` hoặc thiếu weights thì project sẽ không load được.

---

## 2) Tải file model từ Kaggle về máy

Trong Kaggle, nén folder `output_dir` thành `.zip` (hoặc tải trực tiếp nếu Kaggle hiển thị nút Download artifact).

Sau khi tải về máy, giải nén ra sẽ thấy đúng “cây thư mục model” (các file ở mục 1.2).

---

## 3) Copy model vào đúng thư mục project

### 3.1 Sentiment

Copy toàn bộ nội dung model export từ Kaggle vào:

- `ai_module/app/data/models/phobert_sentiment/`

Thực hiện theo kiểu “copy cả thư mục file”, ví dụ:
- copy `config.json`
- copy `pytorch_model.bin` / `model.safetensors`
- copy `tokenizer_config.json`, `vocab.txt`, các file tokenizer khác

### 3.2 Emotion

Copy emotion model (nếu bạn cũng fine-tune emotion) vào:

- `ai_module/app/data/models/phobert_emotion/`

Nếu hiện tại bạn **chỉ train sentiment** và chưa train emotion:
- bạn vẫn nên giữ emotion folder hiện có (base hoặc model cũ) để PhoBERT mode không bị tắt.

---

## 4) (Quan trọng) Khớp nhãn với code của bạn

Trong `sentiment_service.py`, project đang map nhãn theo thứ tự:

- `sentiment_labels = ["negative", "neutral", "positive"]` (3 nhãn)
- `emotion_labels = ["sad", "angry", "suggestion", "happy", "love"]` (5 nhãn)

### Trường hợp A: Bạn train sentiment đủ 3 lớp (negative/neutral/positive)

Thì bạn chỉ cần đảm bảo khi train bạn set đúng `label2id/id2label` tương ứng, để index argmax của model khớp đúng thứ tự trong project.

### Trường hợp B: Bạn chỉ train sentiment nhị phân (positive/negative)

Nếu model export của bạn có `num_labels=2` thì:
- hệ thống hiện tại trong project **vẫn đang coi là 3 nhãn**
- kết quả sẽ bị lệch (vì index 0/1 sẽ map vào `["negative","neutral","positive"]`)

Bạn sẽ phải chọn 1 trong 2 hướng:
1. (Khuyên dùng) train lại sentiment với `num_labels=3` (thêm lớp neutral)
2. hoặc sửa code `sentiment_service.py`/logic hậu xử lý để xử lý nhị phân và suy ra neutral bằng rule

Tài liệu này đang tập trung vào “export”; phần “sửa code” nếu bạn muốn mình cũng có thể hướng dẫn cụ thể theo đúng cấu trúc repo của bạn.

---

## 5) Kiểm tra xem project đã load PhoBERT thành công chưa

Chạy kiểm tra nhanh:

```bash
cd ai_module
python check_phobert_models.py
```

Bạn cần thấy:
- `✅ Sentiment model is complete!`
- `✅ Emotion model is complete!`

Nếu thiếu file, script sẽ báo thiếu `config.json`, thiếu “model file”, hoặc thiếu “tokenizer files”.

---

## 6) Chạy thử phân loại sentiment để xác nhận “đang dùng model mới”

Chạy AI module:

```bash
cd ai_module
source .venv/bin/activate
python main.py
```

Sau đó dùng:
- frontend `Comment Sentiment`
- hoặc gọi endpoint sentiment:
  - `POST /api/analyze-sentiment`
  - `POST /api/analyze-sentiment/batch`

Khi PhoBERT models đã load đúng, log khi khởi động sẽ có dòng kiểu:
- `✓ PhoBERT models loaded successfully`

---

## 7) Checklist nhanh (tick từng mục)

1. Kaggle training: có `trainer.save_model(output_dir)` + `tokenizer.save_pretrained(output_dir)`
2. output model folder có `config.json` + weights + tokenizer files
3. Copy sentiment vào `phobert_sentiment`
4. Copy emotion vào `phobert_emotion` (hoặc giữ model emotion cũ để PhoBERT mode bật)
5. Chạy `python check_phobert_models.py`
6. Restart AI module và thử phân loại

---

## Câu hỏi để mình hướng dẫn đúng nhãn của bạn

Bạn trả lời giúp 2 ý:
1. Dataset Kaggle của bạn đang dùng nhãn `prod/com/rat` (hoặc tên khác) và bạn ánh xạ chúng sang `positive/negative/neutral` như thế nào?
2. Model Kaggle của bạn đang train với `num_labels=2` hay `num_labels=3`?

Mình sẽ chỉ bạn cách set `label2id/id2label` để khớp hoàn toàn với code project.

