# Notebook Kaggle: Train PhoBERT

**Dataset Input:** `youtubeai-phobert-processed-v1`  
**Epochs:** Sentiment **6** | Emotion **8** (early stopping patience 3)  
**Output:** `phobert_sentiment/`, `phobert_emotion/` + zip tải về

## Khuyến nghị — 2 file Python (dễ copy)

| Cell | File | Nội dung |
|------|------|----------|
| **1** | [`kaggle_cell1_check_dataset.py`](kaggle_cell1_check_dataset.py) | Kiểm tra dataset (~10 giây) |
| **2** | [`kaggle_cell2_train_phobert.py`](kaggle_cell2_train_phobert.py) | Train + test + zip (~30–60 phút) |
| **3** | [`kaggle_cell3_plot_training_status.py`](kaggle_cell3_plot_training_status.py) | Vẽ biểu đồ + **xuất file ảnh/báo cáo zip** để tải |

Cell 2 đọc `/kaggle/working/dataset_root.txt` từ Cell 1; nếu bỏ qua Cell 1 vẫn tự tìm dataset. Đã sửa lỗi `Trainer(..., tokenizer=...)` → `processing_class` trên transformers mới.

**Kaggle notebook:**

1. **Cell 1:** copy `kaggle_cell1_check_dataset.py` → Run (cần `pandas`, thường có sẵn trên Kaggle)
2. **Cell 2 (đầu):** `!pip -q install transformers datasets accelerate scikit-learn matplotlib`
3. **Cell 2:** copy `kaggle_cell2_train_phobert.py` → Run (GPU T4, Internet On, Add Data dataset)
4. **Cell 3:** copy `kaggle_cell3_plot_training_status.py` → Run → tải `training_report_youtubeai.zip` từ Output

**Cell 3 xuất ra:** biểu đồ Loss/Acc/F1, dashboard tóm tắt, copy confusion matrix + classification report, file `training_status_report.txt`, gói zip tải về.

---

## Notebook 2 cell (markdown bên dưới — tùy chọn)

> **Cell 1** — CHECK dataset → **Cell 2** — pip + train

---

## Cell 1 — CHECK DATASET STRUCTURE ON KAGGLE

```python
# CHECK DATASET STRUCTURE ON KAGGLE (youtubeai project)
import json
import os
import pandas as pd

REQUIRED_COLUMNS = ["id", "text", "label", "source", "split"]
EXPECTED_SENTIMENT = ["negative", "neutral", "positive"]
EXPECTED_EMOTION = ["sad", "angry", "suggestion", "happy", "love"]

PATH_HINTS = [
    "/kaggle/input/youtubeai-phobert-processed-v1",
    "/kaggle/input/youtubeai-phobert-processed-v1/youtubeai-phobert-processed-v1",
]


def find_dataset_root():
    """Tu dong tim folder co label_config.json + sentiment/train_balanced.csv"""
    for hint in PATH_HINTS:
        if os.path.isfile(os.path.join(hint, "label_config.json")):
            return hint
    found = []
    for root, _dirs, files in os.walk("/kaggle/input"):
        if "label_config.json" not in files:
            continue
        if os.path.isfile(os.path.join(root, "sentiment", "train_balanced.csv")):
            found.append(root)
    if not found:
        return None
    return sorted(found, key=len)[0]


print("=== /kaggle/input ===")
if os.path.exists("/kaggle/input"):
    for name in os.listdir("/kaggle/input"):
        p = os.path.join("/kaggle/input", name)
        print(" ", p, "->", os.listdir(p)[:8])
else:
    print("  (empty - chua Add Data)")

DATASET_PATH = find_dataset_root()
print("\nDataset path (auto):", DATASET_PATH)

FILES_TO_CHECK = [
    ("sentiment", "train_balanced.csv", EXPECTED_SENTIMENT),
    ("sentiment", "val.csv", EXPECTED_SENTIMENT),
    ("sentiment", "test.csv", EXPECTED_SENTIMENT),
    ("emotion", "train_balanced.csv", EXPECTED_EMOTION),
    ("emotion", "val.csv", EXPECTED_EMOTION),
    ("emotion", "test.csv", EXPECTED_EMOTION),
]

all_ok = True

if DATASET_PATH is None:
    print("\n[ERROR] Khong tim thay dataset.")
    print("-> Notebook: Add Data -> chon 'youtubeai-phobert-processed-v1'")
    print("-> Hoac doi PATH_HINTS dung path hien tren sidebar Input")
    all_ok = False
else:
    with open("/kaggle/working/dataset_root.txt", "w") as f:
        f.write(DATASET_PATH)
    print("(saved -> /kaggle/working/dataset_root.txt cho Cell 2)")

    print("\nRoot contents:", os.listdir(DATASET_PATH))

    cfg_file = os.path.join(DATASET_PATH, "label_config.json")
    print("\n" + "=" * 60)
    print("label_config.json")
    print("=" * 60)
    if not os.path.exists(cfg_file):
        print("[MISSING]")
        all_ok = False
    else:
        cfg = json.load(open(cfg_file, encoding="utf-8"))
        print("sentiment_labels:", cfg.get("sentiment_labels"))
        print("emotion_labels:", cfg.get("emotion_labels"))

    for task_name, csv_name, expected_labels in FILES_TO_CHECK:
        file_path = os.path.join(DATASET_PATH, task_name, csv_name)
        print("\n" + "=" * 60)
        print(task_name + "/" + csv_name)
        print("=" * 60)
        if not os.path.exists(file_path):
            print("[MISSING]", file_path)
            all_ok = False
            continue
        df = pd.read_csv(file_path)
        print("OK | rows:", len(df), "| KB:", os.path.getsize(file_path) // 1024)
        print("Columns:", list(df.columns))
        for col in REQUIRED_COLUMNS:
            if col not in df.columns:
                print("[WARN] missing column:", col)
                all_ok = False
        if "label" in df.columns:
            print("Label counts:", df["label"].value_counts().to_dict())
            bad = set(df["label"].unique()) - set(expected_labels)
            if bad:
                print("[WARN] unknown labels:", bad)
                all_ok = False
        print(df[["text", "label"]].head(2))

print("\n" + "=" * 60)
if all_ok:
    print("CHECK PASSED - chay Cell 2 train.")
else:
    print("CHECK FAILED - sua path/dataset truoc.")
print("=" * 60)
```

