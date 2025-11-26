package com.example.backend.dto.response;

import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommentDTO {
    private Long id;
    private String authorName;
    private String authorAvatar;
    private String content;
    private Integer likeCount;
    private String sentiment;
    private String emotion;
    private LocalDateTime publishedAt;
    private VideoInfoDTO video;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VideoInfoDTO {
        private Long id;
        private String title;
        private String thumbnailUrl;
    }
}

