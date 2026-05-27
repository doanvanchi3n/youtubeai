"""
Kaggle Cell 2 — Train PhoBERT sentiment + emotion

Truoc khi chay cell nay:
  1. !pip -q install transformers datasets accelerate scikit-learn matplotlib
  2. (khuyen nghi) chay Cell 1: kaggle_cell1_check_dataset.py

Can: GPU T4, Internet On, Add Data youtubeai-phobert-processed-v1
Output: phobert_sentiment/, phobert_emotion/, phobert_models_for_youtubeai.zip
"""
from __future__ import annotations

import csv
import inspect
import json
import os
import random
import re
import zipfile
from dataclasses import dataclass
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

# =============================================================================
# CONFIG
# =============================================================================
@dataclass
class TrainConfig:
    data_root: str = ""
    model_name: str = "vinai/phobert-base"
    max_length: int = 128
    batch_size: int = 16
    lr: float = 2e-5
    weight_decay: float = 0.01
    warmup_ratio: float = 0.1
    max_grad_norm: float = 1.0
    seed: int = 42
    early_stopping_patience: int = 3
    sentiment_epochs: int = 6
    emotion_epochs: int = 8
    save_dir: str = "/kaggle/working"


PATH_HINTS = [
    "/kaggle/input/youtubeai-phobert-processed-v1",
    "/kaggle/input/youtubeai-phobert-processed-v1/youtubeai-phobert-processed-v1",
]

DATASET_ROOT_FILE = "/kaggle/working/dataset_root.txt"

CFG = TrainConfig()
WORKING = Path(CFG.save_dir)
WORKING.mkdir(parents=True, exist_ok=True)

CFG_SENTIMENT: dict = {}
CFG_EMOTION: dict = {}

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")


# =============================================================================
# DATASET PATH (doc Cell 1 hoac tu tim)
# =============================================================================
def find_dataset_root() -> str | None:
    for hint in PATH_HINTS:
        if os.path.isfile(os.path.join(hint, "label_config.json")):
            return hint
    if not os.path.exists("/kaggle/input"):
        return None
    for root, _dirs, files in os.walk("/kaggle/input"):
        if "label_config.json" not in files:
            continue
        if os.path.isfile(os.path.join(root, "sentiment", "train_balanced.csv")):
            return root
    return None


def resolve_data_root() -> str:
    if os.path.isfile(DATASET_ROOT_FILE):
        root = Path(DATASET_ROOT_FILE).read_text(encoding="utf-8").strip()
        if root and os.path.isfile(os.path.join(root, "label_config.json")):
            print("[data_root] from Cell 1:", root)
            return root
        print("[WARN] dataset_root.txt khong hop le, tu tim lai...")

    root = find_dataset_root()
    if root is None:
        raise FileNotFoundError(
            "Khong tim thay dataset. Chay Cell 1 hoac Add Data: youtubeai-phobert-processed-v1"
        )
    print("[data_root] auto-detected:", root)
    return root


def setup_task_paths(data_root: str):
    global CFG_SENTIMENT, CFG_EMOTION
    label_config_path = f"{data_root}/label_config.json"
    CFG.data_root = data_root
    CFG_SENTIMENT = {
        "task": "sentiment",
        "train_csv": f"{data_root}/sentiment/train_balanced.csv",
        "val_csv": f"{data_root}/sentiment/val.csv",
        "test_csv": f"{data_root}/sentiment/test.csv",
        "hf_out": str(WORKING / "phobert_sentiment"),
        "best_pt": str(WORKING / "best_sentiment_phobert.pt"),
        "logs_csv": str(WORKING / "sentiment_training_logs.csv"),
        "report_txt": str(WORKING / "sentiment_classification_report.txt"),
        "cm_png": str(WORKING / "sentiment_confusion_matrix.png"),
        "label_config_path": label_config_path,
    }
    CFG_EMOTION = {
        "task": "emotion",
        "train_csv": f"{data_root}/emotion/train_balanced.csv",
        "val_csv": f"{data_root}/emotion/val.csv",
        "test_csv": f"{data_root}/emotion/test.csv",
        "hf_out": str(WORKING / "phobert_emotion"),
        "best_pt": str(WORKING / "best_emotion_phobert.pt"),
        "logs_csv": str(WORKING / "emotion_training_logs.csv"),
        "report_txt": str(WORKING / "emotion_classification_report.txt"),
        "cm_png": str(WORKING / "emotion_confusion_matrix.png"),
        "label_config_path": label_config_path,
    }


