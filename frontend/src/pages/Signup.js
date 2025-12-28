import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Signup = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState(1); // 1: Signup form, 2: OTP verification
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  // Backend API URL
  const API_BASE_URL = process.env.REACT_APP_API_URL || "https://cinecooltv-backend.onrender.com";

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    // Validation
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (!email.includes("@") || !email.includes(".")) {
      setError("Please enter a valid email address");
      return;
    }

    if (name.trim().length < 2) {
      setError("Please enter your full name");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
          `${API_BASE_URL}/api/auth/signup`,
          {
            name: name,
            email: email,
            password: password
          },
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
      );

      // ✅ Handle new response structure
      if (response.data.success) {
        setMessage(response.data.message || "OTP sent to your email. Please verify to complete registration.");
        setStep(2);
      } else {
        setError(response.data.message || "Registration failed");
      }
    } catch (error) {
      console.error("Signup error details:", error);

      // ✅ FIX #1 — Improved error handling
      if (error.response && error.response.data) {
        // Check for different error response formats
        if (error.response.data.error) {
          setError(error.response.data.error || "Signup failed");
        } else if (error.response.data.message) {
          setError(error.response.data.message || "Signup failed");
        } else if (typeof error.response.data === 'string') {
          setError(error.response.data || "Signup failed");
        } else {
          setError("Signup failed. Please try again.");
        }
      } else if (error.code === "ERR_NETWORK") {
        setError("Network error. Please check your connection and try again.");
      } else if (error.message?.includes("CORS")) {
        setError("Connection issue. Please refresh the page or try again later.");
      } else {
        setError("Server not reachable. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOtpVerification = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP");
      setLoading(false);
      return;
    }

    try {
      // ✅ Use correct endpoint: /verify-signup-otp instead of /verify-email
      const response = await axios.post(
          `${API_BASE_URL}/api/auth/verify-signup-otp`,
          {
            email,
            otp,
          },
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
      );

      // ✅ Handle structured response
      if (response.status === 200) {
        setMessage("Account verified successfully! Redirecting to login...");

        // Auto-redirect to login after 2 seconds
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      } else {
        setError(response.data.message || "OTP verification failed");
      }
    } catch (error) {
      console.error("OTP verification error:", error);

      // ✅ Improved error handling
      if (error.response && error.response.data) {
        if (error.response.data.error) {
          setError(error.response.data.error);
        } else if (error.response.data.message) {
          setError(error.response.data.message);
        } else if (typeof error.response.data === 'string') {
          setError(error.response.data);
        } else {
          setError("OTP verification failed");
        }
      } else if (error.code === "ERR_NETWORK") {
        setError("Network error. Please check your connection.");
      } else if (error.message?.includes("CORS")) {
        setError("Connection issue. Please refresh the page and try again.");
      } else {
        setError("OTP verification failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const response = await axios.post(
          `${API_BASE_URL}/api/auth/resend-otp`,
          { email },
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
      );

      // ✅ Handle structured response
      if (response.status === 200) {
        setMessage("New OTP sent to your email. Please check your inbox.");
      } else {
        setError(response.data.message || "Failed to resend OTP");
      }
    } catch (error) {
      console.error("Resend OTP error:", error);

      // ✅ Improved error handling
      if (error.response && error.response.data) {
        if (error.response.data.error) {
          setError(error.response.data.error);
        } else if (error.response.data.message) {
          setError(error.response.data.message);
        } else {
          setError("Failed to resend OTP");
        }
      } else if (error.code === "ERR_NETWORK") {
        setError("Network error. Please check your connection.");
      } else {
        setError("Failed to resend OTP. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-black py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-gray-800 p-8 rounded-2xl shadow-2xl border border-gray-700">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-bold text-white">
              {step === 1 ? "Join CineCoolTV" : "Verify Your Email"}
            </h2>
            <p className="mt-2 text-sm text-gray-400">
              {step === 1 ? "Create your free account to get started" : "Enter the OTP sent to your email"}
            </p>
          </div>

          {message && (
              <div className={`rounded-lg p-4 ${
                  message.includes("successfully") || message.includes("sent")
                      ? "bg-green-900/30 border-green-800"
                      : "bg-blue-900/30 border-blue-800"
              }`}>
                <div className="flex items-center">
                  {message.includes("successfully") || message.includes("sent") ? (
                      <svg className="w-5 h-5 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                  ) : (
                      <svg className="w-5 h-5 text-blue-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                  )}
                  <p className={`text-sm font-medium ${
                      message.includes("successfully") || message.includes("sent") ? "text-green-300" : "text-blue-300"
                  }`}>
                    {message}
                  </p>
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

          {step === 1 ? (
              <form className="mt-8 space-y-6" onSubmit={handleSignup}>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
                      Full Name
                    </label>
                    <input
                        id="name"
                        name="name"
                        type="text"
                        required
                        className="appearance-none relative block w-full px-4 py-3 border border-gray-600 bg-gray-700 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm"
                        placeholder="Enter your full name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={loading}
                        autoComplete="name"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
                      Email Address
                    </label>
                    <input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        className="appearance-none relative block w-full px-4 py-3 border border-gray-600 bg-gray-700 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={loading}
                    />
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
                      Password
                    </label>
                    <div className="relative">
                      <input
                          id="password"
                          name="password"
                          type={showPassword ? "text" : "password"}
                          required
                          className="appearance-none relative block w-full px-4 py-3 border border-gray-600 bg-gray-700 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm pr-12"
                          placeholder="At least 6 characters"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          disabled={loading}
                          autoComplete="new-password"
                      />
                      <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-white transition-colors"
                          disabled={loading}
                      >
                        {showPassword ? (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                        ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L6.59 6.59m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                            </svg>
                        )}
                      </button>
                    </div>
                    <p className="mt-1 text-xs text-gray-400">Minimum 6 characters</p>
                  </div>

                  <div>
                    <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-300 mb-1">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <input
                          id="confirm-password"
                          name="confirm-password"
                          type={showConfirmPassword ? "text" : "password"}
                          required
                          className="appearance-none relative block w-full px-4 py-3 border border-gray-600 bg-gray-700 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm pr-12"
                          placeholder="Confirm your password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          disabled={loading}
                          autoComplete="new-password"
                      />
                      <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-white transition-colors"
                          disabled={loading}
                      >
                        {showConfirmPassword ? (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                        ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L6.59 6.59m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                            </svg>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <button
                      type="submit"
                      disabled={loading}
                      className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 ${
                          loading
                              ? "bg-blue-700 cursor-not-allowed"
                              : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl"
                      }`}
                  >
                    {loading ? (
                        <>
                          <svg
                              className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                          >
                            <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                            ></circle>
                            <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          Creating Account...
                        </>
                    ) : (
                        "Create Account"
                    )}
                  </button>
                </div>

                <div className="text-center mt-4">
                  <p className="text-sm text-gray-400">
                    Already have an account?{" "}
                    <button
                        type="button"
                        onClick={() => navigate("/login")}
                        className="font-medium text-blue-400 hover:text-blue-300 transition-colors"
                        disabled={loading}
                    >
                      Sign in
                    </button>
                  </p>
                </div>
              </form>
          ) : (
              <form className="mt-8 space-y-6" onSubmit={handleOtpVerification}>
                <div>
                  <p className="text-sm text-gray-300 mb-6">
                    We've sent a 6-digit OTP to <strong className="text-white">{email}</strong>.
                    Please enter it below to verify your account.
                  </p>

                  <div className="mb-8">
                    <label htmlFor="otp" className="block text-sm font-medium text-gray-300 mb-2">
                      Enter OTP
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
                        onChange={(e) =>
                            setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                        }
                        disabled={loading}
                    />
                    <p className="mt-2 text-xs text-gray-400 text-center">Enter the 6-digit code from your email</p>
                  </div>
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
                          <svg
                              className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                          >
                            <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                            ></circle>
                            <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          Verifying...
                        </>
                    ) : (
                        "Verify OTP"
                    )}
                  </button>

                  <div className="flex justify-between">
                    <button
                        type="button"
                        onClick={handleResendOtp}
                        disabled={loading}
                        className="text-sm text-blue-400 hover:text-blue-300 transition-colors flex items-center"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Resend OTP
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                          setStep(1);
                          setError("");
                          setMessage("");
                          setOtp("");
                        }}
                        disabled={loading}
                        className="text-sm text-gray-400 hover:text-white transition-colors"
                    >
                      ← Go Back
                    </button>
                  </div>
                </div>
              </form>
          )}

          <div className="mt-8 pt-6 border-t border-gray-700">
            <p className="text-xs text-gray-500 text-center">
              By signing up, you agree to our{" "}
              <button className="text-gray-400 hover:text-white transition-colors">Terms of Service</button>{" "}
              and{" "}
              <button className="text-gray-400 hover:text-white transition-colors">Privacy Policy</button>
            </p>
          </div>
        </div>
      </div>
  );
};

export default Signup;