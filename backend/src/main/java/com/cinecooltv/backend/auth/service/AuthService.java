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
        // ✅ REMOVED: secureRandom field (not used)
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
        user.setOtpVerified(false); // New users start with OTP not verified
        user.setCreatedAt(LocalDateTime.now());

        userRepository.save(user);

        // Generate OTP for email verification
        String otp = otpService.createOtp(email);
        emailService.sendOtpEmail(email, otp);
    }

    // 🔁 OTP VERIFY FLOW for email verification (signup)
    public void verifyOtp(String email, String otp) {
        // 1️⃣ Verify OTP
        otpService.verifyOtp(email, otp);

        // ✅ FIX 1: Mark user as email-verified
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setVerified(true);        // ✅ Email verified
        user.setOtpVerified(true);     // ✅ OTP verified (for signup flow)
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

        // 4️⃣ Send OTP via email
        emailService.sendOtpEmail(email, otp);

        // Return message instead of JWT
        return "OTP sent to your email. Please verify to complete login.";
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

    public void resendOtp(String email) {
        // Check if user exists
        userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Generate and send new OTP
        String otp = otpService.createOtp(email);
        emailService.sendOtpEmail(email, otp);

        // ⚠ ISSUE 2: No rate limiting (acceptable for now, but should be added later)
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

        // For direct login, we still need OTP verification
        // So redirect to OTP flow
        user.setOtpVerified(false);
        userRepository.save(user);

        String otp = otpService.createOtp(email);
        emailService.sendOtpEmail(email, otp);

        return "OTP sent to your email. Please verify to complete login.";
    }
}