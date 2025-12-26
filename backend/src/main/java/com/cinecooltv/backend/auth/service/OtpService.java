package com.cinecooltv.backend.auth.service;

import com.cinecooltv.backend.model.OtpVerification;
import com.cinecooltv.backend.model.User;
import com.cinecooltv.backend.repository.OtpRepository;
import com.cinecooltv.backend.repository.UserRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDateTime;

@Service
public class OtpService {

    private final OtpRepository otpRepository;
    private final UserRepository userRepository;
    private final SecureRandom secureRandom;
    private static final int MAX_ATTEMPTS = 5;
    private static final int OTP_VALIDITY_MINUTES = 10;

    public OtpService(OtpRepository otpRepository, UserRepository userRepository) {
        this.otpRepository = otpRepository;
        this.userRepository = userRepository;
        this.secureRandom = new SecureRandom();
    }

    // ✅ Generate secure OTP
    public String generateOtp() {
        int otpNumber = 100000 + secureRandom.nextInt(900000);
        return String.valueOf(otpNumber);
    }

    @Transactional
    public String createOtp(String email) {
        // Generate secure OTP
        String otp = generateOtp();

        OtpVerification entity = new OtpVerification();
        entity.setEmail(email);
        entity.setOtp(otp);
        entity.setExpiry(LocalDateTime.now().plusMinutes(OTP_VALIDITY_MINUTES));
        entity.setUsed(false);
        entity.setVerified(false);
        entity.setAttempts(0);

        otpRepository.save(entity);
        return otp; // Return the generated OTP
    }

    @Transactional
    public void verifyOtp(String email, String otp) {
        // Get the latest OTP for this email
        OtpVerification otpRecord = otpRepository
                .findTopByEmailOrderByExpiryDesc(email)
                .orElseThrow(() -> new RuntimeException("OTP not found"));

        // Check if OTP is already used
        if (otpRecord.isUsed()) {
            throw new RuntimeException("OTP already used");
        }

        // Check if OTP is expired
        if (otpRecord.getExpiry().isBefore(LocalDateTime.now())) {
            otpRepository.delete(otpRecord); // Clean up expired OTP
            throw new RuntimeException("OTP expired");
        }


        if (!otpRecord.getOtp().equals(otp)) {

            otpRecord.setAttempts(otpRecord.getAttempts() + 1);

            if (otpRecord.getAttempts() > MAX_ATTEMPTS) {
                otpRepository.delete(otpRecord);
                throw new RuntimeException("OTP locked. Please request a new OTP.");
            }

            otpRepository.save(otpRecord);
            throw new RuntimeException("Invalid OTP");
        }

        otpRecord.setVerified(true);
        otpRepository.delete(otpRecord);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setVerified(true);
        user.setVerifiedAt(LocalDateTime.now());
        userRepository.save(user);
    }

    @Transactional
    public void cleanupExpiredOtps() {
        LocalDateTime now = LocalDateTime.now();
        otpRepository.findAll().stream()
                .filter(otp -> otp.getExpiry().isBefore(now))
                .forEach(otpRepository::delete);
    }
}