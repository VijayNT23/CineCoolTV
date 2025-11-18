# ⚡ Quick Reference: Deployment Settings

**Copy-paste ready settings for cinecooltv-tracker deployment**

---

## 🎨 VERCEL SETTINGS

### Basic Configuration
```
Project Name: cinecooltv-tracker
Framework Preset: Other
Root Directory: ./
Build Command: cd frontend && npm install && npm run build
Output Directory: frontend/build
Install Command: npm install
```

### Repository
```
GitHub Repository: VijayNT23/CineCoolTV
Branch: main
```

### Environment Variables (Copy All)
```env
REACT_APP_FIREBASE_API_KEY=your-firebase-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
REACT_APP_FIREBASE_APP_ID=your-app-id
REACT_APP_FIREBASE_MEASUREMENT_ID=your-measurement-id
REACT_APP_TMDB_API_KEY=your-tmdb-api-key
REACT_APP_API_URL=https://cinecooltv-tracker.onrender.com
```

**Your Frontend URL**: `https://cinecooltv-tracker.vercel.app`

---

## 🐳 RENDER SETTINGS

### Basic Configuration
```
Name: cinecooltv-tracker
Language: Docker
Branch: main
Region: Oregon (US West)
Root Directory: backend
Instance Type: Free
```

### Advanced Settings
```
Docker Build Context Directory: backend
Dockerfile Path: backend/Dockerfile
Health Check Path: /healthz
Auto-Deploy: Yes (On Commit)
```

### Environment Variables (Copy All)
```env
GEMINI_API_KEY=your-gemini-api-key
TMDB_API_KEY=your-tmdb-api-key
AI_PROVIDER=gemini
SERVER_PORT=8080
ALLOWED_ORIGINS=https://cinecooltv-tracker.vercel.app,http://localhost:3000
```

**Your Backend URL**: `https://cinecooltv-tracker.onrender.com`

---

## 🔥 FIREBASE SETTINGS

### Authorized Domains
Add this domain to Firebase Authentication → Settings → Authorized domains:
```
cinecooltv-tracker.vercel.app
```

### Firestore Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /chatHistory/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

---

## 📋 DEPLOYMENT ORDER

### Recommended: Backend First
1. ✅ Deploy to Render → Get backend URL
2. ✅ Deploy to Vercel → Use backend URL in env vars
3. ✅ Update Render CORS → Add Vercel URL
4. ✅ Configure Firebase → Add Vercel domain

### Alternative: Frontend First
1. ✅ Deploy to Vercel → Get frontend URL
2. ✅ Deploy to Render → Use frontend URL in CORS
3. ✅ Update Vercel env → Add backend URL & redeploy
4. ✅ Configure Firebase → Add Vercel domain

---

## 🎯 YOUR URLS

| Service | URL |
|---------|-----|
| Frontend | `https://cinecooltv-tracker.vercel.app` |
| Backend | `https://cinecooltv-tracker.onrender.com` |
| Health Check | `https://cinecooltv-tracker.onrender.com/healthz` |

---

## ⚠️ IMPORTANT REMINDERS

1. **Replace all `your-*` placeholders** with actual API keys
2. **Update CORS** after getting Vercel URL
3. **Update API URL** after getting Render URL
4. **Add Vercel domain** to Firebase authorized domains
5. **Wait 30-60 seconds** for free Render instance to wake up on first request

---

## 🚀 READY TO DEPLOY?

Open `DEPLOYMENT_CONFIG.md` for the complete step-by-step guide!

---

**Total Deployment Time**: 15-20 minutes
**Cost**: FREE (or $32/month for production tier)
