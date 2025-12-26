import React, { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";

const AuthContext = createContext(null);

// ✅ Backend base URL
const API_BASE = process.env.REACT_APP_API_URL || "https://cinecooltv-backend.onrender.com";

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    // 🔁 Restore login on refresh with JWT decoding
    useEffect(() => {
        const storedToken = localStorage.getItem("token");

        if (storedToken) {
            try {
                // ✅ CORRECT JWT DECODING: Get email from 'sub' field
                const payload = JSON.parse(atob(storedToken.split(".")[1]));
                const email = payload.sub; // ✅ 'sub' contains email

                setToken(storedToken);
                setCurrentUser({
                    email: email,
                    name: email.split("@")[0] // ✅ Derive name from email
                });

                // ✅ Also restore userProfile from localStorage if available
                const storedProfile = localStorage.getItem("userProfile");
                if (!storedProfile) {
                    localStorage.setItem("userProfile", JSON.stringify({
                        name: email.split("@")[0],
                        email: email,
                        avatar: "https://upload.wikimedia.org/wikipedia/commons/9/99/Sample_User_Icon.png",
                        joined: new Date().toLocaleDateString()
                    }));
                }

                // ✅ Force stats re-calculation when user is restored from token
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

    // ✅ REMOVED: login(email, password) function - OTP flow handles this

    // ✅ LOGIN WITH JWT TOKEN (After OTP verification)
    const loginWithToken = (jwt) => {
        try {
            // ✅ CORRECT JWT DECODING
            const payload = JSON.parse(atob(jwt.split(".")[1]));
            const email = payload.sub; // ✅ 'sub' contains email

            if (!email) {
                throw new Error("Invalid token: no email found");
            }

            localStorage.setItem("token", jwt);

            const userData = {
                email: email,
                name: email.split("@")[0] // ✅ Derive name from email
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

            // ✅ Force stats re-calculation
            setTimeout(() => {
                window.dispatchEvent(new Event("libraryUpdated"));
            }, 100);

            return userData;
        } catch (err) {
            console.error("Error logging in with token:", err);
            localStorage.removeItem("token");
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

    // ✅ SIGNUP function (optional - if you need it in context)
    const signup = async (email, password, name) => {
        try {
            const res = await axios.post(
                `${API_BASE}/api/auth/signup`,
                { email, password, name },
                {
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );

            return { success: true, message: res.data.message };
        } catch (err) {
            console.error("Signup failed:", err);
            return {
                success: false,
                message: err.response?.data?.message || "Signup failed",
            };
        }
    };

    // ✅ VERIFY EMAIL OTP (for signup flow)
    const verifyEmailOtp = async (email, otp) => {
        try {
            const res = await axios.post(
                `${API_BASE}/api/auth/verify-email`,
                { email, otp },
                {
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );

            return { success: true, message: res.data.message };
        } catch (err) {
            console.error("Email verification failed:", err);
            return {
                success: false,
                message: err.response?.data?.message || "OTP verification failed",
            };
        }
    };

    const value = {
        currentUser,
        token,
        loginWithToken, // ✅ Only this for login (after OTP verification)
        logout,
        signup, // ✅ Optional: for signup flow
        verifyEmailOtp, // ✅ Optional: for email verification
        isAuthenticated: !!token && !!currentUser,
        loading,
        setUser: setCurrentUser, // ✅ Add setter for external use
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