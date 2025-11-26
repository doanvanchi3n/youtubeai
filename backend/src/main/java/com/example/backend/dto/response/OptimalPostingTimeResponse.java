package com.example.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OptimalPostingTimeResponse {
    private String youtubeChannelId;
    private List<Integer> optimalHours; // Giờ tốt nhất (0-23)
    private List<String> optimalDays; // Ngày tốt nhất (Monday, Tuesday, ...)
    private List<Recommendation> recommendations;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Recommendation {
        private String time; // e.g., "Monday 14:00"
        private String reason;
        private Double expectedEngagement; // Dự kiến tương tác (0-1)
    }
}

