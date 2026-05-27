"""
Kaggle Cell 3 — Ve bieu do + XUAT FILE de tai ve

Chay sau Cell 2 (train xong).

Input (trong /kaggle/working):
  - sentiment_training_logs.csv, emotion_training_logs.csv
  - sentiment/emotion_classification_report.txt (neu co)
  - sentiment/emotion_confusion_matrix.png (neu co)

Output (tai ve tu tab Output):
  - training_report/sentiment_training_curves.png
  - training_report/emotion_training_curves.png
  - training_report/training_summary_dashboard.png
  - training_report/training_status_report.txt
  - training_report_youtubeai.zip
"""
from __future__ import annotations

import zipfile
from pathlib import Path

import matplotlib.pyplot as plt
import pandas as pd

def _resolve_working() -> Path:
    candidates = [Path("/kaggle/working")]
    # __file__ khong co trong Jupyter/Kaggle notebook
    try:
        script_dir = Path(__file__).resolve().parent
        candidates.append(script_dir / "app/models/phobert_models_for_youtubeai")
    except NameError:
        pass
    candidates.extend([
        Path("ai_module/app/models/phobert_models_for_youtubeai"),
        Path("app/models/phobert_models_for_youtubeai"),
    ])
    for c in candidates:
        if (c / "sentiment_training_logs.csv").exists() or (c / "emotion_training_logs.csv").exists():
            return c
    return Path("/kaggle/working")


WORKING = _resolve_working()
OUT_DIR = WORKING / "training_report"
ZIP_PATH = WORKING / "training_report_youtubeai.zip"

TASKS = [
    {
        "name": "sentiment",
        "logs": WORKING / "sentiment_training_logs.csv",
        "report": WORKING / "sentiment_classification_report.txt",
        "cm": WORKING / "sentiment_confusion_matrix.png",
        "curves_png": "sentiment_training_curves.png",
    },
    {
        "name": "emotion",
        "logs": WORKING / "emotion_training_logs.csv",
        "report": WORKING / "emotion_classification_report.txt",
        "cm": WORKING / "emotion_confusion_matrix.png",
        "curves_png": "emotion_training_curves.png",
    },
]


def _load_logs(csv_path: Path, task_name: str) -> pd.DataFrame | None:
    if not csv_path.exists():
        print(f"[MISSING] {task_name}: {csv_path.name}")
        return None
    df = pd.read_csv(csv_path)
    if df.empty:
        print(f"[EMPTY] {task_name}: {csv_path.name}")
        return None
    return df


def _status_lines(task_name: str, df: pd.DataFrame) -> list[str]:
    last = df.iloc[-1]
    best_idx = int(df["eval_f1"].idxmax())
    best = df.iloc[best_idx]
    lines = [
        f"===== {task_name.upper()} =====",
        f"epochs_ran     : {len(df)}",
        f"last_epoch     : {int(last['epoch'])}",
        (
            f"last_eval      : loss={last['eval_loss']:.4f}, "
            f"acc={last['eval_acc']:.4f}, f1={last['eval_f1']:.4f}"
        ),
        (
            f"best_eval_f1   : epoch={int(best['epoch'])}, "
            f"f1={best['eval_f1']:.4f}, acc={best['eval_acc']:.4f}"
        ),
        (
            f"last_train_f1  : {last['train_f1']:.4f} | "
            f"gap(train-eval): {last['train_f1'] - last['eval_f1']:.4f}"
        ),
    ]
    if len(df) >= 2:
        improve = df["eval_f1"].iloc[-1] - df["eval_f1"].iloc[0]
        trend = "cai thien" if improve >= 0 else "giam"
        lines.append(f"f1_trend       : {trend} ({improve:+.4f})")
    return lines


def _save_curves(df: pd.DataFrame, task_name: str, out_path: Path) -> None:
    epochs = df["epoch"]
    fig, axes = plt.subplots(1, 3, figsize=(16, 4.8))
    fig.suptitle(f"{task_name.upper()} — Training Curves", fontsize=14, fontweight="bold")

    axes[0].plot(epochs, df["train_loss"], "o-", label="train")
    axes[0].plot(epochs, df["eval_loss"], "o-", label="eval")
    axes[0].set_title("Loss")
    axes[0].set_xlabel("Epoch")
    axes[0].grid(alpha=0.3)
    axes[0].legend()

    axes[1].plot(epochs, df["train_acc"], "o-", label="train")
    axes[1].plot(epochs, df["eval_acc"], "o-", label="eval")
    axes[1].set_title("Accuracy")
    axes[1].set_xlabel("Epoch")
    axes[1].set_ylim(0, 1.02)
    axes[1].grid(alpha=0.3)
    axes[1].legend()

    axes[2].plot(epochs, df["train_f1"], "o-", label="train")
    axes[2].plot(epochs, df["eval_f1"], "o-", label="eval")
    best_idx = int(df["eval_f1"].idxmax())
    axes[2].scatter(
        [df.loc[best_idx, "epoch"]],
        [df.loc[best_idx, "eval_f1"]],
        color="red",
        s=80,
        zorder=5,
        label=f"best eval F1 (ep {int(df.loc[best_idx, 'epoch'])})",
    )
    axes[2].set_title("F1 (macro)")
    axes[2].set_xlabel("Epoch")
    axes[2].set_ylim(0, 1.02)
    axes[2].grid(alpha=0.3)
    axes[2].legend()

    plt.tight_layout()
    fig.savefig(out_path, dpi=150, bbox_inches="tight")
    plt.close(fig)
    print(f"  saved -> {out_path}")


