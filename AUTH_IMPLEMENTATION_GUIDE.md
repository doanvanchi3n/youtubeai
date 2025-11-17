# Quy Trình Hoàn Thành Chức Năng Đăng Nhập & Đăng Ký

## 📋 Tổng Quan

Tài liệu này mô tả chi tiết quy trình implement chức năng **Đăng Nhập (Login)** và **Đăng Ký (Register)** cho hệ thống YouTube AI Analytics.

---

## 🎯 Mục Tiêu

1. ✅ User có thể đăng ký tài khoản mới
2. ✅ User có thể đăng nhập với email/password
3. ✅ Hệ thống xác thực và cấp JWT token
4. ✅ Token được lưu và sử dụng cho các request tiếp theo
5. ✅ User có thể đăng xuất
6. ✅ Protected routes chỉ cho phép user đã đăng nhập

---

## 📊 Luồng Dữ Liệu Tổng Quan

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   Frontend  │ ──────> │   Backend   │ ──────> │  Database   │
│  (React)   │ <────── │ (Spring Boot)│ <────── │   (MySQL)   │
└─────────────┘         └─────────────┘         └─────────────┘
```

---

## 🔄 QUY TRÌNH ĐĂNG KÝ (REGISTER)

### **Bước 1: Frontend - Form Validation**

**File**: `frontend/src/pages/Login/Login.jsx`

```javascript
// State management
const [formData, setFormData] = useState({
  username: '',
  email: '',
  password: '',
  confirmPassword: ''
})
const [errors, setErrors] = useState({})
const [loading, setLoading] = useState(false)

// Validation rules
const validateRegister = () => {
  const newErrors = {}
  
  // Username validation
  if (!formData.username.trim()) {
    newErrors.username = 'Tên người dùng không được để trống'
  } else if (formData.username.length < 3) {
    newErrors.username = 'Tên người dùng phải có ít nhất 3 ký tự'
  }
  
  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!formData.email) {
    newErrors.email = 'Email không được để trống'
  } else if (!emailRegex.test(formData.email)) {
    newErrors.email = 'Email không hợp lệ'
  }
  
  // Password validation
  if (!formData.password) {
    newErrors.password = 'Mật khẩu không được để trống'
  } else if (formData.password.length < 6) {
    newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự'
  }
  
  // Confirm password
  if (formData.password !== formData.confirmPassword) {
    newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp'
  }
  
  setErrors(newErrors)
  return Object.keys(newErrors).length === 0
}
```

### **Bước 2: Frontend - API Service**

**File**: `frontend/src/services/authService.js` (cần tạo)

```javascript
const API_BASE_URL = 'http://localhost:8080/api'

export const authService = {
  async register(userData) {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: userData.username,
        email: userData.email,
        password: userData.password
      })
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Đăng ký thất bại')
    }
    
    return await response.json()
  }
}
```

### **Bước 3: Frontend - Handle Submit**

```javascript
const handleRegister = async (e) => {
  e.preventDefault()
  
  if (!validateRegister()) {
    return
  }
  
  setLoading(true)
  try {
    const response = await authService.register(formData)
    
    // Lưu token
    localStorage.setItem('token', response.token)
    localStorage.setItem('user', JSON.stringify(response.user))
    
    // Redirect to dashboard
    navigate('/dashboard')
  } catch (error) {
    setErrors({ submit: error.message })
  } finally {
    setLoading(false)
  }
}
```

### **Bước 4: Backend - DTOs**

**File**: `backend/src/main/java/com/example/backend/dto/request/RegisterRequest.java`

```java
package com.example.backend.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RegisterRequest {
    @NotBlank(message = "Username không được để trống")
    @Size(min = 3, max = 50, message = "Username phải từ 3-50 ký tự")
    private String username;
    
    @NotBlank(message = "Email không được để trống")
    @Email(message = "Email không hợp lệ")
    private String email;
    
    @NotBlank(message = "Password không được để trống")
    @Size(min = 6, message = "Password phải có ít nhất 6 ký tự")
    private String password;
}
```

**File**: `backend/src/main/java/com/example/backend/dto/response/AuthResponse.java`

```java
package com.example.backend.dto.response;

