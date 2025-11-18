package com.example.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnalyzeUrlResponse {
    private Long channelInternalId;
    private String channelId;
    private String channelName;
    private String status;
    private String message;
}

