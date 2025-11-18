package com.example.backend.dto.youtube;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class YouTubeChannelInfo {
    String channelId;
    String title;
    String description;
    String thumbnailUrl;
    Long subscriberCount;
    Long viewCount;
    Integer videoCount;
    String uploadsPlaylistId;
}

