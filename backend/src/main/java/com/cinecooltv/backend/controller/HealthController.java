package com.cinecooltv.backend.controller;

import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class HealthController {

    @GetMapping("/health")
    public Map<String, Object> health() {
        Map<String, Object> status = new HashMap<>();
        status.put("status", "UP");
        status.put("message", "CineCoolTV Backend is running");
        status.put("timestamp", System.currentTimeMillis());
        return status;
    }
}

