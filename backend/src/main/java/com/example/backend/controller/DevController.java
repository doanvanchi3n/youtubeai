package com.example.backend.controller;

import com.example.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/dev")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class DevController {
    
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    
    /**
     * Endpoint để generate BCrypt hash cho password
     * Chỉ dùng trong development
     */
    @GetMapping("/hash-password")
    public ResponseEntity<Map<String, String>> hashPassword(@RequestParam String password) {
        String hash = passwordEncoder.encode(password);
        Map<String, String> response = new HashMap<>();
        response.put("password", password);
        response.put("hash", hash);
        return ResponseEntity.ok(response);
    }
    
    /**
     * Endpoint để reset password admin
     * Chỉ dùng trong development
     * Hỗ trợ cả GET và POST
     */
    @RequestMapping(value = "/reset-admin-password", method = {RequestMethod.GET, RequestMethod.POST})
    public ResponseEntity<Map<String, String>> resetAdminPassword(
            @RequestParam(required = false, defaultValue = "admin123") String newPassword) {
        var adminOpt = userRepository.findByEmail("admin@example.com");
        if (adminOpt.isEmpty()) {
            Map<String, String> response = new HashMap<>();
            response.put("error", "Admin user not found");
            return ResponseEntity.badRequest().body(response);
        }
        
        var admin = adminOpt.get();
        String hashedPassword = passwordEncoder.encode(newPassword);
        admin.setPassword(hashedPassword);
        userRepository.save(admin);
        
        Map<String, String> response = new HashMap<>();
        response.put("message", "Admin password reset successfully");
        response.put("email", "admin@example.com");
        response.put("newPassword", newPassword);
        response.put("hash", hashedPassword);
        return ResponseEntity.ok(response);
    }
}

