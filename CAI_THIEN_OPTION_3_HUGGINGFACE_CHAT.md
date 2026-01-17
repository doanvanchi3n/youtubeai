# CẢI THIỆN CHO OPTION 3: HUGGINGFACE CHAT MODELS

## 📋 PHÂN TÍCH ĐIỂM YẾU HIỆN TẠI

### 🔴 **VẤN ĐỀ NGHIÊM TRỌNG (Phải sửa ngay)**

#### 1. **AI Module - Model không phù hợp cho Chatbot**

**Vấn đề:**
- ❌ Đang dùng `google/flan-t5-large`, `google/flan-t5-base`, `microsoft/DialoGPT-medium`
- ❌ Đây là **text generation models**, KHÔNG phải **conversation/chat models**
- ❌ Không hiểu context hội thoại, không có memory
- ❌ Chất lượng chatbot rất thấp

**Code hiện tại:**
```python
# content_service.py line 62-66
models_to_try = [
    self.hf_model,  # 'google/flan-t5-large'
    'google/flan-t5-base',
    'microsoft/DialoGPT-medium'
]
```

**Cần thay đổi:**
```python
# Nên dùng chat models:
models_to_try = [
    'meta-llama/Llama-3.1-8B-Instruct',  # Chat model tốt
    'mistralai/Mistral-7B-Instruct-v0.2',  # Alternative
    'vinai/PhoGPT-7B5-Instruct',  # Vietnamese LLM (nếu có)
    'microsoft/Phi-3-mini-4k-instruct'  # Nhẹ, nhanh
]
```

---

#### 2. **Không có Chat Endpoint**

**Vấn đề:**
- ❌ Không có API endpoint cho conversation
- ❌ Chỉ có `/api/generate-suggestions` (one-shot)
- ❌ Không hỗ trợ message history

**Cần tạo:**
- ✅ `POST /api/chat` - Endpoint mới cho chatbot
- ✅ Nhận `messages` array với format: `[{role: "user", content: "..."}, ...]`
- ✅ Trả về `{reply: "..."}`

---

#### 3. **Không có Conversation History**

**Vấn đề:**
- ❌ Mỗi request độc lập, không nhớ context trước đó
- ❌ User phải nhắc lại thông tin mỗi lần
- ❌ Không có lưu trữ lịch sử hội thoại

**Cần:**
- ✅ Frontend: Lưu messages trong state/localStorage
- ✅ Backend: Có thể lưu conversation history vào DB (optional)
- ✅ AI Module: Nhận toàn bộ messages để hiểu context

---

#### 4. **Không có Tool/Function Calling**

**Vấn đề:**
- ❌ Chatbot không thể tự động gọi các chức năng phụ (generate_titles, generate_description)
- ❌ User phải gọi từng chức năng riêng lẻ
- ❌ Không có cách để chatbot "hành động" dựa trên yêu cầu

**Cần:**
- ✅ Implement tool calling mechanism
- ✅ Định nghĩa tools: `generate_titles()`, `generate_description()`, `generate_hashtags()`, `get_trends()`
- ✅ Chatbot tự quyết định khi nào gọi tool nào

---

### 🟡 **VẤN ĐỀ TRUNG BÌNH (Nên sửa)**

#### 5. **Backend - Không có Timeout cho RestTemplate**

**Vấn đề:**
```java
// AIService.java line 141
AiModuleSuggestionResponse response = restTemplate.postForObject(
    endpoint, payload, AiModuleSuggestionResponse.class);
// ❌ Không có timeout → có thể block mãi mãi
```

**Cần:**
```java
@Bean
public RestTemplate restTemplate() {
    RestTemplate restTemplate = new RestTemplate();
    HttpComponentsClientHttpRequestFactory factory = 
        new HttpComponentsClientHttpRequestFactory();
    factory.setConnectTimeout(5000);  // 5s
    factory.setReadTimeout(30000);     // 30s
    restTemplate.setRequestFactory(factory);
    return restTemplate;
}
```

