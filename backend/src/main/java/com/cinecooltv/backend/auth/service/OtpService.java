package com.cinecooltv.backend.auth.service;

import com.cinecooltv.backend.model.OtpVerification;
import com.cinecooltv.backend.repository.OtpRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Random;

@Service
public class OtpService {

    private final OtpRepository otpRepository;

    public OtpService(OtpRepository otpRepository) {
        this.otpRepository = otpRepository;
    }

    public String generateOtp(String email) {
        String otp = String.valueOf(new Random().nextInt(900000) + 100000);

        OtpVerification entity = new OtpVerification();
        entity.setEmail(email);
        entity.setOtp(otp);
        entity.setExpiryTime(LocalDateTime.now().plusMinutes(5));

        otpRepository.save(entity);
        return otp;
    }

    public boolean verifyOtp(String email, String otp) {
        OtpVerification data = otpRepository
                .findTopByEmailOrderByExpiryTimeDesc(email)
                .orElseThrow();

        if (data.isUsed()) return false;
        if (data.getExpiryTime().isBefore(LocalDateTime.now())) return false;
        if (!data.getOtp().equals(otp)) return false;

        data.setUsed(true);
        otpRepository.save(data);
        return true;
    }
}