import com.example.backend.model.User;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class AuthResponse {
    private String token;
    private User user;
}
```

### **Bước 5: Backend - Service**

**File**: `backend/src/main/java/com/example/backend/service/AuthService.java`

```java
package com.example.backend.service;

import com.example.backend.dto.request.LoginRequest;
import com.example.backend.dto.request.RegisterRequest;
import com.example.backend.dto.response.AuthResponse;
import com.example.backend.model.User;
import com.example.backend.model.UserPreferences;
import com.example.backend.repository.UserRepository;
import com.example.backend.repository.UserPreferencesRepository;
import com.example.backend.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {
    
    private final UserRepository userRepository;
    private final UserPreferencesRepository preferencesRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    
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
        
        user = userRepository.save(user);
        
        // Tạo preferences mặc định
        UserPreferences preferences = new UserPreferences();
        preferences.setUserId(user.getId());
        preferences.setDarkMode(true);
        preferences.setLanguage("vi");
        preferencesRepository.save(preferences);
        
        // Generate JWT token
        String token = jwtTokenProvider.generateToken(user.getEmail());
        
        return new AuthResponse(token, user);
    }
    
    public AuthResponse login(LoginRequest request) {
        // Tìm user theo email
        User user = userRepository.findByEmail(request.getEmail())
            .orElseThrow(() -> new RuntimeException("Email hoặc mật khẩu không đúng"));
        
        // Verify password
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Email hoặc mật khẩu không đúng");
        }
        
        // Generate JWT token
        String token = jwtTokenProvider.generateToken(user.getEmail());
        
        return new AuthResponse(token, user);
    }
}
```

### **Bước 6: Backend - Controller**

**File**: `backend/src/main/java/com/example/backend/controller/AuthController.java`

```java
package com.example.backend.controller;

import com.example.backend.dto.request.LoginRequest;
import com.example.backend.dto.request.RegisterRequest;
import com.example.backend.dto.response.AuthResponse;
import com.example.backend.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class AuthController {
    
    private final AuthService authService;
    
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return ResponseEntity.ok(response);
    }
    
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }
    
    @PostMapping("/logout")
    public ResponseEntity<?> logout() {
        // JWT là stateless, logout chỉ cần xóa token ở frontend
        return ResponseEntity.ok().build();
    }
}
```

### **Bước 7: Backend - JWT Token Provider**

**File**: `backend/src/main/java/com/example/backend/security/JwtTokenProvider.java`

```java
package com.example.backend.security;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;

@Component
public class JwtTokenProvider {
    
    @Value("${jwt.secret:your-secret-key-min-256-bits}")
    private String jwtSecret;
    
    @Value("${jwt.expiration:86400000}") // 24 hours
    private long jwtExpiration;
    
    public String generateToken(String email) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtExpiration);
        
        SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes());
        
        return Jwts.builder()
            .setSubject(email)
            .setIssuedAt(now)
            .setExpiration(expiryDate)
            .signWith(key, SignatureAlgorithm.HS512)
            .compact();
    }
    
    public String getEmailFromToken(String token) {
        SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes());
        return Jwts.parserBuilder()
            .setSigningKey(key)
            .build()
            .parseClaimsJws(token)
            .getBody()
            .getSubject();
    }
    
    public boolean validateToken(String token) {
        try {
            SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes());
            Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}
```

### **Bước 8: Backend - Security Configuration**

**File**: `backend/src/main/java/com/example/backend/config/SecurityConfig.java`

```java
package com.example.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

