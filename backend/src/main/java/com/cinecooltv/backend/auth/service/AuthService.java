package com.cinecooltv.backend.auth.service;

import com.cinecooltv.backend.model.User;
import com.cinecooltv.backend.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

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
            throw new RuntimeException("Email already registered");
        }

        User user = new User();
        user.setEmail(email);
        user.setUsername(name);
        user.setPassword(passwordEncoder.encode(password));
        user.setVerified(false);
        user.setOtpVerified(false);
        user.setCreatedAt(LocalDateTime.now());

        userRepository.save(user);

        // Generate OTP
        String otp = otpService.createOtp(email);

        // 🔧 Fix #1: Wrap email sending in try/catch
        boolean emailSent = false;
        String message;

        try {
            emailService.sendOtpEmail(email, otp);
            emailSent = true;
            message = "Signup successful. OTP sent to email.";
        } catch (Exception e) {
            // Log error but don't crash signup
            System.err.println("❌ OTP email failed for " + email + ": " + e.getMessage());
            message = "Signup successful. OTP delivery delayed. Please check your email or request a new OTP.";
        }

        // ✅ Return structured result
        return new SignupResult(true, message, emailSent);
    }

    // 🔁 OTP VERIFY FLOW for email verification (signup)
    public void verifyOtp(String email, String otp) {
        // 1️⃣ Verify OTP
        otpService.verifyOtp(email, otp);

        // ✅ Mark user as email-verified
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setVerified(true);
        user.setOtpVerified(true);
        user.setVerifiedAt(LocalDateTime.now());
        userRepository.save(user);
    }

    // 🔁 LOGIN FLOW
    public String initiateLogin(String email, String password) {
        // 1️⃣ Validate email + password
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Invalid email or password"));

        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new RuntimeException("Invalid email or password");
        }

        // Check if user is verified (email verification)
        if (!user.isVerified()) {
            throw new RuntimeException("Please verify your email first");
        }

        // 2️⃣ Reset OTP verification status for this login session
        user.setOtpVerified(false);
        userRepository.save(user);

        // 3️⃣ Generate OTP for login verification
        String otp = otpService.createOtp(email);

        // 🔧 Apply same fix for login OTP emails
        try {
            emailService.sendOtpEmail(email, otp);
            return "OTP sent to your email. Please verify to complete login.";
        } catch (Exception e) {
            System.err.println("❌ Login OTP email failed for " + email + ": " + e.getMessage());
            return "Login initiated. OTP delivery delayed. Please check your email or request a new OTP.";
        }
    }

    // 🔁 OTP VERIFY FLOW for login
    public String verifyLoginOtp(String email, String otp) {
        // 1️⃣ Validate OTP using OtpService
        otpService.verifyOtp(email, otp);

        // 2️⃣ Get the user
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // 3️⃣ Mark OTP as verified
        user.setOtpVerified(true);
        user.setLastLogin(LocalDateTime.now());
        userRepository.save(user);

        // 4️⃣ Generate JWT ONLY AFTER OTP verification
        return jwtService.generateToken(user.getEmail());
    }

    public String resendOtp(String email) {
        // Check if user exists
        userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Generate and send new OTP
        String otp = otpService.createOtp(email);

        try {
            emailService.sendOtpEmail(email, otp);
            return "OTP resent successfully.";
        } catch (Exception e) {
            System.err.println("❌ Resend OTP email failed for " + email + ": " + e.getMessage());
            return "OTP generated but delivery delayed. Please check your email.";
        }
    }

    // Direct login for testing/development (if needed)
    public String directLogin(String email, String password) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Invalid email or password"));

        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new RuntimeException("Invalid email or password");
        }

        if (!user.isVerified()) {
            throw new RuntimeException("Please verify your email first");
        }

        user.setOtpVerified(false);
        userRepository.save(user);

        String otp = otpService.createOtp(email);

        try {
            emailService.sendOtpEmail(email, otp);
            return "OTP sent to your email. Please verify to complete login.";
        } catch (Exception e) {
            System.err.println("❌ Direct login OTP email failed: " + e.getMessage());
            return "Login initiated. OTP delivery delayed.";
        }
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