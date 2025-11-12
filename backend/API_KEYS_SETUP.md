# API Keys Setup Guide

## Quick Setup

### Step 1: Edit `application.properties`

Open `backend/src/main/resources/application.properties` and replace the placeholder values:

```properties
# Replace with your actual API keys
GEMINI_API_KEY=your-actual-gemini-api-key-here
OPENAI_API_KEY=your-actual-openai-api-key-here
TMDB_API_KEY=your-actual-tmdb-api-key-here

# Choose which AI to use (gemini or openai)
AI_PROVIDER=gemini
```

### Step 2: Restart the Backend Server

After updating the keys, restart your backend server:

```bash
cd backend
.\mvnw.cmd spring-boot:run
```

## Alternative: Environment Variables

You can also set API keys as environment variables (recommended for production):

### Windows PowerShell:
```powershell
$env:GEMINI_API_KEY="your-actual-gemini-api-key"
$env:OPENAI_API_KEY="your-actual-openai-api-key"
$env:TMDB_API_KEY="your-actual-tmdb-api-key"
$env:AI_PROVIDER="gemini"
```

### Windows CMD:
```cmd
set GEMINI_API_KEY=your-actual-gemini-api-key
set OPENAI_API_KEY=your-actual-openai-api-key
set TMDB_API_KEY=your-actual-tmdb-api-key
set AI_PROVIDER=gemini
```

### Linux/Mac:
```bash
export GEMINI_API_KEY="your-actual-gemini-api-key"
export OPENAI_API_KEY="your-actual-openai-api-key"
export TMDB_API_KEY="your-actual-tmdb-api-key"
export AI_PROVIDER="gemini"
```

## How It Works

- **Gemini API**: Preferred by default. Set `AI_PROVIDER=gemini` or just provide `GEMINI_API_KEY`
- **OpenAI API**: Alternative option. Set `AI_PROVIDER=openai` or just provide `OPENAI_API_KEY`
- **Auto-fallback**: If the preferred provider fails, it will try the other one automatically
- **TMDB API**: Optional, used for movie recommendations and posters

## Getting API Keys

### Gemini API Key:
1. Go to https://makersuite.google.com/app/apikey
2. Create a new API key
3. Copy and paste it into `application.properties`

### OpenAI API Key:
1. Go to https://platform.openai.com/api-keys
2. Create a new API key
3. Copy and paste it into `application.properties`

### TMDB API Key:
1. Go to https://www.themoviedb.org/settings/api
2. Request an API key
3. Copy and paste it into `application.properties`

## Troubleshooting

### Error: "No AI API key configured"
- Make sure you've set at least one of: `GEMINI_API_KEY` or `OPENAI_API_KEY`
- Check that the key is not still set to "your-gemini-key-here" or "your-openai-key-here"
- Restart the server after updating keys

### Error: "Gemini API request failed"
- Verify your Gemini API key is correct
- Check if you have API quota remaining
- Try switching to OpenAI by setting `AI_PROVIDER=openai`

### Error: "OpenAI API request failed"
- Verify your OpenAI API key is correct
- Check if you have API credits remaining
- Try switching to Gemini by setting `AI_PROVIDER=gemini`

