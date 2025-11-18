package com.example.backend.dto.request;

import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class UpdatePreferencesRequest {
    private Boolean darkMode;
    
    @Pattern(regexp = "vi|en", message = "Ngôn ngữ không hợp lệ")
    private String language;
}

