package com.example.backend.controller;

import com.example.backend.dto.request.AnalyzeUrlRequest;
import com.example.backend.dto.response.AnalyzeUrlResponse;
import com.example.backend.exception.UnauthorizedException;
import com.example.backend.security.JwtTokenProvider;
import com.example.backend.service.YouTubeAnalysisService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/youtube")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class ChannelController {
    
    private final YouTubeAnalysisService youTubeAnalysisService;
    private final JwtTokenProvider jwtTokenProvider;
    
    @PostMapping("/analyze")
    public ResponseEntity<AnalyzeUrlResponse> analyzeUrl(
        @RequestHeader("Authorization") String authHeader,
        @Valid @RequestBody AnalyzeUrlRequest request
    ) {
        TokenPrincipal principal = resolvePrincipal(authHeader);
        AnalyzeUrlResponse response = youTubeAnalysisService.analyzeUrl(principal.userId(), request.getUrl());
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
        return new TokenPrincipal(userId, email);
    }
    
    private record TokenPrincipal(Long userId, String email) {}
}
