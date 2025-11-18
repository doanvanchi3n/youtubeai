package com.example.backend.repository;

import com.example.backend.model.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CommentRepository extends JpaRepository<Comment, Long> {
    Optional<Comment> findByCommentId(String commentId);
    List<Comment> findByVideoId(Long videoId);
    
    @Query("SELECT c FROM Comment c WHERE c.video.channel.id = :channelId AND c.isAnalyzed = false")
    List<Comment> findUnanalyzedCommentsByChannelId(Long channelId);
    
    @Query("SELECT c FROM Comment c WHERE c.video.channel.id = :channelId AND c.sentiment = :sentiment")
    List<Comment> findByChannelIdAndSentiment(@Param("channelId") Long channelId, @Param("sentiment") String sentiment);
    
    @Query("SELECT c FROM Comment c WHERE c.video.channel.id = :channelId AND c.emotion = :emotion")
    List<Comment> findByChannelIdAndEmotion(@Param("channelId") Long channelId, @Param("emotion") String emotion);
    
    @Query("SELECT c FROM Comment c WHERE c.video.channel.id = :channelId ORDER BY c.likeCount DESC")
    List<Comment> findTopLikedCommentsByChannelId(@Param("channelId") Long channelId);
    
    @Query("SELECT COUNT(c) FROM Comment c WHERE c.video.channel.user.id = :userId")
    long countByVideoChannelUserId(@Param("userId") Long userId);
    
    @Query("SELECT COUNT(c) FROM Comment c WHERE c.video.channel.id = :channelId")
    long countByChannelId(@Param("channelId") Long channelId);
    
    @Query("""
        SELECT c.sentiment, COUNT(c) 
        FROM Comment c 
        WHERE c.video.channel.id = :channelId AND c.sentiment IS NOT NULL
        GROUP BY c.sentiment
        """)
    List<Object[]> countSentimentByChannelId(@Param("channelId") Long channelId);
}

