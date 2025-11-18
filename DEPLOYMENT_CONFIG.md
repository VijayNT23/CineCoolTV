# 🚀 CineCoolTV Deployment Configuration Guide

**Your Custom Deployment Settings for cinecooltv-tracker**

This guide contains the **exact settings** you need to deploy your CineCoolTV application to Vercel (Frontend) and Render (Backend).

---

## 📋 Table of Contents

1. [Vercel Frontend Deployment](#vercel-frontend-deployment)
2. [Render Backend Deployment](#render-backend-deployment)
3. [Environment Variables](#environment-variables)
4. [Post-Deployment Steps](#post-deployment-steps)

---

## 🎨 Vercel Frontend Deployment

### Step-by-Step Configuration

1. **Go to Vercel**: [https://vercel.com](https://vercel.com)
2. **Sign in** with your GitHub account
3. Click **"Add New..."** → **"Project"**
4. Click **"Import Git Repository"**
5. Select **"Import from GitHub"**

### Repository Selection

```
Repository: VijayNT23/CineCoolTV
Branch: main
```

### Project Configuration

Fill in the following settings **exactly as shown**:

| Setting | Value |
|---------|-------|
| **Vercel Team** | Vijay's projects (Hobby) |
| **Project Name** | `cinecooltv-tracker` |
| **Framework Preset** | Other |
| **Root Directory** | `./` (leave as default) |
| **Build Command** | `cd frontend && npm install && npm run build` |
| **Output Directory** | `frontend/build` |
| **Install Command** | `npm install` (default) |

### Environment Variables for Vercel

Click **"Add Environment Variable"** and add these one by one:

```env
# Firebase Configuration
REACT_APP_FIREBASE_API_KEY=your-firebase-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
REACT_APP_FIREBASE_APP_ID=your-app-id
REACT_APP_FIREBASE_MEASUREMENT_ID=your-measurement-id

# TMDB API
REACT_APP_TMDB_API_KEY=your-tmdb-api-key

# Backend API URL (Update after deploying backend)
REACT_APP_API_URL=https://cinecooltv-tracker.onrender.com
```

**⚠️ IMPORTANT**:
- Replace all `your-*` values with your actual API keys
- Update `REACT_APP_API_URL` after deploying the backend (Step 2)
- You can paste the entire `.env` file contents using "Add from .env" option

### Deploy

Click **"Deploy"** and wait for the build to complete (~2-3 minutes)

**Your Frontend URL will be**: `https://cinecooltv-tracker.vercel.app`

---

## 🐳 Render Backend Deployment

### Step-by-Step Configuration

1. **Go to Render**: [https://render.com](https://render.com)
2. **Sign in** with your GitHub account
3. Click **"New +"** → **"Web Service"**
4. Click **"Connect account"** to connect GitHub (if not already connected)
5. Select repository: **VijayNT23/CineCoolTV**

### Service Configuration

Fill in the following settings **exactly as shown**:

| Setting | Value |
|---------|-------|
| **Name** | `cinecooltv-tracker` |
| **Language** | Docker |
| **Branch** | `main` |
| **Region** | Oregon (US West) |
| **Root Directory** | `backend` |
| **Instance Type** | Free ($0/month) |

### Advanced Settings

Expand the **"Advanced"** section and configure:

| Setting | Value |
|---------|-------|
| **Docker Build Context Directory** | `backend` |
| **Dockerfile Path** | `backend/Dockerfile` |
| **Health Check Path** | `/healthz` |
| **Auto-Deploy** | Yes (On Commit) |

### Environment Variables for Render

Click **"Add Environment Variable"** and add these:

```env
# API Keys
GEMINI_API_KEY=your-gemini-api-key
TMDB_API_KEY=your-tmdb-api-key

# Server Configuration
AI_PROVIDER=gemini
SERVER_PORT=8080

# CORS Configuration (Update after Vercel deployment)
ALLOWED_ORIGINS=https://cinecooltv-tracker.vercel.app,http://localhost:3000
```

**⚠️ IMPORTANT**:
- Replace `your-gemini-api-key` with your actual Gemini API key
- Replace `your-tmdb-api-key` with your actual TMDB API key
- Update `ALLOWED_ORIGINS` with your actual Vercel URL after frontend deployment

### Deploy

Click **"Create Web Service"** and wait for the build to complete (~5-10 minutes)

**Your Backend URL will be**: `https://cinecooltv-tracker.onrender.com`

---

## 🔑 Environment Variables Reference

### Where to Get Your API Keys

#### 1. Firebase Configuration
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (or create a new one)
3. Click ⚙️ **Settings** → **Project settings**
4. Scroll down to **"Your apps"** → Select your web app
5. Copy all the config values from `firebaseConfig`

#### 2. TMDB API Key
1. Go to [TMDB](https://www.themoviedb.org/)
2. Sign up/Login
3. Go to **Settings** → **API**
4. Request an API key (free)
5. Copy the **API Key (v3 auth)**

#### 3. Gemini API Key
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click **"Create API Key"**
4. Copy the generated key

---

## 🔧 Post-Deployment Steps

### Step 1: Update Backend CORS Configuration

After deploying to Vercel, you need to update the backend CORS settings:

1. **Note your Vercel URL**: `https://cinecooltv-tracker.vercel.app`

2. **Update Render Environment Variable**:
   - Go to Render Dashboard → Your Service
   - Click **"Environment"** tab
   - Update `ALLOWED_ORIGINS` to:
     ```
     https://cinecooltv-tracker.vercel.app,http://localhost:3000
     ```
   - Click **"Save Changes"**
   - Render will automatically redeploy

### Step 2: Update Vercel Backend URL

If you deployed Vercel first, update the backend URL:

1. Go to Vercel Dashboard → Your Project
2. Click **"Settings"** → **"Environment Variables"**
3. Update `REACT_APP_API_URL` to:
   ```
   https://cinecooltv-tracker.onrender.com
   ```
4. Click **"Save"**
5. Go to **"Deployments"** → Click **"Redeploy"** on the latest deployment

### Step 3: Configure Firebase Authentication

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Authentication** → **Settings** → **Authorized domains**
4. Click **"Add domain"**
5. Add: `cinecooltv-tracker.vercel.app`
6. Click **"Add"**

### Step 4: Update Firestore Security Rules

1. Go to **Firestore Database** → **Rules**
2. Update the rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User data - only accessible by the user
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Chat history - only accessible by the user
    match /chatHistory/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

3. Click **"Publish"**

---

## ✅ Deployment Checklist

### Pre-Deployment
- [ ] Code pushed to GitHub repository `VijayNT23/CineCoolTV`
- [ ] Firebase project created
- [ ] TMDB API key obtained
- [ ] Gemini API key obtained
- [ ] Vercel account created
- [ ] Render account created

### Vercel Deployment
- [ ] Project name set to `cinecooltv-tracker`
- [ ] Build command: `cd frontend && npm install && npm run build`
- [ ] Output directory: `frontend/build`
- [ ] All environment variables added
- [ ] Deployment successful
- [ ] Frontend URL noted: `https://cinecooltv-tracker.vercel.app`

### Render Deployment
- [ ] Service name set to `cinecooltv-tracker`
- [ ] Language set to Docker
- [ ] Root directory: `backend`
- [ ] Docker build context: `backend`
- [ ] Dockerfile path: `backend/Dockerfile`
- [ ] All environment variables added
- [ ] Deployment successful
- [ ] Backend URL noted: `https://cinecooltv-tracker.onrender.com`

### Post-Deployment
- [ ] Backend CORS updated with Vercel URL
- [ ] Frontend API URL updated with Render URL
- [ ] Firebase authorized domains updated
- [ ] Firestore security rules configured
- [ ] Tested login/signup functionality
- [ ] Tested browsing movies/series
- [ ] Tested AI chat feature
- [ ] Tested library management

---

## 🎯 Your Deployment URLs

After successful deployment, your application will be available at:

| Service | URL |
|---------|-----|
| **Frontend (Vercel)** | `https://cinecooltv-tracker.vercel.app` |
| **Backend (Render)** | `https://cinecooltv-tracker.onrender.com` |
| **API Health Check** | `https://cinecooltv-tracker.onrender.com/healthz` |

---

## 🐛 Troubleshooting

### Issue: "Backend not responding"
**Solution**:
- Free tier Render instances sleep after 15 minutes of inactivity
- First request after sleep takes 30-60 seconds to wake up
- Wait and try again
- Consider upgrading to Starter ($7/month) for always-on service

### Issue: "CORS Error"
**Solution**:
- Verify `ALLOWED_ORIGINS` in Render includes your Vercel URL
- Check that `REACT_APP_API_URL` in Vercel points to your Render URL
- Make sure there are no trailing slashes in URLs

### Issue: "Firebase Authentication Failed"
**Solution**:
- Verify all Firebase environment variables are correct
- Check that your Vercel domain is in Firebase authorized domains
- Ensure Firebase Authentication is enabled (Google provider)

### Issue: "Build Failed on Vercel"
**Solution**:
- Check build logs in Vercel dashboard
- Verify build command: `cd frontend && npm install && npm run build`
- Ensure all environment variables are set
- Check that `frontend/build` directory is correct

### Issue: "Build Failed on Render"
**Solution**:
- Check build logs in Render dashboard
- Verify Dockerfile exists at `backend/Dockerfile`
- Ensure Docker build context is set to `backend`
- Check that all environment variables are set

---

## 💰 Cost Breakdown

### Free Tier (Perfect for Testing)
- **Vercel**: $0/month
  - 100GB bandwidth
  - Unlimited deployments
  - Automatic HTTPS
  - Global CDN

- **Render**: $0/month
  - 512 MB RAM
  - 0.1 CPU
  - Sleeps after 15 min inactivity
  - 750 hours/month free

- **Firebase**: $0/month (Spark Plan)
  - 50K reads/day
  - 20K writes/day
  - 1GB storage

**Total**: **$0/month**

### Production Tier (Recommended)
- **Vercel Pro**: $20/month
  - Unlimited bandwidth
  - Advanced analytics
  - Custom domains

- **Render Starter**: $7/month
  - Always-on (no sleep)
  - 512 MB RAM
  - 0.5 CPU
  - SSH access

- **Firebase Blaze**: ~$5/month (pay-as-you-go)
  - Unlimited reads/writes
  - More storage

**Total**: **~$32/month**

---

## 🚀 Quick Deploy Summary

### Option 1: Deploy Backend First (Recommended)

1. **Deploy to Render** (5-10 min)
   - Use settings above
   - Note the backend URL: `https://cinecooltv-tracker.onrender.com`

2. **Deploy to Vercel** (2-3 min)
   - Use settings above
   - Set `REACT_APP_API_URL` to your Render URL
   - Note the frontend URL: `https://cinecooltv-tracker.vercel.app`

3. **Update Backend CORS** (1 min)
   - Add Vercel URL to `ALLOWED_ORIGINS` in Render

4. **Configure Firebase** (2 min)
   - Add Vercel domain to authorized domains
   - Update Firestore rules

**Total Time**: ~15-20 minutes

### Option 2: Deploy Frontend First

1. **Deploy to Vercel** (2-3 min)
   - Use settings above
   - Use placeholder for `REACT_APP_API_URL`
   - Note the frontend URL

2. **Deploy to Render** (5-10 min)
   - Use settings above
   - Set `ALLOWED_ORIGINS` with your Vercel URL
   - Note the backend URL

3. **Update Frontend API URL** (1 min)
   - Update `REACT_APP_API_URL` in Vercel
   - Redeploy

4. **Configure Firebase** (2 min)
   - Add Vercel domain to authorized domains
   - Update Firestore rules

**Total Time**: ~15-20 minutes

---

## 📝 Notes

- **Project Name**: Both services use `cinecooltv-tracker` for consistency
- **Auto-Deploy**: Both platforms will automatically redeploy when you push to GitHub
- **HTTPS**: Both platforms provide automatic HTTPS certificates
- **Logs**: Check deployment logs in respective dashboards for debugging
- **Monitoring**: Use Vercel Analytics and Render metrics for monitoring

---

## 🎉 Success!

Once deployed, your CineCoolTV application will be live and accessible worldwide!

**Share your app**: `https://cinecooltv-tracker.vercel.app`

---

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Render Documentation](https://render.com/docs)
- [Firebase Documentation](https://firebase.google.com/docs)
- [TMDB API Documentation](https://developers.themoviedb.org/3)
- [Gemini API Documentation](https://ai.google.dev/docs)

---

**Need more help?** Check out:
- `QUICK_DEPLOY.md` - Quick deployment guide
- `DEPLOYMENT_STEPS.md` - Detailed step-by-step guide
- `DEPLOYMENT_CHECKLIST.md` - Complete production checklist

---

**Version**: 1.0.0
**Last Updated**: 2025
**Status**: ✅ Ready to Deploy

---

**Happy Deploying! 🚀**
