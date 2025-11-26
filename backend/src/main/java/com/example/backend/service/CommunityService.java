package com.example.backend.service;

import com.example.backend.dto.response.SentimentStatsDTO;
import com.example.backend.model.Channel;
import com.example.backend.model.Keyword;
import com.example.backend.model.VideoTopic;
import com.example.backend.repository.CommentRepository;
import com.example.backend.repository.KeywordRepository;
import com.example.backend.repository.VideoTopicRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CommunityService {
    
    private final DashboardService dashboardService;
    private final CommentService commentService;
    private final CommentRepository commentRepository;
    private final KeywordRepository keywordRepository;
    private final VideoTopicRepository videoTopicRepository;
    
    /**
     * Get total comments count for a channel
     */
    public Long getTotalComments(Long userId, String channelIdentifier) {
        Channel channel = dashboardService.resolveChannel(userId, channelIdentifier);
        return commentRepository.countByChannelId(channel.getId());
    }
    
    /**
     * Get list of video topics for a channel
     */
    public List<String> getVideoTopics(Long userId, String channelIdentifier) {
        Channel channel = dashboardService.resolveChannel(userId, channelIdentifier);
        List<VideoTopic> topics = videoTopicRepository.findByChannelId(channel.getId());
        return topics.stream()
                .map(VideoTopic::getTopicName)
                .sorted()
                .collect(Collectors.toList());
    }
    
    /**
     * Get sentiment distribution (positive/negative/neutral) for pie chart
     */
    public SentimentStatsDTO getSentimentDistribution(Long userId, String channelIdentifier) {
        Channel channel = dashboardService.resolveChannel(userId, channelIdentifier);
        return commentService.getSentimentStats(channel.getId());
    }
    
    /**
     * Get top keywords mentioned in comments
     */
    public List<String> getTopKeywords(Long userId, String channelIdentifier, int limit) {
        Channel channel = dashboardService.resolveChannel(userId, channelIdentifier);
        List<Keyword> keywords = keywordRepository.findTopKeywordsByChannelId(channel.getId());
        
        // If no keywords in database, extract from comments (fallback)
        if (keywords.isEmpty()) {
            return extractKeywordsFromComments(channel.getId(), limit);
        }
        
        return keywords.stream()
                .limit(limit)
                .map(Keyword::getKeyword)
                .collect(Collectors.toList());
    }
    
    /**
     * Get topic suggestions based on keywords and comments
     */
    public List<String> getTopicSuggestions(Long userId, String channelIdentifier) {
        Channel channel = dashboardService.resolveChannel(userId, channelIdentifier);
        
        // Get top keywords
        List<String> keywords = getTopKeywords(userId, channelIdentifier, 10);
        
        // Simple rule-based suggestions (can be enhanced with AI later)
        Set<String> suggestions = new LinkedHashSet<>();
        
        for (String keyword : keywords) {
            String lower = keyword.toLowerCase();
            if (lower.contains("game") || lower.contains("gaming") || lower.contains("play")) {
                suggestions.add("Gaming");
            }
            if (lower.contains("vlog") || lower.contains("travel") || lower.contains("du lich")) {
                suggestions.add("Vlog");
            }
            if (lower.contains("music") || lower.contains("nhac") || lower.contains("song")) {
                suggestions.add("Music");
            }
            if (lower.contains("review") || lower.contains("danh gia")) {
                suggestions.add("Review");
            }
            if (lower.contains("tutorial") || lower.contains("huong dan")) {
                suggestions.add("Tutorial");
            }
        }
        
        // If no suggestions found, return default
        if (suggestions.isEmpty()) {
            suggestions.add("Gaming");
            suggestions.add("Vlog");
            suggestions.add("Entertainment");
        }
        
        return new ArrayList<>(suggestions);
    }
    
    /**
     * Get topic comparison data for bar chart (views, likes, comments per topic)
     */
    public List<Map<String, Object>> getTopicComparison(Long userId, String channelIdentifier) {
        Channel channel = dashboardService.resolveChannel(userId, channelIdentifier);
        List<VideoTopic> topics = videoTopicRepository.findByChannelId(channel.getId());
        
        return topics.stream()
                .map(topic -> {
                    Map<String, Object> data = new HashMap<>();
                    data.put("topic", topic.getTopicName());
                    data.put("views", topic.getTotalViews() != null ? topic.getTotalViews().longValue() : 0L);
                    data.put("likes", topic.getTotalLikes() != null ? topic.getTotalLikes().longValue() : 0L);
                    data.put("comments", topic.getTotalComments() != null ? topic.getTotalComments().intValue() : 0);
                    return data;
                })
                .sorted((a, b) -> Long.compare(
                    (Long) b.get("views"),
                    (Long) a.get("views")
                ))
                .collect(Collectors.toList());
    }
    
    /**
     * Fallback: Extract keywords from comment content if keywords table is empty
     */
    private List<String> extractKeywordsFromComments(Long channelId, int limit) {
        // Get comments with suggestion emotion (they often contain topic requests)
        var comments = commentRepository.findByChannelIdAndEmotion(
            channelId, 
            "suggestion", 
            PageRequest.of(0, 50)
        );
        
        Set<String> keywords = new LinkedHashSet<>();
        for (var comment : comments.getContent()) {
            String content = comment.getContent().toLowerCase();
            // Simple extraction - look for common patterns
            if (content.contains("làm về") || content.contains("làm")) {
                int idx = content.indexOf("làm");
                String after = content.substring(Math.min(idx + 4, content.length()));
                String[] words = after.split("\\s+");
                if (words.length > 0 && words[0].length() > 2) {
                    keywords.add(words[0]);
                }
            }
        }
        
        return keywords.stream()
                .limit(limit)
                .collect(Collectors.toList());
    }
}
