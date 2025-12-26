package com.cinecooltv.backend.auth.dto;

import lombok.Data;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

@Data
public class SignupRequest {
    @NotBlank
    private String name;   // ✅ REQUIRED

    @Email
    @NotBlank
    private String email;

    @NotBlank
    private String password;
}
