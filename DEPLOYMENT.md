# 🚀 Deployment Guide for CineCoolTV

This guide covers deployment options for the CineCoolTV application.

## 📋 Pre-Deployment Checklist

### ✅ Code Quality
- [x] Frontend builds successfully (`npm run build`)
- [x] Backend builds successfully (`./mvnw clean package`)
- [x] All linting errors fixed
- [x] No console errors in production build

### ✅ Configuration
- [ ] Environment variables configured for production
- [ ] API keys obtained and secured
- [ ] Firebase project set up
- [ ] Database configured (if using)
- [ ] CORS settings updated for production domain
- [ ] Security settings enabled

### ✅ Security
- [ ] `.env` files added to `.gitignore`
- [ ] API keys stored securely (not in code)
- [ ] Spring Security enabled for production
- [ ] Firebase security rules configured
- [ ] HTTPS enabled

## 🌐 Deployment Options

### Option 1: Traditional Server Deployment

#### Backend Deployment

1. **Build the JAR file**:
```bash
cd backend
./mvnw clean package -DskipTests
```

2. **Copy JAR to server**:
```bash
scp target/backend-0.0.1-SNAPSHOT.jar user@your-server:/path/to/app/
```

3. **Set environment variables on server**:
```bash
export GEMINI_API_KEY=your-key
export TMDB_API_KEY=your-key
export SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/movies_tracker
export SPRING_DATASOURCE_USERNAME=postgres
export SPRING_DATASOURCE_PASSWORD=your-password
```

4. **Run the application**:
```bash
java -jar backend-0.0.1-SNAPSHOT.jar
```

5. **Use systemd for auto-restart** (Linux):
Create `/etc/systemd/system/cinecooltv.service`:
```ini
[Unit]
Description=CineCoolTV Backend
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/app
ExecStart=/usr/bin/java -jar /path/to/app/backend-0.0.1-SNAPSHOT.jar
Restart=always
Environment="GEMINI_API_KEY=your-key"
Environment="TMDB_API_KEY=your-key"

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable cinecooltv
sudo systemctl start cinecooltv
```

#### Frontend Deployment

1. **Build the frontend**:
```bash
cd frontend
npm run build
```

2. **Deploy to web server** (Nginx example):

Create `/etc/nginx/sites-available/cinecooltv`:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    root /var/www/cinecooltv/build;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable and restart Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/cinecooltv /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Option 2: Docker Deployment

#### Create Dockerfile for Backend

Create `backend/Dockerfile`:
```dockerfile
FROM eclipse-temurin:21-jdk-alpine
WORKDIR /app
COPY target/backend-0.0.1-SNAPSHOT.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

#### Create Dockerfile for Frontend

Create `frontend/Dockerfile`:
```dockerfile
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

Create `frontend/nginx.conf`:
```nginx
server {
    listen 80;
    location / {
        root /usr/share/nginx/html;
        index index.html index.htm;
        try_files $uri $uri/ /index.html;
    }
    location /api {
        proxy_pass http://backend:8080;
    }
}
```

#### Create docker-compose.yml

Create `docker-compose.yml` in project root:
```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "8080:8080"
    environment:
      - GEMINI_API_KEY=${GEMINI_API_KEY}
      - TMDB_API_KEY=${TMDB_API_KEY}
      - SPRING_DATASOURCE_URL=${SPRING_DATASOURCE_URL}
      - SPRING_DATASOURCE_USERNAME=${SPRING_DATASOURCE_USERNAME}
      - SPRING_DATASOURCE_PASSWORD=${SPRING_DATASOURCE_PASSWORD}
    depends_on:
      - db
    networks:
      - app-network

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend
    networks:
      - app-network

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=movies_tracker
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres-data:/var/lib/postgresql/data
    networks:
      - app-network

volumes:
  postgres-data:

networks:
  app-network:
    driver: bridge
```

Run with Docker Compose:
```bash
docker-compose up -d
```

### Option 3: Cloud Platform Deployment

#### Heroku

**Backend**:
1. Create `Procfile` in backend directory:
```
web: java -jar target/backend-0.0.1-SNAPSHOT.jar
```

2. Deploy:
```bash
heroku create cinecooltv-backend
heroku config:set GEMINI_API_KEY=your-key
heroku config:set TMDB_API_KEY=your-key
git subtree push --prefix backend heroku main
```

