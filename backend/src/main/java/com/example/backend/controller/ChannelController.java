package com.example.backend.controller;

import com.example.backend.dto.request.AnalyzeUrlRequest;
import com.example.backend.dto.response.AnalyzeJobResponse;
import com.example.backend.exception.UnauthorizedException;
import com.example.backend.security.JwtTokenProvider;
import com.example.backend.service.AnalyzeJobService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/youtube")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class ChannelController {
    
    private final AnalyzeJobService analyzeJobService;
    private final JwtTokenProvider jwtTokenProvider;
    
    @PostMapping("/analyze")
    public ResponseEntity<AnalyzeJobResponse> analyzeUrl(
        @RequestHeader("Authorization") String authHeader,
        @Valid @RequestBody AnalyzeUrlRequest request
    ) {
        TokenPrincipal principal = resolvePrincipal(authHeader);
        var job = analyzeJobService.createJob(principal.userId(), request.getUrl());
        return ResponseEntity.accepted().body(AnalyzeJobResponse.from(job));
    }
    
    @GetMapping("/analyze/{jobId}")
    public ResponseEntity<AnalyzeJobResponse> getAnalyzeJob(
        @RequestHeader("Authorization") String authHeader,
        @PathVariable Long jobId
    ) {
        TokenPrincipal principal = resolvePrincipal(authHeader);
        return analyzeJobService.getJob(principal.userId(), jobId)
            .map(job -> ResponseEntity.ok(AnalyzeJobResponse.from(job)))
            .orElseGet(() -> ResponseEntity.notFound().build());
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
