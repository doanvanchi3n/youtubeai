package com.example.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SentimentSummaryResponse {
    private Long totalComments;
    private Long positiveCount;
    private Long negativeCount;
    private Long neutralCount;
    
    private Double positiveRatio;
    private Double negativeRatio;
    private Double neutralRatio;
}