---

#### 6. **Backend - Không có Retry Mechanism**

**Vấn đề:**
- ❌ Nếu AI Module tạm thời fail → request fail ngay
- ❌ Không có cơ chế retry tự động

**Cần:**
- ✅ Spring Retry với exponential backoff
- ✅ Retry 2-3 lần với delay 1-2 giây

---

#### 7. **AI Module - Không có Rate Limiting**

**Vấn đề:**
- ❌ Google Trends có thể bị rate limit
- ❌ HuggingFace API free tier có giới hạn
- ❌ Nhiều requests cùng lúc → có thể bị block

**Cần:**
- ✅ Rate limiting cho Google Trends (max 1 request/5 giây)
- ✅ Queue system cho HuggingFace API calls
- ✅ Cache trends data để giảm số lần gọi

---

#### 8. **Không có Caching**

**Vấn đề:**
- ❌ Mỗi request đều fetch Google Trends mới → chậm (2-5 giây)
- ❌ Cùng keywords → vẫn generate lại từ đầu
- ❌ Tốn tài nguyên không cần thiết

**Cần:**
- ✅ Cache trends data (TTL: 1-6 giờ)
- ✅ Cache generated content theo hash của input (TTL: 1 giờ)
- ✅ Redis hoặc in-memory cache

---

#### 9. **Error Handling không chi tiết**

**Vấn đề:**
- ❌ Backend chỉ throw `BadRequestException` → không phân biệt loại lỗi
- ❌ Frontend chỉ hiển thị generic message
- ❌ Không biết lỗi là network, timeout, hay service unavailable

**Cần:**
- ✅ Phân biệt HTTP status codes (500, 503, timeout)
- ✅ Trả về error type và message chi tiết
- ✅ Frontend hiển thị error message phù hợp

---

### 🟢 **VẤN ĐỀ NHỎ (Có thể cải thiện sau)**

#### 10. **Frontend - Thiếu UX Features**

- ⚠️ Không có retry button khi fail
- ⚠️ Loading state không rõ ràng (chỉ "Đang tạo gợi ý...")
- ⚠️ Không có preview/edit suggestions
- ⚠️ Không có copy button cho từng suggestion

---

#### 11. **Không có Validation chi tiết**

- ⚠️ Input validation cơ bản nhưng không check format
- ⚠️ Không validate language (có thể nhận tiếng Anh nhưng model train cho tiếng Việt)

---

## 🎯 KẾ HOẠCH CẢI THIỆN CHO OPTION 3

### **Phase 1: Upgrade Model & Tạo Chat Endpoint (Ưu tiên cao)**

#### 1.1. Thay đổi Model sang Chat Models

**File:** `ai_module/app/services/content_service.py`

