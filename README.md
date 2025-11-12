# CineCoolTV - Movie & TV Series Tracker with AI Assistant

A full-stack web application for tracking movies and TV series with an AI-powered chat assistant for cinema analysis and recommendations.

## 🎬 Features

- **Movie & TV Series Tracking**: Browse, search, and track your favorite movies and TV shows
- **AI Chat Assistant**: Get intelligent recommendations, character analysis, and show comparisons
- **User Library**: Organize your watchlist with custom statuses (Watching, Completed, Plan to Watch, etc.)
- **Dark/Light Theme**: Beautiful UI with theme switching
- **Real-time Data**: Powered by TMDB API for up-to-date movie information
- **Firebase Authentication**: Secure user authentication and data storage

## 🏗️ Tech Stack

### Frontend
- **React 19.2.0** - Modern UI library
- **React Router** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Beautiful icons
- **Axios** - HTTP client
- **Firebase** - Authentication and data storage

### Backend
- **Spring Boot 3.5.7** - Java backend framework
- **Java 21** - Latest LTS Java version
- **PostgreSQL** - Database (optional)
- **Maven** - Build tool
- **OpenAI/Gemini API** - AI-powered chat assistant
- **TMDB API** - Movie and TV data

## 📋 Prerequisites

- **Node.js** (v16 or higher)
- **Java 21** (JDK)
- **Maven** (included via wrapper)
- **PostgreSQL** (optional - only needed for movie storage features)

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd CineCoolTV
```

### 2. Backend Setup

#### Configure Environment Variables

1. Navigate to the backend directory:
```bash
cd backend
```

2. Copy the example environment file:
```bash
cp .env.example .env
```

3. Edit `.env` and add your API keys:
```env
# Required for AI features
GEMINI_API_KEY=your-gemini-api-key-here
# OR
OPENAI_API_KEY=your-openai-api-key-here

# Required for movie data
TMDB_API_KEY=your-tmdb-api-key-here

# Optional - Database (AI features work without it)
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5433/movies_tracker
SPRING_DATASOURCE_USERNAME=postgres
SPRING_DATASOURCE_PASSWORD=your-password
```

#### Get API Keys

- **TMDB API Key**: Sign up at [https://www.themoviedb.org/settings/api](https://www.themoviedb.org/settings/api)
- **Gemini API Key**: Get it from [https://makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey)
- **OpenAI API Key**: Get it from [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)

#### Build and Run Backend

```bash
# Build the project
./mvnw clean package -DskipTests

# Run the backend
./mvnw spring-boot:run
```

Or use the provided scripts:
- **Windows**: `start-backend.bat`
- **Linux/Mac**: `./start-backend.sh`

The backend will start on `http://localhost:8080`

### 3. Frontend Setup

#### Configure Environment Variables

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Copy the example environment file:
```bash
cp .env.example .env
```

3. Edit `.env` and add your Firebase and TMDB credentials:
```env
# Firebase Configuration
REACT_APP_FIREBASE_API_KEY=your-firebase-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
REACT_APP_FIREBASE_APP_ID=your-app-id
REACT_APP_FIREBASE_MEASUREMENT_ID=your-measurement-id

# TMDB API Key
REACT_APP_TMDB_API_KEY=your-tmdb-api-key

# Backend API URL
REACT_APP_API_URL=http://localhost:8080
```

#### Install Dependencies and Run

```bash
# Install dependencies
npm install

# Start development server
npm start
```

The frontend will start on `http://localhost:3000`

### 4. Build for Production

#### Frontend Build
```bash
cd frontend
npm run build
```

The production build will be in the `frontend/build` directory.

#### Backend Build
```bash
cd backend
./mvnw clean package -DskipTests
```

The JAR file will be in `backend/target/backend-0.0.1-SNAPSHOT.jar`

## 🎯 Usage

1. **Start the Backend**: Run the Spring Boot backend on port 8080
2. **Start the Frontend**: Run the React app on port 3000
3. **Sign Up/Login**: Create an account using Firebase authentication
4. **Browse Content**: Explore movies and TV series
5. **Use AI Chat**: Ask the AI assistant about movies, characters, and recommendations
6. **Track Your Library**: Add items to your watchlist and track your progress

