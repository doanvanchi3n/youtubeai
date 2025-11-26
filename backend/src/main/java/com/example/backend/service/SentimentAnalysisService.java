package com.example.backend.service;

import com.example.backend.dto.request.BatchAnalysisRequest;
import com.example.backend.dto.response.AnalysisResult;
import com.example.backend.dto.response.BatchAnalysisResponse;
import com.example.backend.model.Comment;
import com.example.backend.repository.CommentRepository;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

@Service
@RequiredArgsConstructor
@Slf4j
public class SentimentAnalysisService {
    
    private final CommentRepository commentRepository;
    private final RestTemplate restTemplate;
    
    @Value("${ai.module.url:http://localhost:5000}")
    private String aiModuleUrl;
    
    @Async("sentimentAnalysisExecutor")
    @Transactional
    public void analyzeCommentsAsync(List<Comment> comments) {
        try {
            if (comments == null || comments.isEmpty()) {
                log.warn("No comments to analyze");
                return;
            }
            
            // 1. Prepare batch texts
            List<String> texts = comments.stream()
                .map(Comment::getContent)
                .filter(Objects::nonNull)
                .filter(text -> !text.trim().isEmpty())
                .collect(Collectors.toList());
            
            if (texts.isEmpty()) {
                log.warn("No valid comment texts to analyze");
                return;
            }
            
            log.info("Analyzing {} comments via AI Module", texts.size());
            
            // 2. Call AI Module
            String url = aiModuleUrl + "/api/analyze-sentiment/batch";
            BatchAnalysisRequest request = BatchAnalysisRequest.builder()
                .texts(texts)
                .build();
            
            BatchAnalysisResponse response;
            try {
                response = restTemplate.postForObject(url, request, BatchAnalysisResponse.class);
            } catch (Exception e) {
                log.error("Error calling AI Module: {}", e.getMessage(), e);
                return;
            }
            
            if (response == null || response.getResults() == null) {
                log.error("AI Module returned null response");
                return;
            }
            
            // 3. Update comments with analysis results
            List<AnalysisResult> results = response.getResults();
            int updatedCount = 0;
            
            // Create a map for quick lookup by text
            Map<String, AnalysisResult> resultMap = results.stream()
                .collect(Collectors.toMap(
                    AnalysisResult::getText,
                    result -> result,
                    (existing, replacement) -> existing
                ));
            
            for (Comment comment : comments) {
                String commentText = comment.getContent();
                if (commentText == null || commentText.trim().isEmpty()) {
                    continue;
                }
                
                AnalysisResult result = resultMap.get(commentText);
                if (result == null) {
                    log.warn("No result found for comment ID: {}", comment.getId());
                    continue;
                }
                
                comment.setSentiment(result.getSentiment());
                comment.setEmotion(result.getEmotion());
                comment.setSentimentScore(BigDecimal.valueOf(result.getConfidence()));
                comment.setIsAnalyzed(true);
                comment.setAnalyzedAt(LocalDateTime.now());
                
                commentRepository.save(comment);
                updatedCount++;
            }
            
            log.info("Successfully analyzed and updated {} comments", updatedCount);
            
        } catch (Exception e) {
            log.error("Error analyzing comments", e);
        }
    }
}