**Thay đổi:**
```python
def __init__(self):
    self.hf_token = os.getenv('HUGGINGFACE_API_TOKEN')
    # Thay đổi default model
    self.hf_model = os.getenv('HUGGINGFACE_MODEL', 'meta-llama/Llama-3.1-8B-Instruct')
    self.session = requests.Session()
    self.trend_client = None
    # ... rest of init

def _call_huggingface_chat(self, messages: List[Dict[str, str]], max_length: int = 512) -> str:
    """Call HuggingFace Chat API với conversation format"""
    if not self.hf_token:
        logger.debug("No HuggingFace token, skipping AI generation")
        return ""
    
    # Chat models to try
    models_to_try = [
        'meta-llama/Llama-3.1-8B-Instruct',
        'mistralai/Mistral-7B-Instruct-v0.2',
        'microsoft/Phi-3-mini-4k-instruct'
    ]
    
    for model in models_to_try:
        try:
            url = f"https://api-inference.huggingface.co/models/{model}"
            headers = {"Authorization": f"Bearer {self.hf_token}"}
            
            # Format cho chat models (khác với text generation)
            payload = {
                "inputs": self._format_messages_for_model(messages),
                "parameters": {
                    "max_new_tokens": max_length,
                    "temperature": 0.7,
                    "top_p": 0.9,
                    "return_full_text": False
                }
            }
            
            response = self.session.post(url, json=payload, headers=headers, timeout=30)
            
            if response.status_code == 200:
                result = response.json()
                text = self._extract_generated_text(result)
                if text and len(text) > 10:
                    logger.info(f"✓ AI chat generated using {model}")
                    return text
            elif response.status_code == 503:
                logger.debug(f"Model {model} is loading, trying next...")
                continue
        except Exception as e:
            logger.debug(f"HuggingFace API error for {model}: {e}")
            continue
    
    logger.warning("All HuggingFace chat models failed")
    return ""

def _format_messages_for_model(self, messages: List[Dict[str, str]]) -> str:
    """Format messages thành prompt cho chat model"""
    formatted = []
    for msg in messages:
        role = msg.get("role", "user")
        content = msg.get("content", "")
        if role == "system":
            formatted.append(f"System: {content}")
        elif role == "assistant":
            formatted.append(f"Assistant: {content}")
        else:
            formatted.append(f"User: {content}")
    return "\n".join(formatted) + "\nAssistant:"
```

---

#### 1.2. Tạo ChatService mới

**File:** `ai_module/app/services/chat_service.py` (mới)

```python
"""
Chat Service - Conversation AI cho YouTube Content
Sử dụng HuggingFace Chat Models
"""
from typing import Any, Dict, List, Optional
import logging
from app.services.content_service import ContentService

logger = logging.getLogger(__name__)

class ChatService:
    """Chat service với conversation support và tool calling"""
    
    def __init__(self):
        self.content_service = ContentService()
        self.system_prompt = """Bạn là trợ lý AI chuyên gia nội dung YouTube cho thị trường Việt Nam.

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

    def generate_chat_reply(
        self,
        messages: List[Dict[str, str]],
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Generate chat reply với conversation history
        
        Args:
            messages: List of messages [{role: "user", content: "..."}, ...]
            context: Optional context {keywords: [...], description: "..."}
        
        Returns:
            {reply: "..."}
        """
        # 1. Build conversation với system prompt
        conversation = [
            {"role": "system", "content": self.system_prompt}
        ]
        
        # 2. Add context nếu có
        if context:
            ctx_msg = self._build_context_message(context)
            conversation.append({"role": "system", "content": ctx_msg})
        
        # 3. Add conversation history
        conversation.extend(messages)
        
        # 4. Call HuggingFace Chat API
        reply = self.content_service._call_huggingface_chat(conversation, max_length=512)
        
        # 5. Check if reply contains tool call request
        # (Simple pattern matching - có thể cải thiện sau)
        if self._should_call_tool(reply):
            tool_result = self._handle_tool_call(reply, context)
            if tool_result:
                # Regenerate reply với tool result
                conversation.append({"role": "assistant", "content": reply})
                conversation.append({"role": "user", "content": f"Kết quả: {tool_result}"})
                reply = self.content_service._call_huggingface_chat(conversation, max_length=512)
        
        return {"reply": reply or "Xin lỗi, tôi không thể trả lời lúc này. Vui lòng thử lại sau."}

    def _build_context_message(self, context: Dict[str, Any]) -> str:
        """Build context message từ context dict"""
        parts = []
        if context.get("keywords"):
            parts.append(f"Từ khóa: {', '.join(context['keywords'][:10])}")
        if context.get("description"):
            parts.append(f"Mô tả: {context['description'][:400]}")
        return "\n".join(parts) if parts else ""

    def _should_call_tool(self, reply: str) -> bool:
        """Simple check nếu reply yêu cầu gọi tool"""
        tool_keywords = ["tạo tiêu đề", "generate_titles", "gợi ý tiêu đề"]
        return any(keyword in reply.lower() for keyword in tool_keywords)

    def _handle_tool_call(self, reply: str, context: Optional[Dict[str, Any]]) -> Optional[str]:
        """Handle tool call - gọi các functions từ ContentService"""
        # Simple implementation - có thể cải thiện với proper tool calling
        if "tiêu đề" in reply.lower() or "titles" in reply.lower():
            keywords = context.get("keywords", []) if context else []
            description = context.get("description", "") if context else ""
            result = self.content_service.generate_suggestions({
                "keywords": keywords,
                "description": description
            })
            titles = result.get("titles", [])
            return "\n".join([f"{i+1}. {title}" for i, title in enumerate(titles[:10])])
        return None
```

