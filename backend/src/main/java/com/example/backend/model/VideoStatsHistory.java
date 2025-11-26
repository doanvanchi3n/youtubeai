package com.example.backend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.Data;

@Entity
@Table(name = "video_stats_history",
    indexes = {
        @Index(name = "idx_history_video", columnList = "video_id"),
        @Index(name = "idx_history_video_ts", columnList = "video_id, snapshot_time")
    })
@Data
public class VideoStatsHistory {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "video_id", nullable = false)
    private Video video;
    
    @Column(name = "snapshot_time", nullable = false)
    private LocalDateTime snapshotTime;
    
    @Column(name = "view_count", nullable = false)
    private Long viewCount;
    
    @Column(name = "like_count", nullable = false)
    private Long likeCount;
    
    @Column(name = "comment_count", nullable = false)
    private Integer commentCount;
    
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}

