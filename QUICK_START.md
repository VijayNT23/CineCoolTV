# 🚀 Quick Start Guide - CineCoolTV

Get your CineCoolTV application up and running in minutes!

## ⚡ Prerequisites

- Node.js (v16+)
- Java 21
- Git

## 🎯 5-Minute Setup

### Step 1: Get API Keys (5 minutes)

1. **TMDB API Key** (Required)
   - Go to: https://www.themoviedb.org/signup
   - Sign up → Settings → API → Request API Key
   - Copy your API key

2. **Gemini API Key** (Required for AI)
   - Go to: https://makersuite.google.com/app/apikey
   - Click "Create API Key"
   - Copy your API key

3. **Firebase Setup** (Required for auth)
   - Go to: https://console.firebase.google.com/
   - Create new project
   - Enable Authentication (Email/Password)
   - Go to Project Settings → Copy config values

### Step 2: Configure Backend (2 minutes)

```bash
cd backend
```

Create `.env` file:
```env
GEMINI_API_KEY=paste-your-gemini-key-here
TMDB_API_KEY=paste-your-tmdb-key-here
AI_PROVIDER=gemini
```

### Step 3: Configure Frontend (2 minutes)

```bash
cd frontend
```

Create `.env` file:
```env
REACT_APP_FIREBASE_API_KEY=your-firebase-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
REACT_APP_FIREBASE_APP_ID=your-app-id
REACT_APP_TMDB_API_KEY=paste-your-tmdb-key-here
REACT_APP_API_URL=http://localhost:8080
```

### Step 4: Start Backend (1 minute)

```bash
cd backend

# Windows
start-backend.bat

# Linux/Mac
./start-backend.sh
```

Wait for: `🎬 Backend started successfully on http://localhost:8080`

### Step 5: Start Frontend (1 minute)

```bash
cd frontend
npm install
npm start
```

Wait for: `Compiled successfully!`

### Step 6: Open Browser

Navigate to: **http://localhost:3000**

🎉 **You're ready to go!**

---

## 🎬 What You Can Do Now

1. **Sign Up**: Create an account
2. **Browse**: Explore movies and TV shows
3. **Chat with AI**: Ask about movies, characters, recommendations
4. **Track**: Add items to your library
5. **Discover**: Get personalized recommendations

---

## 🐛 Troubleshooting

### Backend won't start?
- Check Java 21 is installed: `java -version`
- Verify API keys in `.env` file
- Check port 8080 is available

### Frontend won't start?
- Check Node.js is installed: `node -v`
- Run `npm install` again
- Check port 3000 is available

### AI Chat not working?
- Verify GEMINI_API_KEY or OPENAI_API_KEY is set
- Check backend is running
- Look at backend console for errors

### Can't login?
- Verify Firebase configuration in `.env`
- Check Firebase Authentication is enabled
- Ensure all Firebase config values are correct

---

## 📚 Next Steps

- Read `README.md` for detailed documentation
- Check `DEPLOYMENT.md` for production deployment
- Review `DEPLOYMENT_READINESS_REPORT.md` for status

---

**Need Help?** Open an issue on GitHub or check the documentation!
