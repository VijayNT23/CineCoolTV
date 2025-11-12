# How to Start the Backend Server

## Quick Start

### Option 1: Using the Startup Script (Windows)
```bash
cd backend
start-backend.bat
```

### Option 2: Using the Startup Script (Linux/Mac)
```bash
cd backend
chmod +x start-backend.sh
./start-backend.sh
```

### Option 3: Using Maven Directly
```bash
cd backend
mvn spring-boot:run
```

### Option 4: Using Maven Wrapper
```bash
cd backend
# Windows
mvnw.cmd spring-boot:run

# Linux/Mac
./mvnw spring-boot:run
```

## Prerequisites

1. **Java 21** - Make sure Java 21 is installed
   ```bash
   java -version
   ```

2. **Maven** (optional if using mvnw)
   ```bash
   mvn -version
   ```

3. **PostgreSQL** - Database should be running on `localhost:5433`

## Configure API Keys

Before starting, you need to set your API keys. You have two options:

### Option 1: Environment Variables (Recommended)
Set these in your system environment or terminal:
```bash
# Windows PowerShell
$env:OPENAI_API_KEY="your-actual-openai-key"
$env:TMDB_API_KEY="your-actual-tmdb-key"

# Windows CMD
set OPENAI_API_KEY=your-actual-openai-key
set TMDB_API_KEY=your-actual-tmdb-key

# Linux/Mac
export OPENAI_API_KEY="your-actual-openai-key"
export TMDB_API_KEY="your-actual-tmdb-key"
```

### Option 2: Update application.properties
Edit `backend/src/main/resources/application.properties`:
```properties
OPENAI_API_KEY=your-actual-openai-key
TMDB_API_KEY=your-actual-tmdb-key
```

## Verify Backend is Running

Once started, you should see:
```
🎬 Backend started successfully on http://localhost:8080
📡 AI Endpoint: http://localhost:8080/api/ai/ask
❤️ Health Check: http://localhost:8080/api/health
```

Test the health endpoint:
- Open browser: http://localhost:8080/api/health
- Or use curl: `curl http://localhost:8080/api/health`

## Troubleshooting

### Port 8080 already in use
- Stop any other application using port 8080
- Or change the port in `application.properties`: `server.port=8082`

### Database connection error
- Make sure PostgreSQL is running
- Check database credentials in `application.properties`

### API key errors
- Make sure you've set valid API keys
- Check the console for specific error messages

