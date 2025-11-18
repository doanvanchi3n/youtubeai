package com.example.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdatePasswordRequest {
    @NotBlank(message = "Vui lòng nhập mật khẩu hiện tại")
    private String currentPassword;
    
    @Size(min = 6, max = 100, message = "Mật khẩu mới phải từ 6-100 ký tự")
    private String newPassword;
    
    @NotBlank(message = "Vui lòng xác nhận mật khẩu mới")
    private String confirmPassword;
}

