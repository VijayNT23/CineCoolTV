package com.cinecooltv.backend.auth.service;

import com.cinecooltv.backend.model.User;
import com.cinecooltv.backend.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Random;

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

    public void signup(String email, String password, String name) {

        if (userRepository.findByEmail(email).isPresent()) {
            throw new RuntimeException("Email already registered");
        }

        User user = new User();
        user.setEmail(email);
        user.setName(name);
        user.setPassword(passwordEncoder.encode(password));
        user.setVerified(false);
        user.setCreatedAt(LocalDateTime.now());

        userRepository.save(user);

        String otp = generateOtp();
        otpService.createOtp(email, otp);
        emailService.sendOtpEmail(email, otp);
    }

    public void verifyOtp(String email, String otp) {
        otpService.verifyOtp(email, otp);
    }

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

    public void resendOtp(String email) {
        String otp = generateOtp();
        otpService.createOtp(email, otp);
        emailService.sendOtpEmail(email, otp);
    }

    private String generateOtp() {
        return String.valueOf(100000 + new Random().nextInt(900000));
    }
}
