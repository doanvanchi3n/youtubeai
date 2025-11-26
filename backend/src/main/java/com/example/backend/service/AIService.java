package com.example.backend.service;

import com.example.backend.dto.request.AISuggestionRequest;
import com.example.backend.dto.response.AISuggestionResponse;
import com.example.backend.dto.youtube.YouTubeVideoInfo;
import com.example.backend.exception.BadRequestException;
import com.example.backend.exception.ResourceNotFoundException;
import com.example.backend.model.Channel;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

@Service
@RequiredArgsConstructor
@Slf4j
public class AIService {
    
    private final RestTemplate restTemplate;
    private final DashboardService dashboardService;
    private final YouTubeAnalysisService youTubeAnalysisService;
    private final YouTubeApiService youTubeApiService;
    
    @Value("${ai.module.url:http://localhost:5000}")
    private String aiModuleUrl;
    
    public AISuggestionResponse generateSuggestions(Long userId, AISuggestionRequest request) {
        List<String> keywords = sanitizeKeywords(Optional.ofNullable(request.getKeywords()).orElse(List.of()));
        String description = Optional.ofNullable(request.getDescription())
            .map(String::trim)
            .filter(StringUtils::hasText)
            .orElse(null);
        
        Channel channel = resolveChannelIfNeeded(userId, request);
        if (keywords.isEmpty() && description == null && channel == null) {
            throw new BadRequestException("Vui lòng nhập từ khóa, mô tả hoặc bật chế độ dùng dữ liệu kênh YouTube.");
        }
        
        List<YouTubeVideoInfo> videoContext = channel != null
            ? loadVideoContext(channel, request)
            : Collections.emptyList();
        
        Map<String, Object> payload = buildPayload(request, keywords, description, channel, videoContext);
        AiModuleSuggestionResponse aiResponse = callAiModule(payload);
        
        return buildResponse(aiResponse, keywords, channel, videoContext);
    }
    
    private Channel resolveChannelIfNeeded(Long userId, AISuggestionRequest request) {
        boolean needChannel = request.isUseChannelContext() || StringUtils.hasText(request.getChannelId());
        if (!needChannel) {
            return null;
        }
        try {
            return dashboardService.resolveChannel(userId, request.getChannelId());
        } catch (ResourceNotFoundException ex) {
            throw new BadRequestException("Không tìm thấy kênh YouTube. Vui lòng đồng bộ kênh trước.");
        }
    }
    
    private List<YouTubeVideoInfo> loadVideoContext(Channel channel, AISuggestionRequest request) {
        int limit = clampSampleLimit(request.getSampleVideoLimit());
        List<YouTubeVideoInfo> videos = new ArrayList<>();
        List<YouTubeVideoInfo> cached = youTubeAnalysisService.getCachedTopVideos(channel);
        if (cached != null) {
            videos.addAll(cached.stream().limit(limit).toList());
        }
        boolean needsYoutubeFetch = request.isFetchYouTubeContext() || videos.isEmpty();
        if (needsYoutubeFetch) {
            try {
                List<YouTubeVideoInfo> remote = youTubeApiService.getVideosByChannel(channel.getChannelId(), limit);
                videos.clear();
                videos.addAll(remote.stream().limit(limit).toList());
            } catch (Exception ex) {
                log.warn("Không thể tải dữ liệu video mới từ YouTube API: {}", ex.getMessage());
            }
        }
        return videos.stream().limit(limit).collect(Collectors.toList());
    }
    
