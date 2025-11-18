# =========================
# 🏗️ Build Stage
# =========================
FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /app

# Copy Maven wrapper, config, and pom.xml (FROM backend folder)
COPY backend/mvnw .
COPY backend/.mvn .mvn
COPY backend/pom.xml .

# Fix mvnw permissions
RUN chmod +x mvnw

# Download dependencies
RUN ./mvnw dependency:go-offline -B

# Copy backend src folder
COPY backend/src ./src

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
