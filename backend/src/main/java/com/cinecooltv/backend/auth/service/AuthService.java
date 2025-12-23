package com.cinecooltv.backend.auth.service;

import com.cinecooltv.backend.model.User;
import com.cinecooltv.backend.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class AuthService {

    private final UserRepository userRepo;
    private final OtpService otpService;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(
            UserRepository userRepo,
            OtpService otpService,
            EmailService emailService,
            PasswordEncoder passwordEncoder,
            JwtService jwtService
    ) {
        this.userRepo = userRepo;
        this.otpService = otpService;
        this.emailService = emailService;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    // =========================
    // ✅ SIGNUP
    // =========================
    public void signup(String email, String password, String name) {
        // Check if user already exists
        Optional<User> existingUser = userRepo.findByEmail(email);

        if (existingUser.isPresent()) {
            User user = existingUser.get();

            // If user exists but is not verified, resend OTP
            if (!user.isVerified()) {
                String otp = otpService.generateOtp(email);
                emailService.sendOtp(email, otp);
                return;
            } else {
                throw new RuntimeException("Email already registered. Please login.");
            }
        }

        // Create new user
        User user = new User();
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(password));
        user.setName(name);
        user.setVerified(false);

        userRepo.save(user);

        // Generate and send OTP
        String otp = otpService.generateOtp(email);
        emailService.sendOtp(email, otp);
    }

    // =========================
    // ✅ VERIFY OTP (SIGNUP)
    // =========================
    public void verifyOtp(String email, String otp) {
        // Verify OTP
        if (!otpService.verifyOtp(email, otp)) {
            throw new RuntimeException("Invalid or expired OTP");
        }

        // Find user and mark as verified
        User user = userRepo.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setVerified(true);
        user.setVerifiedAt(LocalDateTime.now());
        userRepo.save(user);
    }

    // =========================
    // ✅ LOGIN + JWT
    // =========================
    public String login(String email, String password) {
        // Find user
        User user = userRepo.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Invalid email or password"));

        // Check if account is verified
        if (!user.isVerified()) {
            throw new RuntimeException("Please verify your email first");
        }

        // Verify password
        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new RuntimeException("Invalid email or password");
        }

        // Update last login
        user.setLastLogin(LocalDateTime.now());
        userRepo.save(user);

        // Generate JWT token
        return jwtService.generateToken(email);
    }

    // =========================
    // 🔁 FORGOT PASSWORD (SEND OTP)
    // =========================
    public void forgotPassword(String email) {
        // Find user
        User user = userRepo.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Generate and send OTP
        String otp = otpService.generateOtp(email);
        emailService.sendOtp(email, otp);
    }

    // =========================
    // 🔐 RESET PASSWORD
    // =========================
    public void resetPassword(String email, String otp, String newPassword) {
        // Verify OTP
        if (!otpService.verifyOtp(email, otp)) {
            throw new RuntimeException("Invalid or expired OTP");
        }

        // Find user and update password
        User user = userRepo.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepo.save(user);
    }

    // =========================
    // 🔄 RESEND OTP
    // =========================
    public void resendOtp(String email) {
        // Check if user exists
        User user = userRepo.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Generate new OTP
        String otp = otpService.generateOtp(email);
        emailService.sendOtp(email, otp);
    }

    // =========================
    // 📧 CHECK EMAIL AVAILABILITY
    // =========================
    public boolean checkEmailAvailability(String email) {
        Optional<User> user = userRepo.findByEmail(email);
        if (user.isPresent()) {
            // Return true only if user exists but is not verified (can resend OTP)
            return !user.get().isVerified();
        }
        return true; // Email doesn't exist at all
    }

    // =========================
    // 👤 GET USER PROFILE
    // =========================
    public User getUserProfile(String email) {
        return userRepo.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
}