@Configuration
@EnableWebSecurity
public class SecurityConfig {
    
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
    
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(session -> 
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**").permitAll()
                .anyRequest().authenticated()
            );
        
        return http.build();
    }
    
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Arrays.asList("http://localhost:5173"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(true);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
```

---

## 🔄 QUY TRÌNH ĐĂNG NHẬP (LOGIN)

### **Bước 1: Frontend - Form Validation**

```javascript
const validateLogin = () => {
  const newErrors = {}
  
  if (!formData.email) {
    newErrors.email = 'Email không được để trống'
  }
  
  if (!formData.password) {
    newErrors.password = 'Mật khẩu không được để trống'
  }
  
  setErrors(newErrors)
  return Object.keys(newErrors).length === 0
}
```

### **Bước 2: Frontend - Handle Login**

```javascript
const handleLogin = async (e) => {
  e.preventDefault()
  
  if (!validateLogin()) {
    return
  }
  
  setLoading(true)
  try {
    const response = await authService.login({
      email: formData.email,
      password: formData.password
    })
    
    // Lưu token
    localStorage.setItem('token', response.token)
    localStorage.setItem('user', JSON.stringify(response.user))
    
    // Remember me
    if (rememberMe) {
      localStorage.setItem('rememberMe', 'true')
    }
    
    // Update AuthContext
    setUser(response.user)
    
    // Redirect
    navigate('/dashboard')
  } catch (error) {
    setErrors({ submit: error.message })
  } finally {
    setLoading(false)
  }
}
```

### **Bước 3: Frontend - AuthContext**

**File**: `frontend/src/context/AuthContext.jsx`

```javascript
import { createContext, useContext, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { authService } from '../services/authService'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  
  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token')
    const savedUser = localStorage.getItem('user')
    
    if (token && savedUser) {
      setUser(JSON.parse(savedUser))
      // Verify token với backend
      verifyToken()
    } else {
      setLoading(false)
    }
  }, [])
  
  const verifyToken = async () => {
    try {
      const userData = await authService.getCurrentUser()
      setUser(userData)
    } catch (error) {
      // Token invalid, logout
      logout()
    } finally {
      setLoading(false)
    }
  }
  
  const login = async (email, password) => {
    const response = await authService.login({ email, password })
    setUser(response.user)
    localStorage.setItem('token', response.token)
    localStorage.setItem('user', JSON.stringify(response.user))
    return response
  }
  
  const register = async (userData) => {
    const response = await authService.register(userData)
    setUser(response.user)
    localStorage.setItem('token', response.token)
    localStorage.setItem('user', JSON.stringify(response.user))
    return response
  }
  
  const logout = () => {
    setUser(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('rememberMe')
    navigate('/login')
  }
  
  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
```

### **Bước 4: Frontend - Protected Routes**

**File**: `frontend/src/components/ProtectedRoute.jsx`

```javascript
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  
  if (loading) {
    return <div>Loading...</div>
  }
  
  if (!user) {
    return <Navigate to="/login" replace />
  }
  
  return children
}
```

**Update App.jsx**:
```javascript
import ProtectedRoute from './components/ProtectedRoute'

<Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
  <Route path="/dashboard" element={<Dashboard />} />
  // ... other routes
</Route>
```

---

## 📦 Dependencies Cần Thêm

### **Backend (pom.xml)**

```xml
<!-- JWT -->
<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-api</artifactId>
    <version>0.12.3</version>
</dependency>
<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-impl</artifactId>
    <version>0.12.3</version>
    <scope>runtime</scope>
</dependency>
<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-jackson</artifactId>
    <version>0.12.3</version>
    <scope>runtime</scope>
</dependency>

