package com.example.backend.service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.OptionalDouble;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.backend.dto.response.InteractionResponse;
import com.example.backend.dto.response.OptimalPostingTimeResponse;
import com.example.backend.dto.response.ViewGrowthResponse;
import com.example.backend.model.Channel;
import com.example.backend.model.Video;
import com.example.backend.repository.VideoRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class VideoAnalyticsService {
    
    private static final int MIN_VIDEOS_FOR_OPTIMAL_TIME = 5;
    private static final double LIKE_WEIGHT = 10.0;
    private static final double COMMENT_WEIGHT = 5.0;

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

        // Không đủ dữ liệu để đưa ra gợi ý đáng tin cậy
        if (videos == null || videos.size() < MIN_VIDEOS_FOR_OPTIMAL_TIME) {
            return OptimalPostingTimeResponse.builder()
                .youtubeChannelId(channel.getChannelId())
                .optimalHours(new ArrayList<>())
                .optimalDays(new ArrayList<>())
                .recommendations(new ArrayList<>())
                .build();
        }

        // Phân tích thời điểm đăng video dựa trên publishedAt và engagement
        Map<Integer, List<Double>> hourEngagements = new HashMap<>(); // Giờ -> danh sách engagement
        Map<DayOfWeek, List<Double>> dayEngagements = new HashMap<>(); // Ngày -> danh sách engagement

        int validVideos = 0;
        for (Video video : videos) {
            LocalDateTime publishedAt = video.getPublishedAt();
            if (publishedAt == null) {
                continue;
            }

            // TODO: Trong tương lai có thể chuẩn hoá timezone theo cấu hình kênh
            int hour = publishedAt.getHour();
            DayOfWeek dayOfWeek = publishedAt.getDayOfWeek();

            double engagement = calculateEngagement(video);
            hourEngagements.computeIfAbsent(hour, h -> new ArrayList<>()).add(engagement);
            dayEngagements.computeIfAbsent(dayOfWeek, d -> new ArrayList<>()).add(engagement);
            validVideos++;
        }

        // Nếu sau khi lọc không còn đủ video hợp lệ, trả về rỗng
        if (validVideos < MIN_VIDEOS_FOR_OPTIMAL_TIME
            || hourEngagements.isEmpty()
            || dayEngagements.isEmpty()) {
            return OptimalPostingTimeResponse.builder()
                .youtubeChannelId(channel.getChannelId())
                .optimalHours(new ArrayList<>())
                .optimalDays(new ArrayList<>())
                .recommendations(new ArrayList<>())
                .build();
        }

        Map<Integer, Double> hourAvgEngagement = new HashMap<>();
        for (Map.Entry<Integer, List<Double>> entry : hourEngagements.entrySet()) {
            OptionalDouble avg = entry.getValue().stream().mapToDouble(Double::doubleValue).average();
            hourAvgEngagement.put(entry.getKey(), avg.orElse(0.0));
        }

        Map<DayOfWeek, Double> dayAvgEngagement = new HashMap<>();
        for (Map.Entry<DayOfWeek, List<Double>> entry : dayEngagements.entrySet()) {
            OptionalDouble avg = entry.getValue().stream().mapToDouble(Double::doubleValue).average();
            dayAvgEngagement.put(entry.getKey(), avg.orElse(0.0));
        }

        // Tìm top 3 giờ tốt nhất dựa trên engagement trung bình
        List<Integer> optimalHours = hourAvgEngagement.entrySet().stream()
            .sorted((a, b) -> Double.compare(b.getValue(), a.getValue()))
            .limit(3)
            .map(Map.Entry::getKey)
            .sorted()
            .collect(Collectors.toList());

        // Tìm top 3 ngày tốt nhất dựa trên engagement trung bình
        List<DayOfWeek> optimalDayEnums = dayAvgEngagement.entrySet().stream()
            .sorted((a, b) -> Double.compare(b.getValue(), a.getValue()))
            .limit(3)
            .map(Map.Entry::getKey)
            .sorted(Comparator.comparingInt(DayOfWeek::getValue))
            .collect(Collectors.toList());

        List<String> optimalDays = optimalDayEnums.stream()
            .map(this::toVietnameseDayName)
            .collect(Collectors.toList());

        // Tạo recommendations
        List<OptimalPostingTimeResponse.Recommendation> recommendations = new ArrayList<>();

        double maxHourAvg = hourAvgEngagement.values().stream()
            .mapToDouble(Double::doubleValue)
            .max()
            .orElse(1.0);

        double maxDayAvg = dayAvgEngagement.values().stream()
            .mapToDouble(Double::doubleValue)
            .max()
            .orElse(1.0);

        for (DayOfWeek day : optimalDayEnums) {
            for (Integer hour : optimalHours) {
                double hourScore = hourAvgEngagement.getOrDefault(hour, 0.0) / maxHourAvg;
                double dayScore = dayAvgEngagement.getOrDefault(day, 0.0) / maxDayAvg;

                // Kết hợp theo trung bình có trọng số đơn giản giữa giờ và ngày
                double expectedEngagement = (hourScore * 0.6) + (dayScore * 0.4);

                String vnDay = toVietnameseDayName(day);
                String reason = String.format(
                    Locale.forLanguageTag("vi-VN"),
                    "Khung giờ %02d:00 ngày %s có mức tương tác trung bình cao so với các thời điểm khác",
                    hour,
                    vnDay
                );

                recommendations.add(OptimalPostingTimeResponse.Recommendation.builder()
                    .time(String.format("%s %02d:00", vnDay, hour))
                    .reason(reason)
                    .expectedEngagement(Math.round(expectedEngagement * 100.0) / 100.0)
                    .build());
            }
        }

        // Sắp xếp recommendations theo expectedEngagement và chỉ lấy top 5
        recommendations.sort((a, b) -> Double.compare(b.getExpectedEngagement(), a.getExpectedEngagement()));

        return OptimalPostingTimeResponse.builder()
            .youtubeChannelId(channel.getChannelId())
            .optimalHours(optimalHours)
            .optimalDays(optimalDays)
            .recommendations(recommendations.stream().limit(5).collect(Collectors.toList()))
            .build();
    }

    private double calculateEngagement(Video video) {
        double views = safeLong(video.getViewCount());
        double likes = safeLong(video.getLikeCount());
        double comments = safeInt(video.getCommentCount());
        return views + likes * LIKE_WEIGHT + comments * COMMENT_WEIGHT;
    }

    private long safeLong(Long value) {
        return value != null ? value : 0L;
    }

    private int safeInt(Integer value) {
        return value != null ? value : 0;
    }

    private String toVietnameseDayName(DayOfWeek dayOfWeek) {
        switch (dayOfWeek) {
            case MONDAY:
                return "Thứ hai";
            case TUESDAY:
                return "Thứ ba";
            case WEDNESDAY:
                return "Thứ tư";
            case THURSDAY:
                return "Thứ năm";
            case FRIDAY:
                return "Thứ sáu";
            case SATURDAY:
                return "Thứ bảy";
            case SUNDAY:
            default:
                return "Chủ nhật";
        }
    }
}

