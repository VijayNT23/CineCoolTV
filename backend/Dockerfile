FROM eclipse-temurin:21-jdk

WORKDIR /app

# Copy pom first (cache dependencies)
COPY pom.xml .
RUN mvn dependency:go-offline

# Copy source
COPY src src

# Build
RUN mvn clean package -DskipTests

EXPOSE 8080

CMD ["java", "-jar", "target/backend-0.0.1-SNAPSHOT.jar"]
