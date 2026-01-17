package com.example.backend.service;

import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.example.backend.exception.ResourceNotFoundException;
import com.example.backend.model.AnalyzeJob;
import com.example.backend.model.AnalyzeJobStatus;
import com.example.backend.model.User;
import com.example.backend.repository.AnalyzeJobRepository;
import com.example.backend.repository.UserRepository;

import lombok.RequiredArgsConstructor;

/**
 * Service quản lý AnalyzeJob - Tạo, lấy, và lưu analyze jobs
 */
@Service
@RequiredArgsConstructor
public class AnalyzeJobService {
    
    private final AnalyzeJobRepository jobRepository;
    private final UserRepository userRepository;
    
    /**
     * Tạo job mới với status PENDING
     * @param userId ID user tạo job
     * @param url URL kênh YouTube cần phân tích
     * @return AnalyzeJob đã được lưu
     */
    @Transactional
    public AnalyzeJob createJob(Long userId, String url) {
        if (!StringUtils.hasText(url)) {
            throw new IllegalArgumentException("URL không được để trống");
        }
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng"));
        
        AnalyzeJob job = new AnalyzeJob();
        job.setUser(user);
        job.setUrl(url.trim());
        job.setStatus(AnalyzeJobStatus.PENDING);
        job.setProgress(0);
        job.setMessage("Chờ xử lý");
        return jobRepository.save(job);
    }
    
    /**
     * Lấy job theo ID (chỉ job của user này)
     * @param userId ID user
     * @param jobId ID job
     * @return Optional<AnalyzeJob>
     */
    @Transactional(readOnly = true)
    public Optional<AnalyzeJob> getJob(Long userId, Long jobId) {
        return jobRepository.findByIdAndUserId(jobId, userId);
    }
    
    /**
     * Lấy job PENDING đầu tiên (cho background worker)
     * @return Optional<AnalyzeJob>
     */
    @Transactional(readOnly = true)
    public Optional<AnalyzeJob> getNextPendingJob() {
        return jobRepository.findFirstByStatusOrderByCreatedAtAsc(AnalyzeJobStatus.PENDING);
    }
    
    /**
     * Lưu job (update status, progress, message, etc.)
     * @param job Job cần lưu
     * @return AnalyzeJob đã được lưu
     */
    @Transactional
    public AnalyzeJob save(AnalyzeJob job) {
        return jobRepository.save(job);
    }
}