def _save_dashboard(task_data: list[tuple[str, pd.DataFrame]], out_path: Path) -> None:
    """1 anh tong hop: text trang thai + 2 bang metric epoch cuoi."""
    n = len(task_data)
    fig = plt.figure(figsize=(14, 5 * n))
    fig.suptitle("YouTube AI — PhoBERT Training Summary", fontsize=16, fontweight="bold", y=0.98)

    for i, (name, df) in enumerate(task_data):
        lines = _status_lines(name, df)
        ax_text = fig.add_subplot(n, 2, i * 2 + 1)
        ax_text.axis("off")
        ax_text.text(
            0.02,
            0.98,
            "\n".join(lines),
            va="top",
            ha="left",
            fontsize=11,
            family="monospace",
            transform=ax_text.transAxes,
            bbox=dict(boxstyle="round", facecolor="#f0f4ff", alpha=0.9),
        )

        ax_tbl = fig.add_subplot(n, 2, i * 2 + 2)
        ax_tbl.axis("off")
        cols = ["epoch", "train_f1", "eval_f1", "eval_acc", "eval_loss"]
        show = df[cols].round(4)
        table = ax_tbl.table(
            cellText=show.values,
            colLabels=show.columns,
            loc="center",
            cellLoc="center",
        )
        table.auto_set_font_size(False)
        table.set_fontsize(9)
        table.scale(1.1, 1.4)
        ax_tbl.set_title(f"{name.upper()} — metrics per epoch", fontsize=12)

    plt.tight_layout(rect=[0, 0, 1, 0.96])
    fig.savefig(out_path, dpi=150, bbox_inches="tight")
    plt.close(fig)
    print(f"  saved -> {out_path}")


def _save_combined_f1(task_data: list[tuple[str, pd.DataFrame]], out_path: Path) -> None:
    fig, ax = plt.subplots(figsize=(10, 5))
    for name, df in task_data:
        ax.plot(df["epoch"], df["eval_f1"], "o-", linewidth=2, label=f"{name} eval F1")
    ax.set_title("So sanh Eval F1 — Sentiment vs Emotion")
    ax.set_xlabel("Epoch")
    ax.set_ylabel("F1 macro")
    ax.set_ylim(0, 1.02)
    ax.grid(alpha=0.3)
    ax.legend()
    plt.tight_layout()
    fig.savefig(out_path, dpi=150, bbox_inches="tight")
    plt.close(fig)
    print(f"  saved -> {out_path}")


def _copy_confusion_to_report(cm_src: Path, task_name: str) -> Path | None:
    if not cm_src.exists():
        return None
    dst = OUT_DIR / f"{task_name}_confusion_matrix.png"
    dst.write_bytes(cm_src.read_bytes())
    print(f"  copied -> {dst.name}")
    return dst


def _zip_report(files: list[Path]) -> None:
    with zipfile.ZipFile(ZIP_PATH, "w", zipfile.ZIP_DEFLATED) as zf:
        for f in files:
            if f.exists():
                zf.write(f, arcname=f"training_report/{f.name}")
    mb = ZIP_PATH.stat().st_size / 1024 / 1024
    print(f"\n[ZIP] {ZIP_PATH} ({mb:.2f} MB)")
    print("-> Tai file nay tu tab Output cua Kaggle notebook.")


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    print("Export folder:", OUT_DIR)

    task_data: list[tuple[str, pd.DataFrame]] = []
    exported: list[Path] = []
    report_lines: list[str] = ["YouTube AI — PhoBERT Training Report", "=" * 50, ""]

    for t in TASKS:
        df = _load_logs(t["logs"], t["name"])
        if df is None:
            continue
        task_data.append((t["name"], df))
        report_lines.extend(_status_lines(t["name"], df))
        report_lines.append("")

        curves_path = OUT_DIR / t["curves_png"]
        _save_curves(df, t["name"], curves_path)
        exported.append(curves_path)

        if t["report"].exists():
            dst = OUT_DIR / t["report"].name
            dst.write_text(t["report"].read_text(encoding="utf-8"), encoding="utf-8")
            exported.append(dst)
            print(f"  copied -> {dst.name}")

        cm_dst = _copy_confusion_to_report(t["cm"], t["name"])
        if cm_dst:
            exported.append(cm_dst)

    if not task_data:
        print("\n[ERROR] Khong co log CSV. Chay Cell 2 truoc.")
        return

    txt_path = OUT_DIR / "training_status_report.txt"
    txt_path.write_text("\n".join(report_lines), encoding="utf-8")
    exported.append(txt_path)
    print(f"  saved -> {txt_path.name}")

    dash_path = OUT_DIR / "training_summary_dashboard.png"
    _save_dashboard(task_data, dash_path)
    exported.append(dash_path)

    compare_path = OUT_DIR / "sentiment_vs_emotion_eval_f1.png"
    if len(task_data) >= 2:
        _save_combined_f1(task_data, compare_path)
        exported.append(compare_path)

    _zip_report(exported)

    print("\n" + "=" * 50)
    for line in report_lines:
        print(line)
    print("=" * 50)
    print("\nFiles exported:")
    for p in sorted(exported):
        print(" ", p)


if __name__ == "__main__":
    main()
