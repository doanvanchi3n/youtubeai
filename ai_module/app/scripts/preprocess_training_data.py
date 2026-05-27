"""
Chuẩn hóa dataset raw (Kaggle) -> processed CSV cho train PhoBERT.

Pipeline:
  1. Map nhãn từng nguồn -> nhãn project
  2. Làm sạch text (unicode, URL, ký tự lỗi, khoảng trắng)
  3. Lọc mẫu quá ngắn / quá dài / quá nhiễu
  4. Loại trùng exact + near-duplicate (trong từng split)
  5. Loại train leak sang val/test (exact)
  6. Cân bằng lớp train -> train_balanced.csv

Output:
  data/processed/{sentiment,emotion}/{train,val,test}.csv
  data/processed/{sentiment,emotion}/train_balanced.csv
  data/processed/label_config.json
  data/processed/preprocessing_report.json
"""
from __future__ import annotations

import argparse
import ast
import hashlib
import json
import random
import re
import unicodedata
import zipfile
import xml.etree.ElementTree as ET
from collections import defaultdict
from difflib import SequenceMatcher
from pathlib import Path
from typing import Iterable

import pandas as pd

SENTIMENT_LABELS = ["negative", "neutral", "positive"]
EMOTION_LABELS = ["sad", "angry", "suggestion", "happy", "love"]

MIN_TEXT_LEN = 5
MAX_TEXT_LEN = 256
MIN_LETTER_RATIO = 0.25
MAX_REPEAT_CHAR_RATIO = 0.55
NEAR_DUP_RATIO = 0.92

VLSP_LABEL_MAP = {
    "NEG": "negative",
    "NEU": "neutral",
    "POS": "positive",
    "negative": "negative",
    "neutral": "neutral",
    "positive": "positive",
}

AIVIVN_LABEL_MAP = {
    0: "negative",
    1: "positive",
    "0": "negative",
    "1": "positive",
}

SYNTHETIC_LABEL_MAP = {
    "negative": "negative",
    "neutral": "neutral",
    "positive": "positive",
}

VSMEC_EMOTION_MAP = {
    "sadness": "sad",
    "fear": "sad",
    "anger": "angry",
    "disgust": "angry",
    "enjoyment": "happy",
    "surprise": "happy",
    "other": "suggestion",
}

VIGO_FINE_TO_BUCKET = {
    "neutral": "suggestion",
    "love": "love",
    "amusement": "happy",
    "excitement": "happy",
    "joy": "happy",
    "desire": "happy",
    "optimism": "happy",
    "caring": "happy",
    "pride": "happy",
    "admiration": "happy",
    "gratitude": "happy",
    "relief": "happy",
    "approval": "happy",
    "realization": "happy",
    "surprise": "happy",
    "curiosity": "happy",
    "anger": "angry",
    "annoyance": "angry",
    "disapproval": "angry",
    "disgust": "angry",
    "sadness": "sad",
    "grief": "sad",
    "disappointment": "sad",
    "remorse": "sad",
    "embarrassment": "sad",
    "confusion": "sad",
    "fear": "sad",
    "nervousness": "sad",
}

EMOTION_PRIORITY = ["love", "angry", "sad", "happy", "suggestion"]

CONTROL_CHAR_RE = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]")
ZERO_WIDTH_RE = re.compile(r"[\u200b-\u200d\ufeff]")
URL_RE = re.compile(r"http\S+|www\.\S+", re.IGNORECASE)
EMAIL_RE = re.compile(r"\S+@\S+")
WHITESPACE_RE = re.compile(r"\s+")
LETTER_RE = re.compile(r"[^\W\d_]", re.UNICODE)
NON_ALNUM_RE = re.compile(r"[\W_]+", re.UNICODE)
VIET_DIACRITICS_RE = re.compile(
    r"[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]",
    re.IGNORECASE,
)
ENGLISH_MARKERS_RE = re.compile(
    r"\b(the|and|or|is|are|was|were|university|student|students|facilities|"
    r"excellent|teaching|curriculum|feedback|school|college)\b",
    re.IGNORECASE,
)


