package com.example.backend.controller;

import com.example.backend.dto.response.SentimentStatsDTO;
import com.example.backend.security.JwtTokenProvider;
import com.example.backend.service.CommunityService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/community")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class CommunityController {
    
    private final CommunityService communityService;
    private final JwtTokenProvider jwtTokenProvider;
    
    @GetMapping("/total-comments")
    public ResponseEntity<Map<String, Long>> getTotalComments(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam(required = false) String channelId
    ) {
        Long userId = jwtTokenProvider.getUserIdFromToken(authHeader.replace("Bearer ", ""));
        Long total = communityService.getTotalComments(userId, channelId != null ? channelId : "");
        return ResponseEntity.ok(Map.of("totalComments", total));
    }
    
    @GetMapping("/topics")
    public ResponseEntity<List<String>> getVideoTopics(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam(required = false) String channelId
    ) {
        Long userId = jwtTokenProvider.getUserIdFromToken(authHeader.replace("Bearer ", ""));
        List<String> topics = communityService.getVideoTopics(userId, channelId != null ? channelId : "");
        return ResponseEntity.ok(topics);
    }
    
    @GetMapping("/sentiment-distribution")
    public ResponseEntity<SentimentStatsDTO> getSentimentDistribution(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam(required = false) String channelId
    ) {
        Long userId = jwtTokenProvider.getUserIdFromToken(authHeader.replace("Bearer ", ""));
        SentimentStatsDTO stats = communityService.getSentimentDistribution(userId, channelId != null ? channelId : "");
        return ResponseEntity.ok(stats);
    }
    
    @GetMapping("/keywords")
    public ResponseEntity<List<String>> getTopKeywords(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam(required = false) String channelId,
            @RequestParam(defaultValue = "10") int limit
    ) {
        Long userId = jwtTokenProvider.getUserIdFromToken(authHeader.replace("Bearer ", ""));
        List<String> keywords = communityService.getTopKeywords(userId, channelId != null ? channelId : "", limit);
        return ResponseEntity.ok(keywords);
    }
    
    @GetMapping("/topic-suggestions")
    public ResponseEntity<List<String>> getTopicSuggestions(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam(required = false) String channelId
    ) {
        Long userId = jwtTokenProvider.getUserIdFromToken(authHeader.replace("Bearer ", ""));
        List<String> suggestions = communityService.getTopicSuggestions(userId, channelId != null ? channelId : "");
        return ResponseEntity.ok(suggestions);
    }
    
    @GetMapping("/topic-comparison")
    public ResponseEntity<List<Map<String, Object>>> getTopicComparison(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam(required = false) String channelId
    ) {
        Long userId = jwtTokenProvider.getUserIdFromToken(authHeader.replace("Bearer ", ""));
        List<Map<String, Object>> comparison = communityService.getTopicComparison(userId, channelId != null ? channelId : "");
        return ResponseEntity.ok(comparison);
    }
}
