package com.example.backend.service;

import com.example.backend.dto.request.GoogleAuthRequest;
import com.example.backend.dto.request.LoginRequest;
import com.example.backend.dto.request.RegisterRequest;
import com.example.backend.dto.response.AuthResponse;
import com.example.backend.model.User;
import com.example.backend.model.UserPreferences;
import com.example.backend.repository.UserPreferencesRepository;
import com.example.backend.repository.UserRepository;
import com.example.backend.security.JwtTokenProvider;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AuthService {
    
    private final UserRepository userRepository;
    private final UserPreferencesRepository preferencesRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    
    @Value("${google.client-id:}")
    private String googleClientId;
    
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        // Kiểm tra email đã tồn tại
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email đã được sử dụng");
        }
        
        // Tạo user mới
        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole("USER"); // Mặc định là USER
        user.setLocked(false);
        
        user = userRepository.save(user);
        
        // Tạo preferences mặc định
        UserPreferences preferences = new UserPreferences();
        preferences.setUser(user);
        preferences.setDarkMode(true);
        preferences.setLanguage("vi");
        preferencesRepository.save(preferences);
        
        // Generate JWT token
        String token = jwtTokenProvider.generateToken(user.getEmail(), user.getRole());
        
        return buildAuthResponse(token, user);
    }
    
    public AuthResponse login(LoginRequest request) {
        // Tìm user theo email
        User user = userRepository.findByEmail(request.getEmail())
            .orElseThrow(() -> new RuntimeException("Email hoặc mật khẩu không đúng"));
        
        // Kiểm tra tài khoản bị khóa
        if (user.getLocked()) {
            throw new RuntimeException("Tài khoản đã bị khóa. Vui lòng liên hệ admin.");
        }
        
        // Verify password
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Email hoặc mật khẩu không đúng");
        }
        
        // Generate JWT token
        String token = jwtTokenProvider.generateToken(user.getEmail(), user.getRole());
        
        return buildAuthResponse(token, user);
    }
    
    @Transactional
    public AuthResponse googleAuth(GoogleAuthRequest request) {
        try {
            if (googleClientId == null || googleClientId.isEmpty() || googleClientId.equals("YOUR_GOOGLE_CLIENT_ID_HERE")) {
                throw new RuntimeException("Google Client ID chưa được cấu hình");
            }
            
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
                new NetHttpTransport(), 
                new GsonFactory())
                .setAudience(Collections.singletonList(googleClientId))
                .build();
            
            GoogleIdToken idToken = verifier.verify(request.getToken());
            if (idToken == null) {
                throw new RuntimeException("Token Google không hợp lệ hoặc đã hết hạn");
            }
            
            GoogleIdToken.Payload payload = idToken.getPayload();
            String googleId = payload.getSubject();
            String email = payload.getEmail();
            String name = (String) payload.get("name");
            String picture = (String) payload.get("picture");
            
            // Tìm user theo Google ID hoặc email
            Optional<User> userOpt = userRepository.findByGoogleId(googleId);
            if (userOpt.isEmpty()) {
                userOpt = userRepository.findByEmail(email);
            }
            
            User user;
            if (userOpt.isPresent()) {
                // User đã tồn tại, cập nhật thông tin
                user = userOpt.get();
                if (user.getGoogleId() == null) {
                    user.setGoogleId(googleId);
                }
                if (picture != null && user.getAvatarUrl() == null) {
                    user.setAvatarUrl(picture);
                }
                user = userRepository.save(user);
            } else {
                // Tạo user mới
                user = new User();
                user.setEmail(email);
                user.setUsername(name != null ? name : email.split("@")[0]);
                user.setGoogleId(googleId);
                user.setAvatarUrl(picture);
                user.setPassword(passwordEncoder.encode("google_oauth_" + googleId)); // Dummy password
                user.setRole("USER");
                user.setLocked(false);
                user = userRepository.save(user);
                
                // Tạo preferences mặc định
                UserPreferences preferences = new UserPreferences();
                preferences.setUser(user);
                preferences.setDarkMode(true);
                preferences.setLanguage("vi");
                preferencesRepository.save(preferences);
            }
            
            // Kiểm tra tài khoản bị khóa
            if (user.getLocked()) {
                throw new RuntimeException("Tài khoản đã bị khóa. Vui lòng liên hệ admin.");
            }
            
            // Generate JWT token
            String token = jwtTokenProvider.generateToken(user.getEmail(), user.getRole());
            
            return buildAuthResponse(token, user);
        } catch (Exception e) {
            throw new RuntimeException("Xác thực Google thất bại: " + e.getMessage());
        }
    }
    
    public AuthResponse.UserInfo getCurrentUser(String email) {
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        return AuthResponse.UserInfo.builder()
            .id(user.getId())
            .username(user.getUsername())
            .email(user.getEmail())
            .avatarUrl(user.getAvatarUrl())
            .role(user.getRole())
            .build();
    }
    
    private AuthResponse buildAuthResponse(String token, User user) {
        AuthResponse.UserInfo userInfo = AuthResponse.UserInfo.builder()
            .id(user.getId())
            .username(user.getUsername())
            .email(user.getEmail())
            .avatarUrl(user.getAvatarUrl())
            .role(user.getRole())
            .build();
        
        return AuthResponse.builder()
            .token(token)
            .user(userInfo)
            .build();
    }
}
