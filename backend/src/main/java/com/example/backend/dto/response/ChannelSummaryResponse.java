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
public class ChannelSummaryResponse {
    private Long id;
    private String channelId;
    private String channelName;
    private Long userId;
    private Integer videoCount;
    private Long subscriberCount;
    private LocalDateTime lastSyncedAt;
}

