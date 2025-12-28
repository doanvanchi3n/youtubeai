package com.example.backend.service;

import com.example.backend.dto.response.DashboardMetricsResponse;
import com.example.backend.dto.response.DashboardTrendResponse;
import com.example.backend.dto.response.MetricsComparison;
import com.example.backend.dto.response.SentimentSummaryResponse;
import com.example.backend.dto.response.TopVideoResponse;
import com.example.backend.exception.ResourceNotFoundException;
import com.example.backend.exception.UnauthorizedException;
import com.example.backend.model.Analytics;
import com.example.backend.model.Channel;
import com.example.backend.model.Video;
import com.example.backend.repository.AnalyticsRepository;
import com.example.backend.repository.ChannelRepository;
import com.example.backend.repository.CommentRepository;
import com.example.backend.repository.VideoRepository;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DashboardService {
    
    private final ChannelRepository channelRepository;
    private final VideoRepository videoRepository;
    private final CommentRepository commentRepository;
    private final AnalyticsRepository analyticsRepository;
    
    @SuppressWarnings("ConstantConditions")
    public DashboardMetricsResponse getMetrics(Long userId, String channelIdentifier) {
        Channel channel = resolveChannel(userId, channelIdentifier);
        Long channelDbId = channel.getId();
        
        Integer videoCount = channel.getVideoCount();
        long totalVideos = videoCount != null ? videoCount.longValue() : 0L;
        if (totalVideos == 0) {
            totalVideos = videoRepository.countByChannelId(channelDbId);
        }
        Long viewCount = channel.getViewCount();
        long totalViews = viewCount != null ? viewCount : 0L;
        if (totalViews == 0) {
            totalViews = safeLong(videoRepository.sumViewCountByChannelId(channelDbId));
        }
        long totalLikes = safeLong(videoRepository.sumLikeCountByChannelId(channelDbId));
        long totalComments = safeLong(videoRepository.sumCommentCountByChannelId(channelDbId));
        if (totalComments == 0) {
            totalComments = commentRepository.countByChannelId(channelDbId);
        }
        
        // Lấy snapshot gần nhất (trước ngày hiện tại) để so sánh
        List<Analytics> previousSnapshots = analyticsRepository
            .findByChannelIdAndDateBeforeOrderByDateDesc(channelDbId, LocalDate.now(), PageRequest.of(0, 1));
        Optional<Analytics> previousSnapshot = previousSnapshots.isEmpty() 
            ? Optional.empty() 
            : Optional.of(previousSnapshots.get(0));
        
        // Tính toán comparison cho từng metric
        MetricsComparison viewsComparison = calculateComparison(
            totalViews,
            previousSnapshot.map(Analytics::getViewCount).orElse(null),
            previousSnapshot.map(Analytics::getDate).orElse(null)
        );
        
        MetricsComparison likesComparison = calculateComparison(
            totalLikes,
            previousSnapshot.map(Analytics::getLikeCount).orElse(null),
            previousSnapshot.map(Analytics::getDate).orElse(null)
        );
        
        MetricsComparison commentsComparison = calculateComparison(
            totalComments,
            previousSnapshot.map(a -> a.getCommentCount() != null ? a.getCommentCount().longValue() : null).orElse(null),
            previousSnapshot.map(Analytics::getDate).orElse(null)
        );
        
        MetricsComparison videosComparison = calculateComparison(
            totalVideos,
            previousSnapshot.map(a -> a.getVideoCount() != null ? a.getVideoCount().longValue() : null).orElse(null),
            previousSnapshot.map(Analytics::getDate).orElse(null)
        );
        
        // Lấy thời gian sync trước đó
        LocalDateTime previousSyncDateTime = previousSnapshot.map(a -> 
            a.getCreatedAt() != null ? a.getCreatedAt() : 
            LocalDateTime.of(a.getDate(), LocalTime.MIDNIGHT)
        ).orElse(null);
        
        return DashboardMetricsResponse.builder()
            .channelInternalId(channelDbId)
            .youtubeChannelId(channel.getChannelId())
            .channelName(channel.getChannelName())
            .avatarUrl(channel.getAvatarUrl())
            .subscriberCount(channel.getSubscriberCount())
            .syncedVideoCount(channel.getVideoCount())
            .lastSyncedAt(channel.getLastSyncedAt())
            .totalVideos(totalVideos)
            .totalViews(totalViews)
            .totalLikes(totalLikes)
            .totalComments(totalComments)
            .viewsComparison(viewsComparison)
            .likesComparison(likesComparison)
            .commentsComparison(commentsComparison)
            .videosComparison(videosComparison)
            .previousSyncDate(previousSyncDateTime)
            .build();
    }
    
    /**
     * Tính toán so sánh giữa giá trị hiện tại và giá trị trước đó
     */
    private MetricsComparison calculateComparison(
        Long currentValue, 
        Long previousValue, 
        LocalDate previousDate
    ) {
        if (previousValue == null || previousDate == null) {
            return MetricsComparison.builder()
                .currentValue(currentValue)
                .previousValue(null)
                .change(null)
                .changePercentage(null)
                .trend("stable")
                .daysSinceLastSync(null)
                .build();
        }
        
        long change = currentValue - previousValue;
        double changePercentage = previousValue > 0 
            ? ((double) change / previousValue) * 100.0 
            : (change > 0 ? 100.0 : 0.0);
        
        String trend = change > 0 ? "up" : (change < 0 ? "down" : "stable");
        long daysSince = ChronoUnit.DAYS.between(previousDate, LocalDate.now());
        
        return MetricsComparison.builder()
            .currentValue(currentValue)
            .previousValue(previousValue)
            .change(change)
            .changePercentage(Math.round(changePercentage * 100.0) / 100.0)
            .trend(trend)
            .daysSinceLastSync(daysSince)
            .build();
    }
    
    public DashboardTrendResponse getTrends(Long userId, String channelIdentifier, LocalDate startDate, LocalDate endDate) {
        Channel channel = resolveChannel(userId, channelIdentifier);
        
        LocalDate safeEnd = endDate != null ? endDate : LocalDate.now();
        LocalDate safeStart;
        
        if (startDate != null) {
            safeStart = startDate;
        } else {
            // Get first analytics entry date (first sync) as the starting point
            List<Analytics> allAnalytics = analyticsRepository.findByChannelIdOrderByDateAsc(channel.getId());
            if (!allAnalytics.isEmpty()) {
                safeStart = allAnalytics.get(0).getDate();
            } else {
                // Fallback to channel creation date if no analytics exist
                safeStart = channel.getCreatedAt() != null 
                    ? channel.getCreatedAt().toLocalDate() 
                    : safeEnd.minusDays(29);
            }
        }
        
        if (safeStart.isAfter(safeEnd)) {
            LocalDate tmp = safeStart;
            safeStart = safeEnd;
            safeEnd = tmp;
        }
        
        List<Analytics> analyticsEntries = analyticsRepository
            .findByChannelIdAndDateBetweenOrderByDateAsc(channel.getId(), safeStart, safeEnd);
        
        Map<LocalDate, Analytics> analyticsByDate = analyticsEntries.stream()
            .collect(Collectors.toMap(
                Analytics::getDate,
                analytics -> analytics,
                (a, b) -> a
            ));
        
        List<DashboardTrendResponse.TrendPoint> points = new ArrayList<>();
        LocalDate cursor = safeStart;
        while (!cursor.isAfter(safeEnd)) {
            Analytics dayAnalytics = analyticsByDate.get(cursor);
            points.add(
                DashboardTrendResponse.TrendPoint.builder()
                    .date(cursor)
                    .views(dayAnalytics != null ? safeLong(dayAnalytics.getViewCount()) : 0L)
                    .likes(dayAnalytics != null ? safeLong(dayAnalytics.getLikeCount()) : 0L)
                    .comments(dayAnalytics != null ? safeInt(dayAnalytics.getCommentCount()) : 0)
                    .build()
            );
            cursor = cursor.plusDays(1);
        }
        
        long prevViews = 0;
        long prevLikes = 0;
        int prevComments = 0;
        for (DashboardTrendResponse.TrendPoint point : points) {
            long cumulativeViews = safeLong(point.getViews());
            long cumulativeLikes = safeLong(point.getLikes());
            int cumulativeComments = safeInt(point.getComments());
            
            point.setViews(Math.max(0L, cumulativeViews - prevViews));
            point.setLikes(Math.max(0L, cumulativeLikes - prevLikes));
            point.setComments(Math.max(0, cumulativeComments - prevComments));
            
            prevViews = cumulativeViews;
            prevLikes = cumulativeLikes;
            prevComments = cumulativeComments;
        }
        
        return DashboardTrendResponse.builder()
            .youtubeChannelId(channel.getChannelId())
            .startDate(safeStart)
            .endDate(safeEnd)
            .points(points)
            .build();
    }
    
    public List<TopVideoResponse> getTopVideos(Long userId, String channelIdentifier, int limit) {
        Channel channel = resolveChannel(userId, channelIdentifier);
        int pageSize = Math.min(Math.max(limit, 1), 20);
        List<Video> videos = videoRepository.findTopEngagingVideosByChannelId(
            channel.getId(), PageRequest.of(0, pageSize));
        
        return videos.stream()
            .map(video -> TopVideoResponse.builder()
                .id(video.getId())
                .videoId(video.getVideoId())
                .title(video.getTitle())
                .thumbnailUrl(video.getThumbnailUrl())
                .viewCount(safeLong(video.getViewCount()))
                .likeCount(safeLong(video.getLikeCount()))
                .commentCount(safeInt(video.getCommentCount()))
                .publishedAt(video.getPublishedAt())
                .build())
            .toList();
    }
    
    public SentimentSummaryResponse getSentimentSummary(Long userId, String channelIdentifier) {
        Channel channel = resolveChannel(userId, channelIdentifier);
        Long channelDbId = channel.getId();
        long totalComments = commentRepository.countByChannelId(channelDbId);
        
        List<Object[]> sentimentRows = commentRepository.countSentimentByChannelId(channelDbId);
        long positive = 0;
        long negative = 0;
        long neutral = 0;
        for (Object[] row : sentimentRows) {
            String sentiment = (String) row[0];
            long count = row[1] instanceof Number ? ((Number) row[1]).longValue() : 0L;
            if ("positive".equalsIgnoreCase(sentiment)) {
                positive += count;
            } else if ("negative".equalsIgnoreCase(sentiment)) {
                negative += count;
            } else if ("neutral".equalsIgnoreCase(sentiment)) {
                neutral += count;
            }
        }
        
        double denominator = totalComments == 0 ? 1.0 : totalComments;
        return SentimentSummaryResponse.builder()
            .totalComments(totalComments)
            .positiveCount(positive)
            .negativeCount(negative)
            .neutralCount(neutral)
            .positiveRatio(roundRatio(positive / denominator))
            .negativeRatio(roundRatio(negative / denominator))
            .neutralRatio(roundRatio(neutral / denominator))
            .build();
    }
    
    public Channel resolveChannel(Long userId, String channelIdentifier) {
        Channel channel;
        if (channelIdentifier != null && !channelIdentifier.isBlank()) {
            channel = channelRepository.findByChannelId(channelIdentifier.trim())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy kênh với channelId đã cung cấp"));
        } else {
            channel = channelRepository.findFirstByUserIdOrderByUpdatedAtDesc(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Bạn chưa kết nối kênh YouTube nào"));
        }
        
        if (channel.getUser() == null || !Objects.equals(channel.getUser().getId(), userId)) {
            throw new UnauthorizedException("Bạn không có quyền truy cập kênh này");
        }
        return channel;
    }
    
    private long safeLong(Number value) {
        return value != null ? value.longValue() : 0L;
    }
    
    private int safeInt(Integer value) {
        return value != null ? value : 0;
    }
    
    private double roundRatio(double value) {
        return Math.round(value * 1000.0d) / 1000.0d;
    }
}