package com.example.backend.service;

import com.example.backend.exception.ResourceNotFoundException;
import com.example.backend.model.AnalyzeJob;
import com.example.backend.model.AnalyzeJobStatus;
import com.example.backend.model.User;
import com.example.backend.repository.AnalyzeJobRepository;
import com.example.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AnalyzeJobService {
    
    private final AnalyzeJobRepository jobRepository;
    private final UserRepository userRepository;
    
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
    
    @Transactional(readOnly = true)
    public Optional<AnalyzeJob> getJob(Long userId, Long jobId) {
        return jobRepository.findByIdAndUserId(jobId, userId);
    }
    
    @Transactional(readOnly = true)
    public Optional<AnalyzeJob> getNextPendingJob() {
        return jobRepository.findFirstByStatusOrderByCreatedAtAsc(AnalyzeJobStatus.PENDING);
    }
    
    @Transactional
    public AnalyzeJob save(AnalyzeJob job) {
        return jobRepository.save(job);
    }
}

