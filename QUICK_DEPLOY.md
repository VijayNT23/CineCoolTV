# ⚡ Quick Deploy Guide - CineCoolTV

**Deploy in 15 minutes!** Follow these steps to get CineCoolTV live.

---

## 🎯 What You Need

1. GitHub account
2. Vercel account (free)
3. Render account (free)
4. Firebase project
5. TMDB API key
6. Gemini API key

---

## 🚀 Deploy Now

### Step 1: Push to GitHub (2 min)

```bash
git init
git add .
git commit -m "Initial deployment"
git remote add origin https://github.com/yourusername/CineCoolTV.git
git push -u origin main
```

---

### Step 2: Deploy Backend to Render (5 min)

1. Go to [render.com](https://render.com) → Sign up with GitHub
2. Click **New +** → **Web Service**
3. Select your repository
4. Settings:
   - Name: `cinecooltv-backend`
   - Root Directory: `backend`
   - Runtime: **Docker**
   - Instance Type: **Free**
5. Add Environment Variables:
   ```
   GEMINI_API_KEY=your-key
   TMDB_API_KEY=your-key
   AI_PROVIDER=gemini
   SERVER_PORT=8080
   ```
6. Click **Create Web Service**
7. **Copy your backend URL** (e.g., `https://cinecooltv-backend.onrender.com`)

---

### Step 3: Deploy Frontend to Vercel (5 min)

1. Go to [vercel.com](https://vercel.com) → Sign up with GitHub
2. Click **Add New...** → **Project**
3. Import your repository
4. Settings:
   - Framework: **Create React App**
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `build`
5. Add Environment Variables:
   ```
   REACT_APP_FIREBASE_API_KEY=your-key
   REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   REACT_APP_FIREBASE_PROJECT_ID=your-project-id
   REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-id
   REACT_APP_FIREBASE_APP_ID=your-id
   REACT_APP_FIREBASE_MEASUREMENT_ID=your-id
   REACT_APP_TMDB_API_KEY=your-key
   REACT_APP_API_URL=https://cinecooltv-backend.onrender.com
   ```
6. Click **Deploy**
7. **Your app is live!** 🎉

---

### Step 4: Update CORS (3 min)

1. Open `backend/src/main/java/com/moviestracker/backend/config/WebConfig.java`
2. Add your Vercel URL to `allowedOrigins`:
   ```java
   .allowedOrigins(
       "http://localhost:3000",
       "https://your-project.vercel.app"  // Add this
   )
   ```
3. Commit and push:
   ```bash
   git add .
   git commit -m "Update CORS for production"
   git push
   ```
4. Render will auto-deploy

---

### Step 5: Configure Firebase (2 min)

1. Go to Firebase Console → Authentication → Settings
2. Add authorized domain: `your-project.vercel.app`
3. Go to Firestore → Rules → Update:
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{userId}/{document=**} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
     }
   }
   ```

---

## ✅ Test Your Deployment

Visit your Vercel URL and test:
- ✅ Login/Signup
- ✅ Browse content
- ✅ Add to library
- ✅ AI Chat
- ✅ Profile stats

---

## 🎉 You're Live!

**Your URLs:**
- Frontend: `https://your-project.vercel.app`
- Backend: `https://cinecooltv-backend.onrender.com`

---

## 💡 Pro Tips

1. **Free tier limitations:**
   - Render backend sleeps after 15 min (first request takes 30-60s)
   - Upgrade to $7/month for always-on

2. **Custom domain:**
   - Add in Vercel/Render settings
   - Update DNS records

3. **Monitoring:**
   - Check Render logs for backend errors
   - Use Vercel Analytics for frontend metrics

---

## 🆘 Issues?

**Backend not responding:**
- Wait 60 seconds (free tier wakes up)
- Check Render logs

**CORS errors:**
- Verify Vercel URL in backend CORS config
- Check `REACT_APP_API_URL` in Vercel

**Firebase errors:**
- Check authorized domains
- Verify environment variables

---

**Need detailed help?** See `DEPLOYMENT_STEPS.md`

**Happy deploying! 🚀**
