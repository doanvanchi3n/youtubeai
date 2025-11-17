# Backend Structure (Spring Boot)

## Cấu Trúc Thư Mục

```
backend/
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/
│   │   │       └── example/
│   │   │           └── backend/
│   │   │               ├── BackendApplication.java
│   │   │               │
│   │   │               ├── config/                    # Configuration classes
│   │   │               │   ├── SecurityConfig.java
│   │   │               │   ├── WebConfig.java
│   │   │               │   ├── JwtConfig.java
│   │   │               │   └── CorsConfig.java
│   │   │               │
│   │   │               ├── controller/                # REST Controllers
│   │   │               │   ├── AuthController.java
│   │   │               │   ├── UserController.java
│   │   │               │   ├── ChannelController.java
│   │   │               │   ├── VideoController.java
│   │   │               │   ├── CommentController.java
│   │   │               │   ├── AnalyticsController.java
│   │   │               │   ├── DashboardController.java
│   │   │               │   ├── CommunityController.java
│   │   │               │   └── AIController.java
│   │   │               │
│   │   │               ├── service/                   # Business Logic
│   │   │               │   ├── AuthService.java
│   │   │               │   ├── UserService.java
│   │   │               │   ├── ChannelService.java
│   │   │               │   ├── VideoService.java
│   │   │               │   ├── CommentService.java
│   │   │               │   ├── AnalyticsService.java
│   │   │               │   ├── DashboardService.java
│   │   │               │   ├── CommunityService.java
│   │   │               │   ├── AIService.java
│   │   │               │   ├── YouTubeApiService.java
│   │   │               │   └── DataSyncService.java
│   │   │               │
│   │   │               ├── repository/                # Data Access Layer
│   │   │               │   ├── UserRepository.java
│   │   │               │   ├── ChannelRepository.java
│   │   │               │   ├── VideoRepository.java
│   │   │               │   ├── CommentRepository.java
│   │   │               │   ├── AnalyticsRepository.java
│   │   │               │   ├── VideoTopicRepository.java
│   │   │               │   └── KeywordRepository.java
│   │   │               │
│   │   │               ├── model/                     # Entity Models
│   │   │               │   ├── User.java
│   │   │               │   ├── UserPreferences.java
│   │   │               │   ├── Channel.java
│   │   │               │   ├── Video.java
│   │   │               │   ├── Comment.java
│   │   │               │   ├── Analytics.java
│   │   │               │   ├── VideoTopic.java
│   │   │               │   ├── VideoTopicMapping.java
│   │   │               │   └── Keyword.java
│   │   │               │
│   │   │               ├── dto/                      # Data Transfer Objects
│   │   │               │   ├── request/
│   │   │               │   │   ├── LoginRequest.java
│   │   │               │   │   ├── RegisterRequest.java
│   │   │               │   │   ├── AnalyzeUrlRequest.java
│   │   │               │   │   ├── UpdateUserRequest.java
│   │   │               │   │   └── GenerateContentRequest.java
│   │   │               │   ├── response/
│   │   │               │   │   ├── AuthResponse.java
│   │   │               │   │   ├── UserResponse.java
│   │   │               │   │   ├── ChannelResponse.java
│   │   │               │   │   ├── VideoResponse.java
│   │   │               │   │   ├── CommentResponse.java
│   │   │               │   │   ├── MetricsResponse.java
│   │   │               │   │   ├── TrendsResponse.java
│   │   │               │   │   └── ApiResponse.java
│   │   │               │   └── ErrorResponse.java
│   │   │               │
│   │   │               ├── security/                 # Security
│   │   │               │   ├── JwtTokenProvider.java
│   │   │               │   ├── JwtAuthenticationFilter.java
│   │   │               │   ├── UserDetailsServiceImpl.java
│   │   │               │   └── SecurityUser.java
│   │   │               │
│   │   │               ├── util/                      # Utilities
│   │   │               │   ├── YouTubeUrlParser.java
│   │   │               │   ├── DateUtil.java
│   │   │               │   ├── ValidationUtil.java
│   │   │               │   └── Constants.java
│   │   │               │
│   │   │               ├── exception/                # Exception Handling
│   │   │               │   ├── GlobalExceptionHandler.java
│   │   │               │   ├── ResourceNotFoundException.java
│   │   │               │   ├── BadRequestException.java
│   │   │               │   ├── UnauthorizedException.java
│   │   │               │   └── YouTubeApiException.java
│   │   │               │
│   │   │               └── task/                     # Scheduled Tasks
│   │   │                   ├── DataSyncTask.java
│   │   │                   └── AISyncTask.java
│   │   │
│   │   └── resources/
│   │       ├── application.properties
│   │       ├── application-dev.properties
│   │       ├── application-prod.properties
│   │       └── static/
│   │
│   └── test/
│       └── java/
│           └── com/
│               └── example/
│                   └── backend/
│                       ├── controller/
│                       ├── service/
│                       └── repository/
│
├── pom.xml
└── README.md
```

