package com.example.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ViewGrowthResponse {
    private String youtubeChannelId;
    private String period; // daily, weekly, monthly
    private LocalDate startDate;
    private LocalDate endDate;
    private List<GrowthPoint> points;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class GrowthPoint {
        private LocalDate date;
        private Long viewGrowth; // Số view tăng thêm
        private Double growthRate; // Tỷ lệ tăng trưởng (%)
    }
}

