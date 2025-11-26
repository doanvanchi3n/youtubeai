package com.example.backend.repository;

import com.example.backend.model.AnalyzeJob;
import com.example.backend.model.AnalyzeJobStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AnalyzeJobRepository extends JpaRepository<AnalyzeJob, Long> {
    Optional<AnalyzeJob> findFirstByStatusOrderByCreatedAtAsc(AnalyzeJobStatus status);
    List<AnalyzeJob> findByUserIdOrderByCreatedAtDesc(Long userId);
    Optional<AnalyzeJob> findByIdAndUserId(Long id, Long userId);
}

