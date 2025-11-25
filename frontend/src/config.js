const config = {
    backendUrl: process.env.REACT_APP_API_URL || "http://localhost:8080",

    tmdbApiKey: process.env.REACT_APP_TMDB_API_KEY,
    firebase: {
        apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
        authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
        storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.REACT_APP_FIREBASE_APP_ID,
        measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
    }
};

// Development warnings
if (process.env.NODE_ENV === "development") {
    Object.entries(config.firebase).forEach(([key, value]) => {
        if (!value) console.warn(`⚠ Missing Firebase ENV var: ${key}`);
    });
}

export default config;
