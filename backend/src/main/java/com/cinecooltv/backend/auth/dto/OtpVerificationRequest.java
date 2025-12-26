package com.cinecooltv.backend.auth.dto;

import lombok.Data;

@Data
public class OtpVerificationRequest {
    @NotBlank
    @Email
    private String email;
    private String otp;
}