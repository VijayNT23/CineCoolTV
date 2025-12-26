package com.cinecooltv.backend.auth.dto;

import lombok.Data;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

@Getter
@Setter
public class SignupRequest {

    @NotBlank
    private String username;

    @Email
    private String email;

    @NotBlank
    private String password;
}
