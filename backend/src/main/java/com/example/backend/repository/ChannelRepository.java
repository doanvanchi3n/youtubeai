package com.example.backend.repository;

import com.example.backend.model.Channel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ChannelRepository extends JpaRepository<Channel, Long> {
    Optional<Channel> findByChannelId(String channelId);
    boolean existsByChannelId(String channelId);
    
    @Query("SELECT COUNT(c) FROM Channel c WHERE c.user.id = :userId")
    long countByUserId(Long userId);
    
    Optional<Channel> findFirstByUserIdOrderByUpdatedAtDesc(Long userId);
}

