# PHÂN TÍCH CHỨC NĂNG ĐĂNG NHẬP & ĐĂNG KÝ

## 📋 TỔNG QUAN

Chức năng **Đăng nhập (Login)** và **Đăng ký (Register)** cho phép người dùng tạo tài khoản mới, đăng nhập vào hệ thống, và xác thực thông qua JWT token. Hệ thống hỗ trợ 3 phương thức đăng nhập:
1. **Đăng ký/Đăng nhập bằng Email & Password** (truyền thống)
2. **Đăng nhập bằng Google OAuth 2.0** (SSO)
3. **Remember Me** (lưu trạng thái đăng nhập)

---

## 🎯 MỤC ĐÍCH

- ✅ User có thể đăng ký tài khoản mới với email/password
- ✅ User có thể đăng nhập với email/password
- ✅ User có thể đăng nhập bằng Google OAuth
- ✅ Hệ thống xác thực và cấp JWT token
- ✅ Token được lưu ở frontend và sử dụng cho các request tiếp theo
- ✅ User có thể đăng xuất
- ✅ Protected routes chỉ cho phép user đã đăng nhập

---

## 🔄 LUỒNG HOẠT ĐỘNG

### 1. ĐĂNG KÝ (REGISTER)

#### 1.1. Điểm bắt đầu

**Người dùng kích hoạt:**
- Frontend: User nhập thông tin (username, email, password, confirmPassword) → Click "Đăng ký"
- File khởi đầu: [`frontend/src/pages/Login/Login.jsx`](frontend/src/pages/Login/Login.jsx)

**API endpoint được gọi:**
- `POST /api/auth/register`
- Controller: [`backend/src/main/java/com/example/backend/controller/AuthController.java`](backend/src/main/java/com/example/backend/controller/AuthController.java)
- Method: `register()`

#### 1.2. Luồng xử lý bên trong

**Bước 1: Frontend - Form Validation**
- File: [`frontend/src/pages/Login/Login.jsx`](frontend/src/pages/Login/Login.jsx)
- Function: `validateRegister()`
  - Kiểm tra username: không rỗng, tối thiểu 3 ký tự
  - Kiểm tra email: format hợp lệ (regex)
  - Kiểm tra password: không rỗng, tối thiểu 6 ký tự
  - Kiểm tra confirmPassword: khớp với password

**Bước 2: Frontend - Gửi Request**
- File: [`frontend/src/services/authService.js`](frontend/src/services/authService.js)
- Function: `register(userData)`
  - Gọi `POST /api/auth/register`
  - Body: `{ username, email, password }`

**Bước 3: Backend Controller nhận request**
- File: [`backend/src/main/java/com/example/backend/controller/AuthController.java`](backend/src/main/java/com/example/backend/controller/AuthController.java)
- Method: `register(@Valid @RequestBody RegisterRequest request)`
  - Validate request với `@Valid` (Bean Validation)
  - Gọi `AuthService.register(request)`

**Bước 4: AuthService xử lý**
- File: [`backend/src/main/java/com/example/backend/service/AuthService.java`](backend/src/main/java/com/example/backend/service/AuthService.java)
- Method: `register(RegisterRequest request)`
  - **Kiểm tra email đã tồn tại:**
    ```java
    if (userRepository.existsByEmail(request.getEmail())) {
        throw new RuntimeException("Email đã được sử dụng");
    }
    ```
  - **Tạo User mới:**
    - Username, Email từ request
    - Password: Hash bằng `PasswordEncoder.encode()` (BCrypt)
    - Role: "USER" (mặc định)
    - Locked: false
  - **Lưu User vào database**
  - **Tạo UserPreferences mặc định:**
    - DarkMode: true
    - Language: "vi"
  - **Generate JWT token:**
    ```java
    String token = jwtTokenProvider.generateToken(user.getId(), user.getEmail(), user.getRole());
    ```
  - **Trả về AuthResponse:**
    - Token (JWT)
    - UserInfo (id, username, email, avatarUrl, role)

**Bước 5: Frontend nhận response**
- File: [`frontend/src/context/AuthContext.jsx`](frontend/src/context/AuthContext.jsx)
- Function: `register(userData)`
  - Lưu token vào `localStorage.setItem('token', response.token)`
  - Lưu user info vào `localStorage.setItem('user', JSON.stringify(response.user))`
  - Update state `setUser(response.user)`
  - Redirect:
    - Nếu role = "ADMIN" → `/admin`
    - Nếu role = "USER" → `/dashboard`

#### 1.3. Sơ đồ luồng

