# Database Schema Documentation

## Tổng Quan

Database schema cho YouTube AI Analytics project sử dụng MySQL.

## Cấu Trúc Database

### Các Bảng Chính

1. **users** - Thông tin người dùng
2. **user_preferences** - Preferences của user (dark mode, language)
3. **channels** - Thông tin kênh YouTube
4. **videos** - Thông tin video YouTube
5. **comments** - Bình luận từ video
6. **analytics** - Dữ liệu analytics theo ngày
7. **video_topics** - Chủ đề/topic của video
8. **video_topic_mapping** - Mapping video và topic (many-to-many)
9. **keywords** - Từ khóa được nhắc đến trong bình luận

### Views

1. **v_channel_summary** - Tổng hợp thông tin kênh
2. **v_video_engagement** - Engagement metrics của video
3. **v_comment_sentiment_summary** - Tổng hợp sentiment của bình luận

## Cài Đặt

### 1. Tạo Database

```sql
CREATE DATABASE youtubeai CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE youtubeai;
```

### 2. Chạy Schema

```bash
mysql -u root -p youtubeai < schema.sql
```

### 3. Cấu Hình Application

Cập nhật `application.properties`:
```properties
spring.datasource.url=jdbc:mysql://localhost:3306/youtubeai
spring.datasource.username=root
spring.datasource.password=your_password
```

## Quan Hệ Giữa Các Bảng

```
users
  ├── user_preferences (1:1)
  └── channels (1:N)
        ├── videos (1:N)
        │     └── comments (1:N)
        ├── analytics (1:N)
        ├── video_topics (1:N)
        │     └── video_topic_mapping (N:M với videos)
        └── keywords (1:N)
```

## Indexes

Tất cả các foreign keys và các trường thường được query đã được index để tối ưu performance.

## Notes

- Tất cả timestamps sử dụng `TIMESTAMP` với timezone
- Character set: `utf8mb4` để hỗ trợ emoji và ký tự đặc biệt
- Foreign keys có `ON DELETE CASCADE` để đảm bảo data integrity

