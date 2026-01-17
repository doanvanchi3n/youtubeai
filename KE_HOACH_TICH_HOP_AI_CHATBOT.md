# KẾ HOẠCH TÍCH HỢP AI CHATBOT CHO AI CONTENT

## 📋 PHÂN TÍCH HIỆN TRẠNG

### Hiện tại project đang dùng:

1. **HuggingFace Inference API** (cho Content Generation):
   - Model: `google/flan-t5-large`, `google/flan-t5-base`, `microsoft/DialoGPT-medium`
   - **Vấn đề:** Đây là text generation models, KHÔNG phải LLM conversation
   - **Hạn chế:** 
     - Không hiểu context hội thoại tốt
     - Không có memory/conversation history
     - Chất lượng không cao cho chatbot

2. **PhoBERT** (cho Sentiment/Emotion):
   - Đã có fine-tuning cho domain tiếng Việt
   - Nhưng chỉ dùng cho classification, không phải generation

### Kết luận:
- ❌ **KHÔNG tự tạo AI từ đầu** (quá phức tạp, tốn thời gian)
- ✅ **TÍCH HỢP LLM có sẵn** và fine-tune cho YouTube content

---

## 🎯 PHƯƠNG ÁN ĐỀ XUẤT

### **Option 1: Tích hợp OpenAI GPT (Khuyến nghị cho Production)**

**Ưu điểm:**
- ✅ Chất lượng cao nhất
- ✅ Hỗ trợ conversation tốt
- ✅ Có function calling (tools) - phù hợp với yêu cầu "chức năng phụ"
- ✅ API ổn định, có rate limiting

**Nhược điểm:**
- ⚠️ Có chi phí (nhưng hợp lý với GPT-3.5-turbo)
- ⚠️ Cần API key

**Cách làm:**
1. Tích hợp OpenAI Python SDK
2. Dùng GPT-3.5-turbo hoặc GPT-4
3. System prompt: "Bạn là chuyên gia YouTube content cho thị trường Việt Nam..."
4. Function calling để gọi các tools: `generate_titles()`, `generate_description()`, `generate_hashtags()`
5. Fine-tune (optional): Nếu có dataset, có thể fine-tune GPT-3.5 cho domain YouTube

---

### **Option 2: Tích hợp Open-Source LLM (Miễn phí, tự host)**

**Các model đề xuất:**
- **Llama 3.1 8B** (Meta) - Miễn phí, chất lượng tốt
- **Mistral 7B** - Nhẹ, nhanh
- **Vietnamese LLM:** `VinAI/PhoGPT-7B5-Instruct` (nếu có)

**Ưu điểm:**
- ✅ Miễn phí
- ✅ Có thể host trên server riêng
- ✅ Có thể fine-tune hoàn toàn

**Nhược điểm:**
- ⚠️ Cần GPU/server mạnh để chạy
- ⚠️ Setup phức tạp hơn
- ⚠️ Chất lượng có thể thấp hơn GPT

**Cách làm:**
1. Dùng `llama.cpp` hoặc `vLLM` để serve model
2. Tích hợp qua API tương tự OpenAI
3. Fine-tune với dataset YouTube content Việt Nam

---

### **Option 3: HuggingFace Chat Models (Cân bằng)**

**Model đề xuất:**
- `meta-llama/Llama-3.1-8B-Instruct` (qua Inference API)
- `mistralai/Mistral-7B-Instruct-v0.2`
- `vinai/PhoGPT-7B5-Instruct` (nếu có)

**Ưu điểm:**
- ✅ Miễn phí với Inference API (có giới hạn)
- ✅ Dễ tích hợp (giống code hiện tại)
- ✅ Có thể fine-tune

**Nhược điểm:**
- ⚠️ Rate limit với free tier
- ⚠️ Chất lượng không bằng GPT-4

---

## 🏗️ KIẾN TRÚC ĐỀ XUẤT (Option 1 - OpenAI)

### **1. AI Module Layer (Python Flask)**

```
ContentService
├── _call_openai_chat()      # Gọi OpenAI Chat API
├── _call_openai_functions() # Function calling cho tools
└── generate_chat_reply()   # Main chat method
```

**Tools (Functions) cho chatbot:**
```python
tools = [
    {
        "type": "function",
        "function": {
            "name": "generate_titles",
            "description": "Tạo 10 tiêu đề video YouTube dựa trên từ khóa/mô tả",
            "parameters": {
                "type": "object",
                "properties": {
                    "keywords": {"type": "array", "items": {"type": "string"}},
                    "description": {"type": "string"}
                }
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "generate_description",
            "description": "Tạo mô tả SEO 300-600 ký tự cho video YouTube",
            ...
        }
    },
    {
        "type": "function",
        "function": {
            "name": "generate_hashtags",
            "description": "Tạo 20 hashtags phù hợp cho video",
            ...
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_trends",
            "description": "Lấy xu hướng Google Trends và YouTube Trends",
            ...
        }
    }
]
```

