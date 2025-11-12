// src/components/Toast.js
import React, { useEffect } from "react";

const Toast = ({ message, type = "info", onClose }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 2500); // auto close after 2.5s
        return () => clearTimeout(timer);
    }, [onClose]);

    const color =
        type === "success"
            ? "bg-green-600"
            : type === "error"
                ? "bg-red-600"
                : "bg-gray-800";

    return (
        <div
            className={`${color} text-white px-4 py-2 rounded-lg shadow-lg fixed bottom-6 right-6 z-50 animate-fade-in`}
        >
            {message}
        </div>
    );
};

export default Toast;
