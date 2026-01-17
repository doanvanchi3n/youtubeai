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

/**
 * Channel Controller - Xử lý các request liên quan đến YouTube channel analysis
 * 
 * LUỒNG HOẠT ĐỘNG:
 * 1. User nhập URL kênh YouTube → Frontend gửi POST /api/youtube/analyze
 * 2. Controller tạo AnalyzeJob (async job) với status PENDING
 * 3. Background task (hoặc service) xử lý job:
 *    - Parse URL → Xác định loại URL (channel ID, handle, username)
 *    - Gọi YouTube API → Lấy channel info, videos, comments
 *    - Lưu vào database
 * 4. Frontend poll GET /api/youtube/analyze/{jobId} để check status
 */
@RestController
@RequestMapping("/api/youtube")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class ChannelController {
    
    private final AnalyzeJobService analyzeJobService;
    private final JwtTokenProvider jwtTokenProvider;
    
    /**
     * Endpoint: POST /api/youtube/analyze
     * 
     * MỤC ĐÍCH: Tạo job để phân tích và đồng bộ kênh YouTube
     * 
     * LUỒNG XỬ LÝ:
     * 1. Validate JWT token
     * 2. Tạo AnalyzeJob với status PENDING
     * 3. Background task sẽ xử lý job (parse URL, gọi YouTube API, lưu database)
     * 4. Trả về job ID để frontend có thể poll status
     * 
     * INPUT: AnalyzeUrlRequest (url: YouTube channel URL)
     * OUTPUT: AnalyzeJobResponse (jobId, status: PENDING, progress: 0)
     * 
     * LƯU Ý: Job được xử lý async, frontend cần poll GET /api/youtube/analyze/{jobId} để check status
     */
    @PostMapping("/analyze")
    public ResponseEntity<AnalyzeJobResponse> analyzeUrl(
        @RequestHeader("Authorization") String authHeader,
        @Valid @RequestBody AnalyzeUrlRequest request
    ) {
        // Validate token và extract userId
        TokenPrincipal principal = resolvePrincipal(authHeader);
        
        // Tạo job với status PENDING (sẽ được xử lý bởi background task)
        var job = analyzeJobService.createJob(principal.userId(), request.getUrl());
        
        // Trả về 202 Accepted (job đã được tạo, đang chờ xử lý)
        return ResponseEntity.accepted().body(AnalyzeJobResponse.from(job));
    }
    
    /**
     * Endpoint: GET /api/youtube/analyze/{jobId}
     * 
     * MỤC ĐÍCH: Lấy status của analyze job
     * 
     * LUỒNG XỬ LÝ:
     * 1. Validate JWT token
     * 2. Lấy job từ database (phải thuộc về user này)
     * 3. Trả về job status (PENDING, PROCESSING, SUCCESS, FAILED)
     * 
     * INPUT: jobId (path variable)
     * OUTPUT: AnalyzeJobResponse (jobId, status, progress, message)
     * 
     * LƯU Ý: Frontend nên poll endpoint này để check job status
     */
    @GetMapping("/analyze/{jobId}")
    public ResponseEntity<AnalyzeJobResponse> getAnalyzeJob(
        @RequestHeader("Authorization") String authHeader,
        @PathVariable Long jobId
    ) {
        // Validate token và extract userId
        TokenPrincipal principal = resolvePrincipal(authHeader);
        
        // Lấy job từ database (chỉ job của user này)
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
