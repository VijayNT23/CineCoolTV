package com.cinecooltv.backend.auth.dto;

import lombok.Data;

@Data
public class ResetPasswordRequest {
    @NotBlank
    @Email
    private String email;
    private String otp;
    private String newPassword;
}
