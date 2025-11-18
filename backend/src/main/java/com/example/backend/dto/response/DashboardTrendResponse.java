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
public class DashboardTrendResponse {
    private String youtubeChannelId;
    private LocalDate startDate;
    private LocalDate endDate;
    private List<TrendPoint> points;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TrendPoint {
        private LocalDate date;
        private Long views;
        private Long likes;
        private Integer comments;
    }
}

