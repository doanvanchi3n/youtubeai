package com.example.backend.repository;

import com.example.backend.model.Channel;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChannelRepository extends JpaRepository<Channel, Long> {
    Optional<Channel> findByChannelId(String channelId);
    boolean existsByChannelId(String channelId);
    
    @Query("SELECT COUNT(c) FROM Channel c WHERE c.user.id = :userId")
    long countByUserId(Long userId);
    
    Optional<Channel> findFirstByUserIdOrderByUpdatedAtDesc(Long userId);
    
    List<Channel> findByLastSyncedAtNotNullOrderByLastSyncedAtDesc(Pageable pageable);
    
    @Query("""
        SELECT c FROM Channel c
        LEFT JOIN c.user u
        WHERE LOWER(c.channelName) LIKE LOWER(CONCAT('%', :keyword, '%'))
           OR LOWER(c.channelId) LIKE LOWER(CONCAT('%', :keyword, '%'))
           OR (u IS NOT NULL AND LOWER(u.username) LIKE LOWER(CONCAT('%', :keyword, '%')))
        """)
    Page<Channel> searchChannels(@Param("keyword") String keyword, Pageable pageable);
}