def clean_text(text: str) -> str:
    """Làm sạch text: unicode NFC, bỏ ký tự lỗi, URL/email, chuẩn khoảng trắng."""
    if text is None or (isinstance(text, float) and pd.isna(text)):
        return ""
    text = str(text)
    text = unicodedata.normalize("NFC", text)
    text = ZERO_WIDTH_RE.sub("", text)
    text = CONTROL_CHAR_RE.sub("", text)
    text = URL_RE.sub(" ", text)
    text = EMAIL_RE.sub(" ", text)
    text = WHITESPACE_RE.sub(" ", text).strip()
    if len(text) > MAX_TEXT_LEN:
        text = text[:MAX_TEXT_LEN].rsplit(" ", 1)[0].strip() or text[:MAX_TEXT_LEN]
    return text


def normalize_for_dedup(text: str) -> str:
    """Chuẩn hóa để so sánh trùng lặp (không dùng làm text train)."""
    text = unicodedata.normalize("NFC", text.lower())
    text = NON_ALNUM_RE.sub("", text)
    return WHITESPACE_RE.sub("", text)


def text_exact_key(text: str) -> str:
    return hashlib.md5(normalize_for_dedup(text).encode("utf-8")).hexdigest()


def char_ngrams(text: str, n: int = 3) -> set[str]:
    text = normalize_for_dedup(text)
    if len(text) < n:
        return {text} if text else set()
    return {text[i : i + n] for i in range(len(text) - n + 1)}


def ngram_jaccard(a: set[str], b: set[str]) -> float:
    if not a and not b:
        return 1.0
    if not a or not b:
        return 0.0
    inter = len(a & b)
    union = len(a | b)
    return inter / union if union else 0.0


def is_vietnamese_text(text: str) -> bool:
    """Lọc câu tiếng Anh trong Synthetic (giữ câu Việt có/không dấu)."""
    if VIET_DIACRITICS_RE.search(text):
        return True
    if ENGLISH_MARKERS_RE.search(text):
        return False
    # Không dấu nhưng không giống câu Anh -> giữ (vd: "mon hoc rat hay")
    return True


def is_noisy_text(text: str) -> bool:
    """Lọc mẫu quá ngắn, quá nhiễu hoặc không có chữ."""
    if len(text) < MIN_TEXT_LEN:
        return True
    letters = LETTER_RE.findall(text)
    if len(letters) < 2:
        return True
    if len(letters) / max(len(text), 1) < MIN_LETTER_RATIO:
        return True
    if re.fullmatch(r"[\d\W_]+", text):
        return True
    # Ký tự lặp quá nhiều: "aaaaaaa", "!!!!!!"
    max_run = max((len(m.group()) for m in re.finditer(r"(.)\1+", text)), default=1)
    if max_run / len(text) > MAX_REPEAT_CHAR_RATIO:
        return True
    return False


def dedupe_block(indices: list[int], texts: list[str], removed: set[int]) -> int:
    """Near-dedup trong một block nhỏ bằng n-gram Jaccard + SequenceMatcher."""
    count = 0
    ngrams = [char_ngrams(texts[i]) for i in indices]
    for a_pos in range(len(indices)):
        ia = indices[a_pos]
        if ia in removed:
            continue
        for b_pos in range(a_pos + 1, len(indices)):
            ib = indices[b_pos]
            if ib in removed:
                continue
            jacc = ngram_jaccard(ngrams[a_pos], ngrams[b_pos])
            if jacc >= 0.85:
                is_near = True
            elif jacc >= 0.65:
                is_near = SequenceMatcher(None, texts[ia], texts[ib]).ratio() >= NEAR_DUP_RATIO
            else:
                is_near = False
            if is_near:
                removed.add(ib)
                count += 1
    return count


def dedupe_exact(df: pd.DataFrame) -> tuple[pd.DataFrame, int]:
    if df.empty:
        return df, 0
    before = len(df)
    df = df.copy().reset_index(drop=True)
    df["_key"] = df["text"].map(text_exact_key)
    df = df.drop_duplicates(subset=["_key", "split"], keep="first")
    df = df.drop(columns=["_key"]).reset_index(drop=True)
    return df, before - len(df)


