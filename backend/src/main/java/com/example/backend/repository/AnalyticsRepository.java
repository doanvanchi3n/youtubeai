package com.example.backend.repository;

import com.example.backend.model.Analytics;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface AnalyticsRepository extends JpaRepository<Analytics, Long> {
    Optional<Analytics> findByChannelIdAndDate(Long channelId, LocalDate date);
    List<Analytics> findByChannelIdOrderByDateAsc(Long channelId);
    List<Analytics> findByChannelIdAndDateBetweenOrderByDateAsc(Long channelId, LocalDate startDate, LocalDate endDate);
}

