// src/components/ThemeToggle.js
import React from "react";
import { useTheme } from "../hooks/useTheme";
import { Sun, Moon } from "lucide-react";

const ThemeToggle = () => {
    const { theme, setTheme } = useTheme();

    const toggleTheme = () => {
        setTheme(theme === "dark" ? "light" : "dark");
    };

    return (
        <button
            onClick={toggleTheme}
            className="p-2 rounded-full transition-all duration-300 bg-gray-800 text-white hover:scale-110"
            title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        >
            {theme === "dark" ? (
                <Sun size={20} className="text-yellow-400" />
            ) : (
                <Moon size={20} className="text-gray-900" />
            )}
        </button>
    );
};

export default React.memo(ThemeToggle);
