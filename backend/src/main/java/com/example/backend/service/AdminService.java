package com.example.backend.service;

import com.example.backend.dto.request.*;
import com.example.backend.dto.response.*;
import com.example.backend.model.*;
import com.example.backend.repository.*;
import com.example.backend.repository.projection.DailyCountProjection;
import jakarta.annotation.PostConstruct;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.atomic.AtomicLong;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AdminService {
    
    private final UserRepository userRepository;
    private final ChannelRepository channelRepository;
    private final VideoRepository videoRepository;
    private final CommentRepository commentRepository;
    private final AnalyticsRepository analyticsRepository;
    private final SystemLogService systemLogService;
    
    @Value("${youtube.api.key:}")
    private String youtubeApiKeyProperty;
    
    @Value("${openai.api.key:}")
    private String openAiApiKeyProperty;
    
    private final List<AIModelResponse> aiModels = new CopyOnWriteArrayList<>();
    private final List<TrainingHistoryResponse> trainingHistory = new CopyOnWriteArrayList<>();
    private final AtomicLong aiModelIdGenerator = new AtomicLong(1);
    private final AtomicLong trainingIdGenerator = new AtomicLong(1);
    private volatile SystemSettingsResponse cachedSettings;
    
    @PostConstruct
    void initAiManagement() {
        if (!aiModels.isEmpty()) {
            return;
        }
        aiModels.add(AIModelResponse.builder()
            .id(aiModelIdGenerator.getAndIncrement())
            .modelType("sentiment")
            .version("Sentiment v1.0")
            .filePath("/models/sentiment-v1.bin")
            .accuracy(0.924)
            .isActive(true)
            .createdAt(LocalDateTime.now().minusDays(10))
            .build());
        aiModels.add(AIModelResponse.builder()
            .id(aiModelIdGenerator.getAndIncrement())
            .modelType("sentiment")
            .version("Sentiment v0.9")
            .filePath("/models/sentiment-v0.9.bin")
            .accuracy(0.901)
            .isActive(false)
            .createdAt(LocalDateTime.now().minusDays(30))
            .build());
        aiModels.add(AIModelResponse.builder()
            .id(aiModelIdGenerator.getAndIncrement())
            .modelType("emotion")
            .version("Emotion v1.0")
            .filePath("/models/emotion-v1.bin")
            .accuracy(0.885)
            .isActive(true)
            .createdAt(LocalDateTime.now().minusDays(7))
            .build());
        aiModels.add(AIModelResponse.builder()
            .id(aiModelIdGenerator.getAndIncrement())
            .modelType("emotion")
            .version("Emotion v0.8")
            .filePath("/models/emotion-v0.8.bin")
            .accuracy(0.861)
            .isActive(false)
            .createdAt(LocalDateTime.now().minusDays(40))
            .build());
        
        trainingHistory.add(TrainingHistoryResponse.builder()
            .id(trainingIdGenerator.getAndIncrement())
            .modelType("sentiment")
            .datasetSize(12000)
            .accuracy(0.924)
            .loss(0.042)
            .status("completed")
            .createdAt(LocalDateTime.now().minusDays(10))
            .build());
        trainingHistory.add(TrainingHistoryResponse.builder()
            .id(trainingIdGenerator.getAndIncrement())
            .modelType("emotion")
            .datasetSize(8500)
            .accuracy(0.885)
            .loss(0.058)
            .status("completed")
            .createdAt(LocalDateTime.now().minusDays(7))
            .build());
        trainingHistory.add(TrainingHistoryResponse.builder()
            .id(trainingIdGenerator.getAndIncrement())
            .modelType("topic")
            .datasetSize(15000)
            .accuracy(0.812)
            .loss(0.071)
            .status("completed")
            .createdAt(LocalDateTime.now().minusDays(20))
            .build());
    }
    
    private UserSummaryResponse toUserSummary(User user) {
        long channelCount = channelRepository.countByUserId(user.getId());
        return UserSummaryResponse.builder()
            .id(user.getId())
            .username(user.getUsername())
            .email(user.getEmail())
            .role(user.getRole())
            .createdAt(user.getCreatedAt())
            .channelCount(channelCount)
            .isLocked(Boolean.TRUE.equals(user.getLocked()))
            .build();
    }
    
    // ==================== DASHBOARD ====================
    
    public AdminDashboardResponse getDashboardStats() {
        long totalUsers = userRepository.count();
        long totalChannels = channelRepository.count();
        long totalVideos = videoRepository.count();
        long totalComments = commentRepository.count();
        long apiRequestsToday = analyticsRepository.countByDate(LocalDate.now());
        
        return AdminDashboardResponse.builder()
            .totalUsers(totalUsers)
            .totalChannels(totalChannels)
            .totalVideos(totalVideos)
            .totalComments(totalComments)
            .apiRequestsToday(apiRequestsToday)
            .build();
    }
    
    public Map<String, Object> getServerStatus() {
        Map<String, Object> status = new HashMap<>();
        
        // Backend Server
        status.put("backend", Map.of(
            "status", "online",
            "url", "localhost:8080"
        ));
        
        // AI Module
        status.put("aiModule", Map.of(
            "status", "online", // TODO: Implement health check
            "url", "localhost:5000"
        ));
        
        // Database
        status.put("database", Map.of(
            "status", "connected", // TODO: Implement connection check
            "type", "MySQL"
        ));
        
        return status;
    }
    
    public List<ApiRequestStatResponse> getApiRequestTrend(int days) {
        LocalDate end = LocalDate.now();
        LocalDate start = end.minusDays(days - 1L);
        List<DailyCountProjection> projections = analyticsRepository.countRequestsByDateRange(start, end);
        Map<LocalDate, Long> mapped = projections.stream()
            .collect(Collectors.toMap(DailyCountProjection::getDate, DailyCountProjection::getTotal));
        List<ApiRequestStatResponse> responses = new ArrayList<>();
        for (LocalDate date = start; !date.isAfter(end); date = date.plusDays(1)) {
            responses.add(ApiRequestStatResponse.builder()
                .date(date)
                .totalRequests(mapped.getOrDefault(date, 0L))
                .build());
        }
        return responses;
    }
    
    public List<UserActivityResponse> getRecentActivities(int limit) {
        List<Channel> channels = channelRepository
            .findByLastSyncedAtNotNullOrderByLastSyncedAtDesc(PageRequest.of(0, limit));
        return channels.stream()
            .map(channel -> UserActivityResponse.builder()
                .userId(channel.getUser().getId())
                .username(channel.getUser().getUsername())
                .channelName(channel.getChannelName())
                .channelId(channel.getChannelId())
                .action("Đã đồng bộ dữ liệu kênh")
                .timestamp(channel.getLastSyncedAt())
                .build())
            .collect(Collectors.toList());
    }
    
    public List<SystemLogResponse> getRecentLogs(int limit) {
        return systemLogService.getRecentLogs(limit);
    }
    
    // ==================== USER MANAGEMENT ====================
    
    public Page<UserSummaryResponse> getAllUsers(String search, Pageable pageable) {
        Page<User> users;
        if (search != null && !search.isBlank()) {
            users = userRepository.findByUsernameContainingIgnoreCaseOrEmailContainingIgnoreCase(
                search, search, pageable);
        } else {
            users = userRepository.findAll(pageable);
        }
        return users.map(this::toUserSummary);
    }
    
    public UserDetailResponse getUserDetail(Long id) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        long channelCount = channelRepository.countByUserId(id);
        long videoCount = videoRepository.countByChannelUserId(id);
        long commentCount = commentRepository.countByVideoChannelUserId(id);
        
        return UserDetailResponse.builder()
            .id(user.getId())
            .username(user.getUsername())
            .email(user.getEmail())
            .avatarUrl(user.getAvatarUrl())
            .createdAt(user.getCreatedAt())
            .channelCount(channelCount)
            .videoCount(videoCount)
            .commentCount(commentCount)
            .build();
    }
    
    @Transactional
    public UserSummaryResponse updateUser(Long id, UpdateUserRequest request) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        if (request.getUsername() != null && !request.getUsername().isBlank()) {
            user.setUsername(request.getUsername().trim());
        }
        if (request.getEmail() != null && !request.getEmail().isBlank()) {
            if (userRepository.existsByEmail(request.getEmail()) && 
                !user.getEmail().equalsIgnoreCase(request.getEmail())) {
                throw new RuntimeException("Email đã được sử dụng");
            }
            user.setEmail(request.getEmail().trim());
        }
        
        user = userRepository.save(user);
        
        return toUserSummary(user);
    }
    
    @Transactional
    public UserSummaryResponse updateUserRole(Long id, String role) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        if (role == null || role.isBlank()) {
            throw new RuntimeException("Role không hợp lệ");
        }
        user.setRole(role.toUpperCase());
        user = userRepository.save(user);
        
        return toUserSummary(user);
    }
    
    @Transactional
    public UserSummaryResponse lockUser(Long id) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        user.setLocked(true);
        user = userRepository.save(user);
        
        return toUserSummary(user);
    }
    
    @Transactional
    public UserSummaryResponse unlockUser(Long id) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        user.setLocked(false);
        user = userRepository.save(user);
        
        return toUserSummary(user);
    }
    
    @Transactional
    public void deleteUser(Long id) {
        userRepository.deleteById(id);
    }
    
    // ==================== DATA MANAGEMENT ====================
    
    public Page<AnalysisHistoryResponse> getAnalysisHistory(String search, Pageable pageable) {
        Page<Channel> channels;
        if (search != null && !search.isBlank()) {
            channels = channelRepository.searchChannels(search.trim(), pageable);
        } else {
            channels = channelRepository.findAll(pageable);
        }
        
        return channels.map(channel -> {
            long videoCount = videoRepository.countByChannelId(channel.getId());
            long commentCount = commentRepository.countByChannelId(channel.getId());
            String status = channel.getLastSyncedAt() != null ? "success" : "pending";
            User owner = channel.getUser();
            return AnalysisHistoryResponse.builder()
                .id(channel.getId())
                .userId(owner != null ? owner.getId() : null)
                .username(owner != null ? owner.getUsername() : "Unknown")
                .userEmail(owner != null ? owner.getEmail() : null)
                .channelId(channel.getId())
                .channelName(channel.getChannelName())
                .analysisType("channel")
                .status(status)
                .videoCount(videoCount)
                .commentCount(commentCount)
                .syncedAt(channel.getLastSyncedAt())
                .createdAt(channel.getCreatedAt())
                .build();
        });
    }
    
    public Page<ChannelSummaryResponse> getAllChannels(String search, Pageable pageable) {
        // TODO: Implement search
        return channelRepository.findAll(pageable)
            .map(channel -> {
                Long userId = channel.getUser() != null ? channel.getUser().getId() : null;
                int videoCount = channel.getVideoCount() != null ? channel.getVideoCount().intValue() : 0;
                long subscriberCount = channel.getSubscriberCount() != null ? channel.getSubscriberCount().longValue() : 0L;
                return ChannelSummaryResponse.builder()
                    .id(channel.getId())
                    .channelId(channel.getChannelId())
                    .channelName(channel.getChannelName())
                    .userId(userId)
                    .videoCount(videoCount)
                    .subscriberCount(subscriberCount)
                    .lastSyncedAt(channel.getLastSyncedAt())
                    .build();
            });
    }
    
    @Transactional
    public void deleteChannel(Long id) {
        channelRepository.deleteById(id);
    }
    
    @Transactional
    public void refreshChannelData(Long id) {
        // TODO: Implement refresh logic using YouTubeApiService
    }
    
    @Transactional
    public void deleteVideo(Long id) {
        videoRepository.deleteById(id);
    }
    
    @Transactional
    public Map<String, Object> cleanupOldData(CleanupDataRequest request) {
        // TODO: Implement cleanup logic
        Map<String, Object> result = new HashMap<>();
        result.put("deletedComments", 0);
        result.put("deletedVideos", 0);
        result.put("deletedAnalytics", 0);
        return result;
    }
    
    // ==================== AI MANAGEMENT ====================
    
    public List<AIModelResponse> getAIModels() {
        return aiModels.stream()
            .sorted(Comparator.comparing(AIModelResponse::getModelType)
                .thenComparing(AIModelResponse::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
            .collect(Collectors.toList());
    }
    
    public AIModelResponse uploadAIModel(UploadModelRequest request) {
        AIModelResponse model = AIModelResponse.builder()
            .id(aiModelIdGenerator.getAndIncrement())
            .modelType(request.getModelType().toLowerCase())
            .version(Optional.ofNullable(request.getVersion()).filter(v -> !v.isBlank())
                .orElseGet(() -> request.getModelType() + " model"))
            .filePath(request.getFilePath())
            .accuracy(request.getAccuracy())
            .isActive(false)
            .createdAt(LocalDateTime.now())
            .build();
        aiModels.add(model);
        trainingHistory.add(0, TrainingHistoryResponse.builder()
            .id(trainingIdGenerator.getAndIncrement())
            .modelType(model.getModelType())
            .datasetSize(10000)
            .accuracy(model.getAccuracy())
            .loss(0.05)
            .status("completed")
            .createdAt(LocalDateTime.now())
            .build());
        return model;
    }
    
    public AIModelResponse activateModel(Long id) {
        AIModelResponse target = aiModels.stream()
            .filter(model -> Objects.equals(model.getId(), id))
            .findFirst()
            .orElseThrow(() -> new RuntimeException("Không tìm thấy mô hình"));
        
        for (int i = 0; i < aiModels.size(); i++) {
            AIModelResponse model = aiModels.get(i);
            if (model.getModelType().equalsIgnoreCase(target.getModelType())) {
                aiModels.set(i, model.toBuilder().isActive(Objects.equals(model.getId(), id)).build());
            }
        }
        
        return aiModels.stream()
            .filter(model -> Objects.equals(model.getId(), id))
            .findFirst()
            .orElse(target);
    }
    
    public Page<TrainingHistoryResponse> getTrainingHistory(Pageable pageable) {
        List<TrainingHistoryResponse> sorted = trainingHistory.stream()
            .sorted(Comparator.comparing(TrainingHistoryResponse::getCreatedAt).reversed())
            .collect(Collectors.toList());
        int start = (int) pageable.getOffset();
        if (start >= sorted.size()) {
            return new PageImpl<>(Collections.emptyList(), pageable, sorted.size());
        }
        int end = Math.min(start + pageable.getPageSize(), sorted.size());
        List<TrainingHistoryResponse> content = sorted.subList(start, end);
        return new PageImpl<>(content, pageable, sorted.size());
    }
    
    public List<String> getSensitiveKeywords() {
        // TODO: Implement SensitiveKeyword entity
        return new ArrayList<>();
    }
    
    public void addSensitiveKeyword(String keyword) {
        // TODO: Implement add keyword
    }
    
    public void deleteSensitiveKeyword(String keyword) {
        // TODO: Implement delete keyword
    }
    
    // ==================== SYSTEM SETTINGS ====================
    
    @PostConstruct
    void initSystemSettings() {
        cachedSettings = SystemSettingsResponse.builder()
            .youtubeApiKey(Optional.ofNullable(youtubeApiKeyProperty).orElse(""))
            .openAiApiKey(Optional.ofNullable(openAiApiKeyProperty).orElse(""))
            .maxRequestsPerDay(1000)
            .maxRequestsPerHour(100)
            .build();
    }
    
    public SystemSettingsResponse getSystemSettings() {
        if (cachedSettings == null) {
            initSystemSettings();
        }
        return cachedSettings;
    }
    
    public void updateApiKeys(UpdateApiKeysRequest request) {
        // Deprecated: use updateSystemSettings
    }
    
    public void updateRateLimit(UpdateRateLimitRequest request) {
        // Deprecated: use updateSystemSettings
    }
    
    public void updateLogSettings(UpdateLogSettingsRequest request) {
        // Deprecated: log settings removed from UI
    }
    
    public void updateSystemSettings(SystemSettingsResponse request) {
        cachedSettings = SystemSettingsResponse.builder()
            .youtubeApiKey(Optional.ofNullable(request.getYoutubeApiKey()).orElse(""))
            .openAiApiKey(Optional.ofNullable(request.getOpenAiApiKey()).orElse(""))
            .maxRequestsPerDay(Optional.ofNullable(request.getMaxRequestsPerDay()).orElse(1000))
            .maxRequestsPerHour(Optional.ofNullable(request.getMaxRequestsPerHour()).orElse(100))
            .build();
    }
    
    public Map<String, String> createBackup() {
        // TODO: Implement backup logic
        Map<String, String> result = new HashMap<>();
        result.put("backupFile", "backup_" + LocalDateTime.now() + ".sql");
        return result;
    }
    
    public void restoreBackup(String backupFile) {
        // TODO: Implement restore logic
    }
    
    // ==================== SUPPORT & LOGS ====================
    
    public Page<SupportTicketResponse> getSupportTickets(String status, Pageable pageable) {
        // TODO: Implement SupportTicket entity
        return Page.empty(pageable);
    }
    
    public SupportTicketDetailResponse getTicketDetail(Long id) {
        // TODO: Implement
        return null;
    }
    
    public SupportTicketResponse respondToTicket(Long id, RespondTicketRequest request) {
        // TODO: Implement
        return null;
    }
    
    public Page<SystemLogResponse> getSystemLogs(String level, String source, Pageable pageable) {
        return systemLogService.getLogs(level, source, pageable);
    }
}

