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
public class InteractionResponse {
    private String youtubeChannelId;
    private String type; // view, like, comment
    private LocalDate startDate;
    private LocalDate endDate;
    private List<InteractionPoint> points;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class InteractionPoint {
        private LocalDate date;
        private Long value;
    }
}

