# ✅ CineCoolTV Deployment Checklist

Use this checklist to ensure a smooth deployment process.

## 📦 Pre-Deployment

### Code Quality
- [x] Frontend builds successfully (`npm run build`)
- [x] Backend builds successfully (`./mvnw clean package`)
- [x] All linting errors fixed
- [x] No console errors in production build
- [x] All features tested locally

### API Keys & Credentials
- [ ] TMDB API key obtained from [themoviedb.org](https://www.themoviedb.org/settings/api)
- [ ] Gemini API key obtained from [Google AI Studio](https://makersuite.google.com/app/apikey)
- [ ] Firebase project created at [console.firebase.google.com](https://console.firebase.google.com)
- [ ] Firebase Authentication enabled (Google provider)
- [ ] Firestore Database created

### Repository
- [ ] Code pushed to GitHub
- [ ] `.env` files NOT committed (check `.gitignore`)
- [ ] README.md updated with project info
- [ ] All sensitive data removed from code

---

## 🖥️ Backend Deployment (Render)

### Setup
- [ ] Render account created at [render.com](https://render.com)
- [ ] GitHub repository connected to Render
- [ ] New Web Service created
- [ ] Docker runtime selected
- [ ] Root directory set to `backend`

### Environment Variables
Add these in Render dashboard:
- [ ] `GEMINI_API_KEY` = your-gemini-api-key
- [ ] `TMDB_API_KEY` = your-tmdb-api-key
- [ ] `AI_PROVIDER` = gemini
- [ ] `SPRING_PROFILES_ACTIVE` = prod
- [ ] `SERVER_PORT` = 8080

### Deployment
- [ ] Service deployed successfully
- [ ] Backend URL copied (e.g., `https://cinecooltv-backend.onrender.com`)
- [ ] Health check endpoint working: `/actuator/health`
- [ ] Logs checked for errors

---

## 🌐 Frontend Deployment (Vercel)

### Setup
- [ ] Vercel account created at [vercel.com](https://vercel.com)
- [ ] GitHub repository imported
- [ ] Framework preset: Create React App
- [ ] Root directory set to `frontend`
- [ ] Build command: `npm run build`
- [ ] Output directory: `build`

### Environment Variables
Add these in Vercel project settings:
- [ ] `REACT_APP_FIREBASE_API_KEY` = your-firebase-api-key
- [ ] `REACT_APP_FIREBASE_AUTH_DOMAIN` = your-project.firebaseapp.com
- [ ] `REACT_APP_FIREBASE_PROJECT_ID` = your-project-id
- [ ] `REACT_APP_FIREBASE_STORAGE_BUCKET` = your-project.appspot.com
- [ ] `REACT_APP_FIREBASE_MESSAGING_SENDER_ID` = your-sender-id
- [ ] `REACT_APP_FIREBASE_APP_ID` = your-app-id
- [ ] `REACT_APP_FIREBASE_MEASUREMENT_ID` = your-measurement-id
- [ ] `REACT_APP_TMDB_API_KEY` = your-tmdb-api-key
- [ ] `REACT_APP_API_URL` = your-render-backend-url

### Deployment
- [ ] Project deployed successfully
- [ ] Frontend URL copied (e.g., `https://your-project.vercel.app`)
- [ ] No build errors
- [ ] Preview deployment working

---

## 🔧 Configuration Updates

### Backend CORS
Update `backend/src/main/java/com/moviestracker/backend/config/WebConfig.java`:
- [ ] Add Vercel URL to `allowedOrigins`
- [ ] Commit and push changes
- [ ] Render auto-deploys

### Firebase Configuration
- [ ] Firestore security rules updated
- [ ] Vercel domain added to Firebase authorized domains
- [ ] Authentication providers configured

---

## 🧪 Testing

### Frontend Testing
- [ ] Visit your Vercel URL
- [ ] Homepage loads correctly
- [ ] Login/Signup works
- [ ] Browse movies/series/anime
- [ ] Search functionality works
- [ ] Add items to library
- [ ] Profile stats display correctly
- [ ] AI Chat works
- [ ] Theme toggle works
- [ ] Responsive design on mobile

### Backend Testing
- [ ] Health endpoint: `https://your-backend.onrender.com/actuator/health`
- [ ] AI Chat API responds
- [ ] CORS working (no errors in browser console)
- [ ] API calls from frontend successful

### Integration Testing
- [ ] User can sign up with Google
- [ ] User can log in
- [ ] Library syncs with Firebase
- [ ] AI Chat saves history (when logged in)
- [ ] Stats calculate correctly
- [ ] Logout clears data

---

## 🔒 Security

### Backend
- [ ] Environment variables secured
- [ ] CORS restricted to production domains
- [ ] HTTPS enabled (automatic on Render)
- [ ] No sensitive data in logs

### Frontend
- [ ] Firebase API keys configured
- [ ] No API keys in client-side code
- [ ] HTTPS enabled (automatic on Vercel)

### Firebase
- [ ] Security rules prevent unauthorized access
- [ ] Only authenticated users can read/write their data
- [ ] Authorized domains configured

---

## 📊 Monitoring

### Setup Monitoring
- [ ] Vercel Analytics enabled
- [ ] Render logs accessible
- [ ] Error tracking configured (optional: Sentry)
- [ ] Uptime monitoring (optional: UptimeRobot)

### Health Checks
- [ ] Backend health endpoint monitored
- [ ] Frontend uptime monitored
- [ ] Error alerts configured

---

## 🎨 Optional Enhancements

### Custom Domain
- [ ] Domain purchased
- [ ] DNS configured for Vercel
- [ ] DNS configured for Render
- [ ] SSL certificates issued

### Performance
- [ ] Vercel Edge Network enabled
- [ ] Image optimization configured
- [ ] Caching headers set

### Analytics
- [ ] Google Analytics integrated
- [ ] User behavior tracking
- [ ] Performance metrics tracked

---

## 📝 Documentation

### Update Documentation
- [ ] README.md updated with live URLs
- [ ] API documentation updated
- [ ] User guide created (optional)
- [ ] Deployment notes documented

### Team Communication
- [ ] Deployment announced to team
- [ ] Access credentials shared securely
- [ ] Monitoring dashboard shared

---

## 🚀 Post-Deployment

### Immediate Actions
- [ ] Test all critical features
- [ ] Monitor logs for first 24 hours
- [ ] Check error rates
- [ ] Verify performance metrics

### First Week
- [ ] Gather user feedback
- [ ] Monitor resource usage
- [ ] Check for any errors
- [ ] Plan improvements

### Ongoing
- [ ] Regular backups configured
- [ ] Update dependencies monthly
- [ ] Monitor costs
- [ ] Plan scaling if needed

---

## 🆘 Troubleshooting

### Common Issues

**Frontend shows white screen**
- Check browser console for errors
- Verify all environment variables in Vercel
- Check build logs

**Backend not responding**
- Check Render logs
- Verify environment variables
- Check if service is sleeping (free tier)

**CORS errors**
- Verify backend CORS configuration
- Check frontend API URL
- Ensure HTTPS is used

**Firebase authentication fails**
- Check authorized domains in Firebase
- Verify Firebase config in frontend
- Check browser console for errors

---

## 📞 Support Resources

- **Vercel Docs**: https://vercel.com/docs
- **Render Docs**: https://render.com/docs
- **Firebase Docs**: https://firebase.google.com/docs
- **Spring Boot Docs**: https://spring.io/projects/spring-boot

---

## ✅ Deployment Complete!

Once all items are checked, your CineCoolTV app is successfully deployed! 🎉

**Live URLs:**
- Frontend: `https://your-project.vercel.app`
- Backend: `https://cinecooltv-backend.onrender.com`

**Next Steps:**
1. Share with users
2. Gather feedback
3. Monitor performance
4. Plan updates

---

**Deployed on:** _______________
**Deployed by:** _______________
**Version:** 1.0.0
