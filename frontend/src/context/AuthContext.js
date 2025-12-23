import React, { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";

const AuthContext = createContext(null);

// ✅ Backend base URL
const API_BASE = "https://cinecooltv-backend.onrender.com";

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null); // Changed from [user, setUser]
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    // 🔁 Restore login on refresh with JWT decoding
    useEffect(() => {
        const storedToken = localStorage.getItem("token");

        if (storedToken) {
            try {
                // ✅ Decode JWT token to get user info
                const payload = JSON.parse(atob(storedToken.split(".")[1]));

                setToken(storedToken);
                setCurrentUser({
                    id: payload.sub || payload.userId,
                    email: payload.email,
                    name: payload.name || payload.email?.split("@")[0] || "User"
                });

                // ✅ Also restore userProfile from localStorage if available
                const storedProfile = localStorage.getItem("userProfile");
                if (!storedProfile) {
                    localStorage.setItem("userProfile", JSON.stringify({
                        name: payload.name || payload.email?.split("@")[0] || "User",
                        email: payload.email,
                        avatar: "https://upload.wikimedia.org/wikipedia/commons/9/99/Sample_User_Icon.png",
                        joined: new Date().toLocaleDateString()
                    }));
                }

                // ✅ CRITICAL: Force stats re-calculation when user is restored from token
                setTimeout(() => {
                    window.dispatchEvent(new Event("libraryUpdated"));
                }, 100);

            } catch (err) {
                console.error("Error decoding token:", err);
                // Clear invalid token
                localStorage.removeItem("token");
                localStorage.removeItem("userProfile");
            }
        }

        setLoading(false);
    }, []);

    // ✅ LOGIN (Backend JWT)
    const login = async (email, password) => {
        try {
            const res = await axios.post(
                `${API_BASE}/auth/login`,
                { email, password },
                {
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );

            const jwt = res.data.token || res.data;

            if (!jwt) {
                throw new Error("No token received");
            }

            // ✅ Decode token to get user info
            const payload = JSON.parse(atob(jwt.split(".")[1]));

            // ✅ Persist token and user data
            localStorage.setItem("token", jwt);

            const userData = {
                id: payload.sub || payload.userId,
                email: payload.email,
                name: payload.name || email.split("@")[0]
            };

            // ✅ Store user profile in localStorage
            localStorage.setItem("userProfile", JSON.stringify({
                name: userData.name,
                email: userData.email,
                avatar: "https://upload.wikimedia.org/wikipedia/commons/9/99/Sample_User_Icon.png",
                joined: new Date().toLocaleDateString()
            }));

            // ✅ Update state
            setToken(jwt);
            setCurrentUser(userData);

            // ✅ CRITICAL: Force stats re-calculation after successful login
            setTimeout(() => {
                window.dispatchEvent(new Event("libraryUpdated"));
            }, 100);

            return { success: true, token: jwt };
        } catch (err) {
            console.error("Login failed:", err);
            return {
                success: false,
                message:
                    err.response?.data?.message ||
                    "Invalid email or password",
            };
        }
    };

    // ✅ Simplified login for external callers (like Login.js)
    const loginWithToken = (jwt) => {
        try {
            const payload = JSON.parse(atob(jwt.split(".")[1]));

            localStorage.setItem("token", jwt);

            const userData = {
                id: payload.sub || payload.userId,
                email: payload.email,
                name: payload.name || payload.email?.split("@")[0] || "User"
            };

            // ✅ Store user profile in localStorage
            localStorage.setItem("userProfile", JSON.stringify({
                name: userData.name,
                email: userData.email,
                avatar: "https://upload.wikimedia.org/wikipedia/commons/9/99/Sample_User_Icon.png",
                joined: new Date().toLocaleDateString()
            }));

            setToken(jwt);
            setCurrentUser(userData);

            // ✅ CRITICAL: Force stats re-calculation
            setTimeout(() => {
                window.dispatchEvent(new Event("libraryUpdated"));
            }, 100);

            return userData;
        } catch (err) {
            console.error("Error logging in with token:", err);
            return null;
        }
    };

    // ✅ LOGOUT
    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("userProfile");

        setToken(null);
        setCurrentUser(null);

        // ✅ Force stats re-calculation after logout
        setTimeout(() => {
            window.dispatchEvent(new Event("libraryUpdated"));
        }, 100);
    };

    const value = {
        currentUser, // Changed from 'user'
        token,
        login,
        loginWithToken, // Added for external use
        logout,
        isAuthenticated: !!token && !!currentUser,
        loading,
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

// ✅ Custom hook
export const useAuth = () => {
    return useContext(AuthContext);
};