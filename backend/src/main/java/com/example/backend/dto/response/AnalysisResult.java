package com.example.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnalysisResult {
    private String text;
    private String sentiment;  // positive, negative, neutral
    private String emotion;     // happy, sad, angry, suggestion, love
    private Double confidence;
}

