package com.cinecooltv.backend.auth.dto;

import lombok.Data;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

@Data
public class OtpVerificationRequest {

    @NotBlank
    @Email
    private String email;

    @NotBlank
    private String otp;
}