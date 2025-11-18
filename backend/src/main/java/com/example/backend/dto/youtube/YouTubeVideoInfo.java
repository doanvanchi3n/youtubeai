package com.example.backend.dto.youtube;

import lombok.Builder;
import lombok.Value;

import java.time.LocalDateTime;

@Value
@Builder
public class YouTubeVideoInfo {
    String videoId;
    String channelId;
    String title;
    String description;
    String thumbnailUrl;
    LocalDateTime publishedAt;
    Integer durationSeconds;
    Long viewCount;
    Long likeCount;
    Integer commentCount;
}

