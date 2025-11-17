package com.example.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UpdateRoleRequest {
    @NotBlank(message = "Role không được để trống")
    private String role; // USER, PREMIUM, ADMIN
}

