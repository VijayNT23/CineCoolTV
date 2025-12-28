package com.cinecooltv.backend.auth.service;

import com.cinecooltv.backend.model.User;
import com.cinecooltv.backend.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.Optional;

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

    // ✅ FIXED: OTP-friendly signup logic
    public SignupResult signup(String email, String password, String name) {
        Optional<User> existingUserOpt = userRepository.findByEmail(email);

        if (existingUserOpt.isPresent()) {
            User existingUser = existingUserOpt.get();

            // If user exists but NOT verified → resend OTP
            if (!existingUser.isVerified()) {
                try {
                    // Generate and send OTP
                    String otp = otpService.createOtp(email);
                    emailService.sendOtpEmail(email, otp);

                    return new SignupResult(
                            true,
                            "OTP resent to your email. Please verify to complete registration.",
                            true,
                            SignupStatus.OTP_RESENT
                    );
                } catch (Exception e) {
                    System.err.println("❌ OTP email failed for " + email + ": " + e.getMessage());
                    throw new ResponseStatusException(
                            HttpStatus.SERVICE_UNAVAILABLE,
                            "Unable to send OTP email. Please try again."
                    );
                }
            }

            // If already verified → block signup
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Email already registered and verified"
            );
        }

        // ✅ Create new user only if NOT exists
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

        return new SignupResult(
                true,
                message,
                emailSent,
                SignupStatus.OTP_SENT
        );
    }

    // 🔁 OTP VERIFY FLOW for email verification (signup)
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

    // 🔁 LOGIN FLOW
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

    // 🔁 OTP VERIFY FLOW for login
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

    // Resend OTP method
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

    // ✅ Enhanced SignupResult with status enum
    public static class SignupResult {
        private final boolean success;
        private final String message;
        private final boolean emailSent;
        private final SignupStatus status;

        public SignupResult(boolean success, String message, boolean emailSent, SignupStatus status) {
            this.success = success;
            this.message = message;
            this.emailSent = emailSent;
            this.status = status;
        }

        // Backward compatibility constructor
        public SignupResult(boolean success, String message, boolean emailSent) {
            this(success, message, emailSent, SignupStatus.OTP_SENT);
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

        public SignupStatus getStatus() {
            return status;
        }
    }

    // ✅ Status enum for signup results
    public enum SignupStatus {
        OTP_SENT,      // New user, OTP sent
        OTP_RESENT,    // Existing unverified user, OTP resent
        USER_EXISTS    // Existing verified user (error case)
    }
}