## Mô Tả Các Package

### config/
Các class cấu hình Spring Boot:
- **SecurityConfig**: Cấu hình Spring Security, JWT
- **WebConfig**: Cấu hình CORS, Interceptors
- **JwtConfig**: Cấu hình JWT properties
- **CorsConfig**: Cấu hình Cross-Origin Resource Sharing

### controller/
REST API Controllers:
- **AuthController**: `/api/auth/*` - Login, Logout, Register
- **UserController**: `/api/user/*` - User profile, preferences
- **ChannelController**: `/api/channel/*` - Channel operations
- **VideoController**: `/api/videos/*` - Video operations
- **CommentController**: `/api/comments/*` - Comment operations
- **AnalyticsController**: `/api/analytics/*` - Analytics data
- **DashboardController**: `/api/dashboard/*` - Dashboard metrics
- **CommunityController**: `/api/community/*` - Community insights
- **AIController**: `/api/ai/*` - AI operations

### service/
Business Logic Layer:
- **AuthService**: Authentication & Authorization
- **UserService**: User management
- **ChannelService**: Channel operations
- **VideoService**: Video operations
- **CommentService**: Comment operations
- **AnalyticsService**: Analytics calculations
- **DashboardService**: Dashboard data aggregation
- **CommunityService**: Community insights
- **AIService**: Integration với AI module
- **YouTubeApiService**: YouTube Data API v3 integration
- **DataSyncService**: Sync data từ YouTube API

### repository/
Data Access Layer (JPA Repositories):
- Extends `JpaRepository<T, ID>`
- Custom query methods

### model/
JPA Entity Models:
- Annotated với `@Entity`, `@Table`
- Relationships với `@OneToMany`, `@ManyToOne`, etc.

### dto/
Data Transfer Objects:
- **request/**: Request DTOs cho API endpoints
- **response/**: Response DTOs cho API responses
- Tách biệt với Entity models

### security/
Security & Authentication:
- **JwtTokenProvider**: Generate & validate JWT tokens
- **JwtAuthenticationFilter**: Filter để validate JWT
- **UserDetailsServiceImpl**: Load user details
- **SecurityUser**: User principal

### util/
Utility Classes:
- **YouTubeUrlParser**: Parse YouTube URLs
- **DateUtil**: Date formatting utilities
- **ValidationUtil**: Validation helpers
- **Constants**: Application constants

### exception/
Exception Handling:
- **GlobalExceptionHandler**: `@ControllerAdvice` để handle exceptions
- Custom exceptions cho các error cases

### task/
Scheduled Tasks:
- **DataSyncTask**: Sync data từ YouTube định kỳ
- **AISyncTask**: Sync AI analysis định kỳ

## Dependencies Cần Thêm

Thêm vào `pom.xml`:

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

<!-- YouTube API -->
<dependency>
    <groupId>com.google.apis</groupId>
    <artifactId>google-api-services-youtube</artifactId>
    <version>v3-rev20230816-2.0.0</version>
</dependency>
<dependency>
    <groupId>com.google.api-client</groupId>
    <artifactId>google-api-client</artifactId>
    <version>2.2.0</version>
</dependency>

<!-- Password Encoding -->
<dependency>
    <groupId>org.springframework.security</groupId>
    <artifactId>spring-security-crypto</artifactId>
</dependency>

<!-- HTTP Client -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-webflux</artifactId>
</dependency>
```

## Application Properties

Cập nhật `application.properties`:

```properties
# Server
server.port=8080

# Database
spring.datasource.url=jdbc:mysql://localhost:3306/youtubeai
spring.datasource.username=root
spring.datasource.password=
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver

# JPA
spring.jpa.hibernate.ddl-auto=validate
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.MySQLDialect
spring.jpa.properties.hibernate.format_sql=true

# JWT
jwt.secret=your-secret-key-change-in-production
jwt.expiration=86400000

# YouTube API
youtube.api.key=your-youtube-api-key
youtube.api.quota.limit=10000

# AI Module
ai.module.url=http://localhost:5000

# CORS
cors.allowed-origins=http://localhost:5173,http://localhost:3000
```

