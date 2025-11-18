package com.example.backend.service;

import com.example.backend.dto.response.AnalyzeUrlResponse;
import com.example.backend.dto.youtube.YouTubeChannelInfo;
import com.example.backend.dto.youtube.YouTubeCommentInfo;
import com.example.backend.dto.youtube.YouTubeVideoInfo;
import com.example.backend.exception.BadRequestException;
import com.example.backend.exception.ResourceNotFoundException;
import com.example.backend.model.Analytics;
import com.example.backend.model.Channel;
import com.example.backend.model.Comment;
import com.example.backend.model.User;
import com.example.backend.model.Video;
import com.example.backend.repository.AnalyticsRepository;
import com.example.backend.repository.ChannelRepository;
import com.example.backend.repository.CommentRepository;
import com.example.backend.repository.UserRepository;
import com.example.backend.repository.VideoRepository;
import com.example.backend.util.YouTubeUrlParser;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
@Slf4j
public class YouTubeAnalysisService {
    
    private final YouTubeApiService youTubeApiService;
    private final ChannelRepository channelRepository;
    private final VideoRepository videoRepository;
    private final AnalyticsRepository analyticsRepository;
    private final UserRepository userRepository;
    private final CommentRepository commentRepository;
    
    @Value("${youtube.sync.max-videos:0}")
    private int maxVideosToSync;
    
    @Value("${youtube.sync.comments-per-video:0}")
    private int maxCommentsPerVideo;
    
    @Value("${youtube.sync.fetch-comments.analyze:true}")
    private boolean fetchCommentsOnAnalyze;
    
    @Transactional
    public AnalyzeUrlResponse analyzeUrl(Long userId, String url) {
        if (!StringUtils.hasText(url)) {
            throw new BadRequestException("URL không được để trống");
        }
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng"));
        
        YouTubeUrlParser.ParsedUrl parsedUrl;
        try {
            parsedUrl = YouTubeUrlParser.parse(url);
        } catch (IllegalArgumentException ex) {
            throw new BadRequestException("URL YouTube không hợp lệ");
        }
        
        YouTubeChannelInfo channelInfo;
        switch (parsedUrl.getType()) {
            case CHANNEL -> channelInfo = youTubeApiService.getChannelById(parsedUrl.getId());
            case CHANNEL_HANDLE -> channelInfo = youTubeApiService.getChannelByHandle(parsedUrl.getId());
            case CHANNEL_USERNAME -> channelInfo = youTubeApiService.getChannelByUsername(parsedUrl.getId());
            case VIDEO -> throw new BadRequestException("Vui lòng dán URL của kênh YouTube, không hỗ trợ URL video.");
            default -> throw new BadRequestException("Không hỗ trợ loại URL này");
        }
        
        Channel channel = upsertChannel(user, channelInfo);
        
        List<YouTubeVideoInfo> videos = fetchChannelVideos(channelInfo);
        syncChannelData(channel, channelInfo, videos, fetchCommentsOnAnalyze);
        
        log.info("Đã đồng bộ {} video cho channel {}", videos.size(), channelInfo.getChannelId());
        
        return AnalyzeUrlResponse.builder()
            .channelInternalId(channel.getId())
            .channelId(channel.getChannelId())
            .channelName(channel.getChannelName())
            .status("success")
            .message("Đồng bộ dữ liệu thành công")
            .build();
    }
    
    private Channel upsertChannel(User user, YouTubeChannelInfo info) {
        Channel channel = channelRepository.findByChannelId(info.getChannelId())
            .orElseGet(Channel::new);
        channel.setUser(user);
        channel.setChannelId(info.getChannelId());
        channel.setChannelName(info.getTitle());
        channel.setDescription(info.getDescription());
        channel.setAvatarUrl(info.getThumbnailUrl());
        channel.setSubscriberCount(info.getSubscriberCount());
        channel.setViewCount(info.getViewCount());
        if (info.getVideoCount() != null) {
            channel.setVideoCount(info.getVideoCount());
        }
        channel.setUploadsPlaylistId(info.getUploadsPlaylistId());
        return channelRepository.save(channel);
    }
    
    @Transactional
    public void refreshChannel(Channel channel, boolean includeComments) {
        YouTubeChannelInfo channelInfo = youTubeApiService.getChannelById(channel.getChannelId());
        List<YouTubeVideoInfo> videos = fetchChannelVideos(channelInfo);
        syncChannelData(channel, channelInfo, videos, includeComments);
    }
    
    private List<YouTubeVideoInfo> fetchChannelVideos(YouTubeChannelInfo channelInfo) {
        if (StringUtils.hasText(channelInfo.getUploadsPlaylistId())) {
            return youTubeApiService.getAllVideosFromUploads(channelInfo.getUploadsPlaylistId(), maxVideosToSync);
        }
        int limit = maxVideosToSync > 0 ? maxVideosToSync : 50;
        return youTubeApiService.getVideosByChannel(channelInfo.getChannelId(), limit);
    }
    
