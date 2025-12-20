import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom"; // Added for navigation

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [step, setStep] = useState(1);
  const [message, setMessage] = useState("");
  const [completed, setCompleted] = useState(false);
  const navigate = useNavigate(); // Initialize navigate

  const sendOtp = async () => {
    try {
      await axios.post("http://localhost:8080/auth/forgot-password", { email });
      setStep(2);
      setMessage("OTP sent to email");
    } catch (err) {
      setMessage("Failed to send OTP. Please try again.");
    }
  };

  const resetPassword = async () => {
    try {
      await axios.post("http://localhost:8080/auth/reset-password", {
        email,
        otp,
        newPassword,
      });

      setMessage("Password updated successfully");
      setCompleted(true);
    } catch (err) {
      setMessage("OTP already used or expired");
    }
  };

  return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Forgot password
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Reset your account password
            </p>
          </div>

          {message && (
              <div className={`rounded-md p-4 ${message.includes("success") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                {message}
              </div>
          )}

          {step === 1 && (
              <div className="space-y-4">
                <input
                    type="email"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    autoComplete="email"
                />

                <button
                    onClick={sendOtp}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Send OTP
                </button>
              </div>
          )}

          {step === 2 && (
              <div className="space-y-4">
                <input
                    placeholder="OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    autoComplete="off"
                />

                <input
                    type="password"
                    placeholder="New password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    autoComplete="new-password"
                />

                <button
                    onClick={resetPassword}
                    disabled={completed}
                    className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                        completed
                            ? "bg-gray-400 cursor-not-allowed focus:ring-gray-400"
                            : "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500"
                    }`}
                >
                  {completed ? "Password Updated" : "Reset Password"}
                </button>
              </div>
          )}

          {/* Success message with link */}
          {completed && (
              <div className="mt-4 p-4 bg-green-50 text-green-700 rounded-md">
                <p className="text-center">
                  ✅ Password has been reset successfully! You can now{" "}
                  <button
                      onClick={() => navigate("/login")}
                      className="text-blue-600 hover:underline font-medium"
                  >
                    login with your new password
                  </button>
                  .
                </p>
              </div>
          )}

          <p className="text-center text-sm text-gray-600">
            Remembered your password?{" "}
            <button
                onClick={() => navigate("/login")}
                className="font-medium text-blue-600 hover:text-blue-500"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
  );
};

export default ForgotPassword;