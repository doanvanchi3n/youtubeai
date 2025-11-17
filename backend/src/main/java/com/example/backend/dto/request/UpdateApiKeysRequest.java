package com.example.backend.dto.request;

import lombok.Data;

@Data
public class UpdateApiKeysRequest {
    private String youtubeApiKey;
    private String openAiApiKey;
}

