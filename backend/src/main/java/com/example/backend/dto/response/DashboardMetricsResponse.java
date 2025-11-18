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
public class DashboardMetricsResponse {
    private Long channelInternalId;
    private String youtubeChannelId;
    private String channelName;
    private String avatarUrl;
    private Long subscriberCount;
    private Integer syncedVideoCount;
    private LocalDateTime lastSyncedAt;
    
    private Long totalViews;
    private Long totalLikes;
    private Long totalComments;
    private Long totalVideos;
}

