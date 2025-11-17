package com.example.backend.dto.request;

import lombok.Data;

@Data
public class UpdateLogSettingsRequest {
    private Boolean logApiRequests;
    private Boolean logAbnormalRequests;
    private Boolean logAiProcessing;
}

