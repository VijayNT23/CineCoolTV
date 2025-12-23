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

        // OPTIONAL: dotenv only for LOCAL
        // On Render, ENV vars come automatically
        try {
            io.github.cdimascio.dotenv.Dotenv dotenv =
                    io.github.cdimascio.dotenv.Dotenv.configure()
                            .ignoreIfMissing()
                            .load();

            dotenv.entries().forEach(entry ->
                    System.setProperty(entry.getKey(), entry.getValue())
            );

            System.out.println("🔐 .env loaded (local only)");
        } catch (Exception ignored) {}

        SpringApplication.run(BackendApplication.class, args);
        System.out.println("🚀 Backend started");
    }

    @PostConstruct
    public void init() {
        System.out.println("✅ Environment ready");
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
