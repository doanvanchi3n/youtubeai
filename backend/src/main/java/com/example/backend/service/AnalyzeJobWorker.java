package com.example.backend.service;

import com.example.backend.dto.response.AnalyzeUrlResponse;
import com.example.backend.model.AnalyzeJob;
import com.example.backend.model.AnalyzeJobStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
@Slf4j
public class AnalyzeJobWorker {
    
    private final AnalyzeJobService analyzeJobService;
    private final YouTubeAnalysisService youTubeAnalysisService;
    
    @Scheduled(fixedDelayString = "${analysis.job.poll-interval-ms:3000}")
    public void processPendingJobs() {
        analyzeJobService.getNextPendingJob()
            .ifPresent(this::executeJobSafely);
    }
    
    @Transactional
    protected void executeJobSafely(AnalyzeJob job) {
        if (job.getStatus() != AnalyzeJobStatus.PENDING) {
            return;
        }
        log.info("Bắt đầu xử lý job phân tích {} cho user {}", job.getId(), job.getUser().getId());
        job.markRunning();
        analyzeJobService.save(job);
        try {
            AnalyzeUrlResponse result = youTubeAnalysisService.analyzeUrl(job.getUser().getId(), job.getUrl());
            job.markSuccess(result.getChannelId(), result.getMessage());
            analyzeJobService.save(job);
            log.info("Job {} hoàn tất thành công", job.getId());
        } catch (Exception ex) {
            log.error("Job {} thất bại: {}", job.getId(), ex.getMessage(), ex);
            job.markFailed(ex.getMessage());
            analyzeJobService.save(job);
        }
    }
}

