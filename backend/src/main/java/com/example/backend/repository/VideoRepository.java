package com.example.backend.repository;

import com.example.backend.model.Video;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VideoRepository extends JpaRepository<Video, Long> {
    Optional<Video> findByVideoId(String videoId);
    List<Video> findByChannelId(Long channelId);
    
    @Query("SELECT v FROM Video v WHERE v.channel.id = :channelId ORDER BY (v.likeCount + v.commentCount) DESC")
    List<Video> findTopEngagingVideosByChannelId(Long channelId);
    
    long countByChannelId(Long channelId);
    
    @Query("SELECT COUNT(v) FROM Video v WHERE v.channel.user.id = :userId")
    long countByChannelUserId(Long userId);
}

