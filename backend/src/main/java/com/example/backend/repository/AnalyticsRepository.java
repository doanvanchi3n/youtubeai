package com.example.backend.repository;

import com.example.backend.model.Analytics;
import com.example.backend.repository.projection.DailyCountProjection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface AnalyticsRepository extends JpaRepository<Analytics, Long> {
    Optional<Analytics> findByChannelIdAndDate(Long channelId, LocalDate date);
    List<Analytics> findByChannelIdOrderByDateAsc(Long channelId);
    List<Analytics> findByChannelIdAndDateBetweenOrderByDateAsc(Long channelId, LocalDate startDate, LocalDate endDate);
    
    @Query("SELECT a.date AS date, COUNT(a) AS total FROM Analytics a WHERE a.date BETWEEN :start AND :end GROUP BY a.date ORDER BY a.date ASC")
    List<DailyCountProjection> countRequestsByDateRange(LocalDate start, LocalDate end);
    
    long countByDate(LocalDate date);
}

