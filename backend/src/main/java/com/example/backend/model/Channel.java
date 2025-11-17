package com.example.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "channels")
@Data
public class Channel {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @Column(name = "channel_id", unique = true, nullable = false)
    private String channelId;
    
    @Column(name = "channel_name", nullable = false)
    private String channelName;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    @Column(name = "avatar_url")
    private String avatarUrl;
    
    @Column(name = "subscriber_count")
    private Long subscriberCount;
    
    @Column(name = "video_count")
    private Integer videoCount;
    
    @Column(name = "view_count")
    private Long viewCount;
    
    @Column(name = "uploads_playlist_id")
    private String uploadsPlaylistId;
    
    @Column(name = "last_synced_at")
    private LocalDateTime lastSyncedAt;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}

