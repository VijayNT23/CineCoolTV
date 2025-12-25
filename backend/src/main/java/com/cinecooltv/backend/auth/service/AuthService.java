package com.cinecooltv.backend.auth.service;

import com.cinecooltv.backend.model.User;
import com.cinecooltv.backend.repository.UserRepository;
import jakarta.transaction.Transactional;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Random;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final EmailService emailService;
    private final OtpService otpService;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            EmailService emailService,
            OtpService otpService
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.emailService = emailService;
        this.otpService = otpService;
    }

    // ======================
    // SIGNUP
    // ======================
    @Transactional
    public void signup(String email, String password, String name) {

        if (userRepository.existsByEmail(email)) {
            throw new RuntimeException("Email already registered");
        }

        User user = new User();
        user.setEmail(email);
        user.setName(name);               // 🔥 FIXED (name was NULL before)
        user.setPassword(passwordEncoder.encode(password));
        user.setVerified(false);

        userRepository.save(user);

        String otp = generateOtp();
        otpService.createOtp(email, otp);

        emailService.sendOtpEmail(email, otp);
    }

    // ======================
    // VERIFY OTP
    // ======================
    public void verifyOtp(String email, String otp) {
        otpService.verifyOtp(email, otp);
    }

    // ======================
    // RESEND OTP
// ======================
    @Transactional
    public void resendOtp(String email) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.isVerified()) {
            throw new RuntimeException("Account already verified");
        }

        String otp = generateOtp();
        otpService.createOtp(email, otp);
        emailService.sendOtpEmail(email, otp);
    }

    // ======================
    // LOGIN
    // ======================
    public String login(String email, String password) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Invalid email or password"));

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


    // ======================
    // FORGOT PASSWORD
    // ======================
    public void forgotPassword(String email) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String otp = generateOtp();
        otpService.createOtp(email, otp);
        emailService.sendOtpEmail(email, otp);
    }

    // ======================
    // RESET PASSWORD
    // ======================
    @Transactional
    public void resetPassword(String email, String otp, String newPassword) {

        otpService.verifyOtp(email, otp);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    // ======================
    // CHECK EMAIL
    // ======================
    public boolean checkEmailAvailability(String email) {
        return !userRepository.existsByEmail(email);
    }

    // ======================
    // OTP GENERATOR
    // ======================
    private String generateOtp() {
        return String.valueOf(100000 + new Random().nextInt(900000));
    }
}
