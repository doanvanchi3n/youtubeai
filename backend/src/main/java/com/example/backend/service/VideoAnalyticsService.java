package com.example.backend.service;

import com.example.backend.dto.response.InteractionResponse;
import com.example.backend.dto.response.OptimalPostingTimeResponse;
import com.example.backend.dto.response.ViewGrowthResponse;
import com.example.backend.model.Channel;
import com.example.backend.model.Video;
import com.example.backend.repository.VideoRepository;
import com.example.backend.service.DashboardService;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class VideoAnalyticsService {
    
    private final VideoRepository videoRepository;
    private final DashboardService dashboardService;
    
    public ViewGrowthResponse getViewGrowth(Long userId, String channelIdentifier, String period) {
        Channel channel = dashboardService.resolveChannel(userId, channelIdentifier);
        
        // Lấy trends từ DashboardService
        com.example.backend.dto.response.DashboardTrendResponse trends = 
            dashboardService.getTrends(userId, channelIdentifier, null, null);
        
        List<ViewGrowthResponse.GrowthPoint> points = new ArrayList<>();
        Long previousViews = 0L;
        
        for (com.example.backend.dto.response.DashboardTrendResponse.TrendPoint trendPoint : trends.getPoints()) {
            Long currentViews = trendPoint.getViews() != null ? trendPoint.getViews() : 0L;
            Long viewGrowth = currentViews - previousViews;
            
            double growthRate = previousViews > 0 
                ? ((double) viewGrowth / previousViews) * 100.0 
                : (viewGrowth > 0 ? 100.0 : 0.0);
            
            points.add(ViewGrowthResponse.GrowthPoint.builder()
                .date(trendPoint.getDate())
                .viewGrowth(Math.max(0L, viewGrowth))
                .growthRate(Math.round(growthRate * 100.0) / 100.0)
                .build());
            
            previousViews = currentViews;
        }
        
        return ViewGrowthResponse.builder()
            .youtubeChannelId(channel.getChannelId())
            .period(period != null ? period : "daily")
            .startDate(trends.getStartDate())
            .endDate(trends.getEndDate())
            .points(points)
            .build();
    }
    
    public InteractionResponse getInteractions(Long userId, String channelIdentifier, 
                                                String type, LocalDate startDate, LocalDate endDate) {
        Channel channel = dashboardService.resolveChannel(userId, channelIdentifier);
        
        // Lấy trends từ DashboardService
        com.example.backend.dto.response.DashboardTrendResponse trends = 
            dashboardService.getTrends(userId, channelIdentifier, startDate, endDate);
        
        List<InteractionResponse.InteractionPoint> points = trends.getPoints().stream()
            .map(trendPoint -> {
                Long value = 0L;
                if ("view".equalsIgnoreCase(type)) {
                    value = trendPoint.getViews() != null ? trendPoint.getViews() : 0L;
                } else if ("like".equalsIgnoreCase(type)) {
                    value = trendPoint.getLikes() != null ? trendPoint.getLikes() : 0L;
                } else if ("comment".equalsIgnoreCase(type)) {
                    value = trendPoint.getComments() != null ? trendPoint.getComments().longValue() : 0L;
                }
                
                return InteractionResponse.InteractionPoint.builder()
                    .date(trendPoint.getDate())
                    .value(value)
                    .build();
            })
            .collect(Collectors.toList());
        
        return InteractionResponse.builder()
            .youtubeChannelId(channel.getChannelId())
            .type(type != null ? type.toLowerCase() : "view")
            .startDate(trends.getStartDate())
            .endDate(trends.getEndDate())
            .points(points)
            .build();
    }
    
    public OptimalPostingTimeResponse getOptimalPostingTime(Long userId, String channelIdentifier) {
        Channel channel = dashboardService.resolveChannel(userId, channelIdentifier);
        List<Video> videos = videoRepository.findByChannelId(channel.getId());
        
        if (videos.isEmpty()) {
            return OptimalPostingTimeResponse.builder()
                .youtubeChannelId(channel.getChannelId())
                .optimalHours(new ArrayList<>())
                .optimalDays(new ArrayList<>())
                .recommendations(new ArrayList<>())
                .build();
        }
        
        // Phân tích thời điểm đăng video dựa trên publishedAt và engagement
        Map<Integer, Long> hourEngagement = new HashMap<>(); // Giờ -> tổng engagement
        Map<DayOfWeek, Long> dayEngagement = new HashMap<>(); // Ngày -> tổng engagement
        
        for (Video video : videos) {
            if (video.getPublishedAt() == null) {
                continue;
            }
            
            LocalDateTime publishedAt = video.getPublishedAt();
            int hour = publishedAt.getHour();
            DayOfWeek dayOfWeek = publishedAt.getDayOfWeek();
            
            // Tính engagement = views + likes * 10 + comments * 5
            long engagement = safeLong(video.getViewCount()) 
                + safeLong(video.getLikeCount()) * 10 
                + safeInt(video.getCommentCount()) * 5;
            
            hourEngagement.put(hour, hourEngagement.getOrDefault(hour, 0L) + engagement);
            dayEngagement.put(dayOfWeek, dayEngagement.getOrDefault(dayOfWeek, 0L) + engagement);
        }
        
        // Tìm top 3 giờ tốt nhất
        List<Integer> optimalHours = hourEngagement.entrySet().stream()
            .sorted((a, b) -> Long.compare(b.getValue(), a.getValue()))
            .limit(3)
            .map(Map.Entry::getKey)
            .sorted()
            .collect(Collectors.toList());
        
        // Tìm top 3 ngày tốt nhất
        List<String> optimalDays = dayEngagement.entrySet().stream()
            .sorted((a, b) -> Long.compare(b.getValue(), a.getValue()))
            .limit(3)
            .map(Map.Entry::getKey)
            .map(day -> {
                // Convert DayOfWeek to Vietnamese day name
                String[] dayNames = {"Chủ nhật", "Thứ hai", "Thứ ba", "Thứ tư", "Thứ năm", "Thứ sáu", "Thứ bảy"};
                return dayNames[day.getValue() % 7];
            })
            .collect(Collectors.toList());
        
        // Tạo recommendations
        List<OptimalPostingTimeResponse.Recommendation> recommendations = new ArrayList<>();
        Map<String, DayOfWeek> dayNameToDayOfWeek = new HashMap<>();
        dayNameToDayOfWeek.put("Chủ nhật", DayOfWeek.SUNDAY);
        dayNameToDayOfWeek.put("Thứ hai", DayOfWeek.MONDAY);
        dayNameToDayOfWeek.put("Thứ ba", DayOfWeek.TUESDAY);
        dayNameToDayOfWeek.put("Thứ tư", DayOfWeek.WEDNESDAY);
        dayNameToDayOfWeek.put("Thứ năm", DayOfWeek.THURSDAY);
        dayNameToDayOfWeek.put("Thứ sáu", DayOfWeek.FRIDAY);
        dayNameToDayOfWeek.put("Thứ bảy", DayOfWeek.SATURDAY);
        
        for (String day : optimalDays) {
            for (Integer hour : optimalHours) {
                DayOfWeek dayOfWeek = dayNameToDayOfWeek.getOrDefault(day, DayOfWeek.MONDAY);
                long totalEngagement = hourEngagement.getOrDefault(hour, 0L) 
                    + dayEngagement.getOrDefault(dayOfWeek, 0L);
                
                double maxEngagement = hourEngagement.values().stream()
                    .mapToLong(Long::longValue)
                    .max()
                    .orElse(1L);
                
                double expectedEngagement = Math.min(1.0, (double) totalEngagement / (maxEngagement * 2));
                
                recommendations.add(OptimalPostingTimeResponse.Recommendation.builder()
                    .time(String.format("%s %02d:00", day, hour))
                    .reason(String.format("Thời điểm này có mức độ tương tác cao dựa trên lịch sử video"))
                    .expectedEngagement(Math.round(expectedEngagement * 100.0) / 100.0)
                    .build());
            }
        }
        
        // Sắp xếp recommendations theo expectedEngagement
        recommendations.sort((a, b) -> Double.compare(b.getExpectedEngagement(), a.getExpectedEngagement()));
        
        return OptimalPostingTimeResponse.builder()
            .youtubeChannelId(channel.getChannelId())
            .optimalHours(optimalHours)
            .optimalDays(optimalDays)
            .recommendations(recommendations.stream().limit(5).collect(Collectors.toList()))
            .build();
    }
    
    private long safeLong(Long value) {
        return value != null ? value : 0L;
    }
    
    private int safeInt(Integer value) {
        return value != null ? value : 0;
    }
}