---

## Cell 2 — pip + train + test + zip

```python
# Cài thư viện (chạy đầu cell)
!pip -q install transformers datasets evaluate accelerate scikit-learn matplotlib

# =============================================================================
# YOUTUBE AI — PhoBERT train (sentiment 3 lớp + emotion 5 lớp)
# =============================================================================
import json
import os
import re
import zipfile
import csv
import random
import inspect
from dataclasses import dataclass, asdict
from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import torch
from datasets import Dataset
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_recall_fscore_support,
)
from transformers import (
    AutoModelForSequenceClassification,
    AutoTokenizer,
    DataCollatorWithPadding,
    Trainer,
    TrainerCallback,
    TrainingArguments,
)

# --- CONFIG -------------------------------------------------------------------
@dataclass
class TrainConfig:
    data_root: str = "/kaggle/input/youtubeai-phobert-processed-v1"
    label_config_path: str = ""
    model_name: str = "vinai/phobert-base"
    max_length: int = 128
    batch_size: int = 16          # OOM -> đổi 8
    lr: float = 2e-5
    weight_decay: float = 0.01
    warmup_ratio: float = 0.1
    max_grad_norm: float = 1.0
    seed: int = 42
    early_stopping_patience: int = 3
    sentiment_epochs: int = 6
    emotion_epochs: int = 8
    save_dir: str = "/kaggle/working"


def find_dataset_root():
    """Tim folder dataset tren Kaggle (path co the khac slug)."""
    hints = [
        "/kaggle/input/youtubeai-phobert-processed-v1",
        "/kaggle/input/youtubeai-phobert-processed-v1/youtubeai-phobert-processed-v1",
    ]
    for h in hints:
        if os.path.isfile(os.path.join(h, "label_config.json")):
            return h
    for root, _dirs, files in os.walk("/kaggle/input"):
        if "label_config.json" not in files:
            continue
        if os.path.isfile(os.path.join(root, "sentiment", "train_balanced.csv")):
            return root
    return None


CFG = TrainConfig()
WORKING = Path(CFG.save_dir)
WORKING.mkdir(parents=True, exist_ok=True)

_path_file = "/kaggle/working/dataset_root.txt"
if os.path.exists(_path_file):
    CFG.data_root = open(_path_file, encoding="utf-8").read().strip()
elif not os.path.isfile(os.path.join(CFG.data_root, "label_config.json")):
    auto = find_dataset_root()
    if auto is None:
        print("=== /kaggle/input ===")
        if os.path.exists("/kaggle/input"):
            for n in os.listdir("/kaggle/input"):
                print(" ", os.path.join("/kaggle/input", n))
        raise FileNotFoundError(
            "Khong tim thay dataset. Notebook -> Add Data -> youtubeai-phobert-processed-v1"
        )
    CFG.data_root = auto

print("data_root:", CFG.data_root)
with open(_path_file, "w", encoding="utf-8") as f:
    f.write(CFG.data_root)

CFG.label_config_path = f"{CFG.data_root}/label_config.json"

CFG_SENTIMENT = {
    "task": "sentiment",
    "train_csv": f"{CFG.data_root}/sentiment/train_balanced.csv",
    "val_csv": f"{CFG.data_root}/sentiment/val.csv",
    "test_csv": f"{CFG.data_root}/sentiment/test.csv",
    "hf_out": str(WORKING / "phobert_sentiment"),
    "best_pt": str(WORKING / "best_sentiment_phobert.pt"),
    "logs_csv": str(WORKING / "sentiment_training_logs.csv"),
    "report_txt": str(WORKING / "sentiment_classification_report.txt"),
    "cm_png": str(WORKING / "sentiment_confusion_matrix.png"),
}
CFG_EMOTION = {
    "task": "emotion",
    "train_csv": f"{CFG.data_root}/emotion/train_balanced.csv",
    "val_csv": f"{CFG.data_root}/emotion/val.csv",
    "test_csv": f"{CFG.data_root}/emotion/test.csv",
    "hf_out": str(WORKING / "phobert_emotion"),
    "best_pt": str(WORKING / "best_emotion_phobert.pt"),
    "logs_csv": str(WORKING / "emotion_training_logs.csv"),
    "report_txt": str(WORKING / "emotion_classification_report.txt"),
    "cm_png": str(WORKING / "emotion_confusion_matrix.png"),
}

device = "cuda" if torch.cuda.is_available() else "cpu"
print("Device:", device)
if torch.cuda.is_available():
    print("GPU:", torch.cuda.get_device_name(0))


# --- HELPERS ------------------------------------------------------------------
def set_seed(seed: int):
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed)


def apply_project_text_norm(text: str) -> str:
    if not text or (isinstance(text, float) and pd.isna(text)):
        return ""
    text = str(text).lower()
    text = re.sub(r"http\S+|www\S+", "", text)
    text = re.sub(r"\S+@\S+", "", text)
    return re.sub(r"\s+", " ", text).strip()


def load_label_config():
    with open(CFG.label_config_path, encoding="utf-8") as f:
        return json.load(f)


def load_csvs(task_cfg):
    train = pd.read_csv(task_cfg["train_csv"])
    val = pd.read_csv(task_cfg["val_csv"])
    test = pd.read_csv(task_cfg["test_csv"])
    print(f"[{task_cfg['task']}] train={len(train)} val={len(val)} test={len(test)}")
    return train, val, test


def build_hf_dataset(df, label2id):
    df = df.copy()
    df["text"] = df["text"].map(apply_project_text_norm)
    df = df[df["text"].str.len() > 0]
    df["labels"] = df["label"].map(label2id)
    if df["labels"].isna().any():
        raise ValueError(f"Unknown labels: {df[df['labels'].isna()]['label'].unique()}")
    return Dataset.from_pandas(df[["text", "labels"]], preserve_index=False)


def tokenize_ds(ds, tokenizer):
    return ds.map(
        lambda b: tokenizer(b["text"], truncation=True, max_length=CFG.max_length),
        batched=True,
        remove_columns=["text"],
    )


def compute_metrics_sklearn(y_true, y_pred, num_labels):
    precision, recall, f1, _ = precision_recall_fscore_support(
        y_true, y_pred, average="macro", zero_division=0, labels=list(range(num_labels))
    )
    return {
        "acc": accuracy_score(y_true, y_pred),
        "precision": precision,
        "recall": recall,
        "f1": f1,
        "f1_weighted": f1_score(y_true, y_pred, average="weighted", zero_division=0),
    }


def predict_labels(trainer, dataset):
    out = trainer.predict(dataset)
    y_true = out.label_ids
    y_pred = np.argmax(out.predictions, axis=-1)
    loss = out.metrics.get("test_loss", out.metrics.get("eval_loss", 0.0))
    return y_true, y_pred, float(loss)


def plot_confusion_matrix(cm, labels, out_path):
    fig, ax = plt.subplots(figsize=(7, 6))
    im = ax.imshow(cm, interpolation="nearest", cmap=plt.cm.Blues)
    ax.figure.colorbar(im, ax=ax)
    ax.set(
        xticks=np.arange(len(labels)), yticks=np.arange(len(labels)),
        xticklabels=labels, yticklabels=labels,
        ylabel="True", xlabel="Predicted", title="Confusion Matrix",
    )
    plt.setp(ax.get_xticklabels(), rotation=35, ha="right")
    thresh = cm.max() / 2.0 if cm.max() > 0 else 0
    for i in range(cm.shape[0]):
        for j in range(cm.shape[1]):
            ax.text(j, i, format(cm[i, j], "d"), ha="center", va="center",
                    color="white" if cm[i, j] > thresh else "black")
    fig.tight_layout()
    fig.savefig(out_path, dpi=120)
    plt.close(fig)


class EpochMetricsCallback(TrainerCallback):
    def __init__(self, trainer, train_ds, val_ds, label_list, label2id, task_cfg):
        self.trainer = trainer
        self.train_ds = train_ds
        self.val_ds = val_ds
        self.label_list = label_list
        self.label2id = label2id
        self.id2label = {i: l for l, i in label2id.items()}
        self.task_cfg = task_cfg
        self.num_labels = len(label_list)
        self.best_f1 = -1.0
        self.best_epoch = 0
        self.counter = 0
        self.history = []

    def on_epoch_end(self, args, state, control, **kwargs):
        epoch = int(round(state.epoch))
        num_epochs = int(args.num_train_epochs)

        tr_true, tr_pred, tr_loss = predict_labels(self.trainer, self.train_ds)
        tr_m = compute_metrics_sklearn(tr_true, tr_pred, self.num_labels)
        tr_m["loss"] = tr_loss

        ev_true, ev_pred, ev_loss = predict_labels(self.trainer, self.val_ds)
        ev_m = compute_metrics_sklearn(ev_true, ev_pred, self.num_labels)
        ev_m["loss"] = ev_loss
        cm = confusion_matrix(ev_true, ev_pred, labels=list(range(self.num_labels)))

        self.history.append({
            "epoch": epoch,
            "train_loss": tr_m["loss"], "train_acc": tr_m["acc"],
            "train_precision": tr_m["precision"], "train_recall": tr_m["recall"], "train_f1": tr_m["f1"],
            "eval_loss": ev_m["loss"], "eval_acc": ev_m["acc"],
            "eval_precision": ev_m["precision"], "eval_recall": ev_m["recall"], "eval_f1": ev_m["f1"],
        })

        print("\n" + "-" * 70)
        print(f"Epoch {epoch}/{num_epochs} | task={self.task_cfg['task']}")
        print("-" * 70)
        print(
            f"Train | Loss: {tr_m['loss']:.4f} | Acc: {tr_m['acc']:.4f} | "
            f"Precision: {tr_m['precision']:.4f} | Recall: {tr_m['recall']:.4f} | F1: {tr_m['f1']:.4f}"
        )
        print(
            f"Eval  | Loss: {ev_m['loss']:.4f} | Acc: {ev_m['acc']:.4f} | "
            f"Precision: {ev_m['precision']:.4f} | Recall: {ev_m['recall']:.4f} | F1: {ev_m['f1']:.4f}"
        )
        print(f"CM    |\n{cm}")

        if ev_m["f1"] > self.best_f1:
            self.best_f1 = ev_m["f1"]
            self.best_epoch = epoch
            self.counter = 0
            self._save_best(ev_m, epoch)
            print(f"-> Best model saved (F1={self.best_f1:.4f})")
        else:
            self.counter += 1
            print(f"-> Early stopping counter: {self.counter}/{CFG.early_stopping_patience}")
            if self.counter >= CFG.early_stopping_patience:
                print("-> Early stopping triggered.")
                control.should_training_stop = True
        return control

    def _save_best(self, ev_metrics, epoch):
        hf_dir = Path(self.task_cfg["hf_out"])
        hf_dir.mkdir(parents=True, exist_ok=True)
        self.trainer.save_model(str(hf_dir))
        tok = getattr(self.trainer, "processing_class", None) or getattr(self.trainer, "tokenizer", None)
        if tok is not None:
            tok.save_pretrained(str(hf_dir))
        torch.save({
            "model_state_dict": self.trainer.model.state_dict(),
            "task": self.task_cfg["task"],
            "model_name": CFG.model_name,
            "label_list": self.label_list,
            "label2id": self.label2id,
            "best_f1_macro": self.best_f1,
            "best_epoch": self.best_epoch,
            "epoch": epoch,
        }, self.task_cfg["best_pt"])
        print(f"   HF  -> {hf_dir}")
        print(f"   .pt -> {self.task_cfg['best_pt']}")


def save_training_logs(history, csv_path):
    if not history:
        return
    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=history[0].keys())
        w.writeheader()
        w.writerows(history)
    print(f"Logs -> {csv_path}")


def train_phobert_task(task_cfg, label_list, label2id, num_epochs):
    print("\n" + "=" * 70)
    print(f"START TRAINING: {task_cfg['task'].upper()} | max_epochs={num_epochs}")
    print("=" * 70)

    set_seed(CFG.seed)
    id2label = {i: l for l, i in label2id.items()}
    train_df, val_df, test_df = load_csvs(task_cfg)

    tokenizer = AutoTokenizer.from_pretrained(CFG.model_name, use_fast=False)
    model = AutoModelForSequenceClassification.from_pretrained(
        CFG.model_name, num_labels=len(label_list), id2label=id2label, label2id=label2id,
    )

    train_ds = tokenize_ds(build_hf_dataset(train_df, label2id), tokenizer)
    val_ds = tokenize_ds(build_hf_dataset(val_df, label2id), tokenizer)
    test_ds = tokenize_ds(build_hf_dataset(test_df, label2id), tokenizer)

    training_args = TrainingArguments(
        output_dir=str(WORKING / f"checkpoints_{task_cfg['task']}"),
        num_train_epochs=num_epochs,
        per_device_train_batch_size=CFG.batch_size,
        per_device_eval_batch_size=CFG.batch_size * 2,
        learning_rate=CFG.lr,
        weight_decay=CFG.weight_decay,
        warmup_ratio=CFG.warmup_ratio,
        max_grad_norm=CFG.max_grad_norm,
        eval_strategy="no",
        save_strategy="no",
        logging_steps=200,
        report_to="none",
        seed=CFG.seed,
        fp16=torch.cuda.is_available(),
    )

    trainer_kw = dict(
        model=model,
        args=training_args,
        train_dataset=train_ds,
        eval_dataset=val_ds,
        data_collator=DataCollatorWithPadding(tokenizer=tokenizer),
    )
    _sig = inspect.signature(Trainer.__init__).parameters
    if "processing_class" in _sig:
        trainer_kw["processing_class"] = tokenizer
    elif "tokenizer" in _sig:
        trainer_kw["tokenizer"] = tokenizer
    trainer = Trainer(**trainer_kw)

    cb = EpochMetricsCallback(trainer, train_ds, val_ds, label_list, label2id, task_cfg)
    trainer.add_callback(cb)
    trainer.train()
    save_training_logs(cb.history, task_cfg["logs_csv"])

    te_true, te_pred, _ = predict_labels(trainer, test_ds)
    te_m = compute_metrics_sklearn(te_true, te_pred, len(label_list))
    te_cm = confusion_matrix(te_true, te_pred, labels=list(range(len(label_list))))
    report = classification_report(te_true, te_pred, target_names=label_list, zero_division=0, digits=4)
    with open(task_cfg["report_txt"], "w", encoding="utf-8") as f:
        f.write(report)
        f.write(f"\n\nBest epoch: {cb.best_epoch}\nBest val F1: {cb.best_f1:.4f}\n")
    plot_confusion_matrix(te_cm, label_list, task_cfg["cm_png"])

    with open(Path(task_cfg["hf_out"]) / "training_meta.json", "w", encoding="utf-8") as f:
        json.dump({
            "task": task_cfg["task"], "best_epoch": cb.best_epoch,
            "best_val_f1_macro": cb.best_f1, "test_metrics": te_m,
        }, f, indent=2)

    print(f"DONE {task_cfg['task']} | best_val_f1={cb.best_f1:.4f} | test_f1={te_m['f1']:.4f}")
    return trainer, cb


def predict(text, hf_dir, id2label):
    tok = AutoTokenizer.from_pretrained(hf_dir, use_fast=False)
    mdl = AutoModelForSequenceClassification.from_pretrained(hf_dir).to(device).eval()
    inputs = tok(text, return_tensors="pt", truncation=True, max_length=CFG.max_length).to(device)
    with torch.no_grad():
        probs = torch.softmax(mdl(**inputs).logits, dim=-1)[0]
    idx = int(torch.argmax(probs).item())
    return id2label[idx], float(probs[idx].item())


# =============================================================================
# MAIN — chạy tuần tự: kiểm tra data -> train -> test -> zip
# =============================================================================
cfg = load_label_config()
print("Sentiment labels:", cfg["sentiment_labels"])
print("Emotion labels  :", cfg["emotion_labels"])

_check_paths = [
    CFG.label_config_path,
    CFG_SENTIMENT["train_csv"],
    CFG_SENTIMENT["val_csv"],
    CFG_EMOTION["train_csv"],
    CFG_EMOTION["val_csv"],
]
_missing = [p for p in _check_paths if not os.path.exists(p)]
for p in _check_paths:
    print("OK" if os.path.exists(p) else "MISSING", p)
if _missing:
    raise FileNotFoundError("Thieu file dataset. Kiem tra Add Data hoac data_root: " + CFG.data_root)

# 1) Train sentiment
train_phobert_task(
    CFG_SENTIMENT, cfg["sentiment_labels"], cfg["sentiment_label2id"], CFG.sentiment_epochs,
)

# 2) Train emotion
train_phobert_task(
    CFG_EMOTION, cfg["emotion_labels"], cfg["emotion_label2id"], CFG.emotion_epochs,
)

# 3) Test câu YouTube mẫu
sent_id2label = {i: l for l, i in cfg["sentiment_label2id"].items()}
emo_id2label = {i: l for l, i in cfg["emotion_label2id"].items()}
print("\n" + "=" * 70)
print("YOUTUBE SAMPLES")
print("=" * 70)
for text, exp_s, exp_e in [
    ("Video này rất hay!", "positive", "happy"),
    ("Video này chán quá", "negative", "sad"),
    ("Có thể cải thiện phần âm thanh", "neutral", "suggestion"),
    ("Vui quá anh Hiếu ơi!", "positive", "happy"),
    ("Chán quá anh ơi", "negative", "sad"),
    ("Mong video sau của anh sẽ hay hơn", "neutral", "suggestion"),
]:
    t = apply_project_text_norm(text)
    sl, sc = predict(t, CFG_SENTIMENT["hf_out"], sent_id2label)
    el, ec = predict(t, CFG_EMOTION["hf_out"], emo_id2label)
    print(f"{text}")
    print(f"  sentiment={sl} ({sc:.3f}) expect={exp_s} [{'OK' if sl == exp_s else '??'}]")
    print(f"  emotion  ={el} ({ec:.3f}) expect={exp_e} [{'OK' if el == exp_e else '??'}]\n")

# 4) Zip output
zip_path = WORKING / "phobert_models_for_youtubeai.zip"
include_paths = [
    Path(CFG_SENTIMENT["hf_out"]), Path(CFG_EMOTION["hf_out"]),
    Path(CFG_SENTIMENT["best_pt"]), Path(CFG_EMOTION["best_pt"]),
    Path(CFG_SENTIMENT["logs_csv"]), Path(CFG_EMOTION["logs_csv"]),
    Path(CFG_SENTIMENT["report_txt"]), Path(CFG_EMOTION["report_txt"]),
    Path(CFG_SENTIMENT["cm_png"]), Path(CFG_EMOTION["cm_png"]),
]
with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
    for p in include_paths:
        if p.is_dir():
            for f in p.rglob("*"):
                if f.is_file():
                    zf.write(f, arcname=str(f.relative_to(WORKING)))
        elif p.exists():
            zf.write(p, arcname=p.name)

print("\n" + "=" * 70)
print("ALL DONE")
print("Zip:", zip_path, "| MB:", round(zip_path.stat().st_size / 1024 / 1024, 2))
print("Copy phobert_sentiment/ + phobert_emotion/ -> ai_module/app/data/models/")
print("=" * 70)
```

---

# Sau Kaggle

| Từ Kaggle | Vào project |
|---|---|
| `phobert_sentiment/` | `ai_module/app/data/models/phobert_sentiment/` |
| `phobert_emotion/` | `ai_module/app/data/models/phobert_emotion/` |

```bash
cd ai_module && python check_phobert_models.py && python test_api.py
```

**OOM:** trong Cell 2 đổi `batch_size = 8` rồi chạy lại Cell 2.

**Chỉ train lại 1 model:** comment block `train_phobert_task` của task kia trong Cell 2.

**Lưu ý:** Cell 1 tu dong tim path va luu `dataset_root.txt`. Neu CHECK FAILED, xem muc `=== /kaggle/input ===` roi Add Data lai dataset.
