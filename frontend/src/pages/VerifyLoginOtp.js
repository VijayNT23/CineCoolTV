import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import config from "../config";

const VerifyLoginOtp = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { loginWithToken } = useAuth();

    // Email passed from Login.js
    const email = location.state?.email;

    const [otp, setOtp] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    // 🔐 If user lands here directly without email
    if (!email) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black text-white">
                <div className="bg-gray-800 p-6 rounded-xl text-center">
                    <p className="mb-4">Invalid access. Please login again.</p>
                    <button
                        onClick={() => navigate("/login")}
                        className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700"
                    >
                        Go to Login
                    </button>
                </div>
            </div>
        );
    }

    // 🔁 Verify OTP
    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setError("");
        setMessage("");

        if (otp.length !== 6) {
            setError("Please enter a valid 6-digit OTP");
            return;
        }

        setLoading(true);

        try {
            const res = await axios.post(
                `${config.backendUrl}/auth/verify-login-otp`,
                { email, otp },
                {
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );

            const token = res.data.token;

            if (!token) {
                throw new Error("No token received from server");
            }

            // ✅ Store token & set user in context
            loginWithToken(token);

            setMessage("Login successful! Redirecting...");

            setTimeout(() => {
                navigate("/profile");
            }, 800);
        } catch (err) {
            console.error("OTP verification failed:", err);

            const backendMsg = err.response?.data?.message;

            if (backendMsg) {
                setError(backendMsg);
            } else if (err.code === "ERR_NETWORK") {
                setError("Network error. Please check your connection.");
            } else {
                setError("Invalid or expired OTP. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    // 🔁 Resend OTP
    const handleResendOtp = async () => {
        setError("");
        setMessage("");
        setLoading(true);

        try {
            await axios.post(
                `${config.backendUrl}/auth/resend-otp`,
                { email },
                {
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );

            setMessage("New OTP sent to your email.");
        } catch (err) {
            const backendMsg = err.response?.data?.message;
            setError(backendMsg || "Failed to resend OTP.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-black px-4">
            <div className="max-w-md w-full bg-gray-800 p-8 rounded-2xl shadow-2xl border border-gray-700">
                <h2 className="text-2xl font-bold text-white text-center mb-2">
                    Verify Login OTP
                </h2>

                <p className="text-sm text-gray-400 text-center mb-6">
                    Enter the 6-digit OTP sent to <br />
                    <span className="text-white font-semibold">{email}</span>
                </p>

                {message && (
                    <div className="mb-4 bg-green-900/30 border border-green-800 p-3 rounded-lg text-green-300 text-sm">
                        {message}
                    </div>
                )}

                {error && (
                    <div className="mb-4 bg-red-900/30 border border-red-800 p-3 rounded-lg text-red-300 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleVerifyOtp} className="space-y-6">
                    <input
                        type="text"
                        inputMode="numeric"
                        maxLength="6"
                        value={otp}
                        onChange={(e) =>
                            setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                        }
                        placeholder="000000"
                        disabled={loading}
                        className="w-full px-4 py-4 text-center text-2xl tracking-[0.4em] bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />

                    <button
                        type="submit"
                        disabled={loading || otp.length !== 6}
                        className={`w-full py-3 rounded-lg font-bold text-white transition-all ${
                            loading || otp.length !== 6
                                ? "bg-blue-800 cursor-not-allowed"
                                : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                        }`}
                    >
                        {loading ? "Verifying..." : "Verify & Login"}
                    </button>
                </form>

                <div className="flex justify-between mt-6 text-sm">
                    <button
                        onClick={handleResendOtp}
                        disabled={loading}
                        className="text-blue-400 hover:text-blue-300"
                    >
                        Resend OTP
                    </button>

                    <button
                        onClick={() => navigate("/login")}
                        disabled={loading}
                        className="text-gray-400 hover:text-white"
                    >
                        ← Back to Login
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VerifyLoginOtp;
