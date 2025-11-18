package com.example.backend.service;

import com.example.backend.dto.youtube.YouTubeChannelInfo;
import com.example.backend.dto.youtube.YouTubeCommentInfo;
import com.example.backend.dto.youtube.YouTubeVideoInfo;
import com.example.backend.exception.ResourceNotFoundException;
import com.example.backend.exception.YouTubeApiException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class YouTubeApiService {
    
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final RestTemplate restTemplate = new RestTemplate();
    
    @Value("${youtube.api.key}")
    private String apiKey;
    
    @Value("${youtube.api.base-url:https://www.googleapis.com/youtube/v3}")
    private String baseUrl;
    
    @Value("${youtube.api.quota-buffer:100}")
    private int quotaBuffer;
    
    public YouTubeChannelInfo getChannelById(String channelId) {
        JsonNode root = executeGet("/channels", Map.of(
            "part", "snippet,statistics,contentDetails",
            "id", channelId
        ));
        JsonNode items = root.path("items");
        if (!items.isArray() || items.isEmpty()) {
            throw new ResourceNotFoundException("Không tìm thấy kênh YouTube với channelId: " + channelId);
        }
        return parseChannel(items.get(0));
    }
    
    public YouTubeChannelInfo getChannelByHandle(String handle) {
        JsonNode root = executeGet("/channels", Map.of(
            "part", "snippet,statistics,contentDetails",
            "forHandle", handle.startsWith("@") ? handle : "@" + handle
        ));
        JsonNode items = root.path("items");
        if (!items.isArray() || items.isEmpty()) {
            throw new ResourceNotFoundException("Không tìm thấy kênh với handle: " + handle);
        }
        return parseChannel(items.get(0));
    }
    
    public YouTubeChannelInfo getChannelByUsername(String username) {
        JsonNode root = executeGet("/channels", Map.of(
            "part", "snippet,statistics,contentDetails",
            "forUsername", username
        ));
        JsonNode items = root.path("items");
        if (!items.isArray() || items.isEmpty()) {
            throw new ResourceNotFoundException("Không tìm thấy kênh với username: " + username);
        }
        return parseChannel(items.get(0));
    }
    
    public YouTubeVideoInfo getVideoById(String videoId) {
        List<YouTubeVideoInfo> videos = getVideosByIds(Collections.singletonList(videoId));
        if (videos.isEmpty()) {
            throw new ResourceNotFoundException("Không tìm thấy video với ID: " + videoId);
        }
        return videos.get(0);
    }
    
    public List<YouTubeVideoInfo> getVideosByChannel(String channelId, int maxResults) {
        int remaining = Math.max(1, maxResults);
        String pageToken = null;
        List<String> videoIds = new ArrayList<>();
        int guard = 0;
        
        while (remaining > 0 && guard++ < 10) {
            int requestSize = Math.min(remaining, 50);
            Map<String, String> params = new LinkedHashMap<>();
            params.put("part", "id");
            params.put("channelId", channelId);
            params.put("maxResults", String.valueOf(requestSize));
            params.put("order", "date");
            params.put("type", "video");
            params.put("fields", "items(id/videoId),nextPageToken");
            if (StringUtils.hasText(pageToken)) {
                params.put("pageToken", pageToken);
            }
            JsonNode root = executeGet("/search", params);
            JsonNode items = root.path("items");
            if (items.isArray()) {
                items.forEach(item -> {
                    String videoId = item.path("id").path("videoId").asText(null);
                    if (StringUtils.hasText(videoId)) {
                        videoIds.add(videoId);
                    }
                });
            }
            pageToken = root.path("nextPageToken").asText(null);
            if (!StringUtils.hasText(pageToken)) {
                break;
            }
            remaining = maxResults - videoIds.size();
        }
        if (videoIds.isEmpty()) {
            return List.of();
        }
        return getVideosByIds(videoIds);
    }
    
    public List<YouTubeVideoInfo> getAllVideosFromUploads(String uploadsPlaylistId, int maxVideos) {
        if (!StringUtils.hasText(uploadsPlaylistId)) {
            return List.of();
        }
        List<String> videoIds = new ArrayList<>();
        String pageToken = null;
        int guard = 0;
        while (guard++ < 1000) {
            Map<String, String> params = new LinkedHashMap<>();
            params.put("part", "contentDetails");
            params.put("playlistId", uploadsPlaylistId);
            params.put("maxResults", "50");
            if (StringUtils.hasText(pageToken)) {
                params.put("pageToken", pageToken);
            }
            JsonNode root = executeGet("/playlistItems", params);
            JsonNode items = root.path("items");
            if (items.isArray()) {
                for (JsonNode item : items) {
                    String videoId = item.path("contentDetails").path("videoId").asText(null);
                    if (StringUtils.hasText(videoId)) {
                        videoIds.add(videoId);
                    }
                }
            }
            if (maxVideos > 0 && videoIds.size() >= maxVideos) {
                return getVideosByIds(new ArrayList<>(videoIds.subList(0, maxVideos)));
            }
            pageToken = root.path("nextPageToken").asText(null);
            if (!StringUtils.hasText(pageToken)) {
                break;
            }
        }
        if (videoIds.isEmpty()) {
            return List.of();
        }
        return getVideosByIds(videoIds);
    }
    
    private List<YouTubeVideoInfo> getVideosByIds(List<String> ids) {
        List<YouTubeVideoInfo> results = new ArrayList<>();
        int start = 0;
        while (start < ids.size()) {
            int end = Math.min(ids.size(), start + 50);
            List<String> batch = ids.subList(start, end);
            Map<String, String> params = new LinkedHashMap<>();
            params.put("part", "snippet,statistics,contentDetails");
            params.put("id", String.join(",", batch));
            JsonNode root = executeGet("/videos", params);
            JsonNode items = root.path("items");
            if (items.isArray()) {
                items.forEach(item -> results.add(parseVideo(item)));
            }
            start = end;
        }
        return results;
    }
    
    private JsonNode executeGet(String path, Map<String, String> params) {
        if (!StringUtils.hasText(apiKey)) {
            throw new YouTubeApiException("Chưa cấu hình youtube.api.key trong application.properties");
        }
        UriComponentsBuilder builder = UriComponentsBuilder.fromHttpUrl(baseUrl + path);
        params.forEach(builder::queryParam);
        builder.queryParam("key", apiKey);
        try {
            String response = restTemplate.getForObject(builder.toUriString(), String.class);
            return objectMapper.readTree(response);
        } catch (RestClientException ex) {
            log.error("Lỗi khi gọi YouTube API {} với params {}: {}", path, params, ex.getMessage());
            throw new YouTubeApiException("Không thể kết nối tới YouTube API", ex);
        } catch (IOException ex) {
            throw new YouTubeApiException("Không parse được phản hồi YouTube API", ex);
        }
    }
    
    private YouTubeChannelInfo parseChannel(JsonNode node) {
        JsonNode snippet = node.path("snippet");
        JsonNode statistics = node.path("statistics");
        JsonNode contentDetails = node.path("contentDetails");
        
        return YouTubeChannelInfo.builder()
            .channelId(node.path("id").asText())
            .title(snippet.path("title").asText())
            .description(snippet.path("description").asText(null))
            .thumbnailUrl(snippet.path("thumbnails").path("high").path("url").asText(
                snippet.path("thumbnails").path("default").path("url").asText(null)
            ))
            .subscriberCount(statistics.has("subscriberCount") ? statistics.path("subscriberCount").asLong() : null)
            .viewCount(statistics.has("viewCount") ? statistics.path("viewCount").asLong() : null)
            .videoCount(statistics.has("videoCount") ? statistics.path("videoCount").asInt() : null)
            .uploadsPlaylistId(contentDetails.path("relatedPlaylists").path("uploads").asText(null))
            .build();
    }
    
    private YouTubeVideoInfo parseVideo(JsonNode node) {
        JsonNode snippet = node.path("snippet");
        JsonNode statistics = node.path("statistics");
        JsonNode contentDetails = node.path("contentDetails");
        LocalDateTime publishedAt = null;
        try {
            String publishedRaw = snippet.path("publishedAt").asText(null);
            if (StringUtils.hasText(publishedRaw)) {
                publishedAt = OffsetDateTime.parse(publishedRaw).toLocalDateTime();
            }
        } catch (DateTimeParseException ignored) {
        }
        
        Integer durationSeconds = null;
        String durationRaw = contentDetails.path("duration").asText(null);
        if (StringUtils.hasText(durationRaw)) {
            try {
                durationSeconds = (int) Duration.parse(durationRaw).getSeconds();
            } catch (DateTimeParseException ignored) {
            }
        }
        
        Long likeCount = statistics.has("likeCount") ? statistics.path("likeCount").asLong() : null;
        Integer commentCount = statistics.has("commentCount") ? statistics.path("commentCount").asInt() : null;
        Long viewCount = statistics.has("viewCount") ? statistics.path("viewCount").asLong() : null;
        
        return YouTubeVideoInfo.builder()
            .videoId(node.path("id").asText())
            .channelId(snippet.path("channelId").asText())
            .title(snippet.path("title").asText())
            .description(snippet.path("description").asText(null))
            .thumbnailUrl(snippet.path("thumbnails").path("high").path("url").asText(
                snippet.path("thumbnails").path("default").path("url").asText(null)
            ))
            .publishedAt(publishedAt)
            .durationSeconds(durationSeconds)
            .viewCount(viewCount)
            .likeCount(likeCount)
            .commentCount(commentCount)
            .build();
    }
    
    public List<YouTubeCommentInfo> getComments(String videoId, int maxComments) {
        if (maxComments == 0) {
            return List.of();
        }
        List<YouTubeCommentInfo> comments = new ArrayList<>();
        String pageToken = null;
        int guard = 0;
        while (guard++ < 1000) {
            Map<String, String> params = new LinkedHashMap<>();
            params.put("part", "snippet,replies");
            params.put("videoId", videoId);
            params.put("maxResults", "50");
            params.put("textFormat", "plainText");
            if (StringUtils.hasText(pageToken)) {
                params.put("pageToken", pageToken);
            }
            JsonNode root = executeGet("/commentThreads", params);
            JsonNode items = root.path("items");
            if (items.isArray()) {
                for (JsonNode item : items) {
                    JsonNode threadSnippet = item.path("snippet");
                    JsonNode topCommentNode = threadSnippet.path("topLevelComment");
                    JsonNode topCommentSnippet = topCommentNode.path("snippet");
                    String topCommentId = topCommentNode.path("id").asText(null);
                    if (StringUtils.hasText(topCommentId)) {
                        comments.add(parseComment(videoId, topCommentId, null, topCommentSnippet));
                    }
                    JsonNode replies = item.path("replies").path("comments");
                    if (replies.isArray()) {
                        for (JsonNode replyNode : replies) {
                            String replyId = replyNode.path("id").asText(null);
                            if (StringUtils.hasText(replyId)) {
                                comments.add(parseComment(videoId, replyId, topCommentId, replyNode.path("snippet")));
                            }
                        }
                    }
                }
            }
            if (maxComments > 0 && comments.size() >= maxComments) {
                return new ArrayList<>(comments.subList(0, maxComments));
            }
            pageToken = root.path("nextPageToken").asText(null);
            if (!StringUtils.hasText(pageToken)) {
                break;
            }
        }
        return comments;
    }
    
    private YouTubeCommentInfo parseComment(String videoId, String commentId, String parentCommentId, JsonNode snippet) {
        LocalDateTime publishedAt = null;
        try {
            String raw = snippet.path("publishedAt").asText(null);
            if (StringUtils.hasText(raw)) {
                publishedAt = OffsetDateTime.parse(raw).toLocalDateTime();
            }
        } catch (DateTimeParseException ignored) {
        }
        return YouTubeCommentInfo.builder()
            .commentId(commentId)
            .videoId(videoId)
            .parentCommentId(parentCommentId)
            .authorName(snippet.path("authorDisplayName").asText(null))
            .authorAvatar(snippet.path("authorProfileImageUrl").asText(null))
            .textDisplay(snippet.path("textDisplay").asText(null))
            .likeCount(snippet.path("likeCount").isNumber() ? snippet.path("likeCount").asInt() : null)
            .publishedAt(publishedAt)
            .build();
    }
    
    public boolean hasQuotaBuffer(long estimatedCost) {
        // Placeholder logic for future enhancement when tracking usage
        return estimatedCost <= quotaBuffer;
    }
}
