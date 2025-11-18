package com.example.backend.dto.youtube;

import lombok.Builder;
import lombok.Value;

import java.time.LocalDateTime;

@Value
@Builder
public class YouTubeCommentInfo {
    String commentId;
    String videoId;
    String parentCommentId;
    String authorName;
    String authorAvatar;
    String textDisplay;
    Integer likeCount;
    LocalDateTime publishedAt;
}

