package com.example.backend.repository;

import com.example.backend.model.Comment;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface CommentRepository extends JpaRepository<Comment, Long> {
    Optional<Comment> findByCommentId(String commentId);
    List<Comment> findByVideoId(Long videoId);
    
    @Query("SELECT c FROM Comment c WHERE c.video.channel.id = :channelId AND c.isAnalyzed = false")
    List<Comment> findUnanalyzedCommentsByChannelId(@Param("channelId") Long channelId);
    
    @Query("SELECT c FROM Comment c WHERE c.isAnalyzed = false OR c.isAnalyzed IS NULL")
    Page<Comment> findUnanalyzedComments(Pageable pageable);
    
    @Query("""
        SELECT c FROM Comment c 
        WHERE c.video.channel.id = :channelId 
          AND c.sentiment = :sentiment
          AND LOWER(REPLACE(REPLACE(c.authorName, '@', ''), ' ', '')) 
              <> LOWER(REPLACE(REPLACE(c.video.channel.channelName, '@', ''), ' ', ''))
        """)
    Page<Comment> findByChannelIdAndSentiment(
        @Param("channelId") Long channelId, 
        @Param("sentiment") String sentiment,
        Pageable pageable
    );
    
    @Query("""
        SELECT c FROM Comment c 
        WHERE c.video.channel.id = :channelId 
          AND c.emotion = :emotion
          AND LOWER(REPLACE(REPLACE(c.authorName, '@', ''), ' ', '')) 
              <> LOWER(REPLACE(REPLACE(c.video.channel.channelName, '@', ''), ' ', ''))
        """)
    Page<Comment> findByChannelIdAndEmotion(
        @Param("channelId") Long channelId, 
        @Param("emotion") String emotion,
        Pageable pageable
    );
    
    @Query("""
        SELECT c FROM Comment c 
        WHERE c.video.channel.id = :channelId 
          AND c.isAnalyzed = false
          AND LOWER(REPLACE(REPLACE(c.authorName, '@', ''), ' ', '')) 
              <> LOWER(REPLACE(REPLACE(c.video.channel.channelName, '@', ''), ' ', ''))
        """)
    Page<Comment> findByChannelIdAndIsAnalyzedFalse(
        @Param("channelId") Long channelId,
        Pageable pageable
    );
    
    @Query("""
        SELECT c FROM Comment c 
        WHERE c.video.channel.id = :channelId 
          AND LOWER(REPLACE(REPLACE(c.authorName, '@', ''), ' ', '')) 
              <> LOWER(REPLACE(REPLACE(c.video.channel.channelName, '@', ''), ' ', ''))
        ORDER BY c.likeCount DESC
        """)
    List<Comment> findTopLikedCommentsByChannelId(@Param("channelId") Long channelId);
    
    @Query("SELECT COUNT(c) FROM Comment c WHERE c.video.channel.user.id = :userId")
    long countByVideoChannelUserId(@Param("userId") Long userId);
    
    @Query("SELECT COUNT(c) FROM Comment c WHERE c.video.channel.id = :channelId")
    long countByChannelId(@Param("channelId") Long channelId);
    
    @Query("""
        SELECT c.sentiment, COUNT(c) 
        FROM Comment c 
        WHERE c.video.channel.id = :channelId 
          AND c.sentiment IS NOT NULL
          AND LOWER(REPLACE(REPLACE(c.authorName, '@', ''), ' ', '')) 
              <> LOWER(REPLACE(REPLACE(c.video.channel.channelName, '@', ''), ' ', ''))
        GROUP BY c.sentiment
        """)
    List<Object[]> countSentimentByChannelId(@Param("channelId") Long channelId);
    
    @Query("""
        SELECT c.emotion, COUNT(c) 
        FROM Comment c 
        WHERE c.video.channel.id = :channelId 
          AND c.emotion IS NOT NULL
          AND LOWER(REPLACE(REPLACE(c.authorName, '@', ''), ' ', '')) 
              <> LOWER(REPLACE(REPLACE(c.video.channel.channelName, '@', ''), ' ', ''))
        GROUP BY c.emotion
        """)
    List<Object[]> countEmotionByChannelId(@Param("channelId") Long channelId);
}

