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
    private Long previousValue;      // Giá trị lần trước
    private Long currentValue;       // Giá trị hiện tại
    private Long change;             // Thay đổi tuyệt đối (có thể âm)
    private Double changePercentage; // Thay đổi phần trăm
    private String trend;            // "up", "down", "stable"
    private Long daysSinceLastSync;  // Số ngày từ lần sync trước
}

