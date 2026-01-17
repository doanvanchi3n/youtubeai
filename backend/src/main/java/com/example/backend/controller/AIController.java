package com.example.backend.controller;

import com.example.backend.dto.request.AISuggestionRequest;
import com.example.backend.dto.request.AIChatRequest;
import com.example.backend.dto.response.AISuggestionResponse;
import com.example.backend.dto.response.AIChatResponse;
import com.example.backend.exception.UnauthorizedException;
import com.example.backend.security.JwtTokenProvider;
import com.example.backend.service.AIService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * AI Controller - Xử lý các request liên quan đến AI (Suggestions và Chat)
 * 
 * LUỒNG HOẠT ĐỘNG:
 * 1. User gửi request từ Frontend → Controller nhận request
 * 2. Controller validate JWT token → Extract userId
 * 3. Controller gọi AIService để xử lý business logic
 * 4. AIService gọi AI Module (Python Flask) để generate content
 * 5. Trả về response cho Frontend
 */
@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class AIController {
    
    private final AIService aiService;
    private final JwtTokenProvider jwtTokenProvider;
    
    /**
     * Endpoint: POST /api/ai/suggestions
     * 
     * MỤC ĐÍCH: Tạo gợi ý nội dung AI (titles, description, hashtags, topics, trends)
     * 
     * LUỒNG XỬ LÝ:
     * 1. Validate JWT token từ Authorization header
     * 2. Extract userId từ token
     * 3. Gọi AIService.generateSuggestions() để xử lý
     * 4. AIService sẽ:
     *    - Sanitize keywords
     *    - Load channel context nếu cần
     *    - Gọi AI Module (Python Flask) để generate content
     *    - Transform response và trả về
     * 
     * INPUT: AISuggestionRequest (keywords, description, useChannelContext, ...)
     * OUTPUT: AISuggestionResponse (titles, description, hashtags, topics, trends)
     */
    @PostMapping("/suggestions")
    public ResponseEntity<AISuggestionResponse> generateSuggestions(
        @RequestHeader("Authorization") String authHeader,
        @Valid @RequestBody AISuggestionRequest request
    ) {
        // Validate token và extract userId
        TokenPrincipal principal = resolvePrincipal(authHeader);
        
        // Gọi service để xử lý business logic
        AISuggestionResponse response = aiService.generateSuggestions(principal.userId(), request);
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Endpoint: POST /api/ai/chat
     * 
     * MỤC ĐÍCH: Chat với AI chatbot chuyên về YouTube content
     * 
     * LUỒNG XỬ LÝ:
     * 1. Validate JWT token từ Authorization header
     * 2. Extract userId từ token
     * 3. Gọi AIService.chat() để proxy request đến AI Module
     * 4. AI Module (ChatService) sẽ:
     *    - Build conversation với system prompt
     *    - Gọi Google Gemini API (hoặc HuggingFace fallback)
     *    - Handle tool calling nếu cần (generate titles/description/hashtags)
     *    - Trả về reply
     * 
     * INPUT: AIChatRequest (messages: conversation history, context: keywords/description)
     * OUTPUT: AIChatResponse (reply: text response từ AI)
     */
    @PostMapping("/chat")
    public ResponseEntity<AIChatResponse> chat(
        @RequestHeader("Authorization") String authHeader,
        @Valid @RequestBody AIChatRequest request
    ) {
        // Validate token và extract userId
        TokenPrincipal principal = resolvePrincipal(authHeader);
        
        // Proxy request đến AI Module
        AIChatResponse response = aiService.chat(principal.userId(), request);
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Validate JWT token và extract user information
     * 
     * THAM SỐ: authHeader - "Bearer <token>"
     * TRẢ VỀ: TokenPrincipal (userId, email)
     * 
     * XỬ LÝ:
     * 1. Kiểm tra format "Bearer <token>"
     * 2. Validate token với JwtTokenProvider
     * 3. Extract userId và email từ token
     * 4. Throw UnauthorizedException nếu token không hợp lệ
     */
    private TokenPrincipal resolvePrincipal(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new UnauthorizedException("Thiếu thông tin xác thực");
        }
        String token = authHeader.substring(7);
        if (!jwtTokenProvider.validateToken(token)) {
            throw new UnauthorizedException("Token không hợp lệ hoặc đã hết hạn");
        }
        Long userId = jwtTokenProvider.getUserIdFromToken(token);
        String email = jwtTokenProvider.getEmailFromToken(token);
        if (userId == null) {
            throw new UnauthorizedException("Không xác định được người dùng");
        }
        return new TokenPrincipal(userId, email);
    }
    
    /**
     * Record chứa thông tin user từ JWT token
     */
    private record TokenPrincipal(Long userId, String email) {}
}

