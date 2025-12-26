package com.cinecooltv.backend.auth.dto;

import lombok.Data;

@Data
public class ForgotPasswordRequest {
    @NotBlank
    @Email
    private String email;
}
