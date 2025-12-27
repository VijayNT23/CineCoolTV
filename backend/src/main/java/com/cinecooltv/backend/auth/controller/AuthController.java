package com.cinecooltv.backend.auth.controller;

import com.cinecooltv.backend.auth.dto.*;
import com.cinecooltv.backend.auth.service.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.cinecooltv.backend.auth.dto.OtpVerificationRequest;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin
public class AuthController {

    private final AuthService authService;

    // ✅ MANUAL CONSTRUCTOR (NO Lombok)
    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/signup")
    public ResponseEntity<?> signup(@RequestBody SignupRequest req) {
        authService.signup(req.getEmail(), req.getPassword(), req.getName());
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "OTP sent to your email"
        ));
    }

    @PostMapping("/verify-email")
    public ResponseEntity<?> verifyEmail(@RequestBody OtpVerificationRequest req) {
        authService.verifySignupOtp(req.getEmail(), req.getOtp());
        return ResponseEntity.ok(Map.of("status", "SUCCESS"));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest req) {
        authService.login(req.getEmail(), req.getPassword());
        return ResponseEntity.ok(Map.of("status", "OTP_REQUIRED"));
    }

    @PostMapping("/verify-login-otp")
    public ResponseEntity<?> verifyLoginOtp(@RequestBody OtpVerificationRequest req) {
        String token = authService.verifyLoginOtp(req.getEmail(), req.getOtp());
        return ResponseEntity.ok(Map.of("token", token));
    }

    @PostMapping("/resend-otp")
    public ResponseEntity<?> resendOtp(@RequestBody OtpRequest req) {
        authService.resendOtp(req.getEmail());
        return ResponseEntity.ok(Map.of("status", "SUCCESS"));
    }
}
