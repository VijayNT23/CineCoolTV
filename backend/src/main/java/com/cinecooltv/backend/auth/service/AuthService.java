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

    // ================= SIGNUP =================
    public void signup(String email, String password, String name) {

        userRepository.findByEmail(email).ifPresent(user -> {
            if (user.isVerified()) {
                throw new RuntimeException("Email already registered");
            }
        });

        User user = userRepository.findByEmail(email)
                .orElseGet(() -> {
                    User u = new User();
                    u.setEmail(email);
                    u.setName(name);
                    u.setPassword(passwordEncoder.encode(password));
                    u.setVerified(false);
                    u.setCreatedAt(LocalDateTime.now());
                    return userRepository.save(u);
                });

        String otp = otpService.generateOtp();
        otpService.createOtp(email, otp);
        emailService.sendOtp(email, otp);
    }

    // ================= VERIFY OTP =================
    public void verifyOtp(String email, String otp) {
        otpService.verifyOtp(email, otp);
    }

    // ================= LOGIN =================
    public String login(String email, String password) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new RuntimeException("Invalid email or password")
                );

        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new RuntimeException("Invalid email or password");
        }

        if (!user.isVerified()) {
            throw new RuntimeException("Please verify your email first");
        }

        user.setLastLogin(LocalDateTime.now());
        userRepository.save(user);

        return jwtService.generateToken(user.getEmail());
    }

    // ================= FORGOT PASSWORD =================
    public void forgotPassword(String email) {

        userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String otp = otpService.generateOtp();
        otpService.createOtp(email, otp);
        emailService.sendOtp(email, otp);
    }

    // ================= RESET PASSWORD =================
    public void resetPassword(String email, String otp, String newPassword) {

        otpService.verifyOtp(email, otp);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setPassword(passwordEncoder.encode(newPassword));
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);
    }
}
