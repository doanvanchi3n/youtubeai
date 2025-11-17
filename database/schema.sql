-- =====================================================
-- YouTube AI Analytics Database Schema
-- Database: youtubeai
-- =====================================================

-- Drop existing tables if they exist (for development)
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS `user_preferences`;
DROP TABLE IF EXISTS `keywords`;
DROP TABLE IF EXISTS `video_topics`;
DROP TABLE IF EXISTS `comments`;
DROP TABLE IF EXISTS `videos`;
DROP TABLE IF EXISTS `analytics`;
DROP TABLE IF EXISTS `channels`;
DROP TABLE IF EXISTS `users`;
SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================
-- Table: users
-- Mô tả: Lưu thông tin người dùng
-- =====================================================
CREATE TABLE `users` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(255) NOT NULL UNIQUE,
    `password` VARCHAR(255) NOT NULL,
    `username` VARCHAR(100) NOT NULL,
    `avatar_url` VARCHAR(500) DEFAULT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `idx_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Table: user_preferences
-- Mô tả: Lưu preferences của user (dark mode, language)
-- =====================================================
CREATE TABLE `user_preferences` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT NOT NULL,
    `dark_mode` BOOLEAN DEFAULT TRUE,
    `language` VARCHAR(10) DEFAULT 'vi' COMMENT 'vi|en',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_user_id` (`user_id`),
    CONSTRAINT `fk_preferences_user` FOREIGN KEY (`user_id`) 
        REFERENCES `users` (`id`) ON DELETE CASCADE,
    INDEX `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Table: channels
-- Mô tả: Lưu thông tin kênh YouTube
-- =====================================================
CREATE TABLE `channels` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT NOT NULL,
    `channel_id` VARCHAR(255) NOT NULL UNIQUE COMMENT 'YouTube Channel ID',
    `channel_name` VARCHAR(255) NOT NULL,
    `description` TEXT DEFAULT NULL,
    `avatar_url` VARCHAR(500) DEFAULT NULL,
    `subscriber_count` BIGINT DEFAULT 0,
    `video_count` INT DEFAULT 0,
    `view_count` BIGINT DEFAULT 0,
    `uploads_playlist_id` VARCHAR(255) DEFAULT NULL,
    `last_synced_at` TIMESTAMP NULL DEFAULT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    CONSTRAINT `fk_channel_user` FOREIGN KEY (`user_id`) 
        REFERENCES `users` (`id`) ON DELETE CASCADE,
    INDEX `idx_channel_id` (`channel_id`),
    INDEX `idx_user_id` (`user_id`),
    INDEX `idx_last_synced` (`last_synced_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Table: videos