## 📁 Project Structure

```
CineCoolTV/
├── backend/                    # Spring Boot backend
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/
│   │   │   │   └── com/moviestracker/backend/
│   │   │   │       ├── controller/    # REST controllers
│   │   │   │       ├── service/       # Business logic
│   │   │   │       ├── model/         # Data models
│   │   │   │       ├── repository/    # Database repositories
│   │   │   │       └── config/        # Configuration
│   │   │   └── resources/
│   │   │       └── application.properties
│   │   └── test/
│   ├── pom.xml
│   └── .env.example
├── frontend/                   # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/        # Reusable components
│   │   ├── pages/            # Page components
│   │   ├── context/          # React context
│   │   ├── hooks/            # Custom hooks
│   │   ├── utils/            # Utility functions
│   │   ├── App.js
│   │   └── index.js
│   ├── package.json
│   └── .env.example
└── README.md
```

## 🔧 Configuration

### Backend Configuration (`application.properties`)

- **Server Port**: Default is 8080
- **Database**: PostgreSQL (optional)
- **CORS**: Configured for localhost:3000
- **Security**: Disabled for development (enable for production)

### Frontend Configuration

- **Proxy**: Configured to proxy API requests to backend
- **Theme**: Dark/Light mode support
- **Firebase**: Authentication and user data storage

## 🐛 Troubleshooting

### Backend Issues

1. **Port 8080 already in use**:
   - Change the port in `application.properties`: `server.port=8081`

2. **Database connection error**:
   - The AI features work without a database
   - Check PostgreSQL is running if you need database features
   - Verify credentials in `.env` or `application.properties`

3. **API Key errors**:
   - Ensure API keys are set in `.env` or `application.properties`
   - Check that keys are valid and have proper permissions

### Frontend Issues

1. **Port 3000 already in use**:
   - The app will prompt to use a different port

2. **Backend connection failed**:
   - Ensure backend is running on port 8080
   - Check `REACT_APP_API_URL` in `.env`

3. **Firebase errors**:
   - Verify all Firebase credentials in `.env`
   - Check Firebase project settings

## 📝 API Endpoints

### Backend Endpoints

- `GET /api/health` - Health check
- `POST /api/ai/ask` - AI chat assistant
- `GET /api/movies/search` - Search movies

## 🚀 Deployment

**Ready to deploy?** Choose your guide:

- **⚡ Quick Start (15 min)**: [QUICK_DEPLOY.md](QUICK_DEPLOY.md) - Get live fast!
- **📖 Step-by-Step Guide**: [DEPLOYMENT_STEPS.md](DEPLOYMENT_STEPS.md) - Detailed instructions
- **✅ Complete Checklist**: [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md) - Production checklist
- **📚 All Options**: [DEPLOYMENT.md](DEPLOYMENT.md) - Docker, AWS, GCP, etc.
- **📊 Summary**: [DEPLOYMENT_SUMMARY.md](DEPLOYMENT_SUMMARY.md) - Overview & status

### Recommended: Vercel + Render
- **Frontend**: Deploy to Vercel (free tier available)
- **Backend**: Deploy to Render (free tier available)
- **Total Time**: ~15 minutes
- **Cost**: Free or $27/month for production

### Build Status
- ✅ Frontend: BUILD SUCCESS (277.57 kB gzipped)
- ✅ Backend: BUILD SUCCESS (JAR ready)
- ✅ All deployment files configured
- ✅ CI/CD pipeline ready

## 🔐 Security Notes

⚠️ **Important for Production**:

1. **Never commit `.env` files** - They contain sensitive API keys
2. **Enable Spring Security** - Currently disabled for development
3. **Use HTTPS** - In production environments
4. **Secure Firebase rules** - Configure proper security rules
5. **Environment Variables** - Use environment variables for all secrets
6. **CORS Configuration** - Restrict allowed origins in production

## 📄 License

This project is for educational purposes.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Support

For issues and questions, please open an issue on GitHub.

---

**Built with ❤️ using React, Spring Boot**
