package com.example.backend.dto.response;

import java.util.Map;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SentimentStatsDTO {
    private Map<String, Long> sentiment;  // positive, negative, neutral
    private Map<String, Long> emotion;     // happy, sad, angry, suggestion, love
}

