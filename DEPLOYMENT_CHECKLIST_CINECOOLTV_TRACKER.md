# ✅ Deployment Checklist for cinecooltv-tracker

**Complete this checklist to ensure successful deployment**

---

## 📋 PRE-DEPLOYMENT CHECKLIST

### 1. GitHub Repository
- [ ] Code is pushed to GitHub repository: `VijayNT23/CineCoolTV`
- [ ] Repository is on `main` branch
- [ ] All changes are committed and pushed
- [ ] Repository is public or accessible to Vercel/Render

### 2. API Keys Ready
- [ ] **Firebase API Key** - Get from [Firebase Console](https://console.firebase.google.com/)
- [ ] **TMDB API Key** - Get from [TMDB Settings](https://www.themoviedb.org/settings/api)
- [ ] **Gemini API Key** - Get from [Google AI Studio](https://makersuite.google.com/app/apikey)

### 3. Accounts Created
- [ ] **Vercel Account** - Sign up at [vercel.com](https://vercel.com)
- [ ] **Render Account** - Sign up at [render.com](https://render.com)
- [ ] **GitHub Connected** to both Vercel and Render

---

## 🐳 RENDER BACKEND DEPLOYMENT

### Step 1: Create Web Service
- [ ] Go to [render.com](https://render.com)
- [ ] Click "New +" → "Web Service"
- [ ] Connect GitHub account
- [ ] Select repository: `VijayNT23/CineCoolTV`

### Step 2: Basic Configuration
- [ ] **Name**: `cinecooltv-tracker`
- [ ] **Language**: Docker
- [ ] **Branch**: `main`
- [ ] **Region**: Oregon (US West)
- [ ] **Root Directory**: `backend`
- [ ] **Instance Type**: Free (or Starter $7/month)

### Step 3: Advanced Settings
- [ ] **Health Check Path**: `/healthz`
- [ ] **Docker Build Context Directory**: `backend`
- [ ] **Dockerfile Path**: `backend/Dockerfile`
- [ ] **Auto-Deploy**: Yes (On Commit)

### Step 4: Environment Variables
Add these environment variables:
- [ ] `GEMINI_API_KEY` = [your-gemini-api-key]
- [ ] `TMDB_API_KEY` = [your-tmdb-api-key]
- [ ] `AI_PROVIDER` = `gemini`
- [ ] `SERVER_PORT` = `8080`
- [ ] `ALLOWED_ORIGINS` = `https://cinecooltv-tracker.vercel.app,http://localhost:3000`

### Step 5: Deploy
- [ ] Click "Create Web Service"
- [ ] Wait for build to complete (5-10 minutes)
- [ ] Check logs for any errors
- [ ] Verify deployment is successful

### Step 6: Note Backend URL
- [ ] Backend URL: `https://cinecooltv-tracker.onrender.com`
- [ ] Test health check: `https://cinecooltv-tracker.onrender.com/healthz`
- [ ] Copy this URL for Vercel configuration

---

## 🎨 VERCEL FRONTEND DEPLOYMENT

### Step 1: Create New Project
- [ ] Go to [vercel.com](https://vercel.com)
- [ ] Click "Add New..." → "Project"
- [ ] Import Git Repository
- [ ] Select repository: `VijayNT23/CineCoolTV`

### Step 2: Project Configuration
- [ ] **Vercel Team**: Vijay's projects (Hobby)
- [ ] **Project Name**: `cinecooltv-tracker`
- [ ] **Framework Preset**: Other
- [ ] **Root Directory**: `./` (default)

### Step 3: Build Settings
- [ ] **Build Command**: `cd frontend && npm install && npm run build`
- [ ] **Output Directory**: `frontend/build`
- [ ] **Install Command**: `npm install` (default)

### Step 4: Environment Variables
Add these environment variables:
- [ ] `REACT_APP_FIREBASE_API_KEY` = [your-firebase-api-key]
- [ ] `REACT_APP_FIREBASE_AUTH_DOMAIN` = [your-project].firebaseapp.com
- [ ] `REACT_APP_FIREBASE_PROJECT_ID` = [your-project-id]
- [ ] `REACT_APP_FIREBASE_STORAGE_BUCKET` = [your-project].appspot.com
- [ ] `REACT_APP_FIREBASE_MESSAGING_SENDER_ID` = [your-sender-id]
- [ ] `REACT_APP_FIREBASE_APP_ID` = [your-app-id]
- [ ] `REACT_APP_FIREBASE_MEASUREMENT_ID` = [your-measurement-id]
- [ ] `REACT_APP_TMDB_API_KEY` = [your-tmdb-api-key]
- [ ] `REACT_APP_API_URL` = `https://cinecooltv-tracker.onrender.com`

### Step 5: Deploy
- [ ] Click "Deploy"
- [ ] Wait for build to complete (2-3 minutes)
- [ ] Check build logs for any errors
- [ ] Verify deployment is successful

### Step 6: Note Frontend URL
- [ ] Frontend URL: `https://cinecooltv-tracker.vercel.app`
- [ ] Copy this URL for backend CORS configuration

---

## 🔧 POST-DEPLOYMENT CONFIGURATION

### Step 1: Update Backend CORS
- [ ] Go to Render Dashboard → `cinecooltv-tracker` service
- [ ] Click "Environment" tab
- [ ] Update `ALLOWED_ORIGINS` to include Vercel URL:
  ```
  https://cinecooltv-tracker.vercel.app,http://localhost:3000
  ```
- [ ] Click "Save Changes"
- [ ] Wait for automatic redeploy

### Step 2: Configure Firebase Authentication
- [ ] Go to [Firebase Console](https://console.firebase.google.com/)
- [ ] Select your project
- [ ] Go to **Authentication** → **Settings** → **Authorized domains**
- [ ] Click "Add domain"
- [ ] Add: `cinecooltv-tracker.vercel.app`
- [ ] Click "Add"

### Step 3: Enable Google Sign-In
- [ ] In Firebase Console → **Authentication** → **Sign-in method**
- [ ] Enable **Google** provider
- [ ] Add support email
- [ ] Save changes

### Step 4: Configure Firestore Security Rules
- [ ] Go to **Firestore Database** → **Rules**
- [ ] Update rules:
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
- [ ] Click "Publish"

---

## 🧪 TESTING CHECKLIST

### Frontend Testing
- [ ] Visit: `https://cinecooltv-tracker.vercel.app`
- [ ] Page loads successfully
- [ ] No console errors
- [ ] UI displays correctly

### Authentication Testing
- [ ] Click "Sign In" button
- [ ] Google Sign-In popup appears
- [ ] Successfully sign in with Google account
- [ ] User profile displays correctly
- [ ] Sign out works

### Backend API Testing
- [ ] Visit: `https://cinecooltv-tracker.onrender.com/healthz`
- [ ] Returns: `{"status":"UP"}`
- [ ] Wait 30-60 seconds if backend is sleeping (free tier)

### Feature Testing
- [ ] **Browse Movies**: Movies load and display
- [ ] **Browse Series**: Series load and display
- [ ] **Browse Anime**: Anime content loads
- [ ] **Search**: Search functionality works
- [ ] **Add to Library**: Can add items to library
- [ ] **Watch Status**: Can update watch status
- [ ] **Favorites**: Can add/remove favorites
- [ ] **AI Chat**: Chat assistant responds
- [ ] **Profile Stats**: Stats display correctly
- [ ] **Theme Toggle**: Dark/Light theme works

### Mobile Testing
- [ ] Open on mobile device
- [ ] Responsive design works
- [ ] All features work on mobile

---

## 🐛 TROUBLESHOOTING

### Issue: Backend Not Responding
- [ ] Wait 30-60 seconds (free tier wakes up)
- [ ] Check Render logs for errors
- [ ] Verify environment variables are set
- [ ] Check health endpoint: `/healthz`

### Issue: CORS Errors
- [ ] Verify `ALLOWED_ORIGINS` in Render includes Vercel URL
- [ ] Check no trailing slashes in URLs
- [ ] Ensure both URLs use HTTPS
- [ ] Redeploy backend after CORS changes

### Issue: Firebase Authentication Failed
- [ ] Verify all Firebase env variables are correct
- [ ] Check Vercel domain in Firebase authorized domains
- [ ] Ensure Google Sign-In is enabled in Firebase
- [ ] Check browser console for specific errors

### Issue: Build Failed on Vercel
- [ ] Check build logs in Vercel dashboard
- [ ] Verify build command is correct
- [ ] Ensure all environment variables are set
- [ ] Check `frontend/build` directory exists after build

### Issue: Build Failed on Render
- [ ] Check build logs in Render dashboard
- [ ] Verify Dockerfile exists at `backend/Dockerfile`
- [ ] Ensure Docker build context is `backend`
- [ ] Check environment variables are set

---

## 📊 DEPLOYMENT STATUS

### URLs
- [ ] **Frontend**: `https://cinecooltv-tracker.vercel.app`
- [ ] **Backend**: `https://cinecooltv-tracker.onrender.com`
- [ ] **Health Check**: `https://cinecooltv-tracker.onrender.com/healthz`

### Deployment Complete
- [ ] Frontend deployed successfully
- [ ] Backend deployed successfully
- [ ] CORS configured correctly
- [ ] Firebase configured correctly
- [ ] All features tested and working
- [ ] Mobile responsive verified

---

## 🎉 FINAL STEPS

### Share Your App
- [ ] Share URL: `https://cinecooltv-tracker.vercel.app`
- [ ] Test with friends/family
- [ ] Gather feedback

### Monitor Your App
- [ ] Check Vercel Analytics
- [ ] Monitor Render logs
- [ ] Watch Firebase usage

### Optional: Upgrade to Production
- [ ] Consider Vercel Pro ($20/month) for unlimited bandwidth
- [ ] Consider Render Starter ($7/month) for always-on backend
- [ ] Upgrade Firebase to Blaze plan if needed

---

## 💰 COST SUMMARY

### Current Setup (Free Tier)
- Vercel: $0/month
- Render: $0/month
- Firebase: $0/month
- **Total: $0/month**

### Recommended Production Setup
- Vercel Pro: $20/month
- Render Starter: $7/month
- Firebase Blaze: ~$5/month
- **Total: ~$32/month**

---

## 📚 REFERENCE DOCUMENTS

- [ ] `DEPLOYMENT_CONFIG.md` - Complete deployment guide
- [ ] `DEPLOYMENT_SETTINGS_SUMMARY.md` - Quick reference
- [ ] `VERCEL_EXACT_SETTINGS.txt` - Vercel settings
- [ ] `RENDER_EXACT_SETTINGS.txt` - Render settings
- [ ] `QUICK_DEPLOY.md` - Quick deployment guide

---

## ✅ DEPLOYMENT COMPLETE!

**Congratulations!** Your CineCoolTV application is now live at:

🌐 **https://cinecooltv-tracker.vercel.app**

---

**Deployment Date**: _______________
**Deployed By**: _______________
**Status**: ✅ LIVE

---

**Need Help?** Check the troubleshooting section or review the deployment guides.

**Happy Tracking! 🎬🍿**
