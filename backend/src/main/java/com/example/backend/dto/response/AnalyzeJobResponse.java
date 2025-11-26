package com.example.backend.dto.response;

import com.example.backend.model.AnalyzeJob;
import com.example.backend.model.AnalyzeJobStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class AnalyzeJobResponse {
    private Long jobId;
    private AnalyzeJobStatus status;
    private Integer progress;
    private String message;
    private String error;
    private String channelId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime finishedAt;
    
    public static AnalyzeJobResponse from(AnalyzeJob job) {
        return AnalyzeJobResponse.builder()
            .jobId(job.getId())
            .status(job.getStatus())
            .progress(job.getProgress())
            .message(job.getMessage())
            .error(job.getError())
            .channelId(job.getChannelId())
            .createdAt(job.getCreatedAt())
            .updatedAt(job.getUpdatedAt())
            .finishedAt(job.getFinishedAt())
            .build();
    }
}

