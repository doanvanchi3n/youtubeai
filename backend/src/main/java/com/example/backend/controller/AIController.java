package com.example.backend.controller;

import com.example.backend.dto.request.AISuggestionRequest;
import com.example.backend.dto.response.AISuggestionResponse;
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

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class AIController {
    
    private final AIService aiService;
    private final JwtTokenProvider jwtTokenProvider;
    
    @PostMapping("/suggestions")
    public ResponseEntity<AISuggestionResponse> generateSuggestions(
        @RequestHeader("Authorization") String authHeader,
        @Valid @RequestBody AISuggestionRequest request
    ) {
        TokenPrincipal principal = resolvePrincipal(authHeader);
        AISuggestionResponse response = aiService.generateSuggestions(principal.userId(), request);
        return ResponseEntity.ok(response);
    }
    
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
    
    private record TokenPrincipal(Long userId, String email) {}
}

