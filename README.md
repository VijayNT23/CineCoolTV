# 🎬 CineCoolTV

### Full-Stack Movie & TV Series Tracking Platform with AI Assistant

CineCoolTV is a full-stack web application that allows users to browse, track, and manage movies and TV series with a modern UI and secure authentication.
It also features an AI-powered chat assistant for cinema-related analysis and recommendations.

This project is designed with **scalability in mind** and follows a **phased architecture**, making it suitable both as a portfolio project and a foundation for production-grade systems.

---

## 🚀 Features

* **Movie & TV Series Browsing**

    * Real-time movie and TV data powered by TMDB API
    * Detailed pages with ratings, popularity, and metadata

* **User Authentication**

    * Secure JWT-based authentication
    * Signup, login, logout
    * OTP-based forgot password via email

* **Personal Library**

    * Add / remove movies and series to personal library
    * Custom watch statuses (Watching, Completed, Plan to Watch)
    * User ratings and favorites
    * Search and filter within library
    * Responsive layout for mobile and desktop

* **AI Chat Assistant**

    * Movie recommendations
    * Character and story analysis
    * Comparisons between movies and shows
    * Powered by Gemini or OpenAI APIs

* **Modern UI**

    * Responsive design (mobile + laptop)
    * Clean UX inspired by real streaming platforms
    * Dark / Light theme support

---

## 🏗️ Architecture Overview

### Phase 1 (Current – Portfolio / Demo)

* Authentication and business logic handled by **Spring Boot backend**
* User library stored in **browser localStorage** (user-scoped)
* Designed for fast demos and interviews

### Phase 2 (Planned – Production Ready)

* Migrate library persistence to **PostgreSQL / MySQL**
* Use **Spring Data JPA (Hibernate ORM)**
* Enable multi-device sync and long-term persistence
* No UI changes required

> This phased approach demonstrates both **working software** and **scalable system design**.

---

## 🧑‍💻 Tech Stack

### Frontend

* **React 19**
* **React Router**
* **Tailwind CSS**
* **Axios**
* **Lucide Icons**
* LocalStorage (Phase 1 persistence)

### Backend

* **Java 21**
* **Spring Boot 3**
* **Spring Security**
* **JWT Authentication**
* **REST APIs**
* **Java Mail (OTP & Email)**

### APIs & Services

* **TMDB API** – Movie & TV data
* **Gemini API / OpenAI API** – AI assistant

### Database (Phase 2 – Optional / Planned)

* **PostgreSQL** or **MySQL**
* **Spring Data JPA / Hibernate**

---

## 📋 Prerequisites

* Node.js (v16+)
* Java 21 (JDK)
* Maven (included via wrapper)
* TMDB API Key
* Gemini or OpenAI API Key

---

## 🚀 Getting Started

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/VijayNT23/CineCoolTV
cd CineCoolTV
```

---

### 2️⃣ Backend Setup

Navigate to backend directory:

```bash
cd backend
```

Create environment variables (`src/main/resources/.env`):

```env
# AI Provider
AI_PROVIDER=gemini
GEMINI_API_KEY=your-gemini-api-key
# OR
OPENAI_API_KEY=your-openai-api-key

# Movie Data
TMDB_API_KEY=your-tmdb-api-key
```

Build and run backend:

```bash
./mvnw clean package -DskipTests
./mvnw spring-boot:run
```

Backend runs at:

```
http://localhost:8080
```

---

### 3️⃣ Frontend Setup

Navigate to frontend directory:

```bash
cd frontend
```

Create `.env`:

```env
REACT_APP_TMDB_API_KEY=your-tmdb-api-key
REACT_APP_API_BASE_URL=https://cinecooltv-backend.onrender.com
```

Install dependencies and start:

```bash
npm install
npm start
```

Frontend runs at:

```
http://localhost:3000
```

---

## 🧪 Build for Production

### Frontend

```bash
npm run build
```

### Backend

```bash
./mvnw clean package -DskipTests
```

---

## 🔐 Data Persistence Notes

* **Authentication & OTP**: Stored and validated on backend
* **Library (Phase 1)**: Stored in browser localStorage (user-scoped)
* **Library (Phase 2)**: Planned migration to relational database using JPA/Hibernate

---

## 🎯 Why This Project Is Interview-Ready

* Clean full-stack architecture
* Secure authentication flow
* Real-world features (search, filters, ratings, OTP)
* Scalable backend design
* Clear migration path to database persistence
* Modern UI/UX practices

---

## 🤝 Contributing

Contributions are welcome.
Feel free to open issues or submit pull requests.

---

## 📧 Support

For questions or issues, please open a GitHub issue.

---

**Built with ❤️ using React and Spring Boot**
