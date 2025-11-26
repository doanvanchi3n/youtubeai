package com.example.backend.repository;

import com.example.backend.model.VideoStatsHistory;
import java.time.LocalDateTime;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface VideoStatsHistoryRepository extends JpaRepository<VideoStatsHistory, Long> {
    void deleteBySnapshotTimeBefore(LocalDateTime cutoff);
    
    @Modifying
    @Query("""
        DELETE FROM VideoStatsHistory vsh
        WHERE vsh.video.channel.id = :channelId
        """)
    void deleteByChannelId(@Param("channelId") Long channelId);
}

