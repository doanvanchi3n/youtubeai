package com.example.backend.dto.request;

import jakarta.validation.constraints.Min;
import lombok.Data;

@Data
public class UpdateRateLimitRequest {
    @Min(value = 1, message = "Số request phải lớn hơn 0")
    private Integer maxRequestsPerDay;
    
    @Min(value = 1, message = "Số request phải lớn hơn 0")
    private Integer maxRequestsPerHour;
}

