package com.example.backend.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class CleanupDataRequest {
    @NotNull(message = "Ngày bắt đầu không được để trống")
    private LocalDateTime beforeDate;
    
    private boolean deleteComments = false;
    private boolean deleteVideos = false;
    private boolean deleteAnalytics = false;
}

