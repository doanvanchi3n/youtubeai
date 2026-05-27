#!/usr/bin/env python3
"""Tao file .docx bang thu vien chuan (zip + XML), khong can python-docx."""
from __future__ import annotations

import html
import zipfile
from datetime import date
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "BAO_CAO_CONG_VIEC_PHOBERT_27_05_2026.docx"

W_NS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"


def esc(t: str) -> str:
    return html.escape(t, quote=False)


def p(text: str, bold: bool = False, size: int = 24) -> str:
    b_open = "<w:b/>" if bold else ""
    return (
        f'<w:p><w:r><w:rPr>{b_open}<w:sz w:val="{size}"/></w:rPr>'
        f"<w:t xml:space=\"preserve\">{esc(text)}</w:t></w:r></w:p>"
    )


def h1(text: str) -> str:
    return (
        f'<w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr>'
        f'<w:r><w:rPr><w:b/><w:sz w:val="32"/></w:rPr>'
        f"<w:t>{esc(text)}</w:t></w:r></w:p>"
    )


def h2(text: str) -> str:
    return (
        f'<w:p><w:pPr><w:pStyle w:val="Heading2"/></w:pPr>'
        f'<w:r><w:rPr><w:b/><w:sz w:val="28"/></w:rPr>'
        f"<w:t>{esc(text)}</w:t></w:r></w:p>"
    )


def bullet(text: str) -> str:
    return (
        f'<w:p><w:pPr><w:numPr><w:ilvl w:val="0"/>'
        f'<w:numId w:val="1"/></w:numPr></w:pPr>'
        f'<w:r><w:t xml:space="preserve">• {esc(text)}</w:t></w:r></w:p>'
    )


