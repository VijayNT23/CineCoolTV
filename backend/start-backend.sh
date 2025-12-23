#!/bin/bash

echo "========================================"
echo "Starting CineCoolTV Backend Server"
echo "========================================"
echo ""
echo "Make sure you have:"
echo "1. Java 21 installed"
echo "2. Maven installed (or use ./mvnw)"
echo "3. OPENAI_API_KEY set in environment or application.properties"
echo ""
echo "Starting server onhttps://cinecooltv-backend.onrender.com"
echo ""

# Check if mvnw exists, use it, otherwise use mvn
if [ -f "./mvnw" ]; then
    ./mvnw spring-boot:run
else
    mvn spring-boot:run
fi

