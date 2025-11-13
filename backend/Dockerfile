# =========================
# 🏗️ Build Stage
# =========================
FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /app

# Copy Maven wrapper, config, and pom.xml
COPY mvnw .
COPY .mvn .mvn
COPY pom.xml .

# ✅ Fix permission issue before running mvnw
RUN chmod +x mvnw

# Download dependencies (faster incremental builds)
RUN ./mvnw dependency:go-offline -B

# Copy the rest of the source code
COPY src src

# Build the Spring Boot application
RUN ./mvnw clean package -DskipTests

# =========================
# 🚀 Runtime Stage
# =========================
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Copy the JAR file from the build stage
COPY --from=build /app/target/*.jar app.jar

# Expose backend port (Render auto-detects)
EXPOSE 8080

# Optional: health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/actuator/health || exit 1

# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]
