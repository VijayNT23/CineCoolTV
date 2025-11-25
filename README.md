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
git clone https://github.com/VijayNT23/CineCoolTV
cd CineCoolTV
```

### 2. Backend Setup

#### Configure Environment Variables

Navigate to the backend directory:
```bash
cd backend
```

2. Edit `.env` in src/main/resources/.env add your API keys:
```env
# Required for AI features
GEMINI_API_KEY=your-gemini-api-key-here
# OR
OPENAI_API_KEY=your-openai-api-key-here

# Required for movie data
TMDB_API_KEY=your-tmdb-api-key-here

AI_PROVIDER=gemini
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
The backend will start on `http://localhost:8080`

### 3. Frontend Setup

#### Configure Environment Variables

1. Navigate to the frontend directory:
```bash
cd frontend
``` 

2. Edit `.env` in frontend/.env and add your Firebase and TMDB credentials:
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

# Allowed Origins (Frontend)
REACT_APP_ALLOWED_ORIGINS=http://localhost:3000

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


## 📄 License

This project is for educational purposes.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Support

For issues and questions, please open an issue on GitHub.

---

**Built with ❤️ using React, Spring Boot**
