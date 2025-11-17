package com.example.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "keywords")
@Data
public class Keyword {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "channel_id", nullable = false)
    private Channel channel;
    
    @Column(nullable = false)
    private String keyword;
    
    private Integer frequency;
    
    @Column(name = "first_mentioned_at")
    private LocalDateTime firstMentionedAt;
    
    @Column(name = "last_mentioned_at")
    private LocalDateTime lastMentionedAt;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (frequency == null) {
            frequency = 1;
        }
        if (firstMentionedAt == null) {
            firstMentionedAt = LocalDateTime.now();
        }
        if (lastMentionedAt == null) {
            lastMentionedAt = LocalDateTime.now();
        }
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
        lastMentionedAt = LocalDateTime.now();
    }
}

