package com.cinecooltv.backend.auth.dto;

import lombok.Data;

@Data
public class OtpRequest {
    private String email;
    private String otp;
}

