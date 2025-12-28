package com.cinecooltv.backend.auth.controller;

import com.cinecooltv.backend.auth.dto.OtpVerificationRequest;
import com.cinecooltv.backend.auth.dto.SignupRequest;
import com.cinecooltv.backend.auth.dto.LoginRequest;
import com.cinecooltv.backend.auth.service.AuthService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/signup")
    public ResponseEntity<?> signup(@RequestBody SignupRequest request) {
        try {
            AuthService.SignupResult result = authService.signup(
                    request.getEmail(),
                    request.getPassword(),
                    request.getName()
            );

            // Create enhanced response with status
            Map<String, Object> response = Map.of(
                    "success", result.isSuccess(),
                    "message", result.getMessage(),
                    "emailSent", result.isEmailSent(),
                    "status", result.getStatus().name()
            );

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/verify-signup-otp")
    public ResponseEntity<?> verifySignupOtp(@RequestBody OtpVerificationRequest request) {
        try {
            authService.verifySignupOtp(request.getEmail(), request.getOtp());
            return ResponseEntity.ok(Map.of(
                    "message", "Email verified successfully",
                    "status", "VERIFIED"
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        try {
            authService.login(request.getEmail(), request.getPassword());
            return ResponseEntity.ok(Map.of(
                    "message", "OTP sent to your email. Please verify to complete login."
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/verify-login-otp")
    public ResponseEntity<?> verifyLoginOtp(@RequestBody OtpVerificationRequest request) {
        try {
            String token = authService.verifyLoginOtp(request.getEmail(), request.getOtp());
            return ResponseEntity.ok(Map.of(
                    "token", token,
                    "message", "Login successful"
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/resend-otp")
    public ResponseEntity<?> resendOtp(@RequestBody Map<String, String> request) {
        try {
            authService.resendOtp(request.get("email"));
            return ResponseEntity.ok(Map.of(
                    "message", "OTP resent successfully"
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@RequestBody OtpVerificationRequest request) {
        try {
            authService.verifyOtp(request.getEmail(), request.getOtp());
            return ResponseEntity.ok(Map.of(
                    "message", "OTP verified successfully"
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/direct-login")
    public ResponseEntity<?> directLogin(@RequestBody LoginRequest request) {
        try {
            String message = authService.directLogin(request.getEmail(), request.getPassword());
            return ResponseEntity.ok(Map.of("message", message));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/initiate-login")
    public ResponseEntity<?> initiateLogin(@RequestBody LoginRequest request) {
        try {
            String message = authService.initiateLogin(request.getEmail(), request.getPassword());
            return ResponseEntity.ok(Map.of("message", message));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", e.getMessage()));
        }
    }
}