"""
Chat Service - Conversation AI cho YouTube Content
Sử dụng Google Gemini API với conversation support
"""
from typing import Any, Dict, List, Optional
import logging
import os
from app.services.content_service import ContentService

logger = logging.getLogger(__name__)

# Try importing Google Generative AI
try:
    import google.generativeai as genai
    HAS_GEMINI = True
except ImportError:
    HAS_GEMINI = False
    logger.warning("google-generativeai not available, using fallback")

class ChatService:
    """Chat service với conversation support và tool calling"""
    
    def __init__(self):
        self.content_service = ContentService()
        
        # Initialize Google Gemini
        self.gemini_api_key = os.getenv('GOOGLE_GEMINI_API_KEY')
        self.gemini_model = None
        if HAS_GEMINI and self.gemini_api_key:
            try:
                genai.configure(api_key=self.gemini_api_key)
                # Use gemini-2.5-flash-lite (available in free tier: 10 RPM, 20 RPD)
                # This model is confirmed available in free tier according to usage dashboard
                self.gemini_model = genai.GenerativeModel('gemini-2.5-flash-lite')
                logger.info("✓ Google Gemini API initialized")
            except Exception as e:
                logger.warning(f"Could not initialize Gemini: {e}")
                self.gemini_model = None
        
        self.system_prompt = """Bạn là trợ lý AI CHUYÊN VỀ NỘI DUNG YOUTUBE cho thị trường Việt Nam. Bạn KHÔNG phải chatbot chat chung, bạn CHỈ tập trung vào YouTube content.

QUAN TRỌNG: Khi người dùng nhập bất kỳ từ khóa nào (ví dụ: "naruto", "cooking", "gaming"), bạn PHẢI hiểu đó là yêu cầu về NỘI DUNG YOUTUBE liên quan đến từ khóa đó, KHÔNG phải thông tin chung về chủ đề đó.

Nhiệm vụ của bạn:
1. Gợi ý ý tưởng video YouTube dựa trên từ khóa (ví dụ: "naruto" → gợi ý video về Naruto như review, phân tích, top 10, theory, etc.)
2. Tư vấn tiêu đề YouTube hấp dẫn, SEO-friendly
3. Viết mô tả SEO cho video YouTube (300-600 ký tự)
4. Đề xuất hashtags phù hợp cho video YouTube
5. Phân tích xu hướng YouTube và đề xuất nội dung hot
6. Tư vấn chiến lược content YouTube, SEO, thumbnail, engagement

VÍ DỤ CÁCH TRẢ LỜI:
- User: "naruto" 
  → Bạn: "Dựa trên từ khóa 'Naruto', đây là các ý tưởng video YouTube bạn có thể làm:
  1. Top 10 nhẫn thuật mạnh nhất trong Naruto
  2. Phân tích nhân vật: Naruto vs Sasuke - Ai mạnh hơn?
  3. Review anime Naruto: Điểm mạnh và điểm yếu
  4. Theory: Ý nghĩa ẩn sau Rasengan
  5. So sánh Naruto anime vs manga
  Bạn muốn tôi tạo tiêu đề, mô tả SEO, hoặc hashtags cho video nào?"

- User: "cooking"
  → Bạn: "Với chủ đề 'Cooking', đây là các ý tưởng video YouTube phổ biến:
  1. Hướng dẫn nấu món ăn Việt Nam đơn giản
  2. Thử thách nấu ăn trong 10 phút
  3. Review các công thức nấu ăn trending
  4. Mẹo nấu ăn cho người mới bắt đầu
  Bạn muốn tôi giúp gì cụ thể?"

Luôn trả lời bằng tiếng Việt, tập trung vào YOUTUBE CONTENT, không đưa thông tin chung về chủ đề."""

    def generate_chat_reply(
        self,
        messages: List[Dict[str, str]],
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Generate chat reply với conversation history
        
        LUỒNG XỬ LÝ:
        1. Build conversation với system prompt (định nghĩa AI là chuyên gia YouTube content)
        2. Add context nếu có (keywords, description) để AI hiểu user intent
        3. Add conversation history (user messages và assistant replies)
        4. Gọi Google Gemini API (ưu tiên) hoặc HuggingFace (fallback)
        5. Nếu AI reply yêu cầu tool (generate titles/description/hashtags) → Gọi tool
        6. Regenerate reply với tool result nếu cần
        
        Args:
            messages: List of messages [{role: "user", content: "..."}, {role: "assistant", content: "..."}, ...]
            context: Optional context {keywords: [...], description: "...", locale: "vi-VN"}
        
        Returns:
            {reply: "..."} - Text response từ AI
        
        VÍ DỤ:
            messages = [
                {"role": "user", "content": "naruto"},
                {"role": "assistant", "content": "Dựa trên từ khóa 'Naruto'..."}
            ]
            context = {"keywords": ["naruto"], "description": "Video về anime Naruto"}
        """
        try:
            # 1. Build conversation với system prompt
            # System prompt định nghĩa AI là chuyên gia YouTube content, không phải chatbot chung
            conversation = [
                {"role": "system", "content": self.system_prompt}
            ]
            
            # 2. Add context nếu có (keywords, description)
            # Context giúp AI hiểu user intent và tạo reply phù hợp hơn
            if context:
                ctx_msg = self._build_context_message(context)
                if ctx_msg:
                    conversation.append({"role": "system", "content": ctx_msg})
            
            # 3. Add conversation history (loại bỏ system messages từ user input)
            # Chỉ lấy user và assistant messages, không lấy system messages từ user
            user_messages = [msg for msg in messages if msg.get("role") != "system"]
            conversation.extend(user_messages)
            
            # 4. Call AI Chat API (Google Gemini preferred, fallback to HuggingFace)
            # Gemini có conversation quality tốt hơn, HuggingFace là fallback
            logger.info(f"💬 Generating chat reply for {len(conversation)} messages")
            reply = self._call_gemini_chat(conversation)
            
            # Fallback to HuggingFace if Gemini fails (API error, quota exhausted, etc.)
            if not reply:
                logger.info("⚠ Gemini not available, trying HuggingFace...")
                reply = self.content_service._call_huggingface_chat(conversation, max_length=512)
            
            # 5. If no reply from AI, provide helpful fallback
            if not reply:
                logger.warning("⚠ No reply from HuggingFace API, using smart fallback")
                # Provide helpful fallback based on user's message
                last_user_msg = next((msg for msg in reversed(messages) if msg.get("role") == "user"), None)
                if last_user_msg:
                    user_content = last_user_msg.get("content", "").lower()
                    
                    # Smart detection và tự động gọi tool
                    if any(word in user_content for word in ["tiêu đề", "title", "tạo tiêu đề", "gợi ý tiêu đề", "đề xuất tiêu đề"]):
                        tool_result = self._handle_tool_call("tạo tiêu đề", context)
                        if tool_result:
                            return {
                                "reply": f"Tuy tôi không thể kết nối với AI conversation model lúc này, nhưng tôi vẫn có thể giúp bạn tạo tiêu đề:\n\n{tool_result}\n\n💡 Bạn có muốn tôi tạo thêm mô tả hoặc hashtags không? Chỉ cần yêu cầu: 'Tạo mô tả' hoặc 'Tạo hashtags'"
                            }
                    
                    elif any(word in user_content for word in ["mô tả", "description", "viết mô tả", "tạo mô tả", "mô tả seo"]):
                        tool_result = self._handle_tool_call("tạo mô tả", context)
                        if tool_result:
                            return {
                                "reply": f"Tuy tôi không thể kết nối với AI conversation model lúc này, nhưng tôi vẫn có thể giúp bạn tạo mô tả:\n\n{tool_result}\n\n💡 Bạn có muốn tôi tạo thêm tiêu đề hoặc hashtags không? Chỉ cần yêu cầu: 'Tạo tiêu đề' hoặc 'Tạo hashtags'"
                            }
                    
                    elif any(word in user_content for word in ["hashtag", "tag", "tạo hashtag", "gợi ý hashtag"]):
                        tool_result = self._handle_tool_call("tạo hashtags", context)
                        if tool_result:
                            return {
                                "reply": f"Tuy tôi không thể kết nối với AI conversation model lúc này, nhưng tôi vẫn có thể giúp bạn tạo hashtags:\n\n{tool_result}\n\n💡 Bạn có muốn tôi tạo thêm tiêu đề hoặc mô tả không? Chỉ cần yêu cầu: 'Tạo tiêu đề' hoặc 'Tạo mô tả'"
                            }
                    
                    elif any(word in user_content for word in ["xu hướng", "trend", "hot", "đang hot", "phổ biến"]):
                        tool_result = self._handle_tool_call("xu hướng", context)
                        if tool_result:
                            return {
                                "reply": f"Đây là các xu hướng tôi tìm thấy:\n\n{tool_result}\n\n💡 Bạn có muốn tôi tạo tiêu đề, mô tả hoặc hashtags dựa trên xu hướng này không?"
                            }
                
                # Generic helpful message
                return {
                    "reply": "Xin chào! Tôi là trợ lý AI chuyên về nội dung YouTube. Tôi có thể giúp bạn:\n\n✅ Tạo tiêu đề video\n✅ Tạo mô tả SEO\n✅ Tạo hashtags\n✅ Phân tích xu hướng\n✅ Tư vấn chiến lược nội dung\n\n💡 Cách sử dụng:\n• Nhập từ khóa hoặc mô tả video của bạn ở ô input phía trên\n• Yêu cầu: 'Tạo tiêu đề', 'Tạo mô tả', hoặc 'Tạo hashtags'\n• Hoặc dùng tab 'Tạo Gợi ý Nội Dung' để có đầy đủ tính năng\n\nHãy thử hỏi tôi bất cứ điều gì về YouTube content!"
                }
            
            # 6. Check if reply contains tool call request (simple pattern matching)
            if reply and self._should_call_tool(reply):
                tool_result = self._handle_tool_call(reply, context)
                if tool_result:
                    # Regenerate reply với tool result
                    conversation.append({"role": "assistant", "content": reply})
                    conversation.append({"role": "user", "content": f"Đây là kết quả từ hệ thống: {tool_result}. Hãy giải thích và trình bày lại cho người dùng một cách tự nhiên."})
                    reply = self._call_gemini_chat(conversation)
                    if not reply:
                        reply = self.content_service._call_huggingface_chat(conversation, max_length=512)
                    if not reply:
                        # If second call fails, return tool result directly
                        reply = f"Đây là kết quả tôi đã tạo cho bạn:\n\n{tool_result}"
            
            return {"reply": reply}
        except Exception as e:
            logger.error(f"Error generating chat reply: {e}", exc_info=True)
            return {
                "reply": "Xin lỗi, đã xảy ra lỗi khi xử lý yêu cầu của bạn. Vui lòng thử lại sau."
            }

    def _call_gemini_chat(self, conversation: List[Dict[str, str]]) -> str:
        """Call Google Gemini API với conversation format"""
        if not HAS_GEMINI or not self.gemini_model:
            return ""
        
        try:
            # Build prompt from conversation
            # Combine system prompt with user messages
            system_prompt = self.system_prompt
            user_messages = []
            assistant_messages = []
            
            for msg in conversation:
                role = msg.get("role", "user")
                content = msg.get("content", "")
                
                if role == "system":
                    system_prompt = content  # Override system prompt
                elif role == "user":
                    user_messages.append(content)
                elif role == "assistant":
                    assistant_messages.append(content)
            
            # Build full prompt
            full_prompt = system_prompt + "\n\n"
            
            # Add conversation history
            for i, user_msg in enumerate(user_messages):
                full_prompt += f"User: {user_msg}\n"
                if i < len(assistant_messages):
                    full_prompt += f"Assistant: {assistant_messages[i]}\n"
            
            # Add last user message if not in history
            if len(user_messages) > len(assistant_messages):
                full_prompt += f"User: {user_messages[-1]}\n"
                full_prompt += "Assistant: "
            
            # Generate response
            response = self.gemini_model.generate_content(
                full_prompt,
                generation_config={
                    "temperature": 0.7,
                    "top_p": 0.9,
                    "top_k": 40,
                    "max_output_tokens": 1024,
                }
            )
            
            if response and response.text:
                logger.info(f"✓ Gemini chat generated (length: {len(response.text)})")
                return response.text.strip()
            
            return ""
        except Exception as e:
            logger.error(f"Gemini API error: {e}", exc_info=True)
            return ""
    
    def _build_context_message(self, context: Dict[str, Any]) -> str:
        """Build context message từ context dict"""
        parts = []
        if context.get("keywords"):
            keywords = context["keywords"]
            if isinstance(keywords, list) and keywords:
                parts.append(f"Từ khóa hiện tại: {', '.join(keywords[:10])}")
        if context.get("description"):
            desc = context["description"]
            if desc and len(desc.strip()) > 0:
                parts.append(f"Mô tả/ý tưởng hiện tại: {desc[:400]}")
        return "\n".join(parts) if parts else ""

    def _should_call_tool(self, reply: str) -> bool:
        """Simple check nếu reply yêu cầu gọi tool"""
        if not reply:
            return False
        reply_lower = reply.lower()
        tool_keywords = [
            "tạo tiêu đề", "generate_titles", "gợi ý tiêu đề",
            "tạo mô tả", "generate_description", "viết mô tả",
            "tạo hashtags", "generate_hashtags", "gợi ý hashtags"
        ]
        return any(keyword in reply_lower for keyword in tool_keywords)

    def _handle_tool_call(self, request: str, context: Optional[Dict[str, Any]]) -> Optional[str]:
        """Handle tool call - gọi các functions từ ContentService
        
        Args:
            request: String request (có thể là reply từ AI hoặc keyword như "tạo tiêu đề")
            context: Optional context dict
        """
        try:
            request_lower = request.lower() if isinstance(request, str) else ""
            
            # Extract keywords và description từ context
            keywords = []
            description = ""
            if context:
                keywords = context.get("keywords", []) or []
                description = context.get("description", "") or ""
            
            # Nếu không có keywords từ context, thử extract từ description
            if not keywords and description:
                # Simple extraction - lấy từ đầu description
                words = description.split()[:5]
                keywords = [w for w in words if len(w) > 2]
            
            # If still no keywords, use a default
            if not keywords:
                keywords = ["video", "youtube"]
            
            # Determine which tool to call
            if "tiêu đề" in request_lower or "titles" in request_lower:
                result = self.content_service.generate_suggestions({
                    "keywords": keywords if isinstance(keywords, list) else [],
                    "description": description
                })
                titles = result.get("titles", [])
                if titles:
                    return f"10 tiêu đề gợi ý:\n" + "\n".join([f"{i+1}. {title}" for i, title in enumerate(titles[:10])])
            
            elif "mô tả" in request_lower or "description" in request_lower:
                result = self.content_service.generate_suggestions({
                    "keywords": keywords if isinstance(keywords, list) else [],
                    "description": description
                })
                desc = result.get("description", "")
                if desc:
                    return f"Mô tả SEO (300-600 ký tự):\n{desc}"
            
            elif "hashtag" in request_lower:
                result = self.content_service.generate_suggestions({
                    "keywords": keywords if isinstance(keywords, list) else [],
                    "description": description
                })
                hashtags = result.get("hashtags", [])
                if hashtags:
                    return f"20 hashtags gợi ý:\n" + ", ".join(hashtags[:20])
            
            elif "xu hướng" in request_lower or "trend" in request_lower:
                result = self.content_service.generate_suggestions({
                    "keywords": keywords if isinstance(keywords, list) else [],
                    "description": description
                })
                trends = result.get("trends", {})
                google_trends = trends.get("google", []) if isinstance(trends, dict) else []
                youtube_trends = trends.get("youtube", []) if isinstance(trends, dict) else []
                
                parts = []
                if google_trends:
                    parts.append(f"Google Trends: {', '.join(google_trends[:5])}")
                if youtube_trends:
                    parts.append(f"YouTube Trends: {', '.join(youtube_trends[:5])}")
                if parts:
                    return "\n".join(parts)
            
            return None
        except Exception as e:
            logger.error(f"Error handling tool call: {e}", exc_info=True)
            return None