    private Map<String, Object> buildPayload(
        AISuggestionRequest request,
        List<String> keywords,
        String description,
        Channel channel,
        List<YouTubeVideoInfo> videos
    ) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("keywords", keywords);
        if (description != null) {
            payload.put("description", description);
        }
        payload.put("locale", StringUtils.hasText(request.getLocale()) ? request.getLocale() : "vi-VN");
        if (channel != null) {
            payload.put("channel", buildChannelMap(channel));
        }
        payload.put("videos", videos.stream()
            .map(this::buildVideoMap)
            .collect(Collectors.toList()));
        return payload;
    }
    
    private Map<String, Object> buildChannelMap(Channel channel) {
        Map<String, Object> map = new HashMap<>();
        map.put("title", channel.getChannelName());
        map.put("description", channel.getDescription());
        map.put("subscriberCount", channel.getSubscriberCount());
        map.put("viewCount", channel.getViewCount());
        return map;
    }
    
    private Map<String, Object> buildVideoMap(YouTubeVideoInfo info) {
        Map<String, Object> map = new HashMap<>();
        map.put("title", info.getTitle());
        map.put("description", info.getDescription());
        map.put("tags", info.getTags());
        map.put("views", info.getViewCount());
        map.put("likes", info.getLikeCount());
        map.put("comments", info.getCommentCount());
        map.put("publishedAt", info.getPublishedAt() != null ? info.getPublishedAt().toString() : null);
        return map;
    }
    
    private AiModuleSuggestionResponse callAiModule(Map<String, Object> payload) {
        String endpoint = aiModuleUrl.endsWith("/")
            ? aiModuleUrl + "api/generate-suggestions"
            : aiModuleUrl + "/api/generate-suggestions";
        try {
            AiModuleSuggestionResponse response = restTemplate.postForObject(
                endpoint, payload, AiModuleSuggestionResponse.class);
            if (response == null) {
                throw new BadRequestException("AI Module không trả về dữ liệu.");
            }
            return response;
        } catch (RestClientException ex) {
            log.error("Lỗi khi gọi AI Module: {}", ex.getMessage(), ex);
            throw new BadRequestException("Không thể kết nối tới AI Module. Vui lòng thử lại sau.");
        }
    }
    
    private AISuggestionResponse buildResponse(
        AiModuleSuggestionResponse aiResponse,
        List<String> keywords,
        Channel channel,
        List<YouTubeVideoInfo> videos
    ) {
        AISuggestionResponse.TrendInsight trendInsight = AISuggestionResponse.TrendInsight.builder()
            .google(Optional.ofNullable(aiResponse.getTrends()).map(TrendSection::getGoogle).orElse(List.of()))
            .youtube(Optional.ofNullable(aiResponse.getTrends()).map(TrendSection::getYoutube).orElse(List.of()))
            .build();
        
        AISuggestionResponse.ChannelBrief channelBrief = null;
        if (channel != null) {
            channelBrief = AISuggestionResponse.ChannelBrief.builder()
                .name(channel.getChannelName())
                .description(channel.getDescription())
                .subscriberCount(channel.getSubscriberCount())
                .viewCount(channel.getViewCount())
                .build();
        }
        
        List<AISuggestionResponse.SourceVideo> sourceVideos = videos.stream()
            .limit(6)
            .map(this::toSourceVideo)
            .toList();
        
        AISuggestionResponse.ContextSnapshot contextSnapshot = AISuggestionResponse.ContextSnapshot.builder()
            .keywords(keywords)
            .channel(channelBrief)
            .videos(sourceVideos)
            .build();
        
        return AISuggestionResponse.builder()
            .titles(Optional.ofNullable(aiResponse.getTitles()).orElse(List.of()))
            .description(Optional.ofNullable(aiResponse.getDescription()).orElse(""))
            .hashtags(Optional.ofNullable(aiResponse.getHashtags()).orElse(List.of()))
            .topics(Optional.ofNullable(aiResponse.getTopics()).orElse(List.of()))
            .trends(trendInsight)
            .context(contextSnapshot)
            .generatedAt(aiResponse.getGeneratedAt())
            .build();
    }
    
    private AISuggestionResponse.SourceVideo toSourceVideo(YouTubeVideoInfo info) {
        return AISuggestionResponse.SourceVideo.builder()
            .title(info.getTitle())
            .description(info.getDescription())
            .tags(info.getTags())
            .views(info.getViewCount())
            .likes(info.getLikeCount())
            .comments(info.getCommentCount())
            .publishedAt(info.getPublishedAt())
            .build();
    }
    
    private List<String> sanitizeKeywords(List<String> keywords) {
        if (keywords == null) {
            return List.of();
        }
        List<String> normalized = new ArrayList<>();
        for (String keyword : keywords) {
            if (!StringUtils.hasText(keyword)) {
                continue;
            }
            String trimmed = keyword.trim();
            boolean exists = normalized.stream()
                .anyMatch(existing -> existing.equalsIgnoreCase(trimmed));
            if (!exists) {
                normalized.add(trimmed);
            }
            if (normalized.size() >= 25) {
                break;
            }
        }
        return normalized;
    }
    
    private int clampSampleLimit(Integer requested) {
        if (requested == null || requested <= 0) {
            return 6;
        }
        return Math.min(requested, 15);
    }
    
    @Data
    private static class AiModuleSuggestionResponse {
        private List<String> titles;
        private String description;
        private List<String> hashtags;
        private List<String> topics;
        private TrendSection trends;
        private String generatedAt;
    }
    
    @Data
    private static class TrendSection {
        private List<String> google;
        private List<String> youtube;
    }
}

