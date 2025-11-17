package com.example.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AddKeywordRequest {
    @NotBlank(message = "Keyword không được để trống")
    private String keyword;
    
    private String category; // toxic, spam, negative
}

