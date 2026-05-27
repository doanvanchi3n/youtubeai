"""
Kaggle Cell 1 — CHECK dataset youtubeai-phobert-processed-v1

Copy toan bo file nay vao Cell 1 notebook.
Can: Add Data -> youtubeai-phobert-processed-v1
Output: /kaggle/working/dataset_root.txt (Cell 2 doc file nay)
"""
from __future__ import annotations

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

WORKING = "/kaggle/working"
DATASET_ROOT_FILE = os.path.join(WORKING, "dataset_root.txt")


def find_dataset_root() -> str | None:
    for hint in PATH_HINTS:
        if os.path.isfile(os.path.join(hint, "label_config.json")):
            return hint
    for root, _dirs, files in os.walk("/kaggle/input"):
        if "label_config.json" not in files:
            continue
        if os.path.isfile(os.path.join(root, "sentiment", "train_balanced.csv")):
            return root
    return None


def main() -> bool:
    print("=" * 60)
    print("CHECK DATASET STRUCTURE ON KAGGLE")
    print("=" * 60)

    if os.path.exists("/kaggle/input"):
        print("\n/kaggle/input:")
        for name in sorted(os.listdir("/kaggle/input")):
            p = os.path.join("/kaggle/input", name)
            kind = "dir" if os.path.isdir(p) else "file"
            print(f"  [{kind}] {name}")
    else:
        print("\n[WARN] /kaggle/input khong ton tai (chua Add Data?)")

    root = find_dataset_root()
    if root is None:
        print("\n[ERROR] Khong tim thay dataset.")
        print("-> Notebook: Add Data -> youtubeai-phobert-processed-v1")
        return False

    print("\n[data_root]", root)
    os.makedirs(WORKING, exist_ok=True)
    with open(DATASET_ROOT_FILE, "w", encoding="utf-8") as f:
        f.write(root)
    print(f"(saved -> {DATASET_ROOT_FILE})")

    cfg_path = os.path.join(root, "label_config.json")
    if not os.path.isfile(cfg_path):
        print("[MISSING] label_config.json")
        return False

    cfg = json.load(open(cfg_path, encoding="utf-8"))
    print("sentiment_labels:", cfg.get("sentiment_labels"))
    print("emotion_labels:", cfg.get("emotion_labels"))

    files = [
        ("sentiment", "train_balanced.csv", set(EXPECTED_SENTIMENT)),
        ("sentiment", "val.csv", set(EXPECTED_SENTIMENT)),
        ("sentiment", "test.csv", set(EXPECTED_SENTIMENT)),
        ("emotion", "train_balanced.csv", set(EXPECTED_EMOTION)),
        ("emotion", "val.csv", set(EXPECTED_EMOTION)),
        ("emotion", "test.csv", set(EXPECTED_EMOTION)),
    ]
    all_ok = True
    for task, fname, expected in files:
        path = os.path.join(root, task, fname)
        print(f"\n--- {task}/{fname} ---")
        if not os.path.isfile(path):
            print("[MISSING]", path)
            all_ok = False
            continue
        df = pd.read_csv(path)
        print(f"OK rows={len(df)} cols={list(df.columns)}")
        for col in REQUIRED_COLUMNS:
            if col not in df.columns:
                print("[WARN] missing column:", col)
                all_ok = False
        if "label" in df.columns:
            print("labels:", df["label"].value_counts().to_dict())
            bad = set(df["label"].unique()) - expected
            if bad:
                print("[WARN] unknown labels:", bad)
                all_ok = False

    print("\n" + "=" * 60)
    if all_ok:
        print("CHECK PASSED — chay Cell 2 (kaggle_cell2_train_phobert.py)")
    else:
        print("CHECK FAILED — sua dataset truoc khi train")
    print("=" * 60)
    return all_ok


if __name__ == "__main__":
    ok = main()
    if not ok:
        raise SystemExit(1)