# =============================================================================
# TRAIN HELPERS
# =============================================================================
def set_seed(seed: int):
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed)


def apply_project_text_norm(text: str) -> str:
    if text is None or (isinstance(text, float) and pd.isna(text)):
        return ""
    text = str(text).lower()
    text = re.sub(r"http\S+|www\S+", "", text)
    text = re.sub(r"\S+@\S+", "", text)
    return re.sub(r"\s+", " ", text).strip()


def load_label_config():
    with open(CFG_SENTIMENT["label_config_path"], encoding="utf-8") as f:
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
        xticks=np.arange(len(labels)),
        yticks=np.arange(len(labels)),
        xticklabels=labels,
        yticklabels=labels,
        ylabel="True",
        xlabel="Predicted",
        title="Confusion Matrix",
    )
    plt.setp(ax.get_xticklabels(), rotation=35, ha="right")
    fig.tight_layout()
    fig.savefig(out_path, dpi=120)
    plt.close(fig)


def build_trainer(model, training_args, train_ds, val_ds, tokenizer):
    """Tuong thich transformers moi (processing_class) va cu (tokenizer)."""
    kwargs = {
        "model": model,
        "args": training_args,
        "train_dataset": train_ds,
        "eval_dataset": val_ds,
        "data_collator": DataCollatorWithPadding(tokenizer=tokenizer),
    }
    params = inspect.signature(Trainer.__init__).parameters
    if "processing_class" in params:
        kwargs["processing_class"] = tokenizer
    elif "tokenizer" in params:
        kwargs["tokenizer"] = tokenizer
    return Trainer(**kwargs)


def get_trainer_tokenizer(trainer):
    return getattr(trainer, "processing_class", None) or getattr(trainer, "tokenizer", None)


