package com.example.backend.controller;

import com.example.backend.dto.request.UpdatePasswordRequest;
import com.example.backend.dto.request.UpdatePreferencesRequest;
import com.example.backend.dto.request.UpdateUserRequest;
import com.example.backend.dto.response.UserProfileResponse;
import com.example.backend.exception.UnauthorizedException;
import com.example.backend.security.JwtTokenProvider;
import com.example.backend.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class UserController {
    
    private final UserService userService;
    private final JwtTokenProvider jwtTokenProvider;
    
    @GetMapping("/profile")
    public ResponseEntity<UserProfileResponse> getProfile(
        @RequestHeader("Authorization") String authHeader) {
        TokenPrincipal principal = resolvePrincipal(authHeader);
        UserProfileResponse response = userService.getProfile(principal.userId(), principal.email());
        return ResponseEntity.ok(response);
    }
    
    @PutMapping("/profile")
    public ResponseEntity<UserProfileResponse> updateProfile(
        @RequestHeader("Authorization") String authHeader,
        @Valid @RequestBody UpdateUserRequest request) {
        TokenPrincipal principal = resolvePrincipal(authHeader);
        UserProfileResponse response = userService.updateProfile(principal.userId(), principal.email(), request);
        return ResponseEntity.ok(response);
    }
    
    @PutMapping("/password")
    public ResponseEntity<Void> updatePassword(
        @RequestHeader("Authorization") String authHeader,
        @Valid @RequestBody UpdatePasswordRequest request) {
        TokenPrincipal principal = resolvePrincipal(authHeader);
        userService.updatePassword(principal.userId(), principal.email(), request);
        return ResponseEntity.noContent().build();
    }
    
    @PutMapping("/preferences")
    public ResponseEntity<UserProfileResponse> updatePreferences(
        @RequestHeader("Authorization") String authHeader,
        @Valid @RequestBody UpdatePreferencesRequest request) {
        TokenPrincipal principal = resolvePrincipal(authHeader);
        UserProfileResponse response = userService.updatePreferences(principal.userId(), principal.email(), request);
        return ResponseEntity.ok(response);
    }
    
    @PostMapping(value = "/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<UserProfileResponse> updateAvatar(
        @RequestHeader("Authorization") String authHeader,
        @RequestPart("avatar") MultipartFile avatar) {
        TokenPrincipal principal = resolvePrincipal(authHeader);
        UserProfileResponse response = userService.updateAvatar(principal.userId(), principal.email(), avatar);
        return ResponseEntity.ok(response);
    }
    
    private TokenPrincipal resolvePrincipal(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new UnauthorizedException("Thiếu thông tin xác thực");
        }
        String token = authHeader.substring(7);
        if (!jwtTokenProvider.validateToken(token)) {
            throw new UnauthorizedException("Token không hợp lệ hoặc đã hết hạn");
        }
        Long userId = jwtTokenProvider.getUserIdFromToken(token);
        String email = jwtTokenProvider.getEmailFromToken(token);
        return new TokenPrincipal(userId, email);
    }
    
    private record TokenPrincipal(Long userId, String email) {}
}
