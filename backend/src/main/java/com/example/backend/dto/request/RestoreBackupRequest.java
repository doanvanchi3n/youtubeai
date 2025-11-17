package com.example.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class RestoreBackupRequest {
    @NotBlank(message = "Backup file không được để trống")
    private String backupFile;
}

