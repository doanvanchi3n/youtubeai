package com.example.backend.controller;

import com.example.backend.dto.request.*;
import com.example.backend.dto.response.*;
import com.example.backend.exception.ForbiddenException;
import com.example.backend.exception.UnauthorizedException;
import com.example.backend.model.User;
import com.example.backend.repository.UserRepository;
import com.example.backend.security.JwtTokenProvider;
import com.example.backend.service.AdminService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.RequestHeader;
import jakarta.servlet.http.HttpServletRequest;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {
    
    private final AdminService adminService;
    private final JwtTokenProvider jwtTokenProvider;
    private final UserRepository userRepository;
    
    @ModelAttribute
    public void verifyAdmin(@RequestHeader(value = "Authorization", required = false) String authHeader,
                            HttpServletRequest request) {
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return;
        }
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new UnauthorizedException("Thiếu thông tin xác thực");
        }
        String token = authHeader.substring(7);
        if (!jwtTokenProvider.validateToken(token)) {
            throw new UnauthorizedException("Token không hợp lệ hoặc đã hết hạn");
        }
        Long userId = jwtTokenProvider.getUserIdFromToken(token);
        if (userId == null) {
            throw new UnauthorizedException("Token không chứa thông tin người dùng");
        }
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new UnauthorizedException("Không tìm thấy người dùng"));
        if (Boolean.TRUE.equals(user.getLocked())) {
            throw new ForbiddenException("Tài khoản đã bị khóa, vui lòng liên hệ quản trị viên");
        }
        if (!"ADMIN".equalsIgnoreCase(user.getRole())) {
            throw new ForbiddenException("Bạn không có quyền truy cập trang quản trị");
        }
    }
    
    // ==================== DASHBOARD ====================
    
    @GetMapping("/dashboard")
    public ResponseEntity<AdminDashboardResponse> getDashboard() {
        AdminDashboardResponse dashboard = adminService.getDashboardStats();
        return ResponseEntity.ok(dashboard);
    }
    
    @GetMapping("/server-status")
    public ResponseEntity<Map<String, Object>> getServerStatus() {
        Map<String, Object> status = adminService.getServerStatus();
        return ResponseEntity.ok(status);
    }
    
    @GetMapping("/dashboard/api-requests")
    public ResponseEntity<List<ApiRequestStatResponse>> getApiRequestTrend(
            @RequestParam(defaultValue = "14") int days) {
        List<ApiRequestStatResponse> stats = adminService.getApiRequestTrend(days);
        return ResponseEntity.ok(stats);
    }
    
    @GetMapping("/dashboard/activity")
    public ResponseEntity<List<UserActivityResponse>> getRecentActivity(
            @RequestParam(defaultValue = "8") int limit) {
        List<UserActivityResponse> activities = adminService.getRecentActivities(limit);
        return ResponseEntity.ok(activities);
    }
    
    @GetMapping("/dashboard/logs")
    public ResponseEntity<List<SystemLogResponse>> getRecentLogs(
            @RequestParam(defaultValue = "5") int limit) {
        List<SystemLogResponse> logs = adminService.getRecentLogs(limit);
        return ResponseEntity.ok(logs);
    }
    
    // ==================== USER MANAGEMENT ====================
    
    @GetMapping("/users")
    public ResponseEntity<Page<UserSummaryResponse>> getAllUsers(
            @RequestParam(required = false) String search,
            Pageable pageable) {
        Page<UserSummaryResponse> users = adminService.getAllUsers(search, pageable);
        return ResponseEntity.ok(users);
    }
    
    @GetMapping("/users/{id}")
    public ResponseEntity<UserDetailResponse> getUserDetail(@PathVariable Long id) {
        UserDetailResponse user = adminService.getUserDetail(id);
        return ResponseEntity.ok(user);
    }
    
    @PutMapping("/users/{id}")
    public ResponseEntity<UserSummaryResponse> updateUser(
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserRequest request) {
        UserSummaryResponse user = adminService.updateUser(id, request);
        return ResponseEntity.ok(user);
    }
    
    @PutMapping("/users/{id}/role")
    public ResponseEntity<UserSummaryResponse> updateUserRole(
            @PathVariable Long id,
            @Valid @RequestBody UpdateRoleRequest request) {
        UserSummaryResponse user = adminService.updateUserRole(id, request.getRole());
        return ResponseEntity.ok(user);
    }
    
    @PutMapping("/users/{id}/lock")
    public ResponseEntity<UserSummaryResponse> lockUser(@PathVariable Long id) {
        UserSummaryResponse user = adminService.lockUser(id);
        return ResponseEntity.ok(user);
    }
    
    @PutMapping("/users/{id}/unlock")
    public ResponseEntity<UserSummaryResponse> unlockUser(@PathVariable Long id) {
        UserSummaryResponse user = adminService.unlockUser(id);
        return ResponseEntity.ok(user);
    }
    
    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        adminService.deleteUser(id);
        return ResponseEntity.ok().build();
    }
    
    // ==================== DATA MANAGEMENT ====================
    
    @GetMapping("/data/analysis-history")
    public ResponseEntity<Page<AnalysisHistoryResponse>> getAnalysisHistory(
            @RequestParam(required = false) String search,
            Pageable pageable) {
        Page<AnalysisHistoryResponse> history = adminService.getAnalysisHistory(search, pageable);
        return ResponseEntity.ok(history);
    }
    
    @GetMapping("/data/channels")
    public ResponseEntity<Page<ChannelSummaryResponse>> getAllChannels(
            @RequestParam(required = false) String search,
            Pageable pageable) {
        Page<ChannelSummaryResponse> channels = adminService.getAllChannels(search, pageable);
        return ResponseEntity.ok(channels);
    }
    
    @DeleteMapping("/data/channels/{id}")
    public ResponseEntity<?> deleteChannel(@PathVariable Long id) {
        adminService.deleteChannel(id);
        return ResponseEntity.ok().build();
    }
    
    @PostMapping("/data/channels/{id}/refresh")
    public ResponseEntity<?> refreshChannel(@PathVariable Long id) {
        adminService.refreshChannelData(id);
        return ResponseEntity.ok().build();
    }
    
    @DeleteMapping("/data/videos/{id}")
    public ResponseEntity<?> deleteVideo(@PathVariable Long id) {
        adminService.deleteVideo(id);
        return ResponseEntity.ok().build();
    }
    
    @PostMapping("/data/cleanup")
    public ResponseEntity<Map<String, Object>> cleanupOldData(
            @Valid @RequestBody CleanupDataRequest request) {
        Map<String, Object> result = adminService.cleanupOldData(request);
        return ResponseEntity.ok(result);
    }
    
    // ==================== AI MANAGEMENT ====================
    
    @GetMapping("/ai/models")
    public ResponseEntity<List<AIModelResponse>> getAIModels() {
        List<AIModelResponse> models = adminService.getAIModels();
        return ResponseEntity.ok(models);
    }
    
    @PostMapping("/ai/models/upload")
    public ResponseEntity<AIModelResponse> uploadAIModel(
            @Valid @RequestBody UploadModelRequest request) {
        AIModelResponse model = adminService.uploadAIModel(request);
        return ResponseEntity.ok(model);
    }
    
    @PutMapping("/ai/models/{id}/activate")
    public ResponseEntity<AIModelResponse> activateModel(@PathVariable Long id) {
        AIModelResponse model = adminService.activateModel(id);
        return ResponseEntity.ok(model);
    }
    
    @GetMapping("/ai/training-history")
    public ResponseEntity<Page<TrainingHistoryResponse>> getTrainingHistory(Pageable pageable) {
        Page<TrainingHistoryResponse> history = adminService.getTrainingHistory(pageable);
        return ResponseEntity.ok(history);
    }
    
    @GetMapping("/ai/sensitive-keywords")
    public ResponseEntity<List<String>> getSensitiveKeywords() {
        List<String> keywords = adminService.getSensitiveKeywords();
        return ResponseEntity.ok(keywords);
    }
    
    @PostMapping("/ai/sensitive-keywords")
    public ResponseEntity<?> addSensitiveKeyword(@Valid @RequestBody AddKeywordRequest request) {
        adminService.addSensitiveKeyword(request.getKeyword());
        return ResponseEntity.ok().build();
    }
    
    @DeleteMapping("/ai/sensitive-keywords/{keyword}")
    public ResponseEntity<?> deleteSensitiveKeyword(@PathVariable String keyword) {
        adminService.deleteSensitiveKeyword(keyword);
        return ResponseEntity.ok().build();
    }
    
    // ==================== SYSTEM SETTINGS ====================
    
    @GetMapping("/settings")
    public ResponseEntity<SystemSettingsResponse> getSystemSettings() {
        SystemSettingsResponse settings = adminService.getSystemSettings();
        return ResponseEntity.ok(settings);
    }
    
    @PutMapping("/settings/api-keys")
    public ResponseEntity<?> updateApiKeys(@Valid @RequestBody UpdateApiKeysRequest request) {
        adminService.updateApiKeys(request);
        return ResponseEntity.ok().build();
    }
    
    @PutMapping("/settings/rate-limit")
    public ResponseEntity<?> updateRateLimit(@Valid @RequestBody UpdateRateLimitRequest request) {
        adminService.updateRateLimit(request);
        return ResponseEntity.ok().build();
    }
    
    @PutMapping("/settings/logs")
    public ResponseEntity<?> updateLogSettings(@Valid @RequestBody UpdateLogSettingsRequest request) {
        adminService.updateLogSettings(request);
        return ResponseEntity.ok().build();
    }
    
    @PutMapping("/settings")
    public ResponseEntity<?> updateSystemSettings(@Valid @RequestBody SystemSettingsResponse request) {
        adminService.updateSystemSettings(request);
        return ResponseEntity.ok().build();
    }
    
    @PostMapping("/settings/backup")
    public ResponseEntity<Map<String, String>> createBackup() {
        Map<String, String> result = adminService.createBackup();
        return ResponseEntity.ok(result);
    }
    
    @PostMapping("/settings/restore")
    public ResponseEntity<?> restoreBackup(@Valid @RequestBody RestoreBackupRequest request) {
        adminService.restoreBackup(request.getBackupFile());
        return ResponseEntity.ok().build();
    }
    
    // ==================== SUPPORT & LOGS ====================
    
    @GetMapping("/support/tickets")
    public ResponseEntity<Page<SupportTicketResponse>> getSupportTickets(
            @RequestParam(required = false) String status,
            Pageable pageable) {
        Page<SupportTicketResponse> tickets = adminService.getSupportTickets(status, pageable);
        return ResponseEntity.ok(tickets);
    }
    
    @GetMapping("/support/tickets/{id}")
    public ResponseEntity<SupportTicketDetailResponse> getTicketDetail(@PathVariable Long id) {
        SupportTicketDetailResponse ticket = adminService.getTicketDetail(id);
        return ResponseEntity.ok(ticket);
    }
    
    @PutMapping("/support/tickets/{id}/respond")
    public ResponseEntity<SupportTicketResponse> respondToTicket(
            @PathVariable Long id,
            @Valid @RequestBody RespondTicketRequest request) {
        SupportTicketResponse ticket = adminService.respondToTicket(id, request);
        return ResponseEntity.ok(ticket);
    }
    
    @GetMapping("/logs")
    public ResponseEntity<Page<SystemLogResponse>> getSystemLogs(
            @RequestParam(required = false) String level,
            @RequestParam(required = false) String source,
            Pageable pageable) {
        Page<SystemLogResponse> logs = adminService.getSystemLogs(level, source, pageable);
        return ResponseEntity.ok(logs);
    }
}

