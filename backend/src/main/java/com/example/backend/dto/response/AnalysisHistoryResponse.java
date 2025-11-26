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
public class AnalysisHistoryResponse {
    private Long id;
    private Long userId;
    private String username;
    private String userEmail;
    private Long channelId;
    private String channelName;
    private String analysisType; // channel, video
    private String status; // success, failed
    private Long videoCount;
    private Long commentCount;
    private LocalDateTime syncedAt;
    private LocalDateTime createdAt;
}

