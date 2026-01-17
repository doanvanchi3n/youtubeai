@echo off
REM Batch script để tạo file .env cho HuggingFace API Token

echo ============================================================
echo THIẾT LẬP HUGGINGFACE API TOKEN
echo ============================================================
echo.

REM Kiểm tra file .env đã tồn tại chưa
if exist .env (
    echo ⚠️  File .env đã tồn tại!
    set /p overwrite="Bạn có muốn ghi đè không? (y/n): "
    if /i not "%overwrite%"=="y" (
        echo ❌ Hủy bỏ.
        exit /b
    )
)

echo 📝 Hướng dẫn lấy HuggingFace API Token:
echo 1. Truy cập: https://huggingface.co/settings/tokens
echo 2. Đăng nhập/Đăng ký tài khoản HuggingFace
echo 3. Click 'New token'
echo 4. Chọn quyền: Read (đủ cho Inference API)
echo 5. Copy token (chỉ hiển thị 1 lần!)
echo.

set /p token="Nhập HuggingFace API Token của bạn (bắt đầu bằng hf_): "

if "%token%"=="" (
    echo ❌ Token không được để trống!
    exit /b
)

REM Tạo file .env
(
echo # HuggingFace API Configuration
echo HUGGINGFACE_API_TOKEN=%token%
echo HUGGINGFACE_CHAT_MODEL=meta-llama/Llama-3.1-8B-Instruct
echo.
echo # Optional: Override default model
echo # HUGGINGFACE_MODEL=google/flan-t5-large
) > .env

echo.
echo ✅ Đã tạo file .env thành công!
echo.
echo 🔍 Bây giờ bạn có thể chạy:
echo    python check_huggingface_connection.py
echo.
pause

