# 🧹 KẾ HOẠCH DỌN DẸP VÀ HOÀN THIỆN

## 📋 CÁC FILE SẼ XÓA (File tạm/development)

### AI Module - Test Scripts (không cần thiết)
1. ✅ `ai_module/test_simple.ps1` - Test script PowerShell (đã có test_api.py tốt hơn)
2. ✅ `ai_module/test_fixed.ps1` - Test script PowerShell (đã có test_api.py tốt hơn)
3. ✅ `ai_module/test_api.ps1` - Test script PowerShell (đã có test_api.py tốt hơn)
4. ✅ `ai_module/test_api.sh` - Test script Bash (Windows không cần)

### AI Module - Setup Scripts (không cần sau khi setup xong)
5. ✅ `ai_module/clean_cache.bat` - Script xóa cache (chỉ cần khi gặp lỗi)
6. ✅ `ai_module/resume_phobert_download.py` - Script resume download (không cần nữa)
7. ✅ `ai_module/install_phobert.sh` - Script install cho Linux/Mac (Windows không cần)

### AI Module - Debug Code (cần xóa)
8. ✅ Debug logging trong `ai_module/app/api/sentiment.py` (dòng 41-44)

---

## 📝 CÁC FILE GIỮ LẠI (Hữu ích)

- ✅ `ai_module/test_api.py` - Python test script (hữu ích để test API)
- ✅ `ai_module/setup_phobert_quick.py` - Script setup PhoBERT (cần khi setup mới)
- ✅ `ai_module/install_phobert.bat` - Script install cho Windows
- ✅ `ai_module/check_phobert_models.py` - Script kiểm tra models
- ✅ `ai_module/requirements.txt` - Full dependencies (bao gồm PhoBERT)
- ✅ `ai_module/requirements-basic.txt` - Basic dependencies (chỉ scikit-learn, không conflict)
- ✅ Tất cả documentation files (PHOBERT_SETUP_GUIDE.md, SETUP_INSTRUCTIONS.md, etc.)

### 📄 Về 2 file requirements.txt:

**Giữ cả 2 vì:**
- `requirements.txt`: Đầy đủ, cho người dùng PhoBERT (đã setup)
- `requirements-basic.txt`: Nhẹ hơn, cho người chỉ dùng scikit-learn hoặc gặp conflict

**Khuyến nghị:** 
- Nếu đã setup PhoBERT → Dùng `requirements.txt`
- Nếu gặp lỗi hoặc chỉ cần scikit-learn → Dùng `requirements-basic.txt`

---

## 🔧 CẦN HOÀN THIỆN TRONG PAGE SENTIMENT

### 1. Loading States
- ❌ Hiện tại: 1 loading state chung cho cả 2 sections
- ✅ Cần: Loading state riêng cho từng section (sentiment comments, emotion comments)

### 2. Pagination
- ❌ Hiện tại: Chỉ load 20 comments đầu tiên
- ✅ Cần: Thêm pagination controls (Previous/Next, page numbers)

### 3. Error Handling
- ⚠️ Hiện tại: Error hiển thị nhưng không có retry button
- ✅ Cần: Thêm retry button khi có lỗi

### 4. Empty States
- ✅ Đã có: "Không có bình luận nào"
- ✅ Cần cải thiện: Thêm icon/illustration cho empty state

### 5. Top Videos Loading
- ⚠️ Hiện tại: Không có loading state cho top videos
- ✅ Cần: Thêm loading state

---

## ✅ TỔNG KẾT

**Sẽ xóa:** 7 files + debug code
**Sẽ giữ:** test_api.py, setup scripts, documentation
**Sẽ hoàn thiện:** Loading states, pagination, error handling, empty states