```
User nhập thông tin → Click "Đăng ký"
    ↓
Frontend: Login.jsx → validateRegister()
    ↓
Frontend: authService.register(userData)
    ↓
POST /api/auth/register
    ↓
AuthController.register() → @Valid RegisterRequest
    ↓
AuthService.register(request)
    ├─→ Kiểm tra email đã tồn tại
    ├─→ PasswordEncoder.encode(password) → Hash password (BCrypt)
    ├─→ Tạo User entity (role: "USER", locked: false)
    ├─→ Lưu User vào database
    ├─→ Tạo UserPreferences mặc định (darkMode: true, language: "vi")
    └─→ JwtTokenProvider.generateToken() → Generate JWT token
    ↓
Trả về AuthResponse (token, user info)
    ↓
Frontend: Lưu token và user vào localStorage
    ↓
Redirect đến dashboard (hoặc /admin nếu role = ADMIN)
```

---

### 2. ĐĂNG NHẬP (LOGIN)

#### 2.1. Điểm bắt đầu

**Người dùng kích hoạt:**
- Frontend: User nhập email/password → Click "Đăng nhập"
- File khởi đầu: [`frontend/src/pages/Login/Login.jsx`](frontend/src/pages/Login/Login.jsx)

**API endpoint được gọi:**
- `POST /api/auth/login`
- Controller: [`backend/src/main/java/com/example/backend/controller/AuthController.java`](backend/src/main/java/com/example/backend/controller/AuthController.java)
- Method: `login()`

#### 2.2. Luồng xử lý bên trong

**Bước 1: Frontend - Form Validation**
- File: [`frontend/src/pages/Login/Login.jsx`](frontend/src/pages/Login/Login.jsx)
- Function: `validateLogin()`
  - Kiểm tra email: format hợp lệ
  - Kiểm tra password: không rỗng, tối thiểu 6 ký tự

**Bước 2: Frontend - Gửi Request**
- File: [`frontend/src/services/authService.js`](frontend/src/services/authService.js)
- Function: `login(email, password)`
  - Gọi `POST /api/auth/login`
  - Body: `{ email, password }`

**Bước 3: Backend Controller nhận request**
- File: [`backend/src/main/java/com/example/backend/controller/AuthController.java`](backend/src/main/java/com/example/backend/controller/AuthController.java)
- Method: `login(@Valid @RequestBody LoginRequest request)`
  - Validate request với `@Valid`
  - Gọi `AuthService.login(request)`

**Bước 4: AuthService xử lý**
- File: [`backend/src/main/java/com/example/backend/service/AuthService.java`](backend/src/main/java/com/example/backend/service/AuthService.java)
- Method: `login(LoginRequest request)`
  - **Tìm user theo email:**
    ```java
    User user = userRepository.findByEmail(request.getEmail())
        .orElseThrow(() -> new RuntimeException("Email hoặc mật khẩu không đúng"));
    ```
  - **Kiểm tra tài khoản bị khóa:**
    ```java
    if (user.getLocked()) {
        throw new RuntimeException("Tài khoản đã bị khóa. Vui lòng liên hệ admin.");
    }
    ```
  - **Verify password:**
    ```java
    if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
        throw new RuntimeException("Email hoặc mật khẩu không đúng");
    }
    ```
  - **Đảm bảo role không null** (fix nếu thiếu)
  - **Generate JWT token:**
    ```java
    String token = jwtTokenProvider.generateToken(user.getId(), user.getEmail(), role);
    ```
  - **Trả về AuthResponse** (token, user info)

**Bước 5: Frontend nhận response**
- File: [`frontend/src/context/AuthContext.jsx`](frontend/src/context/AuthContext.jsx)
- Function: `login(email, password)`
  - Lưu token vào `localStorage`
  - Lưu user info vào `localStorage`
  - Update state
  - Redirect theo role

#### 2.3. Sơ đồ luồng

```
User nhập email/password → Click "Đăng nhập"
    ↓
Frontend: Login.jsx → validateLogin()
    ↓
Frontend: authService.login(email, password)
    ↓
POST /api/auth/login
    ↓
AuthController.login() → @Valid LoginRequest
    ↓
AuthService.login(request)
    ├─→ Tìm user theo email (userRepository.findByEmail())
    ├─→ Kiểm tra tài khoản bị khóa (user.getLocked())
    ├─→ PasswordEncoder.matches() → Verify password (BCrypt)
    └─→ JwtTokenProvider.generateToken() → Generate JWT token
    ↓
Trả về AuthResponse (token, user info)
    ↓
Frontend: Lưu token và user vào localStorage
    ↓
Redirect đến dashboard (hoặc /admin nếu role = ADMIN)
```

---

