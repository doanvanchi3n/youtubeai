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
public class AIModelResponse {
    private Long id;
    private String modelType; // sentiment, emotion, topic
    private String version;
    private String filePath;
    private Double accuracy;
    private Boolean isActive;
    private LocalDateTime createdAt;
}

