package com.example.backend.repository;

import com.example.backend.model.SystemLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SystemLogRepository extends JpaRepository<SystemLog, Long> {
    Page<SystemLog> findByOrderByCreatedAtDesc(Pageable pageable);
    Page<SystemLog> findByLevelIgnoreCase(String level, Pageable pageable);
    Page<SystemLog> findBySourceIgnoreCase(String source, Pageable pageable);
    Page<SystemLog> findByLevelIgnoreCaseAndSourceIgnoreCase(String level, String source, Pageable pageable);
}


