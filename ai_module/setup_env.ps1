# PowerShell script để tạo file .env cho HuggingFace API Token

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "THIẾT LẬP HUGGINGFACE API TOKEN" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Kiểm tra file .env đã tồn tại chưa
if (Test-Path ".env") {
    Write-Host "⚠️  File .env đã tồn tại!" -ForegroundColor Yellow
    $overwrite = Read-Host "Bạn có muốn ghi đè không? (y/n)"
    if ($overwrite -ne "y" -and $overwrite -ne "Y") {
        Write-Host "❌ Hủy bỏ." -ForegroundColor Red
        exit
    }
}

Write-Host "📝 Hướng dẫn lấy HuggingFace API Token:" -ForegroundColor Green
Write-Host "1. Truy cập: https://huggingface.co/settings/tokens" -ForegroundColor White
Write-Host "2. Đăng nhập/Đăng ký tài khoản HuggingFace" -ForegroundColor White
Write-Host "3. Click 'New token'" -ForegroundColor White
Write-Host "4. Chọn quyền: Read (đủ cho Inference API)" -ForegroundColor White
Write-Host "5. Copy token (chỉ hiển thị 1 lần!)" -ForegroundColor White
Write-Host ""

$token = Read-Host "Nhập HuggingFace API Token của bạn (bắt đầu bằng hf_)"

# Validate token format
if (-not $token) {
    Write-Host "❌ Token không được để trống!" -ForegroundColor Red
    exit
}

if (-not $token.StartsWith("hf_")) {
    Write-Host "⚠️  Cảnh báo: Token thường bắt đầu bằng 'hf_'. Bạn có chắc token đúng không?" -ForegroundColor Yellow
    $confirm = Read-Host "Tiếp tục? (y/n)"
    if ($confirm -ne "y" -and $confirm -ne "Y") {
        Write-Host "❌ Hủy bỏ." -ForegroundColor Red
        exit
    }
}

# Tạo nội dung file .env
$envContent = @"
# HuggingFace API Configuration
HUGGINGFACE_API_TOKEN=$token
HUGGINGFACE_CHAT_MODEL=meta-llama/Llama-3.1-8B-Instruct

# Optional: Override default model
# HUGGINGFACE_MODEL=google/flan-t5-large
"@

# Ghi file
try {
    $envContent | Out-File -FilePath ".env" -Encoding UTF8 -NoNewline
    Write-Host ""
    Write-Host "✅ Đã tạo file .env thành công!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Nội dung file .env:" -ForegroundColor Cyan
    Write-Host $envContent -ForegroundColor Gray
    Write-Host ""
    Write-Host "🔍 Bây giờ bạn có thể chạy:" -ForegroundColor Green
    Write-Host "   python check_huggingface_connection.py" -ForegroundColor White
    Write-Host ""
} catch {
    Write-Host "❌ Lỗi khi tạo file .env: $_" -ForegroundColor Red
    exit
}

