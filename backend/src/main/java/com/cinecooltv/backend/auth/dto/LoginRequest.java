package com.cinecooltv.backend.auth.dto;

import lombok.Data;

@Data
public class LoginRequest {
    @NotBlank
    @Email
    private String email;
    private String password;
}
