package com.example.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UploadModelRequest {
    @NotBlank(message = "Model type không được để trống")
    private String modelType; // sentiment, emotion, topic
    
    @NotBlank(message = "File path không được để trống")
    private String filePath;
    
    private String version;
    private Double accuracy;
}

