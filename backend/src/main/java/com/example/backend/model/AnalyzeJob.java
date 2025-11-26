package com.example.backend.model;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Table(name = "analyze_jobs")
@Data
public class AnalyzeJob {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @Column(nullable = false, length = 1024)
    private String url;
    
    @Column(name = "channel_id")
    private String channelId;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AnalyzeJobStatus status = AnalyzeJobStatus.PENDING;
    
    @Column(nullable = false)
    private Integer progress = 0;
    
    @Column(length = 500)
    private String message;
    
    @Column(length = 2000)
    private String error;
    
    @Column(name = "started_at")
    private LocalDateTime startedAt;
    
    @Column(name = "finished_at")
    private LocalDateTime finishedAt;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    public void markRunning() {
        this.status = AnalyzeJobStatus.RUNNING;
        this.progress = Math.max(progress, 5);
        this.message = "Đang phân tích dữ liệu...";
        this.startedAt = LocalDateTime.now();
    }
    
    public void markSuccess(String channelId, String message) {
        this.status = AnalyzeJobStatus.SUCCESS;
        this.progress = 100;
        this.channelId = channelId;
        this.message = message;
        this.finishedAt = LocalDateTime.now();
    }
    
    public void markFailed(String errorMessage) {
        this.status = AnalyzeJobStatus.FAILED;
        this.error = errorMessage;
        this.message = "Phân tích thất bại";
        this.finishedAt = LocalDateTime.now();
    }
    
    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        createdAt = now;
        updatedAt = now;
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}

