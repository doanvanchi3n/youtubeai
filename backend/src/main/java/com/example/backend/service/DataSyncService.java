package com.example.backend.service;

import com.example.backend.model.Channel;
import com.example.backend.repository.ChannelRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class DataSyncService {
    
    private final ChannelRepository channelRepository;
    private final YouTubeAnalysisService youTubeAnalysisService;
    
    @Value("${youtube.sync.enabled:true}")
    private boolean syncEnabled;
    
    @Value("${youtube.sync.fetch-comments.schedule:false}")
    private boolean fetchCommentsOnSchedule;
    
    @Scheduled(cron = "${youtube.sync.cron:0 30 3 * * *}")
    public void syncChannelsDaily() {
        if (!syncEnabled) {
            return;
        }
        List<Channel> channels = channelRepository.findAll();
        for (Channel channel : channels) {
            try {
                youTubeAnalysisService.refreshChannel(channel, fetchCommentsOnSchedule);
                log.info("Synced channel {}", channel.getChannelId());
            } catch (Exception ex) {
                log.error("Không thể đồng bộ kênh {}: {}", channel.getChannelId(), ex.getMessage());
            }
        }
    }
}