    private void syncChannelData(Channel channel, YouTubeChannelInfo channelInfo,
                                 List<YouTubeVideoInfo> videos, boolean includeComments) {
        List<Video> persistedVideos = storeVideos(channel, videos);
        boolean shouldFetchComments = includeComments && maxCommentsPerVideo != 0;
        if (shouldFetchComments) {
            persistedVideos.forEach(video -> {
                List<YouTubeCommentInfo> comments = youTubeApiService.getComments(
                    video.getVideoId(), maxCommentsPerVideo);
                storeComments(video, comments);
            });
        }
        updateAnalytics(channel, videos, channelInfo);
    }
    
    private List<Video> storeVideos(Channel channel, List<YouTubeVideoInfo> videos) {
        List<Video> persisted = new java.util.ArrayList<>();
        videos.forEach(videoInfo -> {
            Video video = videoRepository.findByVideoId(videoInfo.getVideoId())
                .orElseGet(Video::new);
            video.setChannel(channel);
            video.setVideoId(videoInfo.getVideoId());
            video.setTitle(videoInfo.getTitle());
            video.setDescription(videoInfo.getDescription());
            video.setThumbnailUrl(videoInfo.getThumbnailUrl());
            video.setDuration(videoInfo.getDurationSeconds());
            video.setViewCount(videoInfo.getViewCount());
            video.setLikeCount(videoInfo.getLikeCount());
            video.setCommentCount(videoInfo.getCommentCount());
            video.setPublishedAt(videoInfo.getPublishedAt());
            persisted.add(videoRepository.save(video));
        });
        return persisted;
    }
    
    private void storeComments(Video video, List<YouTubeCommentInfo> comments) {
        comments.forEach(commentInfo -> {
            if (commentRepository.findByCommentId(commentInfo.getCommentId()).isPresent()) {
                return;
            }
            Comment comment = new Comment();
            comment.setVideo(video);
            comment.setCommentId(commentInfo.getCommentId());
            comment.setParentCommentId(commentInfo.getParentCommentId());
            comment.setAuthorName(commentInfo.getAuthorName());
            comment.setAuthorAvatar(commentInfo.getAuthorAvatar());
            comment.setContent(commentInfo.getTextDisplay());
            comment.setLikeCount(commentInfo.getLikeCount());
            comment.setPublishedAt(commentInfo.getPublishedAt());
            commentRepository.save(comment);
        });
    }
    
    private void updateAnalytics(Channel channel, List<YouTubeVideoInfo> videos, YouTubeChannelInfo info) {
        Long infoViews = info.getViewCount();
        long totalViews = infoViews != null ? infoViews.longValue() : videos.stream()
            .map(YouTubeVideoInfo::getViewCount)
            .filter(Objects::nonNull)
            .mapToLong(Long::longValue)
            .sum();
        long totalLikes = videos.stream()
            .map(YouTubeVideoInfo::getLikeCount)
            .filter(Objects::nonNull)
            .mapToLong(Long::longValue)
            .sum();
        int totalComments = videos.stream()
            .map(YouTubeVideoInfo::getCommentCount)
            .filter(Objects::nonNull)
            .mapToInt(Integer::intValue)
            .sum();
        
        Analytics analytics = analyticsRepository
            .findByChannelIdAndDate(channel.getId(), LocalDate.now())
            .orElseGet(Analytics::new);
        analytics.setChannel(channel);
        analytics.setDate(LocalDate.now());
        analytics.setViewCount(totalViews);
        analytics.setLikeCount(totalLikes);
        analytics.setCommentCount(totalComments);
        analytics.setSubscriberCount(info.getSubscriberCount());
        analytics.setVideoCount(info.getVideoCount());
        analyticsRepository.save(analytics);
        
        channel.setViewCount(info.getViewCount());
        channel.setSubscriberCount(info.getSubscriberCount());
        channel.setVideoCount(info.getVideoCount());
        channelRepository.save(channel);
    }
    
    public List<YouTubeVideoInfo> getCachedTopVideos(Channel channel) {
        List<YouTubeVideoInfo> infos = new ArrayList<>();
        videoRepository.findByChannelId(channel.getId()).forEach(video -> {
            infos.add(YouTubeVideoInfo.builder()
                .videoId(video.getVideoId())
                .channelId(channel.getChannelId())
                .title(video.getTitle())
                .description(video.getDescription())
                .thumbnailUrl(video.getThumbnailUrl())
                .publishedAt(video.getPublishedAt())
                .durationSeconds(video.getDuration())
                .viewCount(video.getViewCount())
                .likeCount(video.getLikeCount())
                .commentCount(video.getCommentCount())
                .build());
        });
        
        infos.sort((left, right) -> Long.compare(
            engagementScore(right),
            engagementScore(left)
        ));
        return infos;
    }
    
    private long engagementScore(YouTubeVideoInfo video) {
        Long likeValue = video.getLikeCount();
        Integer commentValue = video.getCommentCount();
        long likes = likeValue != null ? likeValue.longValue() : 0L;
        long comments = commentValue != null ? commentValue.longValue() : 0L;
        return likes + comments;
    }
}

