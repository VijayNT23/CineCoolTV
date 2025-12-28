import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";

const VerifyLoginOtp = () => {
    const [otp, setOtp] = useState("");
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const [countdown, setCountdown] = useState(30);
    const navigate = useNavigate();
    const location = useLocation();

    const API_BASE_URL = process.env.REACT_APP_API_URL || "https://cinecooltv-backend.onrender.com";

    useEffect(() => {
        // Get email from navigation state
        if (location.state?.email) {
            setEmail(location.state.email);
        } else {
            // If no email in state, redirect to login
            navigate("/login");
        }
    }, [location, navigate]);

    useEffect(() => {
        let timer;
        if (countdown > 0) {
            timer = setTimeout(() => setCountdown(countdown - 1), 1000);
        }
        return () => clearTimeout(timer);
    }, [countdown]);

    const handleOtpVerification = async (e) => {
        e.preventDefault();
        setError("");
        setMessage("");

        if (otp.length !== 6) {
            setError("Please enter a valid 6-digit OTP");
            return;
        }

        setLoading(true);
        try {
            // Determine which endpoint to use based on where user came from
            const endpoint = location.state?.fromSignup
                ? "/api/auth/verify-signup-otp"
                : "/api/auth/verify-login-otp";

            const response = await axios.post(
                `${API_BASE_URL}${endpoint}`,
                { email, otp },
                { headers: { "Content-Type": "application/json" } }
            );

            if (response.status === 200) {
                if (location.state?.fromSignup) {
                    setMessage("Account verified successfully! Redirecting to login...");
                    setTimeout(() => navigate("/login"), 2000);
                } else {
                    // Store token and redirect to dashboard
                    const token = response.data.token;
                    localStorage.setItem("token", token);
                    setMessage("Login successful! Redirecting to dashboard...");
                    setTimeout(() => navigate("/dashboard"), 2000);
                }
            }
        } catch (error) {
            console.error("OTP verification error:", error);
            if (error.response?.data?.error) {
                setError(error.response.data.error);
            } else if (error.response?.data?.message) {
                setError(error.response.data.message);
            } else {
                setError("OTP verification failed. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleResendOtp = async () => {
        setResendLoading(true);
        setError("");
        setMessage("");

        try {
            await axios.post(
                `${API_BASE_URL}/api/auth/resend-otp`,
                { email },
                { headers: { "Content-Type": "application/json" } }
            );

            setMessage("New OTP sent to your email!");
            setCountdown(30); // Reset countdown
        } catch (error) {
            console.error("Resend OTP error:", error);
            if (error.response?.data?.error) {
                setError(error.response.data.error);
            } else {
                setError("Failed to resend OTP. Please try again.");
            }
        } finally {
            setResendLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-black py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-gray-800 p-8 rounded-2xl shadow-2xl border border-gray-700">
                <div className="text-center">
                    <h2 className="mt-6 text-3xl font-bold text-white">
                        Verify Your Email
                    </h2>
                    <p className="mt-2 text-sm text-gray-400">
                        Enter the OTP sent to your email
                    </p>
                    <p className="mt-1 text-sm text-gray-300">
                        Sent to: <span className="text-blue-300">{email}</span>
                    </p>
                </div>

                {message && (
                    <div className="rounded-lg bg-green-900/30 border-green-800 p-4">
                        <div className="flex items-center">
                            <svg className="w-5 h-5 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <p className="text-sm font-medium text-green-300">{message}</p>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="rounded-lg bg-red-900/30 border border-red-800 p-4">
                        <div className="flex items-center">
                            <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            <p className="text-sm font-medium text-red-300">{error}</p>
                        </div>
                    </div>
                )}

                <form className="mt-8 space-y-6" onSubmit={handleOtpVerification}>
                    <div>
                        <label htmlFor="otp" className="block text-sm font-medium text-gray-300 mb-4">
                            Enter 6-digit OTP
                        </label>
                        <input
                            id="otp"
                            name="otp"
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]{6}"
                            maxLength="6"
                            required
                            className="w-full px-4 py-4 text-3xl font-bold text-center tracking-[1em] bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="000000"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                            disabled={loading}
                        />
                        <p className="mt-2 text-xs text-gray-400 text-center">
                            Enter the 6-digit code from your email
                        </p>
                    </div>

                    <div className="flex flex-col space-y-4">
                        <button
                            type="submit"
                            disabled={loading || otp.length !== 6}
                            className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200 ${
                                loading || otp.length !== 6
                                    ? "bg-green-800 cursor-not-allowed"
                                    : "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-xl"
                            }`}
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Verifying...
                                </>
                            ) : (
                                "Verify OTP"
                            )}
                        </button>

                        <div className="flex justify-between items-center">
                            <button
                                type="button"
                                onClick={handleResendOtp}
                                disabled={resendLoading || countdown > 0}
                                className={`text-sm flex items-center ${
                                    resendLoading || countdown > 0
                                        ? "text-gray-500 cursor-not-allowed"
                                        : "text-blue-400 hover:text-blue-300 transition-colors"
                                }`}
                            >
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                {resendLoading ? "Sending..." : countdown > 0 ? `Resend OTP (${countdown}s)` : "Resend OTP"}
                            </button>

                            <button
                                type="button"
                                onClick={() => navigate(location.state?.fromSignup ? "/signup" : "/login")}
                                className="text-sm text-gray-400 hover:text-white transition-colors"
                            >
                                ← Go Back
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default VerifyLoginOtp;