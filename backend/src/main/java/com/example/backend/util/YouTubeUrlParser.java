package com.example.backend.util;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Utility class để parse YouTube URLs và extract channel ID hoặc video ID
 */
public class YouTubeUrlParser {
    
    // Patterns cho các loại YouTube URL
    private static final Pattern CHANNEL_ID_PATTERN = 
        Pattern.compile("youtube\\.com/channel/([a-zA-Z0-9_-]+)");
    
    private static final Pattern CHANNEL_USER_PATTERN = 
        Pattern.compile("youtube\\.com/(?:c|user)/([a-zA-Z0-9_-]+)");
    
    private static final Pattern CHANNEL_HANDLE_PATTERN = 
        Pattern.compile("youtube\\.com/@([a-zA-Z0-9_-]+)");
    
    private static final Pattern VIDEO_PATTERN = 
        Pattern.compile("(?:youtube\\.com/watch\\?v=|youtu\\.be/)([a-zA-Z0-9_-]{11})");
    
    /**
     * Parse YouTube URL và trả về ParsedUrl object
     * 
     * @param url YouTube URL
     * @return ParsedUrl object chứa type và id
     * @throws IllegalArgumentException nếu URL không hợp lệ
     */
    public static ParsedUrl parse(String url) {
        if (url == null || url.trim().isEmpty()) {
            throw new IllegalArgumentException("URL cannot be null or empty");
        }
        
        url = url.trim();
        
        // Kiểm tra channel ID format
        Matcher channelIdMatcher = CHANNEL_ID_PATTERN.matcher(url);
        if (channelIdMatcher.find()) {
            return new ParsedUrl(ParsedUrl.Type.CHANNEL, channelIdMatcher.group(1));
        }
        
        // Kiểm tra channel user/c format
        Matcher channelUserMatcher = CHANNEL_USER_PATTERN.matcher(url);
        if (channelUserMatcher.find()) {
            // Note: Cần gọi YouTube API để convert username/custom URL thành channel ID
            return new ParsedUrl(ParsedUrl.Type.CHANNEL_USERNAME, channelUserMatcher.group(1));
        }
        
        // Kiểm tra channel handle format (@username)
        Matcher channelHandleMatcher = CHANNEL_HANDLE_PATTERN.matcher(url);
        if (channelHandleMatcher.find()) {
            return new ParsedUrl(ParsedUrl.Type.CHANNEL_HANDLE, channelHandleMatcher.group(1));
        }
        
        // Kiểm tra video format
        Matcher videoMatcher = VIDEO_PATTERN.matcher(url);
        if (videoMatcher.find()) {
            return new ParsedUrl(ParsedUrl.Type.VIDEO, videoMatcher.group(1));
        }
        
        throw new IllegalArgumentException("Invalid YouTube URL format: " + url);
    }
    
    /**
     * Validate xem URL có phải là YouTube URL hợp lệ không
     */
    public static boolean isValidYouTubeUrl(String url) {
        if (url == null || url.trim().isEmpty()) {
            return false;
        }
        
        return url.contains("youtube.com") || url.contains("youtu.be");
    }
    
    /**
     * Inner class để chứa kết quả parse
     */
    public static class ParsedUrl {
        private final Type type;
        private final String id;
        
        public ParsedUrl(Type type, String id) {
            this.type = type;
            this.id = id;
        }
        
        public Type getType() {
            return type;
        }
        
        public String getId() {
            return id;
        }
        
        public enum Type {
            CHANNEL,           // youtube.com/channel/UCxxxxx
            CHANNEL_USERNAME,   // youtube.com/c/ChannelName hoặc youtube.com/user/username
            CHANNEL_HANDLE,    // youtube.com/@username
            VIDEO              // youtube.com/watch?v=xxxxx hoặc youtu.be/xxxxx
        }
    }
}

