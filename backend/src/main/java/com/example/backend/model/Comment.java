package com.example.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "comments")
@Data
public class Comment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "video_id", nullable = false)
    private Video video;
    
    @Column(name = "comment_id", unique = true, nullable = false)
    private String commentId;
    
    @Column(name = "parent_comment_id")
    private String parentCommentId;
    
    @Column(name = "author_name", nullable = false)
    private String authorName;
    
    @Column(name = "author_avatar")
    private String authorAvatar;
    
    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;
    
    @Column(name = "like_count")
    private Integer likeCount;
    
    @Column(length = 20)
    private String sentiment; // positive, negative, neutral
    
    @Column(length = 50)
    private String emotion; // happy, sad, angry, suggestion, love
    
    @Column(name = "sentiment_score", precision = 5, scale = 4)
    private BigDecimal sentimentScore;
    
    @Column(name = "is_analyzed")
    private Boolean isAnalyzed;
    
    @Column(name = "analyzed_at")
    private LocalDateTime analyzedAt;
    
    @Column(name = "published_at")
    private LocalDateTime publishedAt;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (isAnalyzed == null) {
            isAnalyzed = false;
        }
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}

