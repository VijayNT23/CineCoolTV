package com.cinecooltv.backend.auth.controller;

import com.cinecooltv.backend.auth.dto.*;
import com.cinecooltv.backend.auth.service.AuthService;
import lombok.Data;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = {"https://cine-cool-tv.vercel.app", "http://localhost:3000"},
        maxAge = 3600,
        allowCredentials = "true")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/signup")
    @CrossOrigin
    public ResponseEntity<?> signup(@RequestBody SignupRequest request) {
        try {
            authService.signup(request.getEmail(), request.getPassword(), request.getName());

            Map<String, String> response = new HashMap<>();
            response.put("message", "OTP sent to your email. Please verify to complete registration.");
            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        }
    }

    @PostMapping("/verify-otp")
    @CrossOrigin
    public ResponseEntity<?> verifyOtp(@RequestBody OtpVerificationRequest request) {
        try {
            authService.verifyOtp(request.getEmail(), request.getOtp());

            Map<String, String> response = new HashMap<>();
            response.put("message", "Account verified successfully!");
            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        }
    }

    @PostMapping("/login")
    @CrossOrigin
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        try {
            String token = authService.login(request.getEmail(), request.getPassword());

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Login successful");
            response.put("token", token);
            response.put("email", request.getEmail());
            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(errorResponse);
        }
    }

    @PostMapping("/resend-otp")
    @CrossOrigin
    public ResponseEntity<?> resendOtp(@RequestBody Map<String, String> request) {
        try {
            authService.resendOtp(request.get("email"));

            Map<String, String> response = new HashMap<>();
            response.put("message", "OTP resent successfully!");
            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        }
    }

    @GetMapping("/check-email")
    @CrossOrigin
    public ResponseEntity<?> checkEmailAvailability(@RequestParam String email) {
        try {
            boolean isAvailable = authService.checkEmailAvailability(email);

            Map<String, Object> response = new HashMap<>();
            response.put("available", isAvailable);
            response.put("message", isAvailable ? "Email is available" : "Email already registered");
            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        }
    }

    @PostMapping("/forgot-password")
    @CrossOrigin
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> request) {
        try {
            authService.forgotPassword(request.get("email"));

            Map<String, String> response = new HashMap<>();
            response.put("message", "OTP sent to your email for password reset.");
            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        }
    }

    @PostMapping("/reset-password")
    @CrossOrigin
    public ResponseEntity<?> resetPassword(@RequestBody ResetPasswordRequest request) {
        try {
            authService.resetPassword(request.getEmail(), request.getOtp(), request.getNewPassword());

            Map<String, String> response = new HashMap<>();
            response.put("message", "Password reset successful!");
            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        }
    }

}