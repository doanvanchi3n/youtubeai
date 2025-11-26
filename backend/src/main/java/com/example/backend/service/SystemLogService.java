package com.example.backend.service;

import com.example.backend.dto.response.SystemLogResponse;
import com.example.backend.model.SystemLog;
import com.example.backend.repository.SystemLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SystemLogService {
    
    private final SystemLogRepository systemLogRepository;
    
    public void record(String level, String source, String message, String metadata) {
        SystemLog log = new SystemLog();
        log.setLevel(level != null ? level.toUpperCase() : "INFO");
        log.setSource(source != null ? source : "backend");
        log.setMessage(message);
        log.setMetadata(metadata);
        log.setCreatedAt(LocalDateTime.now());
        systemLogRepository.save(log);
    }
    
    public List<SystemLogResponse> getRecentLogs(int limit) {
        Page<SystemLog> logsPage = systemLogRepository.findByOrderByCreatedAtDesc(Pageable.ofSize(limit));
        return logsPage.getContent().stream()
            .map(this::toResponse)
            .collect(Collectors.toList());
    }
    
    public Page<SystemLogResponse> getLogs(String level, String source, Pageable pageable) {
        Page<SystemLog> logs;
        if (level != null && source != null) {
            logs = systemLogRepository.findByLevelIgnoreCaseAndSourceIgnoreCase(level, source, pageable);
        } else if (level != null) {
            logs = systemLogRepository.findByLevelIgnoreCase(level, pageable);
        } else if (source != null) {
            logs = systemLogRepository.findBySourceIgnoreCase(source, pageable);
        } else {
            logs = systemLogRepository.findByOrderByCreatedAtDesc(pageable);
        }
        return logs.map(this::toResponse);
    }
    
    private SystemLogResponse toResponse(SystemLog log) {
        return SystemLogResponse.builder()
            .id(log.getId())
            .level(log.getLevel())
            .source(log.getSource())
            .message(log.getMessage())
            .timestamp(log.getCreatedAt())
            .build();
    }
}