### 3. ĐĂNG NHẬP GOOGLE OAUTH

#### 3.1. Điểm bắt đầu

**Người dùng kích hoạt:**
- Frontend: User click button "Đăng nhập với Google"
- Google OAuth popup → User chọn tài khoản → Google trả về ID token
- File khởi đầu: [`frontend/src/pages/Login/Login.jsx`](frontend/src/pages/Login/Login.jsx)

**API endpoint được gọi:**
- `POST /api/auth/google`
- Controller: [`backend/src/main/java/com/example/backend/controller/AuthController.java`](backend/src/main/java/com/example/backend/controller/AuthController.java)
- Method: `googleAuth()`

#### 3.2. Luồng xử lý bên trong

**Bước 1: Frontend - Google OAuth**
- File: [`frontend/src/pages/Login/Login.jsx`](frontend/src/pages/Login/Login.jsx)
- Function: `handleGoogleAuth()`
  - Gọi Google OAuth API để lấy ID token
  - Gửi token đến backend

**Bước 2: Backend - Verify Google Token**
- File: [`backend/src/main/java/com/example/backend/service/AuthService.java`](backend/src/main/java/com/example/backend/service/AuthService.java)
- Method: `googleAuth(GoogleAuthRequest request)`
  - **Verify Google ID token:**
    ```java
    GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(...)
        .setAudience(Collections.singletonList(googleClientId))
        .build();
    GoogleIdToken idToken = verifier.verify(request.getToken());
    ```
  - **Extract thông tin từ payload:**
    - Google ID (subject)
    - Email
    - Name
    - Picture (avatar URL)
  - **Tìm user theo Google ID hoặc email:**
    - Nếu user đã tồn tại → Update thông tin (Google ID, avatar)
    - Nếu user chưa tồn tại → Tạo user mới với:
      - Email, Username (từ name hoặc email prefix)
      - Google ID
      - Avatar URL
      - Password: dummy hash (`google_oauth_` + googleId)
      - Role: "USER"
      - Tạo UserPreferences mặc định
  - **Kiểm tra tài khoản bị khóa**
  - **Generate JWT token**
  - **Trả về AuthResponse**

#### 3.3. Sơ đồ luồng

```
User click "Đăng nhập với Google"
    ↓
Google OAuth popup → User chọn tài khoản
    ↓
Google trả về ID token
    ↓
Frontend: authService.googleAuth(token)
    ↓
POST /api/auth/google
    ↓
AuthController.googleAuth() → GoogleAuthRequest
    ↓
AuthService.googleAuth(request)
    ├─→ GoogleIdTokenVerifier.verify() → Verify Google token
    ├─→ Extract: googleId, email, name, picture
    ├─→ Tìm user theo googleId hoặc email
    │   ├─→ Nếu có: Update thông tin
    │   └─→ Nếu không: Tạo user mới
    ├─→ Kiểm tra tài khoản bị khóa
    └─→ JwtTokenProvider.generateToken() → Generate JWT token
    ↓
Trả về AuthResponse (token, user info)
    ↓
Frontend: Lưu token và user vào localStorage
    ↓
Redirect đến dashboard
```

---

## 🔐 CÔNG NGHỆ SỬ DỤNG

### 1. JWT (JSON Web Token)

**Mục đích:** Xác thực người dùng mà không cần lưu session trên server (stateless)

**Công nghệ:**
- Library: `io.jsonwebtoken` (Java)
- Algorithm: **HS512** (HMAC-SHA512)
- Secret key: Tối thiểu 256 bits (64 bytes)

**File:** [`backend/src/main/java/com/example/backend/security/JwtTokenProvider.java`](backend/src/main/java/com/example/backend/security/JwtTokenProvider.java)

**Các methods:**

1. **`generateToken(userId, email, role)`**
   - Tạo JWT token với claims:
     - `subject`: email
     - `userId`: Long
     - `role`: String
     - `issuedAt`: Thời gian tạo
     - `expiration`: Thời gian hết hạn (24 giờ mặc định)
   - Sign với secret key (HS512)

2. **`validateToken(token)`**
   - Verify token signature
   - Kiểm tra expiration
   - Trả về `true` nếu valid, `false` nếu invalid

3. **`getUserIdFromToken(token)`**
   - Extract userId từ claims

4. **`getEmailFromToken(token)`**
   - Extract email từ subject

5. **`getRoleFromToken(token)`**
   - Extract role từ claims

**Cấu hình:**
- File: [`backend/src/main/resources/application.properties`](backend/src/main/resources/application.properties)
  ```properties
  jwt.secret=your-super-secret-key-minimum-256-bits-for-hs512-algorithm
  jwt.expiration=86400000  # 24 hours (milliseconds)
  ```