---

#### 1.3. Tạo Chat API Endpoint

**File:** `ai_module/app/api/chat.py` (mới)

```python
"""
Chat API endpoints
"""
from flask import Blueprint, request, jsonify
from app.services.chat_service import ChatService

bp = Blueprint('chat', __name__)
chat_service = ChatService()

@bp.route('/chat', methods=['POST'])
def chat():
    """
    Chat endpoint với conversation support
    
    Request:
    {
      "messages": [
        {"role": "user", "content": "..."},
        {"role": "assistant", "content": "..."}
      ],
      "context": {
        "keywords": [...],
        "description": "..."
      }
    }
    
    Response:
    {
      "reply": "..."
    }
    """
    try:
        data = request.get_json() or {}
        messages = data.get('messages', [])
        context = data.get('context', {})
        
        if not isinstance(messages, list) or not messages:
            return jsonify({'error': 'messages must be a non-empty list'}), 400
        
        # Validate message format
        for msg in messages:
            if not isinstance(msg, dict) or 'role' not in msg or 'content' not in msg:
                return jsonify({'error': 'Invalid message format'}), 400
        
        result = chat_service.generate_chat_reply(messages, context)
        return jsonify(result), 200
        
    except Exception as e:
        logger.error(f"Chat error: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500
```

**Đăng ký trong `ai_module/app/__init__.py`:**
```python
from app.api.chat import bp as chat_bp
app.register_blueprint(chat_bp, url_prefix='/api')
```

---

### **Phase 2: Backend Integration**

#### 2.1. Tạo DTOs

**File:** `backend/src/main/java/com/example/backend/dto/request/AIChatRequest.java` (mới)

```java
package com.example.backend.dto.request;

import jakarta.validation.constraints.NotEmpty;
import java.util.List;
import lombok.Data;

@Data
public class AIChatRequest {
    
    @NotEmpty
    private List<Message> messages;
    
    private ChatContext context;
    
    @Data
    public static class Message {
        private String role;    // user | assistant | system
        private String content;
    }
    
    @Data
    public static class ChatContext {
        private List<String> keywords;
        private String description;
        private String locale;
    }
}
```

**File:** `backend/src/main/java/com/example/backend/dto/response/AIChatResponse.java` (mới)

```java
package com.example.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AIChatResponse {
    private String reply;
}
```

---

#### 2.2. Cải thiện AIService

**File:** `backend/src/main/java/com/example/backend/service/AIService.java`

**Thêm method:**
```java
public AIChatResponse chat(Long userId, AIChatRequest request) {
    String endpoint = aiModuleUrl.endsWith("/")
        ? aiModuleUrl + "api/chat"
        : aiModuleUrl + "/api/chat";
    
    try {
        AIChatResponse response = restTemplate.postForObject(
            endpoint, request, AIChatResponse.class
        );
        if (response == null || response.getReply() == null) {
            throw new BadRequestException("AI Chat không trả về dữ liệu.");
        }
        return response;
    } catch (RestClientException ex) {
        log.error("Lỗi khi gọi AI Chat Module: {}", ex.getMessage(), ex);
        throw new BadRequestException("Không thể kết nối tới AI Chat. Vui lòng thử lại sau.");
    }
}
```

