package com.cinecooltv.backend;

import jakarta.annotation.PostConstruct;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@SpringBootApplication
public class BackendApplication {

    public static void main(String[] args) {

        // ⭐ Load .env BEFORE Spring Boot starts
        io.github.cdimascio.dotenv.Dotenv dotenv =
                io.github.cdimascio.dotenv.Dotenv.configure()
                        .ignoreIfMissing()
                        .load();

        dotenv.entries().forEach(entry ->
                System.setProperty(entry.getKey(), entry.getValue())
        );

        System.out.println("🔐 Loaded .env BEFORE Spring Boot initialization.");

        SpringApplication.run(BackendApplication.class, args);

        System.out.println("🎬 Backend started successfully on http://localhost:8080");
        System.out.println("📡 AI Endpoint: http://localhost:8080/api/ai/ask");
        System.out.println("❤️ Health Check: http://localhost:8080/api/health");
    }

    // Optional: runs AFTER Spring starts
    @PostConstruct
    public void initEnv() {
        System.out.println("🔁 @PostConstruct executed — environment ready.");
    }

    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/api/**")
                        .allowedOriginPatterns("*")
                        .allowedMethods("*")
                        .allowedHeaders("*")
                        .allowCredentials(true);
            }
        };
    }
}