---

### 2. BCrypt Password Hashing

**Mục đích:** Hash password trước khi lưu vào database (không lưu plain text)

**Công nghệ:**
- Library: Spring Security `BCryptPasswordEncoder`
- Algorithm: **BCrypt** (adaptive hashing)

**File:** [`backend/src/main/java/com/example/backend/config/SecurityConfig.java`](backend/src/main/java/com/example/backend/config/SecurityConfig.java)

**Cấu hình:**
```java
@Bean
public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();
}
```

**Sử dụng:**

1. **Hash password (Register):**
   ```java
   user.setPassword(passwordEncoder.encode(request.getPassword()));
   ```

2. **Verify password (Login):**
   ```java
   if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
       throw new RuntimeException("Email hoặc mật khẩu không đúng");
   }
   ```

**Đặc điểm:**
- Mỗi lần hash tạo ra giá trị khác nhau (salt tự động)
- Không thể reverse (one-way hash)
- Adaptive: có thể tăng cost factor để chống brute-force

---

### 3. Google OAuth 2.0

**Mục đích:** Đăng nhập bằng tài khoản Google (SSO - Single Sign-On)

**Công nghệ:**
- Library: `com.google.api-client:google-api-client` (Java)
- Protocol: **OAuth 2.0** + **OpenID Connect**

**File:** [`backend/src/main/java/com/example/backend/service/AuthService.java`](backend/src/main/java/com/example/backend/service/AuthService.java)

**Cấu hình:**
- File: [`backend/src/main/resources/application.properties`](backend/src/main/resources/application.properties)
  ```properties
  google.client-id=650650176434-ubmgdv9cioe420u6p87c03tvprcgm40v.apps.googleusercontent.com
  ```

**Luồng xử lý:**

1. **Frontend:** Gọi Google OAuth API → Nhận ID token
2. **Backend:** Verify ID token với Google:
   ```java
   GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
       new NetHttpTransport(), 
       new GsonFactory())
       .setAudience(Collections.singletonList(googleClientId))
       .build();
   GoogleIdToken idToken = verifier.verify(request.getToken());
   ```
3. **Extract thông tin:** email, name, picture, googleId
4. **Tạo/Update user:** Dựa trên Google ID hoặc email
5. **Generate JWT token:** Giống như login thông thường

---

### 4. Spring Security

**Mục đích:** Cấu hình security cho ứng dụng Spring Boot

**File:** [`backend/src/main/java/com/example/backend/config/SecurityConfig.java`](backend/src/main/java/com/example/backend/config/SecurityConfig.java)

**Cấu hình chính:**

1. **Password Encoder:**
   ```java
   @Bean
   public PasswordEncoder passwordEncoder() {
       return new BCryptPasswordEncoder();
   }
   ```

2. **Security Filter Chain:**
   - **CORS:** Cho phép `http://localhost:5173`
   - **Session:** STATELESS (dùng JWT, không dùng session)
   - **CSRF:** Disabled (vì dùng JWT)
   - **Authorization:**
     - `/api/auth/**`: Permit all (public endpoints)
     - Các endpoints khác: Manual JWT validation trong controllers

3. **CORS Configuration:**
   ```java
   configuration.setAllowedOrigins(Arrays.asList("http://localhost:5173"));
   configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
   configuration.setAllowedHeaders(Arrays.asList("*"));
   configuration.setAllowCredentials(true);
   ```

---

### 5. React Context API

**Mục đích:** Quản lý state đăng nhập ở frontend (global state)

**File:** [`frontend/src/context/AuthContext.jsx`](frontend/src/context/AuthContext.jsx)

**Các functions:**

1. **`login(email, password)`**
   - Gọi `authService.login()`
   - Lưu token và user vào localStorage
   - Update state

2. **`register(userData)`**
   - Gọi `authService.register()`
   - Lưu token và user vào localStorage
   - Update state

3. **`googleLogin(token)`**
   - Gọi `authService.googleAuth()`
   - Lưu token và user vào localStorage
   - Update state

4. **`logout()`**
   - Xóa token và user khỏi localStorage
   - Clear state
   - Redirect đến `/login`

5. **`verifyToken()`**
   - Kiểm tra token khi app khởi động
   - Gọi `GET /api/auth/me` để verify
   - Nếu invalid → logout

**Sử dụng:**
```javascript
const { user, login, register, logout } = useAuth()
```

---

### 6. LocalStorage

**Mục đích:** Lưu trữ token và user info ở client-side (persistent storage)

