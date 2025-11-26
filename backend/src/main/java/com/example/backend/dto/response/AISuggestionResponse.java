package com.example.backend.dto.response;

import java.time.LocalDateTime;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AISuggestionResponse {
    
    private List<String> titles;
    private String description;
    private List<String> hashtags;
    private List<String> topics;
    private TrendInsight trends;
    private ContextSnapshot context;
    private String generatedAt;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TrendInsight {
        private List<String> google;
        private List<String> youtube;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ContextSnapshot {
        private List<String> keywords;
        private ChannelBrief channel;
        private List<SourceVideo> videos;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ChannelBrief {
        private String name;
        private String description;
        private Long subscriberCount;
        private Long viewCount;
        private String niche;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SourceVideo {
        private String title;
        private String description;
        private List<String> tags;
        private Long views;
        private Long likes;
        private Integer comments;
        private LocalDateTime publishedAt;
    }
}


