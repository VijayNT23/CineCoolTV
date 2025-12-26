package com.cinecooltv.backend.auth.dto;

import lombok.Data;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

@Data
public class ResetPasswordRequest {
    @NotBlank
    @Email
    private String email;
    private String otp;
    private String newPassword;
}
