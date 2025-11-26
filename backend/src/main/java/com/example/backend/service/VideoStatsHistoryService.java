package com.example.backend.service;

import com.example.backend.model.Video;
import com.example.backend.model.VideoStatsHistory;
import com.example.backend.repository.VideoStatsHistoryRepository;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class VideoStatsHistoryService {
    
    private final VideoStatsHistoryRepository historyRepository;
    
    @Value("${video-history.retention-days:60}")
    private int retentionDays;
    
    @Transactional
    public void recordSnapshots(List<Video> videos) {
        if (videos == null || videos.isEmpty()) {
            return;
        }
        LocalDateTime snapshotTime = LocalDateTime.now();
        List<VideoStatsHistory> histories = new ArrayList<>(videos.size());
        for (Video video : videos) {
            if (video.getId() == null) {
                continue;
            }
            VideoStatsHistory history = new VideoStatsHistory();
            history.setVideo(video);
            history.setSnapshotTime(snapshotTime);
            history.setViewCount(video.getViewCount() != null ? video.getViewCount() : 0L);
            history.setLikeCount(video.getLikeCount() != null ? video.getLikeCount() : 0L);
            history.setCommentCount(video.getCommentCount() != null ? video.getCommentCount() : 0);
            histories.add(history);
        }
        historyRepository.saveAll(histories);
    }
    
    @Scheduled(cron = "0 0 3 * * *")
    @Transactional
    public void cleanupOldHistory() {
        LocalDateTime cutoff = LocalDateTime.now().minusDays(retentionDays);
        historyRepository.deleteBySnapshotTimeBefore(cutoff);
    }
    
    @Transactional
    public void deleteByChannelId(Long channelId) {
        if (channelId == null) {
            return;
        }
        historyRepository.deleteByChannelId(channelId);
    }
}

