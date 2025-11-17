package com.example.backend.repository;

import com.example.backend.model.VideoTopic;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VideoTopicRepository extends JpaRepository<VideoTopic, Long> {
    Optional<VideoTopic> findByChannelIdAndTopicName(Long channelId, String topicName);
    List<VideoTopic> findByChannelId(Long channelId);
}