<!-- Validation -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-validation</artifactId>
</dependency>
```

### **Frontend**

Không cần thêm dependencies, đã có `react-router-dom`.

---

## 🗄️ Database Schema

Đã có sẵn trong `database/schema.sql`:
- ✅ Table `users` (id, email, password, username, avatar_url, created_at, updated_at)
- ✅ Table `user_preferences` (user_id, dark_mode, language)

**Cần thêm** (nếu chưa có):
- Cột `role` trong `users` (USER, PREMIUM, ADMIN)

---

## 🔐 Configuration

### **Backend (application.properties)**

```properties
# JWT Configuration
jwt.secret=your-super-secret-key-minimum-256-bits-for-hs512-algorithm
jwt.expiration=86400000

# Database
spring.datasource.url=jdbc:mysql://localhost:3306/youtubeai
spring.datasource.username=root
spring.datasource.password=yourpassword

# CORS
spring.web.cors.allowed-origins=http://localhost:5173
```

---

## 📝 Checklist Implementation

### **Frontend**
- [ ] Tạo `authService.js` với các methods: register, login, logout, getCurrentUser
- [ ] Update `Login.jsx` với form validation và error handling
- [ ] Tạo `AuthContext.jsx` để quản lý state
- [ ] Tạo `ProtectedRoute.jsx` component
- [ ] Update `App.jsx` với AuthProvider và ProtectedRoute
- [ ] Thêm loading states và error messages
- [ ] Handle "Remember me" functionality

### **Backend**
- [ ] Tạo `RegisterRequest.java` DTO
- [ ] Tạo `AuthResponse.java` DTO
- [ ] Implement `AuthService.java` với register() và login()
- [ ] Implement `AuthController.java` với endpoints
- [ ] Tạo `JwtTokenProvider.java` cho JWT
- [ ] Tạo `SecurityConfig.java` với CORS và public endpoints
- [ ] Thêm JWT dependencies vào pom.xml
- [ ] Thêm validation dependencies
- [ ] Cấu hình application.properties

### **Testing**
- [ ] Test đăng ký với email hợp lệ
- [ ] Test đăng ký với email đã tồn tại
- [ ] Test đăng nhập với credentials đúng
- [ ] Test đăng nhập với credentials sai
- [ ] Test protected routes
- [ ] Test logout
- [ ] Test token expiration

---

## 🚀 Thứ Tự Implement

1. **Backend trước**:
   - DTOs
   - JWT Token Provider
   - Security Config
   - Auth Service
   - Auth Controller
   - Test với Postman

2. **Frontend sau**:
   - Auth Service
   - Auth Context
   - Update Login component
   - Protected Routes
   - Test integration

---

## 📊 Flow Diagram

### **Register Flow**
```
User Input → Validation → API Call → Backend Service → 
Password Hash → Save User → Create Preferences → 
Generate Token → Return Response → Save Token → Redirect
```

### **Login Flow**
```
User Input → Validation → API Call → Backend Service → 
Find User → Verify Password → Generate Token → 
Return Response → Save Token → Update Context → Redirect
```

---

## ⚠️ Lưu Ý Bảo Mật

1. ✅ **Password**: Luôn hash bằng BCrypt trước khi lưu
2. ✅ **JWT Secret**: Phải đủ dài (minimum 256 bits cho HS512)
3. ✅ **HTTPS**: Sử dụng HTTPS trong production
4. ✅ **Token Expiration**: Set thời gian hết hạn hợp lý
5. ✅ **CORS**: Chỉ allow origins cần thiết
6. ✅ **Validation**: Validate input ở cả frontend và backend
7. ✅ **Error Messages**: Không tiết lộ thông tin nhạy cảm

---

## 🎯 Kết Quả Mong Đợi

Sau khi hoàn thành:
- ✅ User có thể đăng ký tài khoản mới
- ✅ User có thể đăng nhập với email/password
- ✅ Token được lưu và tự động gửi kèm requests
- ✅ Protected routes chỉ cho phép user đã đăng nhập
- ✅ User có thể đăng xuất
- ✅ Session được duy trì khi refresh page

---

**Chúc bạn implement thành công! 🚀**

