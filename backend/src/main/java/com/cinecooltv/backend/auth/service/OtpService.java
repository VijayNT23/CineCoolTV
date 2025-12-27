package com.cinecooltv.backend.auth.service;

import com.cinecooltv.backend.model.OtpVerification;
import com.cinecooltv.backend.model.User;
import com.cinecooltv.backend.repository.OtpRepository;
import com.cinecooltv.backend.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class OtpService {

    private final OtpRepository otpRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final int MAX_ATTEMPTS = 5;
    private static final int OTP_VALIDITY_MINUTES = 10;

    // 🔐 Generate secure 6-digit OTP
    private String generateOtp() {
        return String.valueOf(100000 + RANDOM.nextInt(900000));
    }

    // 📩 Create & send OTP
    @Transactional
    public void createAndSendOtp(String email) {

        // ❌ Invalidate previous OTPs
        otpRepository.deleteByEmail(email);

        String otp = generateOtp();

        OtpVerification entity = OtpVerification.builder()
                .email(email)
                .otp(otp)
                .expiry(LocalDateTime.now().plusMinutes(OTP_VALIDITY_MINUTES))
                .attempts(0)
                .verified(false)
                .used(false)
                .build();

        otpRepository.save(entity);

        // ✅ Send OTP via Brevo API
        emailService.sendOtpEmail(email, otp);
    }

    // ✅ Verify OTP
    @Transactional
    public void verifyOtp(String email, String otp) {

        OtpVerification otpRecord = otpRepository
                .findTopByEmailOrderByExpiryDesc(email)
                .orElseThrow(() -> new RuntimeException("OTP not found"));

        if (otpRecord.getExpiry().isBefore(LocalDateTime.now())) {
            otpRepository.delete(otpRecord);
            throw new RuntimeException("OTP expired");
        }

        if (!otpRecord.getOtp().equals(otp)) {

            int attempts = otpRecord.getAttempts() + 1;
            otpRecord.setAttempts(attempts);

            if (attempts >= MAX_ATTEMPTS) {
                otpRepository.delete(otpRecord);
                throw new RuntimeException("Too many failed attempts. Request a new OTP.");
            }

            otpRepository.save(otpRecord);
            throw new RuntimeException("Invalid OTP");
        }

        // ✅ OTP verified
        otpRepository.delete(otpRecord);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setVerified(true);
        user.setVerifiedAt(LocalDateTime.now());
        userRepository.save(user);
    }

    // 🧹 Cleanup expired OTPs
    @Transactional
    public void cleanupExpiredOtps() {
        otpRepository.deleteByExpiryBefore(LocalDateTime.now());
    }
}
