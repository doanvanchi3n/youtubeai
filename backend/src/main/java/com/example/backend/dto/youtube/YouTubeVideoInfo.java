package com.example.backend.dto.youtube;

import java.time.LocalDateTime;
import java.util.List;
import lombok.Builder;
import lombok.Value;

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
    List<String> tags;
    String categoryId;
}

