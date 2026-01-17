package com.example.backend.dto.request;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.Valid;
import java.util.List;
import lombok.Data;

@Data
public class AIChatRequest {
    
    @NotEmpty(message = "Messages không được để trống")
    @Valid
    private List<Message> messages;
    
    private ChatContext context;
    
    @Data
    public static class Message {
        private String role;    // user | assistant | system
        private String content;
    }
    
    @Data
    public static class ChatContext {
        private List<String> keywords;
        private String description;
        private String locale;
    }
}

