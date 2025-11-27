// src/components/Navbar.js
import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Home, Tv, Bot, Search, Sun, Moon, Menu, X, User } from "lucide-react";
import logo from "../assets/cinecooltv-logo.png";
import { useTheme } from "../context/ThemeContext";

const Navbar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { theme, toggleTheme } = useTheme();
    const [menuOpen, setMenuOpen] = useState(false);

    const tabs = [
        { name: "Series", icon: <Tv size={20} />, path: "/series" },
        { name: "Anime", icon: <Bot size={20} />, path: "/anime" },
        { name: "AI Chat", icon: <Bot size={20} />, path: "/ai" },
        { name: "My Library", icon: <Home size={20} />, path: "/library" },
        { name: "Search", icon: <Search size={20} />, path: "/search" },
    ];

    return (
        <nav
            className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-md shadow-md glass-effect transition-colors duration-300 ${
                theme === "dark" ? "text-white bg-gray-900/70" : "text-gray-900 bg-white/70"
            }`}
        >
            <div className="flex items-center justify-between px-6 py-3">

                {/* Logo */}
                <div
                    className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => navigate("/")}
                >
                    <img
                        src={logo}
                        alt="CineCoolTV Logo"
                        className="h-10 w-10 rounded-lg shadow-md object-cover"
                    />
                    <h1 className="hidden sm:block text-2xl font-extrabold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent tracking-wide">
                        CineCoolTV
                    </h1>
                </div>

                {/* DESKTOP NAV BUTTONS */}
                <div className="hidden md:flex space-x-6">
                    {tabs.map((tab) => {
                        const isActive = location.pathname === tab.path;
                        return (
                            <button
                                key={tab.name}
                                onClick={() => navigate(tab.path)}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all duration-200 ${
                                    isActive
                                        ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md scale-105"
                                        : theme === "dark"
                                            ? "text-gray-300 hover:bg-gray-800/50"
                                            : "text-gray-700 hover:bg-gray-200/50"
                                }`}
                            >
                                {tab.icon}
                                <span className="font-medium">{tab.name}</span>
                            </button>
                        );
                    })}
                </div>

                {/* RIGHT SIDE ICONS */}
                <div className="flex items-center gap-3">

                    {/* Theme Toggle */}
                    <button
                        onClick={toggleTheme}
                        className={`p-2 rounded-lg transition-all duration-300 hover:scale-110 ${
                            theme === "dark"
                                ? "bg-yellow-400 text-gray-900 hover:bg-yellow-300"
                                : "bg-gray-800 text-yellow-400 hover:bg-gray-700"
                        }`}
                    >
                        {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
                    </button>

                    {/* Profile Icon (visible on all devices) */}
                    <button
                        onClick={() => navigate("/profile")}
                        className={`p-2 rounded-lg transition-all duration-300 hover:scale-110 ${
                            theme === "dark"
                                ? "bg-gray-800 text-white hover:bg-gray-700"
                                : "bg-gray-200 text-gray-900 hover:bg-gray-300"
                        }`}
                    >
                        <User size={20} />
                    </button>

                    {/* Mobile Hamburger */}
                    <button
                        className="md:hidden p-2 rounded-lg"
                        onClick={() => setMenuOpen(!menuOpen)}
                    >
                        {menuOpen ? <X size={28} /> : <Menu size={28} />}
                    </button>
                </div>
            </div>

            {/* MOBILE MENU */}
            {menuOpen && (
                <div
                    className={`md:hidden px-6 py-4 border-t transition-all duration-300 ${
                        theme === "dark" ? "bg-gray-900/90 text-white" : "bg-white/90 text-black"
                    }`}
                >
                    <div className="flex flex-col gap-4">

                        {tabs.map((tab) => {
                            const isActive = location.pathname === tab.path;
                            return (
                                <button
                                    key={tab.name}
                                    onClick={() => {
                                        navigate(tab.path);
                                        setMenuOpen(false);
                                    }}
                                    className={`flex items-center gap-3 px-3 py-3 rounded-xl text-lg ${
                                        isActive
                                            ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md"
                                            : theme === "dark"
                                                ? "text-gray-300 bg-gray-800/40"
                                                : "text-gray-800 bg-gray-200"
                                    }`}
                                >
                                    {tab.icon}
                                    {tab.name}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </nav>
    );
};

export default React.memo(Navbar);
