package com.example.backend.repository;

import com.example.backend.model.Keyword;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface KeywordRepository extends JpaRepository<Keyword, Long> {
    @Query("SELECT k FROM Keyword k WHERE k.channel.id = :channelId ORDER BY k.frequency DESC")
    List<Keyword> findTopKeywordsByChannelId(Long channelId);
}

