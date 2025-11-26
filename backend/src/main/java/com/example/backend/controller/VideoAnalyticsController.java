package com.example.backend.controller;

import com.example.backend.dto.response.InteractionResponse;
import com.example.backend.dto.response.OptimalPostingTimeResponse;
import com.example.backend.dto.response.ViewGrowthResponse;
import com.example.backend.exception.UnauthorizedException;
import com.example.backend.security.JwtTokenProvider;
import com.example.backend.service.VideoAnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/video-analytics")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class VideoAnalyticsController {
    
    private final VideoAnalyticsService videoAnalyticsService;
    private final JwtTokenProvider jwtTokenProvider;
    
    @GetMapping("/view-growth")
    public ResponseEntity<ViewGrowthResponse> getViewGrowth(
        @RequestHeader("Authorization") String authHeader,
        @RequestParam(required = false) String channelId,
        @RequestParam(required = false, defaultValue = "daily") String period) {
        TokenPrincipal principal = resolvePrincipal(authHeader);
        ViewGrowthResponse response = videoAnalyticsService.getViewGrowth(
            principal.userId(), channelId, period);
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/interactions")
    public ResponseEntity<InteractionResponse> getInteractions(
        @RequestHeader("Authorization") String authHeader,
        @RequestParam(required = false) String channelId,
        @RequestParam(required = false, defaultValue = "view") String type,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        TokenPrincipal principal = resolvePrincipal(authHeader);
        InteractionResponse response = videoAnalyticsService.getInteractions(
            principal.userId(), channelId, type, startDate, endDate);
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/optimal-posting-time")
    public ResponseEntity<OptimalPostingTimeResponse> getOptimalPostingTime(
        @RequestHeader("Authorization") String authHeader,
        @RequestParam(required = false) String channelId) {
        TokenPrincipal principal = resolvePrincipal(authHeader);
        OptimalPostingTimeResponse response = videoAnalyticsService.getOptimalPostingTime(
            principal.userId(), channelId);
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

