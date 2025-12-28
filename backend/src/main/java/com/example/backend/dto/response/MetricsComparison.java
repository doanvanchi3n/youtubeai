package com.example.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MetricsComparison {
    private Long previousValue;
    private Long currentValue;
    private Long change;  // có thể âm
    private Double changePercentage;
    private String trend;  // "up", "down", "stable"
    private Long daysSinceLastSync;
}

