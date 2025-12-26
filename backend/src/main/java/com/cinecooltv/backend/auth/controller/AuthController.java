package com.cinecooltv.backend.auth.controller;

import com.cinecooltv.backend.auth.dto.LoginRequest;
import com.cinecooltv.backend.auth.dto.OtpRequest;
import com.cinecooltv.backend.auth.dto.SignupRequest;
import com.cinecooltv.backend.auth.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(
        origins = {"https://cine-cool-tv.vercel.app", "http://localhost:3000"},
        allowCredentials = "true"
)
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/signup")
    public ResponseEntity<?> signup(@Valid @RequestBody SignupRequest request) {
        authService.signup(request.getEmail(), request.getPassword(), request.getName());
        return ResponseEntity.ok(Map.of("message", "OTP sent to email"));
    }

    @PostMapping("/verify-email")
    public ResponseEntity<?> verifyEmail(@Valid @RequestBody OtpRequest request) {
        authService.verifyOtp(request.getEmail(), request.getOtp());
        return ResponseEntity.ok(Map.of("message", "Account verified successfully"));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        String message = authService.initiateLogin(request.getEmail(), request.getPassword());
        return ResponseEntity.ok(Map.of("message", message));
    }

    @PostMapping("/verify-login-otp")
    public ResponseEntity<?> verifyLoginOtp(@Valid @RequestBody OtpRequest request) {
        String token = authService.verifyLoginOtp(request.getEmail(), request.getOtp());
        return ResponseEntity.ok(Map.of(
                "message", "Login successful",
                "token", token
        ));
    }

    @PostMapping("/resend-otp")
    public ResponseEntity<?> resendOtp(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        if (email == null || email.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email is required"));
        }

        authService.resendOtp(email);
        return ResponseEntity.ok(Map.of("message", "OTP resent"));
    }
}