**Cải thiện RestTemplate với timeout:**
```java
@Bean
public RestTemplate restTemplate() {
    RestTemplate restTemplate = new RestTemplate();
    HttpComponentsClientHttpRequestFactory factory = 
        new HttpComponentsClientHttpRequestFactory();
    factory.setConnectTimeout(5000);
    factory.setReadTimeout(30000);
    restTemplate.setRequestFactory(factory);
    return restTemplate;
}
```

---

#### 2.3. Thêm Controller Endpoint

**File:** `backend/src/main/java/com/example/backend/controller/AIController.java`

**Thêm:**
```java
@PostMapping("/chat")
public ResponseEntity<AIChatResponse> chat(
    @RequestHeader("Authorization") String authHeader,
    @Valid @RequestBody AIChatRequest request
) {
    TokenPrincipal principal = resolvePrincipal(authHeader);
    AIChatResponse response = aiService.chat(principal.userId(), request);
    return ResponseEntity.ok(response);
}
```

---

### **Phase 3: Frontend - Chat UI**

#### 3.1. Cải thiện aiService

**File:** `frontend/src/services/aiService.js`

**Thêm:**
```js
export const aiService = {
  generateSuggestions(payload) {
    return authFetch('/ai/suggestions', {
      method: 'POST',
      body: payload
    })
  },

  chat(messages, context) {
    return authFetch('/ai/chat', {
      method: 'POST',
      body: { messages, context }
    })
  }
}
```

---

#### 3.2. Tạo Chat Component

**File:** `frontend/src/pages/AISuggestion/AISuggestion.jsx`

**Thêm chat UI:**
```jsx
const [messages, setMessages] = useState([
  { 
    role: 'assistant', 
    content: 'Xin chào! Tôi là trợ lý AI giúp bạn tạo nội dung YouTube. Bạn muốn làm video về chủ đề gì?' 
  }
])
const [chatInput, setChatInput] = useState('')
const [chatLoading, setChatLoading] = useState(false)

const handleSendMessage = async () => {
  const text = chatInput.trim()
  if (!text || chatLoading) return

  const newMessages = [...messages, { role: 'user', content: text }]
  setMessages(newMessages)
  setChatInput('')
  setChatLoading(true)

  try {
    const context = {
      keywords,
      description: inputValue.trim(),
      locale: 'vi-VN'
    }
    const data = await aiService.chat(newMessages, context)
    setMessages([...newMessages, { role: 'assistant', content: data.reply }])
    
    // Lưu vào localStorage
    localStorage.setItem('ai_chat_history', JSON.stringify([...newMessages, { role: 'assistant', content: data.reply }]))
  } catch (err) {
    setMessages([
      ...newMessages,
      {
        role: 'assistant',
        content: 'Xin lỗi, hiện tại tôi không thể trả lời. Vui lòng thử lại sau.'
      }
    ])
  } finally {
    setChatLoading(false)
  }
}

// Load history từ localStorage khi mount
useEffect(() => {
  const saved = localStorage.getItem('ai_chat_history')
  if (saved) {
    try {
      setMessages(JSON.parse(saved))
    } catch (e) {
      console.error('Failed to load chat history', e)
    }
  }
}, [])
```

---

### **Phase 4: Cải thiện Performance & Reliability**

#### 4.1. Thêm Caching

**File:** `ai_module/app/services/content_service.py`

