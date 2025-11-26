package com.example.backend.service;

import com.example.backend.model.Comment;
import com.example.backend.repository.CommentRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class ScheduledAnalysisService {
    
    private final CommentRepository commentRepository;
    private final SentimentAnalysisService sentimentAnalysisService;
    
    private static final int BATCH_SIZE = 50;
    
    @Scheduled(fixedDelay = 60000) // Mỗi 60 giây
    public void analyzePendingComments() {
        try {
            log.debug("Checking for unanalyzed comments...");
            
            Pageable pageable = PageRequest.of(0, BATCH_SIZE);
            Page<Comment> unanalyzedPage = commentRepository.findUnanalyzedComments(pageable);
            
            if (unanalyzedPage.hasContent()) {
                List<Comment> unanalyzedList = unanalyzedPage.getContent();
                log.info("Found {} unanalyzed comments, processing batch", unanalyzedList.size());
                sentimentAnalysisService.analyzeCommentsAsync(unanalyzedList);
            } else {
                log.debug("No unanalyzed comments found");
            }
            
        } catch (Exception e) {
            log.error("Error in scheduled analysis", e);
        }
    }
}

