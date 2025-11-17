package com.example.backend.util;

public class Constants {
    // JWT
    public static final long JWT_EXPIRATION = 86400000; // 24 hours
    
    // YouTube API
    public static final int YOUTUBE_API_QUOTA_LIMIT = 10000;
    
    // Data freshness (in hours)
    public static final int DATA_FRESHNESS_HOURS = 24;
    
    // Pagination
    public static final int DEFAULT_PAGE_SIZE = 20;
    public static final int MAX_PAGE_SIZE = 100;
    
    // Private constructor to prevent instantiation
    private Constants() {
    }
}

