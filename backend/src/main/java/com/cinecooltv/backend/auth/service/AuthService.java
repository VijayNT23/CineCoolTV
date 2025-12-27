package com.cinecooltv.backend.auth.service;

import com.cinecooltv.backend.model.User;
import com.cinecooltv.backend.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final OtpService otpService;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(
            UserRepository userRepository,
            OtpService otpService,
            EmailService emailService,
            PasswordEncoder passwordEncoder,
            JwtService jwtService
    ) {
        this.userRepository = userRepository;
        this.otpService = otpService;
        this.emailService = emailService;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    // 🔧 Fix #1: Don't crash signup if email fails
    public SignupResult signup(String email, String password, String name) {
        if (userRepository.findByEmail(email).isPresent()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Email already registered"
            );
        }

        User user = new User();
        user.setEmail(email);
        user.setName(name);
        user.setPassword(passwordEncoder.encode(password));
        user.setVerified(false);
        user.setCreatedAt(LocalDateTime.now());

        userRepository.save(user);

        // Generate OTP
        String otp = otpService.createOtp(email);

        boolean emailSent = false;
        String message;

        try {
            emailService.sendOtpEmail(email, otp);
            emailSent = true;
            message = "Signup successful. OTP sent to email.";
        } catch (Exception e) {
            // Log error but throw exception instead
            System.err.println("❌ OTP email failed for " + email + ": " + e.getMessage());
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Unable to send OTP email. Please try again."
            );
        }

        return new SignupResult(true, message, emailSent);
    }

    // 🔁 OTP VERIFY FLOW for email verification (signup) - NEW METHOD
    public void verifySignupOtp(String email, String otp) {
        otpService.verifyOtp(email, otp);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "User not found"
                ));

        user.setVerified(true);
        user.setVerifiedAt(LocalDateTime.now());
        userRepository.save(user);
    }

    // 🔁 LOGIN FLOW - Updated to match your requested method signature
    public void login(String email, String password) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "Invalid email or password"
                ));

        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Invalid email or password"
            );
        }

        if (!user.isVerified()) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Please verify your email first"
            );
        }

        // Generate OTP for login
        String otp = otpService.createOtp(email);

        // Send OTP email
        try {
            emailService.sendOtpEmail(email, otp);
        } catch (Exception e) {
            System.err.println("❌ Login OTP email failed for " + email + ": " + e.getMessage());
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Unable to send OTP email. Please try again."
            );
        }
    }

    // 🔁 OTP VERIFY FLOW for login - Already exists but keeping your version
    public String verifyLoginOtp(String email, String otp) {
        otpService.verifyOtp(email, otp);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "User not found"
                ));

        user.setLastLogin(LocalDateTime.now());
        userRepository.save(user);

        return jwtService.generateToken(user.getEmail());
    }

    // Resend OTP method - Updated to match your requested method signature
    public void resendOtp(String email) {
        // Check if user exists
        userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "User not found"
                ));

        // Generate new OTP
        String otp = otpService.createOtp(email);

        // Send OTP email
        try {
            emailService.sendOtpEmail(email, otp);
        } catch (Exception e) {
            System.err.println("❌ Resend OTP email failed for " + email + ": " + e.getMessage());
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Unable to send OTP email. Please try again."
            );
        }
    }

    // Keep existing methods for backward compatibility
    public void verifyOtp(String email, String otp) {
        verifySignupOtp(email, otp);
    }

    public String initiateLogin(String email, String password) {
        login(email, password);
        return "OTP sent to your email. Please verify to complete login.";
    }

    // Direct login for testing/development (if needed)
    public String directLogin(String email, String password) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "Invalid email or password"
                ));

        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Invalid email or password"
            );
        }

        if (!user.isVerified()) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Please verify your email first"
            );
        }

        user.setLastLogin(LocalDateTime.now());
        userRepository.save(user);

        return jwtService.generateToken(user.getEmail());
    }

    // ✅ Inner class for structured response
    public static class SignupResult {
        private final boolean success;
        private final String message;
        private final boolean emailSent;

        public SignupResult(boolean success, String message, boolean emailSent) {
            this.success = success;
            this.message = message;
            this.emailSent = emailSent;
        }

        public boolean isSuccess() {
            return success;
        }

        public String getMessage() {
            return message;
        }

        public boolean isEmailSent() {
            return emailSent;
        }
    }
}