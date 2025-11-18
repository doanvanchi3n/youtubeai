package com.example.backend.service;

import com.example.backend.dto.request.UpdatePasswordRequest;
import com.example.backend.dto.request.UpdatePreferencesRequest;
import com.example.backend.dto.request.UpdateUserRequest;
import com.example.backend.dto.response.UserProfileResponse;
import com.example.backend.exception.BadRequestException;
import com.example.backend.exception.ResourceNotFoundException;
import com.example.backend.model.User;
import com.example.backend.model.UserPreferences;
import com.example.backend.repository.ChannelRepository;
import com.example.backend.repository.CommentRepository;
import com.example.backend.repository.UserPreferencesRepository;
import com.example.backend.repository.UserRepository;
import com.example.backend.repository.VideoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class UserService {
    
    private final UserRepository userRepository;
    private final UserPreferencesRepository userPreferencesRepository;
    private final ChannelRepository channelRepository;
    private final VideoRepository videoRepository;
    private final CommentRepository commentRepository;
    private final PasswordEncoder passwordEncoder;
    
    @Value("${app.upload-dir:uploads}")
    private String uploadDir;
    
    @Transactional(readOnly = true)
    public UserProfileResponse getProfile(Long userId, String email) {
        User user = resolveUser(userId, email);
        UserPreferences preferences = ensurePreferences(user);
        return buildProfileResponse(user, preferences);
    }
    
    @Transactional
    public UserProfileResponse updateProfile(Long userId, String email, UpdateUserRequest request) {
        User user = resolveUser(userId, email);
        
        if (request.getUsername() != null && !request.getUsername().isBlank()) {
            user.setUsername(request.getUsername().trim());
        }
        
        if (request.getEmail() != null 
                && !request.getEmail().isBlank() 
                && !request.getEmail().equalsIgnoreCase(user.getEmail())) {
            String normalizedEmail = request.getEmail().trim();
            if (userRepository.existsByEmail(normalizedEmail)) {
                throw new BadRequestException("Email đã được sử dụng");
            }
            user.setEmail(normalizedEmail);
        }
        
        userRepository.save(user);
        UserPreferences preferences = ensurePreferences(user);
        return buildProfileResponse(user, preferences);
    }
    
    @Transactional
    public void updatePassword(Long userId, String email, UpdatePasswordRequest request) {
        User user = resolveUser(userId, email);
        
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new BadRequestException("Mật khẩu hiện tại không đúng");
        }
        
        if (request.getNewPassword() == null || request.getNewPassword().isBlank()) {
            throw new BadRequestException("Mật khẩu mới không được bỏ trống");
        }
        
        if (!Objects.equals(request.getNewPassword(), request.getConfirmPassword())) {
            throw new BadRequestException("Xác nhận mật khẩu không khớp");
        }
        
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }
    
    @Transactional
    public UserProfileResponse updatePreferences(Long userId, String email, UpdatePreferencesRequest request) {
        User user = resolveUser(userId, email);
        UserPreferences preferences = ensurePreferences(user);
        
        if (request.getDarkMode() != null) {
            preferences.setDarkMode(request.getDarkMode());
        }
        
        if (request.getLanguage() != null) {
            preferences.setLanguage(request.getLanguage());
        }
        
        userPreferencesRepository.save(preferences);
        return buildProfileResponse(user, preferences);
    }
    
    @Transactional
    public UserProfileResponse updateAvatar(Long userId, String email, MultipartFile avatar) {
        if (avatar == null || avatar.isEmpty()) {
            throw new BadRequestException("Vui lòng chọn ảnh hợp lệ");
        }
        
        User user = resolveUser(userId, email);
        
        try {
            Path avatarDir = Paths.get(uploadDir, "avatars").toAbsolutePath().normalize();
            Files.createDirectories(avatarDir);
            
            String extension = getFileExtension(avatar.getOriginalFilename());
            String fileName = "avatar-" + user.getId() + "-" + System.currentTimeMillis() + extension;
            Path targetLocation = avatarDir.resolve(fileName);
            Files.copy(avatar.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);
            
            deleteOldAvatarIfLocal(user.getAvatarUrl());
            
            String publicUrl = "/uploads/avatars/" + fileName;
            user.setAvatarUrl(publicUrl);
            userRepository.save(user);
            
            UserPreferences preferences = ensurePreferences(user);
            return buildProfileResponse(user, preferences);
        } catch (IOException e) {
            throw new RuntimeException("Không thể lưu ảnh đại diện", e);
        }
    }
    
    private User resolveUser(Long userId, String email) {
        if (userId != null) {
            return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng"));
        }
        
        if (email != null && !email.isBlank()) {
            return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng"));
        }
        
        throw new ResourceNotFoundException("Không xác định được người dùng");
    }
    
    private UserPreferences ensurePreferences(User user) {
        return userPreferencesRepository.findByUserId(user.getId())
            .orElseGet(() -> {
                UserPreferences preferences = new UserPreferences();
                preferences.setUser(user);
                preferences.setDarkMode(true);
                preferences.setLanguage("vi");
                return userPreferencesRepository.save(preferences);
            });
    }
    
    private UserProfileResponse buildProfileResponse(User user, UserPreferences preferences) {
        long channelCount = channelRepository.countByUserId(user.getId());
        long videoCount = videoRepository.countByChannelUserId(user.getId());
        long commentCount = commentRepository.countByVideoChannelUserId(user.getId());
        
        return UserProfileResponse.builder()
            .id(user.getId())
            .username(user.getUsername())
            .email(user.getEmail())
            .avatarUrl(user.getAvatarUrl())
            .role(user.getRole())
            .darkMode(preferences.getDarkMode() != null ? preferences.getDarkMode() : Boolean.TRUE)
            .language(preferences.getLanguage() != null ? preferences.getLanguage() : "vi")
            .channelCount(channelCount)
            .videoCount(videoCount)
            .commentCount(commentCount)
            .createdAt(user.getCreatedAt())
            .updatedAt(user.getUpdatedAt())
            .build();
    }
    
    private void deleteOldAvatarIfLocal(String avatarUrl) {
        if (avatarUrl == null || !avatarUrl.startsWith("/uploads/")) {
            return;
        }
        
        try {
            Path basePath = Paths.get(uploadDir).toAbsolutePath().normalize();
            String relativePath = avatarUrl.replaceFirst("/uploads/", "");
            Path filePath = basePath.resolve(relativePath).normalize();
            Files.deleteIfExists(filePath);
        } catch (IOException ignored) {
        }
    }
    
    private String getFileExtension(String filename) {
        if (filename == null || !filename.contains(".")) {
            return ".png";
        }
        return filename.substring(filename.lastIndexOf("."));
    }
}
