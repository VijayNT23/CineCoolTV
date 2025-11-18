# =========================
# 🏗️ Build Stage
# =========================
FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /app

# Copy Maven wrapper, config, and pom.xml from backend folder (relative to Dockerfile)
COPY mvnw .
COPY .mvn .mvn
COPY pom.xml .

# Fix mvnw permissions
RUN chmod +x mvnw

# Download dependencies before copying source code
RUN ./mvnw dependency:go-offline -B

# Copy backend src folder
COPY src ./src

# Build the Spring Boot JAR
RUN ./mvnw clean package -DskipTests

# =========================
# 🚀 Runtime Stage
# =========================
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Copy the JAR from the build stage
COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