def dedupe_near(df: pd.DataFrame) -> tuple[pd.DataFrame, int]:
    """Near-duplicate trong từng split, nhóm theo bucket độ dài + prefix."""
    if df.empty:
        return df, 0
    df = df.reset_index(drop=True)
    removed_indices: list[int] = []
    near_removed = 0
    texts = df["text"].tolist()

    for split in df["split"].unique():
        split_idx = df.index[df["split"] == split].tolist()
        buckets: dict[tuple[int, str], list[int]] = defaultdict(list)
        for idx in split_idx:
            norm = normalize_for_dedup(texts[idx])
            bucket = (len(norm) // 8, norm[:12])
            buckets[bucket].append(idx)

        removed_set: set[int] = set()
        for bucket_indices in buckets.values():
            if len(bucket_indices) < 2:
                continue
            near_removed += dedupe_block(bucket_indices, texts, removed_set)
        removed_indices.extend(removed_set)

    if not removed_indices:
        return df, 0
    return df.drop(index=removed_indices).reset_index(drop=True), near_removed


def remove_split_leakage(train_df: pd.DataFrame, other_df: pd.DataFrame) -> tuple[pd.DataFrame, int]:
    """Bỏ train trùng exact với val/test (tránh leak)."""
    if train_df.empty or other_df.empty:
        return train_df, 0
    leak_keys = {text_exact_key(t) for t in other_df["text"]}
    mask = train_df["text"].map(lambda t: text_exact_key(t) not in leak_keys)
    removed = int((~mask).sum())
    return train_df[mask].reset_index(drop=True), removed


def balance_train_df(train_df: pd.DataFrame, seed: int = 42) -> pd.DataFrame:
    """Oversample các lớp thiểu số trong train để bằng lớp đa số."""
    if train_df.empty:
        return train_df
    rng = random.Random(seed)
    target = train_df["label"].value_counts().max()
    parts = []
    for label in train_df["label"].unique():
        subset = train_df[train_df["label"] == label]
        if len(subset) == 0:
            continue
        if len(subset) < target:
            extra = subset.sample(n=target - len(subset), replace=True, random_state=seed)
            parts.append(pd.concat([subset, extra], ignore_index=True))
        else:
            parts.append(subset)
    balanced = pd.concat(parts, ignore_index=True)
    return balanced.sample(frac=1, random_state=seed).reset_index(drop=True)


def postprocess_df(df: pd.DataFrame, stats: dict, task_name: str) -> pd.DataFrame:
    """Áp dụng dedup, leak removal, balance cho một task."""
    s = stats[task_name]
    s["after_load"] = len(df)

    df, n_exact = dedupe_exact(df)
    s["removed_exact_dup"] = n_exact

    df, n_near = dedupe_near(df)
    s["removed_near_dup"] = n_near

    val_df = df[df["split"] == "val"].copy()
    test_df = df[df["split"] == "test"].copy()
    train_df = df[df["split"] == "train"].copy()

    train_df, n_leak_val = remove_split_leakage(train_df, val_df)
    train_df, n_leak_test = remove_split_leakage(train_df, test_df)
    s["removed_train_leak_val"] = n_leak_val
    s["removed_train_leak_test"] = n_leak_test

    s["train_before_balance"] = len(train_df)
    train_balanced = balance_train_df(train_df)
    s["train_balanced"] = len(train_balanced)

    df = pd.concat([train_df, val_df, test_df], ignore_index=True)
    s["final_unbalanced_total"] = len(df)
    return df, train_balanced


def read_xlsx_rows(path: Path) -> list[list[str]]:
    with zipfile.ZipFile(path) as zf:
        shared: list[str] = []
        if "xl/sharedStrings.xml" in zf.namelist():
            root = ET.fromstring(zf.read("xl/sharedStrings.xml"))
            ns = {"m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
            for si in root.findall(".//m:si", ns):
                parts = [t.text or "" for t in si.findall(".//m:t", ns)]
                shared.append("".join(parts))

        sheet = ET.fromstring(zf.read("xl/worksheets/sheet1.xml"))
        ns = {"m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
        rows: list[list[str]] = []
        for row in sheet.findall(".//m:sheetData/m:row", ns):
            vals: list[str] = []
            for cell in row.findall("m:c", ns):
                cell_type = cell.get("t")
                value_node = cell.find("m:v", ns)
                if value_node is None:
                    vals.append("")
                elif cell_type == "s":
                    vals.append(shared[int(value_node.text)])
                else:
                    vals.append(value_node.text or "")
            rows.append(vals)
        return rows


def append_record(
    records: list[dict],
    sample_id: str,
    raw_text: str,
    label: str | None,
    source: str,
    split: str,
    stats: dict,
    task: str,
) -> None:
    if not label:
        stats[task]["skipped_bad_label"] += 1
        return
    text = clean_text(raw_text)
    if not text:
        stats[task]["skipped_empty"] += 1
        return
    if is_noisy_text(text):
        stats[task]["skipped_noisy"] += 1
        return
    if source == "synthetic_feedback" and not is_vietnamese_text(text):
        stats[task]["skipped_non_vietnamese"] += 1
        return
    records.append(
        {
            "id": sample_id,
            "text": text,
            "label": label,
            "source": source,
            "split": split,
        }
    )


def load_vsmec_split(path: Path, split: str, source: str, stats: dict) -> pd.DataFrame:
    rows = read_xlsx_rows(path)
    records = []
    for row in rows[1:]:
        if len(row) < 3:
            continue
        sample_id, emotion_raw, sentence = row[0], row[1], row[2]
        emotion = str(emotion_raw).strip().lower()
        label = VSMEC_EMOTION_MAP.get(emotion)
        append_record(
            records,
            f"vsmec_{sample_id}",
            sentence,
            label,
            source,
            split,
            stats,
            "emotion",
        )
    return pd.DataFrame(records)


def parse_vigo_label_list(raw_labels) -> list[int]:
    if isinstance(raw_labels, list):
        return [int(x) for x in raw_labels]
    s = str(raw_labels).strip()
    if not s:
        return []
    try:
        parsed = ast.literal_eval(s)
        if isinstance(parsed, list):
            return [int(x) for x in parsed]
    except (ValueError, SyntaxError):
        pass
    return [int(x.strip()) for x in s.strip("[]").split(",") if x.strip().isdigit()]


def vigo_ids_to_bucket(label_ids: Iterable[int], id2emotion: dict[str, str]) -> str | None:
    buckets: set[str] = set()
    for label_id in label_ids:
        fine = id2emotion.get(str(label_id), "").lower()
        bucket = VIGO_FINE_TO_BUCKET.get(fine)
        if bucket:
            buckets.add(bucket)
    if not buckets:
        return None
    for priority in EMOTION_PRIORITY:
        if priority in buckets:
            return priority
    return None


def clean_task_output_dir(out_dir: Path) -> None:
    """Xóa file CSV/lock cũ trước khi ghi processed mới."""
    if not out_dir.exists():
        return
    for path in out_dir.iterdir():
        if path.is_file():
            path.unlink()


def save_outputs(
    df: pd.DataFrame,
    train_balanced: pd.DataFrame,
    out_dir: Path,
    task_name: str,
) -> None:
    clean_task_output_dir(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    for split in ["train", "val", "test"]:
        part = df[df["split"] == split]
        part.to_csv(out_dir / f"{split}.csv", index=False)
        print(f"  -> {task_name}/{split}.csv: {len(part)} rows")
    train_balanced.to_csv(out_dir / "train_balanced.csv", index=False)
    print(f"  -> {task_name}/train_balanced.csv: {len(train_balanced)} rows")


def process_sentiment(raw_dir: Path, include_synthetic: bool, stats: dict) -> tuple[pd.DataFrame, pd.DataFrame]:
    frames: list[pd.DataFrame] = []
    st = stats["sentiment"]

    vlsp_dir = raw_dir / "VLSP2016_SA"
    for split, fname in [("train", "train.csv"), ("val", "val.csv"), ("test", "test.csv")]:
        path = vlsp_dir / fname
        if not path.exists():
            continue
        df = pd.read_csv(path)
        records = []
        for i, row in df.iterrows():
            label = VLSP_LABEL_MAP.get(str(row["label"]).strip())
            append_record(
                records,
                f"vlsp_{split}_{i}",
                row["text"],
                label,
                "vlsp2016",
                split,
                stats,
                "sentiment",
            )
        frames.append(pd.DataFrame(records))

    aiv_dir = raw_dir / "AIVIVN2019"
    for split, fname in [("train", "train.csv"), ("test", "test.csv")]:
        path = aiv_dir / fname
        if not path.exists():
            continue
        df = pd.read_csv(path)
        records = []
        for _, row in df.iterrows():
            label = AIVIVN_LABEL_MAP.get(row["label"])
            if label is None:
                label = AIVIVN_LABEL_MAP.get(str(row["label"]).strip())
            append_record(
                records,
                str(row.get("id", "")),
                row["comment"],
                label,
                "aivivn2019",
                split,
                stats,
                "sentiment",
            )
        frames.append(pd.DataFrame(records))

    if include_synthetic:
        for path in raw_dir.glob("Synthetic*/synthetic_*.csv"):
            split = "train" if "train" in path.name else "val"
            df = pd.read_csv(path)
            records = []
            for i, row in df.iterrows():
                label = SYNTHETIC_LABEL_MAP.get(str(row["sentiment"]).strip().lower())
                append_record(
                    records,
                    f"synthetic_{split}_{i}",
                    row["sentence"],
                    label,
                    "synthetic_feedback",
                    split,
                    stats,
                    "sentiment",
                )
            syn_df = pd.DataFrame(records)
            st["synthetic_rows_added"] = len(syn_df)
            frames.append(syn_df)

    merged = pd.concat(frames, ignore_index=True) if frames else pd.DataFrame()
    st["raw_merged"] = len(merged)
    if merged.empty:
        return merged, merged
    return postprocess_df(merged, stats, "sentiment")


def process_emotion(raw_dir: Path, stats: dict) -> tuple[pd.DataFrame, pd.DataFrame]:
    frames: list[pd.DataFrame] = []

    vsmec_dir = raw_dir / "Vietnamese Social Media Emotion Corpus"
    for split, fname in [
        ("train", "train_nor_811.xlsx"),
        ("val", "valid_nor_811.xlsx"),
        ("test", "test_nor_811.xlsx"),
    ]:
        path = vsmec_dir / fname
        if path.exists():
            frames.append(load_vsmec_split(path, split, "vsmec", stats))

    vigo_dir = raw_dir / "ViGoEmotions dataset"
    id2emotion: dict[str, str] = {}
    label_dict_path = vigo_dir / "label_dict.json"
    if label_dict_path.exists():
        with open(label_dict_path, encoding="utf-8") as f:
            id2emotion = json.load(f)

    for split, fname in [("train", "train.csv"), ("val", "val.csv"), ("test", "test.csv")]:
        path = vigo_dir / fname
        if not path.exists():
            continue
        df = pd.read_csv(path)
        records = []
        for _, row in df.iterrows():
            label_ids = parse_vigo_label_list(row["labels"])
            bucket = vigo_ids_to_bucket(label_ids, id2emotion)
            append_record(
                records,
                str(row.get("id", "")),
                row["text"],
                bucket,
                "vigoemotions",
                split,
                stats,
                "emotion",
            )
        frames.append(pd.DataFrame(records))

    merged = pd.concat(frames, ignore_index=True) if frames else pd.DataFrame()
    stats["emotion"]["raw_merged"] = len(merged)
    if merged.empty:
        return merged, merged
    return postprocess_df(merged, stats, "emotion")


def label_counts(df: pd.DataFrame) -> dict:
    if df.empty:
        return {}
    return df["label"].value_counts().to_dict()


def write_label_config(
    out_dir: Path,
    sentiment_df: pd.DataFrame,
    sentiment_balanced: pd.DataFrame,
    emotion_df: pd.DataFrame,
    emotion_balanced: pd.DataFrame,
) -> None:
    config = {
        "sentiment_labels": SENTIMENT_LABELS,
        "emotion_labels": EMOTION_LABELS,
        "sentiment_label2id": {l: i for i, l in enumerate(SENTIMENT_LABELS)},
        "emotion_label2id": {l: i for i, l in enumerate(EMOTION_LABELS)},
        "train_file_recommendation": "train_balanced.csv",
        "preprocessing": {
            "min_text_len": MIN_TEXT_LEN,
            "max_text_len": MAX_TEXT_LEN,
            "near_dup_ratio": NEAR_DUP_RATIO,
            "balance_method": "oversample_to_majority_class",
        },
        "sentiment_counts": {},
        "emotion_counts": {},
    }
    config["sentiment_counts"]["train_balanced"] = label_counts(sentiment_balanced)
    config["emotion_counts"]["train_balanced"] = label_counts(emotion_balanced)

    for task, df in [("sentiment", sentiment_df), ("emotion", emotion_df)]:
        for split in ["train", "val", "test"]:
            part = df[df["split"] == split]
            key = f"{task}_{split}"
            bucket = "sentiment_counts" if task == "sentiment" else "emotion_counts"
            config[bucket][key] = label_counts(part)

    with open(out_dir / "label_config.json", "w", encoding="utf-8") as f:
        json.dump(config, f, ensure_ascii=False, indent=2)
    print("  -> label_config.json")


def print_summary(sentiment_df: pd.DataFrame, emotion_df: pd.DataFrame) -> None:
    print("\n=== SENTIMENT (sau xử lý đầy đủ) ===")
    if not sentiment_df.empty:
        print(sentiment_df.groupby(["split", "label"]).size().unstack(fill_value=0))
    print("\n=== EMOTION (sau xử lý đầy đủ) ===")
    if not emotion_df.empty:
        print(emotion_df.groupby(["split", "label"]).size().unstack(fill_value=0))


def main() -> None:
    parser = argparse.ArgumentParser(description="Preprocess Kaggle raw datasets for PhoBERT training.")
    parser.add_argument("--raw-dir", type=Path, default=Path("data/raw/kaggle_downloads"))
    parser.add_argument("--out-dir", type=Path, default=Path("data/processed"))
    parser.add_argument(
        "--include-synthetic",
        action=argparse.BooleanOptionalAction,
        default=True,
        help="Ghép Synthetic Vietnamese Students' Feedback vào sentiment (mặc định: bật)",
    )
    parser.add_argument("--seed", type=int, default=42)
    args = parser.parse_args()

    raw_dir = args.raw_dir.resolve()
    out_dir = args.out_dir.resolve()
    out_dir.mkdir(parents=True, exist_ok=True)

    stats = {
        "sentiment": defaultdict(int),
        "emotion": defaultdict(int),
        "settings": {
            "min_text_len": MIN_TEXT_LEN,
            "max_text_len": MAX_TEXT_LEN,
            "near_dup_ratio": NEAR_DUP_RATIO,
            "seed": args.seed,
        },
    }

    print(f"Raw dir : {raw_dir}")
    print(f"Out dir : {out_dir}")
    print(f"Include synthetic sentiment: {args.include_synthetic}")

    sentiment_df, sentiment_balanced = process_sentiment(raw_dir, args.include_synthetic, stats)
    emotion_df, emotion_balanced = process_emotion(raw_dir, stats)

    if not sentiment_df.empty:
        save_outputs(sentiment_df, sentiment_balanced, out_dir / "sentiment", "sentiment")
    if not emotion_df.empty:
        save_outputs(emotion_df, emotion_balanced, out_dir / "emotion", "emotion")

    write_label_config(out_dir, sentiment_df, sentiment_balanced, emotion_df, emotion_balanced)

    with open(out_dir / "preprocessing_report.json", "w", encoding="utf-8") as f:
        json.dump({k: dict(v) if isinstance(v, defaultdict) else v for k, v in stats.items()}, f, indent=2)
    print("  -> preprocessing_report.json")

    print_summary(sentiment_df, emotion_df)
    print("\nDone. Dùng train_balanced.csv khi train trên Kaggle.")


if __name__ == "__main__":
    main()
