package com.example.backend.controller;

import com.example.backend.dto.response.DashboardMetricsResponse;
import com.example.backend.dto.response.DashboardTrendResponse;
import com.example.backend.dto.response.SentimentSummaryResponse;
import com.example.backend.dto.response.TopVideoResponse;
import com.example.backend.exception.UnauthorizedException;
import com.example.backend.security.JwtTokenProvider;
import com.example.backend.service.DashboardService;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class DashboardController {
    
    private final DashboardService dashboardService;
    private final JwtTokenProvider jwtTokenProvider;
    
    @GetMapping("/metrics")
    public ResponseEntity<DashboardMetricsResponse> getMetrics(
        @RequestHeader("Authorization") String authHeader,
        @RequestParam(required = false) String channelId) {
        TokenPrincipal principal = resolvePrincipal(authHeader);
        DashboardMetricsResponse response = dashboardService.getMetrics(principal.userId(), channelId);
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/trends")
    public ResponseEntity<DashboardTrendResponse> getTrends(
        @RequestHeader("Authorization") String authHeader,
        @RequestParam(required = false) String channelId,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        TokenPrincipal principal = resolvePrincipal(authHeader);
        DashboardTrendResponse response = dashboardService.getTrends(principal.userId(), channelId, startDate, endDate);
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/top-videos")
    public ResponseEntity<List<TopVideoResponse>> getTopVideos(
        @RequestHeader("Authorization") String authHeader,
        @RequestParam(required = false) String channelId,
        @RequestParam(defaultValue = "5") @Min(1) @Max(20) int limit) {
        TokenPrincipal principal = resolvePrincipal(authHeader);
        List<TopVideoResponse> response = dashboardService.getTopVideos(principal.userId(), channelId, limit);
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/sentiment")
    public ResponseEntity<SentimentSummaryResponse> getSentimentSummary(
        @RequestHeader("Authorization") String authHeader,
        @RequestParam(required = false) String channelId) {
        TokenPrincipal principal = resolvePrincipal(authHeader);
        SentimentSummaryResponse response = dashboardService.getSentimentSummary(principal.userId(), channelId);
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
