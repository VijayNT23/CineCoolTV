# 🚀 Quick Deployment Guide for CineCoolTV

This guide will help you deploy CineCoolTV to production using **Vercel (Frontend)** and **Render (Backend)**.

## 📋 Prerequisites

1. ✅ GitHub account
2. ✅ Vercel account (free tier available)
3. ✅ Render account (free tier available)
4. ✅ Firebase project set up
5. ✅ TMDB API key
6. ✅ Gemini API key (for AI features)

---

## 🎯 Step 1: Prepare Your Repository

### 1.1 Push to GitHub

```bash
# Initialize git if not already done
git init

# Add all files
git add .

# Commit
git commit -m "Ready for deployment"

# Add remote (replace with your GitHub repo URL)
git remote add origin https://github.com/yourusername/CineCoolTV.git

# Push to GitHub
git push -u origin main
```

---

## 🖥️ Step 2: Deploy Backend to Render

### 2.1 Create Render Account
1. Go to [render.com](https://render.com)
2. Sign up with GitHub

### 2.2 Deploy Backend
1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository
3. Configure the service:
   - **Name**: `cinecooltv-backend`
   - **Region**: Choose closest to your users
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Docker`
   - **Instance Type**: `Free` (or paid for better performance)

### 2.3 Add Environment Variables
In Render dashboard, add these environment variables:

```
GEMINI_API_KEY=your-gemini-api-key
TMDB_API_KEY=your-tmdb-api-key
AI_PROVIDER=gemini
SPRING_PROFILES_ACTIVE=prod
SERVER_PORT=8080
```

### 2.4 Deploy
1. Click **"Create Web Service"**
2. Wait for deployment (5-10 minutes)
3. Copy your backend URL (e.g., `https://cinecooltv-backend.onrender.com`)

---

## 🌐 Step 3: Deploy Frontend to Vercel

### 3.1 Create Vercel Account
1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub

### 3.2 Deploy Frontend
1. Click **"Add New..."** → **"Project"**
2. Import your GitHub repository
3. Configure the project:
   - **Framework Preset**: `Create React App`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`

### 3.3 Add Environment Variables
In Vercel project settings → Environment Variables, add:

```
REACT_APP_FIREBASE_API_KEY=your-firebase-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
REACT_APP_FIREBASE_APP_ID=your-app-id
REACT_APP_FIREBASE_MEASUREMENT_ID=your-measurement-id
REACT_APP_TMDB_API_KEY=your-tmdb-api-key
REACT_APP_API_URL=https://cinecooltv-backend.onrender.com
```

**Important**: Replace `REACT_APP_API_URL` with your actual Render backend URL from Step 2.4

### 3.4 Deploy
1. Click **"Deploy"**
2. Wait for deployment (2-5 minutes)
3. Your app will be live at `https://your-project.vercel.app`

---

## 🔧 Step 4: Configure CORS (Backend)

Update `backend/src/main/java/com/moviestracker/backend/config/WebConfig.java`:

```java
@Override
public void addCorsMappings(CorsRegistry registry) {
    registry.addMapping("/api/**")
        .allowedOrigins(
            "http://localhost:3000",
            "https://your-project.vercel.app"  // Add your Vercel URL
        )
        .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
        .allowedHeaders("*")
        .allowCredentials(true);
}
```

Commit and push this change - Render will auto-deploy.

---

## 🔥 Step 5: Configure Firebase

### 5.1 Update Firebase Security Rules

In Firebase Console → Firestore Database → Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own data
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### 5.2 Add Authorized Domains

In Firebase Console → Authentication → Settings → Authorized domains:
- Add your Vercel domain: `your-project.vercel.app`

---

## ✅ Step 6: Test Your Deployment

1. **Visit your Vercel URL**: `https://your-project.vercel.app`
2. **Test features**:
   - ✅ User authentication (login/signup)
   - ✅ Browse movies/series/anime
   - ✅ Add to library
   - ✅ AI Chat functionality
   - ✅ Profile stats
   - ✅ Search functionality

3. **Check backend health**:
   - Visit: `https://cinecooltv-backend.onrender.com/actuator/health`
   - Should return: `{"status":"UP"}`

---

## 🎨 Step 7: Custom Domain (Optional)

### Vercel Custom Domain
1. Go to Vercel project → Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed

### Render Custom Domain
1. Go to Render service → Settings → Custom Domain
2. Add your custom domain
3. Update DNS records as instructed

---

## 🔄 Continuous Deployment

Both Vercel and Render support automatic deployments:

- **Push to `main` branch** → Automatic deployment
- **Pull requests** → Preview deployments (Vercel)
- **Rollback** → Available in both platforms

---

## 📊 Monitoring

### Vercel Analytics
- Enable in Vercel dashboard
- Track page views, performance

### Render Logs
- View real-time logs in Render dashboard
- Monitor backend errors

### Backend Health Check
- Endpoint: `/actuator/health`
- Set up uptime monitoring (e.g., UptimeRobot)

---

## 🐛 Troubleshooting

### Frontend Issues

**Problem**: White screen after deployment
- **Solution**: Check browser console for errors
- Verify all environment variables are set in Vercel

**Problem**: API calls failing
- **Solution**: Check `REACT_APP_API_URL` is correct
- Verify CORS settings in backend

### Backend Issues

**Problem**: Backend not starting
- **Solution**: Check Render logs
- Verify all environment variables are set

**Problem**: 502 Bad Gateway
- **Solution**: Backend might be sleeping (free tier)
- First request takes 30-60 seconds to wake up

---

## 💰 Cost Breakdown

### Free Tier (Recommended for Testing)
- **Vercel**: Free (100GB bandwidth/month)
- **Render**: Free (750 hours/month, sleeps after 15 min inactivity)
- **Firebase**: Free (Spark plan)
- **Total**: $0/month

### Paid Tier (Recommended for Production)
- **Vercel Pro**: $20/month
- **Render Starter**: $7/month (always on)
- **Firebase Blaze**: Pay as you go
- **Total**: ~$27-30/month

---

## 🎉 You're Live!

Your CineCoolTV app is now deployed and accessible worldwide!

**Share your deployment**:
- Frontend: `https://your-project.vercel.app`
- Backend: `https://cinecooltv-backend.onrender.com`

---

## 📞 Need Help?

- Check logs in Vercel/Render dashboards
- Review `DEPLOYMENT.md` for advanced options
- Open an issue on GitHub

**Happy Deploying! 🚀**
