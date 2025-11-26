package com.example.backend.controller;

import com.example.backend.dto.response.CommentDTO;
import com.example.backend.dto.response.SentimentStatsDTO;
import com.example.backend.dto.response.TopVideoResponse;
import com.example.backend.exception.UnauthorizedException;
import com.example.backend.security.JwtTokenProvider;
import com.example.backend.service.CommentService;
import com.example.backend.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/comments")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class CommentController {
    
    private final CommentService commentService;
    private final DashboardService dashboardService;
    private final JwtTokenProvider jwtTokenProvider;
    
    @GetMapping("/sentiment")
    public ResponseEntity<Page<CommentDTO>> getCommentsBySentiment(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam(required = false) String channelId,
            @RequestParam String sentiment,
            @PageableDefault(size = 20) Pageable pageable) {
        
        TokenPrincipal principal = resolvePrincipal(authHeader);
        Long channelDbId = resolveChannelId(principal.userId(), channelId);
        
        Page<CommentDTO> comments = commentService.getCommentsBySentiment(
            channelDbId, sentiment, pageable
        );
        return ResponseEntity.ok(comments);
    }
    
    @GetMapping("/emotion")
    public ResponseEntity<Page<CommentDTO>> getCommentsByEmotion(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam(required = false) String channelId,
            @RequestParam String emotion,
            @PageableDefault(size = 20) Pageable pageable) {
        
        TokenPrincipal principal = resolvePrincipal(authHeader);
        Long channelDbId = resolveChannelId(principal.userId(), channelId);
        
        Page<CommentDTO> comments = commentService.getCommentsByEmotion(
            channelDbId, emotion, pageable
        );
        return ResponseEntity.ok(comments);
    }
    
    @GetMapping("/sentiment-stats")
    public ResponseEntity<SentimentStatsDTO> getSentimentStats(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam(required = false) String channelId) {
        
        TokenPrincipal principal = resolvePrincipal(authHeader);
        Long channelDbId = resolveChannelId(principal.userId(), channelId);
        
        SentimentStatsDTO stats = commentService.getSentimentStats(channelDbId);
        return ResponseEntity.ok(stats);
    }
    
    @GetMapping("/emotion-chart")
    public ResponseEntity<SentimentStatsDTO> getEmotionChartData(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam(required = false) String channelId) {
        
        TokenPrincipal principal = resolvePrincipal(authHeader);
        Long channelDbId = resolveChannelId(principal.userId(), channelId);
        
        // Same as sentiment-stats, returns emotion counts for chart
        SentimentStatsDTO stats = commentService.getSentimentStats(channelDbId);
        return ResponseEntity.ok(stats);
    }
    
    @GetMapping("/top-videos")
    public ResponseEntity<java.util.List<TopVideoResponse>> getTopVideos(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam(required = false) String channelId,
            @RequestParam(defaultValue = "3") int limit) {
        
        TokenPrincipal principal = resolvePrincipal(authHeader);
        java.util.List<TopVideoResponse> videos = dashboardService.getTopVideos(
            principal.userId(), channelId, limit
        );
        return ResponseEntity.ok(videos);
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
    
    private Long resolveChannelId(Long userId, String channelIdentifier) {
        try {
            return dashboardService.resolveChannel(userId, channelIdentifier).getId();
        } catch (Exception e) {
            throw new com.example.backend.exception.ResourceNotFoundException(
                "Không tìm thấy kênh. Vui lòng đồng bộ kênh YouTube trước."
            );
        }
    }
    
    private record TokenPrincipal(Long userId, String email) {}
}
