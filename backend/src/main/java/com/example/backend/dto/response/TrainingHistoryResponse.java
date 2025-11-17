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
public class TrainingHistoryResponse {
    private Long id;
    private String modelType;
    private Integer datasetSize;
    private Double accuracy;
    private Double loss;
    private String status; // completed, failed, in_progress
    private LocalDateTime createdAt;
}

