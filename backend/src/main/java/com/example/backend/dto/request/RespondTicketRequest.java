package com.example.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class RespondTicketRequest {
    @NotBlank(message = "Response không được để trống")
    private String response;
}

