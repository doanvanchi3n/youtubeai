package com.example.backend.repository;

import com.example.backend.model.Video;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface VideoRepository extends JpaRepository<Video, Long> {
    Optional<Video> findByVideoId(String videoId);
    List<Video> findByChannelId(Long channelId);
    void deleteByChannelId(Long channelId);
    
    @Query("""
        SELECT v FROM Video v 
        WHERE v.channel.id = :channelId 
        ORDER BY (COALESCE(v.likeCount, 0) + COALESCE(v.commentCount, 0)) DESC, COALESCE(v.viewCount, 0) DESC
        """)
    List<Video> findTopEngagingVideosByChannelId(@Param("channelId") Long channelId, Pageable pageable);
    
    long countByChannelId(Long channelId);
    
    @Query("SELECT COUNT(v) FROM Video v WHERE v.channel.user.id = :userId")
    long countByChannelUserId(Long userId);
    
    @Query("SELECT COALESCE(SUM(v.viewCount), 0) FROM Video v WHERE v.channel.id = :channelId")
    Long sumViewCountByChannelId(@Param("channelId") Long channelId);
    
    @Query("SELECT COALESCE(SUM(v.likeCount), 0) FROM Video v WHERE v.channel.id = :channelId")
    Long sumLikeCountByChannelId(@Param("channelId") Long channelId);
    
    @Query("SELECT COALESCE(SUM(v.commentCount), 0) FROM Video v WHERE v.channel.id = :channelId")
    Long sumCommentCountByChannelId(@Param("channelId") Long channelId);
}

