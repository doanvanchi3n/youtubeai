package com.example.backend.service;

import com.example.backend.dto.response.CommentDTO;
import com.example.backend.dto.response.SentimentStatsDTO;
import com.example.backend.model.Comment;
import com.example.backend.repository.CommentRepository;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class CommentService {
    
    private final CommentRepository commentRepository;
    
    public Page<CommentDTO> getCommentsBySentiment(
            Long channelId, String sentiment, Pageable pageable) {
        Page<Comment> comments = commentRepository.findByChannelIdAndSentiment(
            channelId, sentiment, pageable
        );
        return comments.map(this::toDTO);
    }
    
    public Page<CommentDTO> getCommentsByEmotion(
            Long channelId, String emotion, Pageable pageable) {
        Page<Comment> comments = commentRepository.findByChannelIdAndEmotion(
            channelId, emotion, pageable
        );
        return comments.map(this::toDTO);
    }
    
    @Transactional(readOnly = true)
    public SentimentStatsDTO getSentimentStats(Long channelId) {
        // Get sentiment counts
        List<Object[]> sentimentCounts = commentRepository.countSentimentByChannelId(channelId);
        Map<String, Long> sentimentMap = new HashMap<>();
        for (Object[] row : sentimentCounts) {
            String sentiment = (String) row[0];
            Long count = ((Number) row[1]).longValue();
            sentimentMap.put(sentiment, count);
        }
        
        // Get emotion counts
        List<Object[]> emotionCounts = commentRepository.countEmotionByChannelId(channelId);
        Map<String, Long> emotionMap = new HashMap<>();
        for (Object[] row : emotionCounts) {
            String emotion = (String) row[0];
            Long count = ((Number) row[1]).longValue();
            emotionMap.put(emotion, count);
        }
        
        return SentimentStatsDTO.builder()
            .sentiment(sentimentMap)
            .emotion(emotionMap)
            .build();
    }
    
    private CommentDTO toDTO(Comment comment) {
        CommentDTO.VideoInfoDTO videoInfo = CommentDTO.VideoInfoDTO.builder()
            .id(comment.getVideo().getId())
            .title(comment.getVideo().getTitle())
            .thumbnailUrl(comment.getVideo().getThumbnailUrl())
            .build();
        
        return CommentDTO.builder()
            .id(comment.getId())
            .authorName(comment.getAuthorName())
            .authorAvatar(comment.getAuthorAvatar())
            .content(comment.getContent())
            .likeCount(comment.getLikeCount())
            .sentiment(comment.getSentiment())
            .emotion(comment.getEmotion())
            .publishedAt(comment.getPublishedAt())
            .video(videoInfo)
            .build();
    }
}
