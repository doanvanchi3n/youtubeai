package com.example.backend.dto.request;

import jakarta.validation.constraints.Size;
import java.util.List;
import lombok.Data;

@Data
public class AISuggestionRequest {
    
    @Size(max = 25)
    private List<@Size(max = 80) String> keywords;
    
    @Size(max = 2000)
    private String description;
    
    private String channelId;
    private boolean useChannelContext = true;
    private boolean fetchYouTubeContext = false;
    private Integer sampleVideoLimit = 6;
    private String locale = "vi-VN";
}


