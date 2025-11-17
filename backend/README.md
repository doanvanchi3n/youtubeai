# Backend - YouTube Analytics API

Spring Boot REST API for YouTube Analytics platform.

## Setup

1. **Configure database**:
   - Update `src/main/resources/application.properties` with your MySQL credentials
   - Run `database/schema.sql` to create database schema

2. **Build project**:
```bash
mvn clean install
```

3. **Run application**:
```bash
mvn spring-boot:run
```

The API will run on `http://localhost:8080`

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### User Management
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update profile
- `POST /api/user/avatar` - Upload avatar
- `PUT /api/user/password` - Change password

### YouTube Integration
- `POST /api/youtube/analyze` - Analyze YouTube URL
- `GET /api/channel/info` - Get channel info

### Dashboard
- `GET /api/dashboard/metrics` - Get metrics
- `GET /api/dashboard/trends` - Get trends

See `STRUCTURE.md` for detailed structure documentation.

## Dependencies

- Spring Boot 3.5.6
- Spring Data JPA
- Spring Security
- MySQL Connector
- Lombok

