package com.cinecooltv.backend.auth.dto;

import lombok.Data;

@Data
public class SignupRequest {
    @NotBlank
    @Email
    private String email;
    private String password;
    private String name;
}