class EpochMetricsCallback(TrainerCallback):
    def __init__(self, trainer, train_ds, val_ds, label_list, label2id, task_cfg):
        self.trainer = trainer
        self.train_ds = train_ds
        self.val_ds = val_ds
        self.label_list = label_list
        self.label2id = label2id
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
            "train_loss": tr_m["loss"],
            "train_acc": tr_m["acc"],
            "train_precision": tr_m["precision"],
            "train_recall": tr_m["recall"],
            "train_f1": tr_m["f1"],
            "eval_loss": ev_m["loss"],
            "eval_acc": ev_m["acc"],
            "eval_precision": ev_m["precision"],
            "eval_recall": ev_m["recall"],
            "eval_f1": ev_m["f1"],
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
            self._save_best()
            print(f"-> Best model saved (F1={self.best_f1:.4f})")
        else:
            self.counter += 1
            print(f"-> Early stopping counter: {self.counter}/{CFG.early_stopping_patience}")
            if self.counter >= CFG.early_stopping_patience:
                print("-> Early stopping triggered.")
                control.should_training_stop = True
        return control

    def _save_best(self):
        hf_dir = Path(self.task_cfg["hf_out"])
        hf_dir.mkdir(parents=True, exist_ok=True)
        self.trainer.save_model(str(hf_dir))
        tok = get_trainer_tokenizer(self.trainer)
        if tok is not None:
            tok.save_pretrained(str(hf_dir))
        torch.save(
            {
                "model_state_dict": self.trainer.model.state_dict(),
                "task": self.task_cfg["task"],
                "best_f1_macro": self.best_f1,
                "best_epoch": self.best_epoch,
            },
            self.task_cfg["best_pt"],
        )
        print(f"   HF  -> {hf_dir}")


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
    id2label = {i: lab for lab, i in label2id.items()}
    train_df, val_df, test_df = load_csvs(task_cfg)

    tokenizer = AutoTokenizer.from_pretrained(CFG.model_name, use_fast=False)
    model = AutoModelForSequenceClassification.from_pretrained(
        CFG.model_name,
        num_labels=len(label_list),
        id2label=id2label,
        label2id=label2id,
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

    trainer = build_trainer(model, training_args, train_ds, val_ds, tokenizer)
    cb = EpochMetricsCallback(trainer, train_ds, val_ds, label_list, label2id, task_cfg)
    trainer.add_callback(cb)
    trainer.train()
    save_training_logs(cb.history, task_cfg["logs_csv"])

    te_true, te_pred, _ = predict_labels(trainer, test_ds)
    te_m = compute_metrics_sklearn(te_true, te_pred, len(label_list))
    te_cm = confusion_matrix(te_true, te_pred, labels=list(range(len(label_list))))
    report = classification_report(
        te_true, te_pred, target_names=label_list, zero_division=0, digits=4
    )
    with open(task_cfg["report_txt"], "w", encoding="utf-8") as f:
        f.write(report)
        f.write(f"\n\nBest epoch: {cb.best_epoch}\nBest val F1: {cb.best_f1:.4f}\n")
    plot_confusion_matrix(te_cm, label_list, task_cfg["cm_png"])

    with open(Path(task_cfg["hf_out"]) / "training_meta.json", "w", encoding="utf-8") as f:
        json.dump(
            {
                "task": task_cfg["task"],
                "best_epoch": cb.best_epoch,
                "best_val_f1_macro": cb.best_f1,
                "test_metrics": {k: float(v) for k, v in te_m.items()},
            },
            f,
            indent=2,
        )

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


def zip_outputs():
    zip_path = WORKING / "phobert_models_for_youtubeai.zip"
    include_paths = [
        Path(CFG_SENTIMENT["hf_out"]),
        Path(CFG_EMOTION["hf_out"]),
        Path(CFG_SENTIMENT["best_pt"]),
        Path(CFG_EMOTION["best_pt"]),
        Path(CFG_SENTIMENT["logs_csv"]),
        Path(CFG_EMOTION["logs_csv"]),
        Path(CFG_SENTIMENT["report_txt"]),
        Path(CFG_EMOTION["report_txt"]),
        Path(CFG_SENTIMENT["cm_png"]),
        Path(CFG_EMOTION["cm_png"]),
    ]
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
        for p in include_paths:
            if p.is_dir():
                for f in p.rglob("*"):
                    if f.is_file():
                        zf.write(f, arcname=str(f.relative_to(WORKING)))
            elif p.exists():
                zf.write(p, arcname=p.name)
    print("Zip:", zip_path, "| MB:", round(zip_path.stat().st_size / 1024 / 1024, 2))


def main():
    print("Device:", device)
    if torch.cuda.is_available():
        print("GPU:", torch.cuda.get_device_name(0))

    setup_task_paths(resolve_data_root())
    cfg = load_label_config()
    print("\nSentiment labels:", cfg["sentiment_labels"])
    print("Emotion labels  :", cfg["emotion_labels"])

    train_phobert_task(
        CFG_SENTIMENT,
        cfg["sentiment_labels"],
        cfg["sentiment_label2id"],
        CFG.sentiment_epochs,
    )
    train_phobert_task(
        CFG_EMOTION,
        cfg["emotion_labels"],
        cfg["emotion_label2id"],
        CFG.emotion_epochs,
    )

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
        print(f"  sentiment={sl} ({sc:.3f}) expect={exp_s}")
        print(f"  emotion  ={el} ({ec:.3f}) expect={exp_e}\n")

    zip_outputs()
    print("\nALL DONE. Copy phobert_sentiment/ + phobert_emotion/ -> ai_module/app/data/models/")


if __name__ == "__main__":
    main()
