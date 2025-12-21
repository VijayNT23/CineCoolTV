package com.cinecooltv.backend.auth.dto;

import lombok.Data;

@Data
public class SignupRequest {
    private String email;
    private String password;
}