-- Mô tả: Lưu thông tin video YouTube
-- =====================================================
CREATE TABLE `videos` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `channel_id` BIGINT NOT NULL COMMENT 'FK to channels.id',
    `video_id` VARCHAR(255) NOT NULL COMMENT 'YouTube Video ID',
    `title` VARCHAR(500) NOT NULL,
    `description` TEXT DEFAULT NULL,
    `thumbnail_url` VARCHAR(500) DEFAULT NULL,
    `duration` INT DEFAULT NULL COMMENT 'Duration in seconds',
    `view_count` BIGINT DEFAULT 0,
    `like_count` BIGINT DEFAULT 0,
    `comment_count` INT DEFAULT 0,
    `published_at` TIMESTAMP NULL DEFAULT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    CONSTRAINT `fk_video_channel` FOREIGN KEY (`channel_id`) 
        REFERENCES `channels` (`id`) ON DELETE CASCADE,
    UNIQUE KEY `uk_video_id` (`video_id`),
    INDEX `idx_channel_id` (`channel_id`),
    INDEX `idx_video_id` (`video_id`),
    INDEX `idx_published_at` (`published_at`),
    INDEX `idx_view_count` (`view_count`),
    INDEX `idx_like_count` (`like_count`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Table: comments
-- Mô tả: Lưu bình luận từ video
-- =====================================================
CREATE TABLE `comments` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `video_id` BIGINT NOT NULL COMMENT 'FK to videos.id',
    `comment_id` VARCHAR(255) NOT NULL COMMENT 'YouTube Comment ID',
    `parent_comment_id` VARCHAR(255) DEFAULT NULL COMMENT 'For replies',
    `author_name` VARCHAR(255) NOT NULL,
    `author_avatar` VARCHAR(500) DEFAULT NULL,
    `content` TEXT NOT NULL,
    `like_count` INT DEFAULT 0,
    `sentiment` VARCHAR(20) DEFAULT NULL COMMENT 'positive|negative|neutral',
    `emotion` VARCHAR(50) DEFAULT NULL COMMENT 'happy|sad|angry|suggestion|love',
    `sentiment_score` DECIMAL(5,4) DEFAULT NULL COMMENT 'Confidence score 0-1',
    `is_analyzed` BOOLEAN DEFAULT FALSE,
    `analyzed_at` TIMESTAMP NULL DEFAULT NULL,
    `published_at` TIMESTAMP NULL DEFAULT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    CONSTRAINT `fk_comment_video` FOREIGN KEY (`video_id`) 
        REFERENCES `videos` (`id`) ON DELETE CASCADE,
    UNIQUE KEY `uk_comment_id` (`comment_id`),
    INDEX `idx_video_id` (`video_id`),
    INDEX `idx_comment_id` (`comment_id`),
    INDEX `idx_sentiment` (`sentiment`, `emotion`),
    INDEX `idx_is_analyzed` (`is_analyzed`),
    INDEX `idx_like_count` (`like_count`),
    INDEX `idx_published_at` (`published_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Table: analytics
-- Mô tả: Lưu dữ liệu analytics theo ngày
-- =====================================================
CREATE TABLE `analytics` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `channel_id` BIGINT NOT NULL COMMENT 'FK to channels.id',
    `date` DATE NOT NULL,
    `view_count` BIGINT DEFAULT 0,
    `like_count` BIGINT DEFAULT 0,
    `comment_count` INT DEFAULT 0,
    `subscriber_count` BIGINT DEFAULT 0,
    `video_count` INT DEFAULT 0,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    CONSTRAINT `fk_analytics_channel` FOREIGN KEY (`channel_id`) 
        REFERENCES `channels` (`id`) ON DELETE CASCADE,
    UNIQUE KEY `uk_channel_date` (`channel_id`, `date`),
    INDEX `idx_channel_id` (`channel_id`),
    INDEX `idx_date` (`date`),
    INDEX `idx_channel_date` (`channel_id`, `date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Table: video_topics
-- Mô tả: Lưu các chủ đề/topic của video
-- =====================================================
CREATE TABLE `video_topics` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `channel_id` BIGINT NOT NULL COMMENT 'FK to channels.id',
    `topic_name` VARCHAR(255) NOT NULL,
    `video_count` INT DEFAULT 0,
    `total_views` BIGINT DEFAULT 0,
    `total_likes` BIGINT DEFAULT 0,
    `total_comments` INT DEFAULT 0,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    CONSTRAINT `fk_topic_channel` FOREIGN KEY (`channel_id`) 
        REFERENCES `channels` (`id`) ON DELETE CASCADE,
    UNIQUE KEY `uk_channel_topic` (`channel_id`, `topic_name`),
    INDEX `idx_channel_id` (`channel_id`),
    INDEX `idx_topic_name` (`topic_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Table: video_topic_mapping
-- Mô tả: Mapping giữa video và topic (many-to-many)
-- =====================================================
CREATE TABLE `video_topic_mapping` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `video_id` BIGINT NOT NULL,
    `topic_id` BIGINT NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    CONSTRAINT `fk_mapping_video` FOREIGN KEY (`video_id`) 
        REFERENCES `videos` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_mapping_topic` FOREIGN KEY (`topic_id`) 
        REFERENCES `video_topics` (`id`) ON DELETE CASCADE,
    UNIQUE KEY `uk_video_topic` (`video_id`, `topic_id`),
    INDEX `idx_video_id` (`video_id`),
    INDEX `idx_topic_id` (`topic_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Table: keywords
-- Mô tả: Lưu các từ khóa được nhắc đến trong bình luận
-- =====================================================
CREATE TABLE `keywords` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `channel_id` BIGINT NOT NULL COMMENT 'FK to channels.id',
    `keyword` VARCHAR(255) NOT NULL,
    `frequency` INT DEFAULT 1,
    `first_mentioned_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `last_mentioned_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    CONSTRAINT `fk_keyword_channel` FOREIGN KEY (`channel_id`) 
        REFERENCES `channels` (`id`) ON DELETE CASCADE,
    UNIQUE KEY `uk_channel_keyword` (`channel_id`, `keyword`),
    INDEX `idx_channel_id` (`channel_id`),
    INDEX `idx_keyword` (`keyword`),
    INDEX `idx_frequency` (`frequency`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Insert default data (optional)
-- =====================================================

-- Insert default user (for testing)
-- Password: password123 (bcrypt hash)
INSERT INTO `users` (`email`, `password`, `username`) 
VALUES ('admin@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Admin');

-- Insert default preferences
INSERT INTO `user_preferences` (`user_id`, `dark_mode`, `language`)
SELECT `id`, TRUE, 'vi' FROM `users` WHERE `email` = 'admin@example.com';

-- =====================================================
-- Views for easier querying
-- =====================================================

-- View: Channel Summary
CREATE OR REPLACE VIEW `v_channel_summary` AS
SELECT 
    c.id,
    c.channel_id,
    c.channel_name,
    c.subscriber_count,
    c.video_count,
    c.view_count,
    COUNT(DISTINCT v.id) as actual_video_count,
    SUM(v.view_count) as total_video_views,
    SUM(v.like_count) as total_likes,
    SUM(v.comment_count) as total_comments,
    COUNT(DISTINCT cm.id) as total_comment_count,
    c.last_synced_at
FROM channels c
LEFT JOIN videos v ON v.channel_id = c.id
LEFT JOIN comments cm ON cm.video_id = v.id
GROUP BY c.id, c.channel_id, c.channel_name, c.subscriber_count, 
         c.video_count, c.view_count, c.last_synced_at;

-- View: Video Engagement
CREATE OR REPLACE VIEW `v_video_engagement` AS
SELECT 
    v.id,
    v.video_id,
    v.channel_id,
    v.title,
    v.view_count,
    v.like_count,
    v.comment_count,
    v.published_at,
    CASE 
        WHEN v.view_count > 0 THEN (v.like_count + v.comment_count) / v.view_count
        ELSE 0
    END as engagement_rate,
    CASE 
        WHEN v.view_count > 0 THEN v.like_count / v.view_count
        ELSE 0
    END as like_rate,
    CASE 
        WHEN v.view_count > 0 THEN v.comment_count / v.view_count
        ELSE 0
    END as comment_rate
FROM videos v;

-- View: Comment Sentiment Summary
CREATE OR REPLACE VIEW `v_comment_sentiment_summary` AS
SELECT 
    c.channel_id,
    COUNT(*) as total_comments,
    SUM(CASE WHEN cm.sentiment = 'positive' THEN 1 ELSE 0 END) as positive_count,
    SUM(CASE WHEN cm.sentiment = 'negative' THEN 1 ELSE 0 END) as negative_count,
    SUM(CASE WHEN cm.sentiment = 'neutral' THEN 1 ELSE 0 END) as neutral_count,
    SUM(CASE WHEN cm.emotion = 'happy' THEN 1 ELSE 0 END) as happy_count,
    SUM(CASE WHEN cm.emotion = 'sad' THEN 1 ELSE 0 END) as sad_count,
    SUM(CASE WHEN cm.emotion = 'angry' THEN 1 ELSE 0 END) as angry_count,
    SUM(CASE WHEN cm.emotion = 'suggestion' THEN 1 ELSE 0 END) as suggestion_count,
    SUM(CASE WHEN cm.emotion = 'love' THEN 1 ELSE 0 END) as love_count
FROM channels c
JOIN videos v ON v.channel_id = c.id
JOIN comments cm ON cm.video_id = v.id
WHERE cm.is_analyzed = TRUE
GROUP BY c.channel_id;