def build_body() -> str:
    d = date.today().strftime("%d/%m/%Y")
    parts = [
        p("BÁO CÁO CÔNG VIỆC — HUẤN LUYỆN MÔ HÌNH PhoBERT", bold=True, size=36),
        p("Dự án: YouTube AI — Phân tích cảm xúc & sắc thái bình luận tiếng Việt", size=24),
        p(f"Ngày báo cáo: {d}", size=22),
        p("Người thực hiện: [Điền tên nhóm / sinh viên]", size=22),
        p(""),
        h1("1. Mục tiêu công việc"),
        p(
            "Xây dựng pipeline huấn luyện hai mô hình PhoBERT (vinai/phobert-base) "
            "phục vụ hệ thống YouTube AI: (1) Sentiment 3 lớp: negative, neutral, positive; "
            "(2) Emotion 5 lớp: sad, angry, suggestion, happy, love. "
            "Mô hình sau train được đưa vào ai_module để phân tích bình luận YouTube."
        ),
        h1("2. Các công việc đã thực hiện trong ngày"),
        h2("2.1. Thu thập dữ liệu"),
        p(
            "Tải và tổ chức các bộ dataset tiếng Việt từ Kaggle vào "
            "ai_module/data/raw/kaggle_downloads/: VLSP2016_SA, AIVIVN2019, "
            "Synthetic Vietnamese Students' Feedback, UIT-VSMEC (VSMEC), ViGoEmotions."
        ),
        h2("2.2. Tiền xử lý dữ liệu (Data Processing)"),
        p("Viết và chạy script: ai_module/app/scripts/preprocess_training_data.py"),
        bullet("Chuẩn hóa nhãn theo label_config của project"),
        bullet("Làm sạch văn bản: Unicode NFC, lowercase, loại URL/email, max 256 ký tự"),
        bullet("Lọc nhiễu, văn bản quá ngắn, không phải tiếng Việt"),
        bullet("Khử trùng lặp exact + near-duplicate (ratio 0.92)"),
        bullet("Loại rò rỉ dữ liệu giữa train / val / test"),
        bullet("Cân bằng lớp trên tập train → train_balanced.csv"),
        p("Kết quả: ai_module/data/processed/ (sentiment/, emotion/, label_config.json)"),
        h2("2.3. Upload dataset lên Kaggle"),
        p("Đóng gói dữ liệu đã xử lý → dataset Kaggle: youtubeai-phobert-processed-v1"),
        h2("2.4. Huấn luyện trên Kaggle (GPU T4)"),
        bullet("Base model: vinai/phobert-base"),
        bullet("Sentiment: tối đa 6 epoch | Emotion: tối đa 8 epoch"),
        bullet("Early stopping: patience=3, metric = val F1 macro"),
        bullet("Batch size 16, lr 2e-5, max_length 128"),
        bullet("Chuẩn hóa text giống TextProcessor của project khi inference"),
        h2("2.5. Tạo script notebook Kaggle (3 cell)"),
        bullet("kaggle_cell1_check_dataset.py — kiểm tra cấu trúc dataset"),
        bullet("kaggle_cell2_train_phobert.py — train, test, lưu model + zip"),
        bullet("kaggle_cell3_plot_training_status.py — vẽ biểu đồ, xuất báo cáo ảnh/zip"),
        h2("2.6. Xử lý lỗi kỹ thuật"),
        bullet("Sửa Trainer(..., tokenizer=...) → processing_class (transformers mới)"),
        bullet("Sửa __file__ không tồn tại trên Kaggle notebook (Cell 3)"),
        bullet("Tự động tìm đường dẫn dataset trong /kaggle/input"),
        h2("2.7. Triển khai model về máy local"),
        p(
            "Tải output Kaggle, copy phobert_sentiment/ và phobert_emotion/ "
            "vào ai_module/app/models/ để tích hợp API."
        ),
        h1("3. Thống kê dữ liệu sau tiền xử lý"),
        p("Sentiment — nguồn: VLSP + AIVIVN + Synthetic"),
        bullet("Train (cân bằng): 32.604 mẫu"),
        bullet("Test: 4.200 mẫu"),
        bullet("3 lớp: negative, neutral, positive"),
        p("Emotion — nguồn: VSMEC + ViGoEmotions"),
        bullet("Train (cân bằng): 28.150 mẫu"),
        bullet("Test: 2.660 mẫu"),
        bullet("5 lớp: sad, angry, suggestion, happy, love"),
        h1("4. Kết quả huấn luyện (test set)"),
        h2("4.1. Sentiment"),
        p("Best epoch (val): 4 | Best val F1 macro: 0.8051"),
        bullet("negative — P=0.84, R=0.86, F1=0.85 (support 1694)"),
        bullet("neutral  — P=0.64, R=0.61, F1=0.63 (support 350)"),
        bullet("positive — P=0.89, R=0.88, F1=0.89 (support 2156)"),
        bullet("Accuracy tổng: 85.17% | Macro F1: 78.86%"),
        h2("4.2. Emotion"),
        p("Best epoch (val): 4 | Best val F1 macro: 0.5809"),
        bullet("sad — F1=0.70 | angry — F1=0.69 | happy — F1=0.72"),
        bullet("suggestion — F1=0.34 | love — F1=0.45 (lớp ít mẫu, khó)"),
        bullet("Accuracy tổng: 66.62% | Macro F1: 58.03%"),
        h2("4.3. Nhận xét"),
        p(
            "Sentiment đạt kết quả tốt, sẵn sàng tích hợp. Emotion khó hơn do đa lớp "
            "và mất cân bằng (suggestion, love). Quan sát overfitting: train F1 tăng cao "
            "trong khi eval loss tăng — nên cân nhắc giảm epoch hoặc tăng regularization."
        ),
        h1("5. Các file đầu ra quan trọng"),
        bullet("ai_module/app/models/phobert_sentiment/ — model sentiment"),
        bullet("ai_module/app/models/phobert_emotion/ — model emotion"),
        bullet("ai_module/app/models/phobert_models_for_youtubeai/ — log, CM, report, .pt"),
        bullet("phobert_models_for_youtubeai.zip — gói tải từ Kaggle"),
        bullet("training_report_youtubeai.zip — biểu đồ + báo cáo (Cell 3)"),
        h1("6. Quy trình triển khai"),
        bullet("Train Kaggle → tải zip → copy 2 folder model vào app/data/models/"),
        bullet("Chạy check_phobert_models.py → test_api.py"),
        bullet("Kiểm tra trên giao diện web phân tích bình luận"),
        h1("7. Việc tiếp theo đề xuất"),
        bullet("Bổ sung dữ liệu cho lớp emotion yếu (suggestion, love)"),
        bullet("Giảm overfitting; đánh giá trên comment YouTube thực tế"),
        bullet("Hoàn thiện báo cáo NCKH: phương pháp, bảng kết quả, hình CM"),
        p(""),
        p("— Hết báo cáo —", bold=True),
    ]
    return "\n".join(parts)


def write_docx(path: Path, body_xml: str) -> None:
    content_types = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/>
</Types>"""

    rels = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>"""

    doc_rels = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/>
</Relationships>"""

    numbering = f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:numbering xmlns:w="{W_NS}">
  <w:abstractNum w:abstractNumId="0">
    <w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="bullet"/><w:lvlText w:val="•"/></w:lvl>
  </w:abstractNum>
  <w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num>
</w:numbering>"""

    document = f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="{W_NS}">
  <w:body>
    {body_xml}
    <w:sectPr><w:pgSz w:w="11906" w:h="16838"/></w:sectPr>
  </w:body>
</w:document>"""

    with zipfile.ZipFile(path, "w", zipfile.ZIP_DEFLATED) as zf:
        zf.writestr("[Content_Types].xml", content_types)
        zf.writestr("_rels/.rels", rels)
        zf.writestr("word/_rels/document.xml.rels", doc_rels)
        zf.writestr("word/numbering.xml", numbering)
        zf.writestr("word/document.xml", document)


if __name__ == "__main__":
    write_docx(OUT, build_body())
    print(f"Created: {OUT}")
