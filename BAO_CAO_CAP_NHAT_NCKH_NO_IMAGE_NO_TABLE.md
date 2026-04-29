# Ghi chú cập nhật báo cáo NCKH (không hình ảnh, không bảng)

Tài liệu này tổng hợp các nội dung đã được cập nhật trong `baocao.md` khi chuyển từ bản đồ án cơ sở sang hướng báo cáo nghiên cứu khoa học, tập trung vào phần train mô hình trên dataset.

## 1) Cập nhật phạm vi mục tiêu nghiên cứu

- Bổ sung mục tiêu thực nghiệm train/fine-tune mô hình trên các dataset công khai:
  - VLSP 2016
  - AIVIVN 2019
  - UIT-VSMEC
  - ViGoEmotions
- Bổ sung yêu cầu lưu artifacts để đảm bảo tính tái lập của kết quả thực nghiệm:
  - training logs
  - classification report
  - confusion matrix
  - best checkpoint

## 2) Cập nhật chương huấn luyện (Chương IV)

- Chuyển nội dung từ mô tả "pipeline dự kiến" sang "đã triển khai train thực tế trên Kaggle".
- Làm rõ bộ dữ liệu được sử dụng theo từng bài toán:
  - Sentiment 3 lớp: VLSP + AIVIVN là hướng chính
  - Hướng mở rộng: UIT-VSMEC + ViGoEmotions (train emotion hoặc mapping về sentiment)
- Thêm nội dung về cấu hình huấn luyện sentiment đã chạy thực tế:
  - backbone PhoBERT
  - learning rate
  - epoch tối đa
  - early stopping
  - batch size
  - max length
  - weight decay
  - metric chọn best model
- Thêm cấu hình huấn luyện emotion 5 lớp (tách riêng khỏi sentiment) để đầy đủ hai nhánh train.

## 3) Cập nhật kết quả đánh giá mô hình

- Điều chỉnh phần kết quả so sánh theo hướng:
  - giữ baseline để đối chiếu
  - cập nhật kết quả sentiment gần nhất đã thực nghiệm
  - để sẵn vị trí cập nhật cho kết quả emotion sau khi train xong
- Thêm phần phân tích lỗi nhầm (confusion matrix) theo hướng thực nghiệm.

## 4) Bổ sung mục sự cố trong quá trình train và cách khắc phục

Nội dung đã thêm gồm:

- Overfitting:
  - dấu hiệu
  - nguyên nhân
  - cách khắc phục (early stopping, chọn best model theo f1 macro, regularization)
- Early stopping dừng sớm:
  - giải thích đây là hành vi bình thường, không phải lỗi
- Lỗi NameError trong notebook:
  - mất biến do restart kernel/chạy cell rời
  - cách chạy lại đúng thứ tự và lấy nhãn từ pred_output
- Lỗi không tương thích phiên bản thư viện:
  - cập nhật tham số theo API version đang dùng
- Lỗi đường dẫn/định dạng dataset:
  - khác nhau giữa csv/xlsx
  - cần chuẩn hóa schema cột trước khi train
- Lỗi export model sai cấu trúc thư mục:
  - nhắc yêu cầu các file model/tokenizer phải đặt đúng cấp thư mục để local load được

## 5) Cập nhật chương triển khai và kết quả thực nghiệm (Chương V)

- Bổ sung quy trình đưa model từ Kaggle về project local:
  - export best model
  - copy vào thư mục model trong AI module
  - kiểm tra đầy đủ file bắt buộc
  - kiểm thử local trước khi dùng chính thức
- Bổ sung phần artifacts cần lưu sau mỗi lần train để phục vụ báo cáo NCKH và tái lập kết quả.
- Cập nhật kết luận chương theo hướng liên kết chặt chẽ giữa:
  - mô hình (Chương IV)
  - triển khai thực tế (Chương V)
  - tái lập kết quả thực nghiệm

## 6) Các điểm đã được làm rõ trong quá trình hiệu chỉnh

- Làm rõ "chia train/validation/test" là chia trên bộ dữ liệu đã gộp/chuẩn hóa cho từng bài toán, không phải dữ liệu YouTube raw đang đồng bộ runtime.
- Bổ sung hyperparameter cho emotion để tránh thiếu sót so với sentiment.
- Giữ nguyên khung tổng thể báo cáo, ưu tiên chèn mục con thay vì phá vỡ cấu trúc chương.

## 7) Lưu ý khi hoàn thiện bản nộp cuối

- Đồng nhất tỉ lệ chia dữ liệu train/validation/test trong toàn bộ báo cáo cho trùng với notebook đã chạy.
- Điền số liệu cuối cùng cho các phần đánh dấu đang cập nhật sau (nếu còn).
- Trích xuất log train và kết quả đánh giá từ notebook để đối chiếu với nội dung viết tay.