```python
from functools import lru_cache
from datetime import datetime, timedelta

class ContentService:
    def __init__(self):
        # ... existing code
        self.trends_cache = {}  # Simple in-memory cache
        self.cache_ttl = timedelta(hours=6)
    
    def _fetch_google_trends(self, keywords: List[str]) -> List[str]:
        # Check cache first
        cache_key = tuple(sorted(keywords[:5]))
        if cache_key in self.trends_cache:
            cached_data, cached_time = self.trends_cache[cache_key]
            if datetime.now() - cached_time < self.cache_ttl:
                logger.debug("Using cached Google Trends")
                return cached_data
        
        # Fetch new data
        trends = self._fetch_google_trends_impl(keywords)
        
        # Cache it
        self.trends_cache[cache_key] = (trends, datetime.now())
        return trends
    
    def _fetch_google_trends_impl(self, keywords: List[str]) -> List[str]:
        # ... existing implementation
```

---

#### 4.2. Thêm Rate Limiting

**File:** `ai_module/app/services/content_service.py`

```python
import time
from threading import Lock

class ContentService:
    def __init__(self):
        # ... existing code
        self.last_trends_call = 0
        self.trends_lock = Lock()
        self.min_trends_interval = 5  # 5 seconds between calls
    
    def _fetch_google_trends(self, keywords: List[str]) -> List[str]:
        # Rate limiting
        with self.trends_lock:
            now = time.time()
            if now - self.last_trends_call < self.min_trends_interval:
                wait_time = self.min_trends_interval - (now - self.last_trends_call)
                logger.debug(f"Rate limiting: waiting {wait_time:.1f}s")
                time.sleep(wait_time)
            self.last_trends_call = time.time()
        
        # ... rest of implementation
```

---

#### 4.3. Cải thiện Error Handling

**File:** `backend/src/main/java/com/example/backend/service/AIService.java`

```java
private AIChatResponse callAiModuleChat(AIChatRequest request) {
    String endpoint = aiModuleUrl.endsWith("/")
        ? aiModuleUrl + "api/chat"
        : aiModuleUrl + "/api/chat";
    
    try {
        AIChatResponse response = restTemplate.postForObject(
            endpoint, request, AIChatResponse.class
        );
        if (response == null || response.getReply() == null) {
            throw new BadRequestException("AI Chat không trả về dữ liệu.");
        }
        return response;
    } catch (ResourceAccessException ex) {
        // Timeout hoặc connection error
        log.error("Timeout hoặc không kết nối được AI Module: {}", ex.getMessage());
        throw new BadRequestException("AI Module không phản hồi. Vui lòng thử lại sau.");
    } catch (HttpServerErrorException ex) {
        // 5xx errors
        log.error("AI Module lỗi server: {}", ex.getMessage());
        throw new BadRequestException("AI Module đang gặp sự cố. Vui lòng thử lại sau.");
    } catch (RestClientException ex) {
        log.error("Lỗi khi gọi AI Chat Module: {}", ex.getMessage(), ex);
        throw new BadRequestException("Không thể kết nối tới AI Chat. Vui lòng thử lại sau.");
    }
}
```

---

## 📊 TÓM TẮT CẢI THIỆN

### **Must Have (Phải làm):**
1. ✅ Upgrade model sang chat models (Llama 3.1, Mistral)
2. ✅ Tạo ChatService và chat endpoint
3. ✅ Implement conversation history
4. ✅ Backend integration với timeout

### **Should Have (Nên làm):**
5. ✅ Tool/Function calling mechanism
6. ✅ Caching cho trends data
7. ✅ Rate limiting
8. ✅ Cải thiện error handling

### **Nice to Have (Có thể làm sau):**
9. ⚠️ Retry mechanism với exponential backoff
10. ⚠️ Circuit breaker pattern
11. ⚠️ Database storage cho conversation history
12. ⚠️ Advanced tool calling với proper parsing

---

## 🚀 NEXT STEPS

1. **Bắt đầu với Phase 1:** Upgrade model và tạo chat endpoint
2. **Test cơ bản:** Đảm bảo conversation hoạt động
3. **Phase 2:** Backend integration
4. **Phase 3:** Frontend chat UI
5. **Phase 4:** Performance improvements

**Bạn muốn tôi bắt đầu implement Phase 1 ngay không?** 🎯