**System Prompt:**
```python
SYSTEM_PROMPT = """Bạn là trợ lý AI chuyên gia nội dung YouTube cho thị trường Việt Nam.

Nhiệm vụ của bạn:
1. Tư vấn chiến lược nội dung YouTube
2. Gợi ý tiêu đề, mô tả, hashtags, kịch bản video
3. Phân tích xu hướng và đề xuất ý tưởng video
4. Giải thích và cải thiện nội dung đã tạo

Khi người dùng yêu cầu:
- "Tạo tiêu đề" → Gọi function generate_titles()
- "Tạo mô tả" → Gọi function generate_description()
- "Tạo hashtags" → Gọi function generate_hashtags()
- "Xu hướng gì đang hot?" → Gọi function get_trends()

Luôn trả lời bằng tiếng Việt tự nhiên, súc tích, thân thiện."""
```

---

### **2. Luồng hoạt động:**

```
User: "Tôi muốn làm video về Naruto, tạo 10 tiêu đề cho tôi"
  ↓
Frontend → Backend → AI Module
  ↓
OpenAI Chat API với function calling
  ↓
AI gọi function: generate_titles(keywords=["naruto"])
  ↓
ContentService.generate_titles() → Trả về 10 titles
  ↓
AI nhận kết quả → Format lại → Trả về user
  ↓
"Đây là 10 tiêu đề tôi gợi ý cho bạn về Naruto:
1. Khám phá Naruto: Hành trình từ Genin đến Hokage
2. Naruto Shippuden: Những trận chiến đáng nhớ nhất
..."
```

---

## 📝 IMPLEMENTATION PLAN

### **Phase 1: Tích hợp OpenAI (1-2 ngày)**

1. **Cài đặt dependencies:**
   ```bash
   pip install openai
   ```

2. **Tạo `ChatService` mới:**
   - File: `ai_module/app/services/chat_service.py`
   - Method: `generate_chat_reply(messages, context, tools)`
   - Tích hợp OpenAI Chat API

3. **Tạo API endpoint:**
   - File: `ai_module/app/api/chat.py`
   - Endpoint: `POST /api/chat`

4. **Backend integration:**
   - DTOs: `AIChatRequest`, `AIChatResponse`
   - Service: `AIService.chat()`
   - Controller: `POST /api/ai/chat`

5. **Frontend:**
   - Chat UI component
   - Lịch sử hội thoại (localStorage)

---

### **Phase 2: Function Calling (2-3 ngày)**

1. **Implement các functions:**
   - `generate_titles()` - Gọi lại logic hiện tại
   - `generate_description()` - Gọi lại logic hiện tại
   - `generate_hashtags()` - Gọi lại logic hiện tại
   - `get_trends()` - Gọi Google Trends + YouTube Trends

2. **Tích hợp vào OpenAI:**
   - Định nghĩa tools schema
   - Xử lý function calls trong response

---

### **Phase 3: Fine-tuning (Optional, 1 tuần)**

1. **Thu thập dataset:**
   - Lấy 1000+ cặp Q&A về YouTube content
   - Format: `{"messages": [{"role": "user", "content": "..."}, {"role": "assistant", "content": "..."}]}`

2. **Fine-tune GPT-3.5:**
   - Upload dataset lên OpenAI
   - Train model
   - Deploy fine-tuned model

3. **Đánh giá:**
   - Test với dataset validation
   - So sánh với base model

---

## 💰 CHI PHÍ ƯỚC TÍNH (OpenAI)

- **GPT-3.5-turbo:** $0.50 / 1M input tokens, $1.50 / 1M output tokens
- **GPT-4:** $10 / 1M input tokens, $30 / 1M output tokens

**Ước tính:**
- 1 conversation ~ 500 tokens input + 200 tokens output
- 1000 conversations/tháng = ~$0.50 (GPT-3.5-turbo)
- **Rất hợp lý cho production!**

---

## 🎯 KẾT LUẬN & KHUYẾN NGHỊ

### **Khuyến nghị: Option 1 (OpenAI GPT-3.5-turbo)**

**Lý do:**
1. ✅ Chất lượng cao, phù hợp production
2. ✅ Có function calling - đúng yêu cầu "chức năng phụ"
3. ✅ Chi phí hợp lý
4. ✅ Dễ tích hợp, ổn định
5. ✅ Có thể fine-tune sau nếu cần

### **Roadmap:**

**Tuần 1:**
- Tích hợp OpenAI Chat API
- Tạo chat UI cơ bản
- Test conversation

**Tuần 2:**
- Implement function calling
- Tích hợp các tools (titles, description, hashtags)
- Test end-to-end

**Tuần 3 (Optional):**
- Fine-tune model với dataset YouTube content
- Optimize prompts
- Production deployment

---

## 📚 TÀI LIỆU THAM KHẢO

- OpenAI Chat API: https://platform.openai.com/docs/api-reference/chat
- Function Calling: https://platform.openai.com/docs/guides/function-calling
- Fine-tuning: https://platform.openai.com/docs/guides/fine-tuning

---

**Bạn muốn tôi bắt đầu implement Option 1 (OpenAI) ngay không?** 🚀

