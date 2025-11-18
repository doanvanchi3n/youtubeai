package com.example.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TopVideoResponse {
    private Long id;
    private String videoId;
    private String title;
    private String thumbnailUrl;
    private Long viewCount;
    private Long likeCount;
    private Integer commentCount;
    private LocalDateTime publishedAt;
}