**Frontend**:
1. Deploy to Vercel, Netlify, or similar
2. Update `REACT_APP_API_URL` to point to Heroku backend

#### AWS

**Backend (Elastic Beanstalk)**:
1. Package the JAR
2. Create Elastic Beanstalk application
3. Upload JAR and configure environment variables

**Frontend (S3 + CloudFront)**:
1. Build the frontend
2. Upload to S3 bucket
3. Configure CloudFront distribution
4. Update API URL

#### Google Cloud Platform

**Backend (Cloud Run)**:
```bash
gcloud run deploy cinecooltv-backend \
  --source ./backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

**Frontend (Firebase Hosting)**:
```bash
cd frontend
npm run build
firebase deploy --only hosting
```

### Option 4: Vercel + Railway

**Backend on Railway**:
1. Connect GitHub repository
2. Select backend directory
3. Add environment variables
4. Deploy

**Frontend on Vercel**:
1. Connect GitHub repository
2. Select frontend directory
3. Add environment variables
4. Deploy

## 🔒 Production Security Checklist

### Backend Security

1. **Enable Spring Security**:
Update `SecurityConfig.java`:
```java
@Bean
public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
    http
        .csrf(csrf -> csrf.csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse()))
        .authorizeHttpRequests(auth -> auth
            .requestMatchers("/api/health").permitAll()
            .anyRequest().authenticated()
        )
        .oauth2Login(oauth2 -> oauth2.defaultSuccessUrl("/"))
        .formLogin(form -> form.loginPage("/login").permitAll());

    return http.build();
}
```

2. **Update CORS**:
```java
registry.addMapping("/api/**")
    .allowedOrigins("https://your-production-domain.com")
    .allowedMethods("GET", "POST", "PUT", "DELETE")
    .allowCredentials(true);
```

3. **Use HTTPS only**:
```properties
server.ssl.enabled=true
server.ssl.key-store=classpath:keystore.p12
server.ssl.key-store-password=your-password
server.ssl.key-store-type=PKCS12
```

### Frontend Security

1. **Update Firebase Security Rules**
2. **Enable Content Security Policy**
3. **Use environment-specific configs**
4. **Enable HTTPS redirect**

## 📊 Monitoring & Logging

### Backend Monitoring

Add to `application.properties`:
```properties
# Actuator endpoints
management.endpoints.web.exposure.include=health,info,metrics
management.endpoint.health.show-details=always

# Logging
logging.level.com.moviestracker.backend=INFO
logging.file.name=logs/application.log
```

### Frontend Monitoring

- Use Google Analytics
- Implement error tracking (Sentry)
- Monitor performance (Lighthouse CI)

## 🔄 CI/CD Pipeline

### GitHub Actions Example

Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v2

    - name: Set up JDK 21
      uses: actions/setup-java@v2
      with:
        java-version: '21'
        distribution: 'temurin'

    - name: Build Backend
      run: |
        cd backend
        ./mvnw clean package -DskipTests

    - name: Set up Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'

    - name: Build Frontend
      run: |
        cd frontend
        npm ci
        npm run build

    - name: Deploy
      run: |
        # Add your deployment commands here
```

## 📝 Environment Variables Summary

### Backend (.env)
```env
GEMINI_API_KEY=
OPENAI_API_KEY=
TMDB_API_KEY=
AI_PROVIDER=gemini
SPRING_DATASOURCE_URL=
SPRING_DATASOURCE_USERNAME=
SPRING_DATASOURCE_PASSWORD=
SERVER_PORT=8080
```

### Frontend (.env.production)
```env
REACT_APP_FIREBASE_API_KEY=
REACT_APP_FIREBASE_AUTH_DOMAIN=
REACT_APP_FIREBASE_PROJECT_ID=
REACT_APP_FIREBASE_STORAGE_BUCKET=
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=
REACT_APP_FIREBASE_APP_ID=
REACT_APP_FIREBASE_MEASUREMENT_ID=
REACT_APP_TMDB_API_KEY=
REACT_APP_API_URL=https://your-backend-url.com
```

## 🎯 Post-Deployment

1. **Test all features**
2. **Monitor logs for errors**
3. **Check performance metrics**
4. **Set up automated backups**
5. **Configure SSL certificates**
6. **Set up domain and DNS**
7. **Enable monitoring and alerts**

---

**Need Help?** Check the main README.md or open an issue on GitHub.
