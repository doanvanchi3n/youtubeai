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
public class SystemLogResponse {
    private Long id;
    private String level; // ERROR, INFO, WARN, DEBUG
    private String source; // backend, ai_module, youtube_api
    private String message;
    private LocalDateTime timestamp;
}