**Lưu trữ:**
- `token`: JWT token
- `user`: User info (JSON stringified)
- `rememberMe`: Boolean (optional)

**Sử dụng:**
```javascript
// Lưu
localStorage.setItem('token', response.token)
localStorage.setItem('user', JSON.stringify(response.user))

// Đọc
const token = localStorage.getItem('token')
const user = JSON.parse(localStorage.getItem('user'))

// Xóa
localStorage.removeItem('token')
localStorage.removeItem('user')
```

**Lưu ý:**
- LocalStorage không tự động expire → Cần check expiration trong JWT token
- Không an toàn 100% (có thể bị XSS) → Nên dùng HttpOnly cookies trong production

---

## 📊 CẤU TRÚC DỮ LIỆU

### 1. RegisterRequest

**File:** [`backend/src/main/java/com/example/backend/dto/request/RegisterRequest.java`](backend/src/main/java/com/example/backend/dto/request/RegisterRequest.java)

```java
{
    "username": String (required, min 3 chars),
    "email": String (required, valid email format),
    "password": String (required, min 6 chars)
}
```

### 2. LoginRequest

**File:** [`backend/src/main/java/com/example/backend/dto/request/LoginRequest.java`](backend/src/main/java/com/example/backend/dto/request/LoginRequest.java)

```java
{
    "email": String (required),
    "password": String (required)
}
```

### 3. AuthResponse

**File:** [`backend/src/main/java/com/example/backend/dto/response/AuthResponse.java`](backend/src/main/java/com/example/backend/dto/response/AuthResponse.java)

```java
{
    "token": String (JWT token),
    "user": {
        "id": Long,
        "username": String,
        "email": String,
        "avatarUrl": String (nullable),
        "role": String ("USER" | "ADMIN")
    }
}
```

---

## 🔒 BẢO MẬT

### 1. Password Security

- ✅ **BCrypt hashing:** Không lưu plain text
- ✅ **Minimum length:** 6 ký tự
- ✅ **Validation:** Frontend và Backend

### 2. JWT Security

- ✅ **HS512 algorithm:** Strong signature
- ✅ **Secret key:** Tối thiểu 256 bits
- ✅ **Expiration:** 24 giờ (có thể cấu hình)
- ✅ **Claims:** userId, email, role

### 3. Token Validation

- ✅ **Signature verification:** Đảm bảo token không bị giả mạo
- ✅ **Expiration check:** Tự động hết hạn sau 24 giờ
- ✅ **Manual validation:** Mỗi controller tự validate token

### 4. Account Locking

- ✅ **Locked field:** User có thể bị khóa bởi admin
- ✅ **Check on login:** Kiểm tra trước khi đăng nhập

---

## 📝 TÓM TẮT

### Đăng ký:
1. User nhập thông tin → Frontend validate
2. Gửi request đến `/api/auth/register`
3. Backend: Hash password (BCrypt) → Tạo user → Generate JWT
4. Frontend: Lưu token và user → Redirect

### Đăng nhập:
1. User nhập email/password → Frontend validate
2. Gửi request đến `/api/auth/login`
3. Backend: Tìm user → Verify password (BCrypt) → Generate JWT
4. Frontend: Lưu token và user → Redirect

### Google OAuth:
1. User click "Đăng nhập với Google" → Google OAuth popup
2. Google trả về ID token
3. Backend: Verify Google token → Tạo/Update user → Generate JWT
4. Frontend: Lưu token và user → Redirect

### Công nghệ chính:
- **JWT (HS512):** Xác thực stateless
- **BCrypt:** Hash password
- **Google OAuth 2.0:** SSO
- **Spring Security:** Security framework
- **React Context API:** State management
- **LocalStorage:** Client-side storage

---

## 🔗 LINK ĐẾN CÁC FILE QUAN TRỌNG

### Backend:
- [`AuthController.java`](backend/src/main/java/com/example/backend/controller/AuthController.java) - REST endpoints
- [`AuthService.java`](backend/src/main/java/com/example/backend/service/AuthService.java) - Business logic
- [`JwtTokenProvider.java`](backend/src/main/java/com/example/backend/security/JwtTokenProvider.java) - JWT utilities
- [`SecurityConfig.java`](backend/src/main/java/com/example/backend/config/SecurityConfig.java) - Security configuration

### Frontend:
- [`Login.jsx`](frontend/src/pages/Login/Login.jsx) - Login/Register UI
- [`AuthContext.jsx`](frontend/src/context/AuthContext.jsx) - Auth state management
- [`authService.js`](frontend/src/services/authService.js) - API calls

### Configuration:
- [`application.properties`](backend/src/main/resources/application.properties) - JWT secret, Google client ID

