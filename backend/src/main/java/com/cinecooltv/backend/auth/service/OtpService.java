package com.cinecooltv.backend.auth.service;

import com.cinecooltv.backend.model.OtpVerification;
import com.cinecooltv.backend.model.User;
import com.cinecooltv.backend.repository.OtpRepository;
import com.cinecooltv.backend.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Random;

@Service
public class OtpService {

    private final OtpRepository otpRepository;
    private final UserRepository userRepository;

    public OtpService(OtpRepository otpRepository, UserRepository userRepository) {
        this.otpRepository = otpRepository;
        this.userRepository = userRepository;
    }

    public String generateOtp() {
        return String.valueOf(100000 + new Random().nextInt(900000));
    }

    // ================= CREATE OTP =================
    @Transactional
    public void createOtp(String email, String otp) {

        OtpVerification entity = new OtpVerification();
        entity.setEmail(email);
        entity.setOtp(otp);
        entity.setExpiryTime(LocalDateTime.now().plusMinutes(10));
        entity.setUsed(false);

        otpRepository.save(entity);
    }

    // ================= VERIFY OTP =================
    @Transactional
    public void verifyOtp(String email, String otp) {

        OtpVerification data = otpRepository
                .findTopByEmailOrderByExpiryTimeDesc(email)
                .orElseThrow(() -> new RuntimeException("OTP not found"));

        if (data.isUsed()) {
            throw new RuntimeException("OTP already used");
        }

        if (data.getExpiryTime().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("OTP expired");
        }

        if (!data.getOtp().equals(otp)) {
            throw new RuntimeException("Invalid OTP");
        }

        data.setUsed(true);
        otpRepository.save(data);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setVerified(true);
        user.setVerifiedAt(LocalDateTime.now());
        userRepository.save(user);
    }
}
