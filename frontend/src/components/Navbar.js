// src/components/Navbar.js
// UPDATED: Perfect navbar-banner sync with CSS variables

import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Home, Tv, Search, Sun, Moon, Menu, X, User, Sparkles, Film, MessageSquare } from "lucide-react";
import logo from "../assets/cinecoolTVtv-logo.png";
import { useTheme } from "../context/ThemeContext";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Handle scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const tabs = [
    { name: "Home", icon: <Home size={16} />, path: "/" },
    { name: "Series", icon: <Tv size={16} />, path: "/series" },
    { name: "Anime", icon: <Film size={16} />, path: "/anime" },
    { name: "AI Chat", icon: <MessageSquare size={16} />, path: "/ai" },
    { name: "Library", icon: <Sparkles size={16} />, path: "/library" },
    { name: "Search", icon: <Search size={16} />, path: "/search" },
  ];

  const isActive = (path) => location.pathname === path || (path !== "/" && location.pathname.startsWith(path));

  return (
    <>
      {/* Navbar with fixed height */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-md transition-all duration-300 border-b
          ${theme === "dark"
            ? "text-white border-gray-800/40"
            : "text-gray-900 border-gray-200/50"
          }
          ${scrolled 
            ? theme === "dark" 
              ? "bg-gray-900/95 shadow-2xl shadow-black/20" 
              : "bg-white/98 shadow-lg shadow-gray-200/30"
            : theme === "dark"
              ? "bg-gradient-to-b from-gray-900/90 via-gray-900/85 to-transparent"
              : "bg-gradient-to-b from-white/95 via-white/90 to-transparent"
          }
        `}
        role="navigation"
        style={{ 
          height: "var(--navbar-height, 64px)",
          minHeight: "var(--navbar-height, 64px)"
        }}
      >
        <div className="flex items-center justify-between h-full px-4 sm:px-6 md:px-8 py-2">
          {/* Logo */}
          <div
            className="flex items-center gap-2.5 cursor-pointer select-none group"
            onClick={() => navigate("/")}
            aria-label="Go to home"
          >
            <div className="relative flex items-center">
              <img
                src={logo}
                alt="CineCoolTV"
                className="h-10 w-auto object-contain transition-all duration-300 transform-gpu group-hover:scale-110 group-hover:rotate-3"
                style={{
                  filter:
                    theme === "light"
                      ? "drop-shadow(0 2px 4px rgba(0,0,0,0.1))"
                      : "drop-shadow(0 2px 8px rgba(0,0,0,0.3)) brightness(1.1)"
                }}
              />
            </div>
          </div>

          {/* Desktop Tabs (compact) */}
          <div className="hidden md:flex items-center gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.name}
                onClick={() => navigate(tab.path)}
                className={`relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 overflow-hidden group
                  ${isActive(tab.path)
                    ? "text-white shadow-md"
                    : theme === "dark"
                      ? "text-gray-300 hover:text-white hover:bg-gray-800/50"
                      : "text-gray-700 hover:text-gray-900 hover:bg-gray-100/80"
                  }
                `}
                aria-current={isActive(tab.path) ? "page" : undefined}
              >
                {/* Active gradient pill */}
                {isActive(tab.path) && (
                  <span
                    aria-hidden
                    className="absolute inset-0 rounded-lg"
                    style={{
                      background: "linear-gradient(90deg, #3b82f6, #8b5cf6, #ec4899)",
                      opacity: 0.95,
                      zIndex: 0,
                    }}
                  />
                )}

                {/* Hover effect */}
                <span
                  aria-hidden
                  className={`absolute inset-0 rounded-lg transition-opacity duration-200
                    ${isActive(tab.path) 
                      ? "opacity-0" 
                      : theme === "dark" 
                        ? "bg-gradient-to-r from-gray-800/20 to-gray-800/10 opacity-0 group-hover:opacity-100" 
                        : "bg-gradient-to-r from-gray-100/50 to-gray-50/30 opacity-0 group-hover:opacity-100"
                    }`}
                />

                <span className="relative z-10 flex items-center gap-1.5">
                  {isActive(tab.path) ? (
                    <div className="animate-spin-slow">
                      <Sparkles size={14} className="text-white" />
                    </div>
                  ) : (
                    <div className="transition-transform duration-200 group-hover:scale-110">
                      {tab.icon}
                    </div>
                  )}
                  <span className="whitespace-nowrap font-medium">{tab.name}</span>
                </span>

                {/* Active indicator */}
                {isActive(tab.path) && (
                  <span className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-4 h-0.5 rounded-full bg-white" />
                )}
              </button>
            ))}
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className={`relative w-9 h-9 flex items-center justify-center rounded-full transition-all duration-300 hover:scale-110 focus:outline-none
                ${theme === "dark"
                  ? "bg-gradient-to-br from-yellow-300 to-orange-500 text-gray-900 shadow-lg shadow-yellow-500/25"
                  : "bg-gradient-to-br from-gray-100 to-white text-yellow-600 border border-gray-200 shadow-sm"
                }`}
              aria-label="Toggle theme"
            >
              <div className="relative">
                {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
                <div className="absolute -inset-1 bg-current opacity-10 blur-sm rounded-full" />
              </div>
            </button>

            {/* Profile icon - just navigates to profile page */}
            <button
              onClick={() => navigate("/profile")}
              className={`w-9 h-9 flex items-center justify-center rounded-full transition-all duration-300 hover:scale-110 focus:outline-none
                ${theme === "dark" 
                  ? "bg-gradient-to-br from-gray-800 to-gray-900 text-white border border-gray-700/50" 
                  : "bg-gradient-to-br from-gray-50 to-white text-gray-800 border border-gray-200"
                }
              `}
              aria-label="Go to profile"
            >
              <User size={16} />
            </button>

            {/* Mobile Menu Toggle */}
            <button
              className="md:hidden flex items-center justify-center rounded-lg focus:outline-none"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              <div className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all duration-300
                ${menuOpen 
                  ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white rotate-90" 
                  : theme === "dark" 
                    ? "bg-gray-800/70 text-gray-300 hover:bg-gray-700/70" 
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }
              `}>
                {menuOpen ? <X size={18} /> : <Menu size={18} />}
              </div>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div
            className={`md:hidden absolute left-0 right-0 top-full border-t backdrop-blur-xl
              ${theme === "dark" 
                ? "bg-gray-900/95 border-gray-800/40" 
                : "bg-white/95 border-gray-200/60"
              }
            `}
          >
            <div className="space-y-1 py-3 px-4">
              {tabs.map((tab) => (
                <button
                  key={tab.name}
                  onClick={() => {
                    navigate(tab.path);
                    setMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 py-3 px-4 rounded-xl text-sm font-medium transition-all duration-150
                    ${isActive(tab.path) 
                      ? "text-white bg-gradient-to-r from-blue-500 to-purple-500 shadow-md" 
                      : theme === "dark" 
                        ? "text-gray-200 hover:bg-gray-800/40" 
                        : "text-gray-800 hover:bg-gray-100"
                    }
                  `}
                >
                  <div className={`p-2 rounded-lg transition-transform duration-200 ${isActive(tab.path) ? "bg-white/20 scale-110" : theme === "dark" ? "bg-gray-800/60" : "bg-gray-100"}`}>
                    {isActive(tab.path) ? (
                      <div className="animate-spin-slow">
                        <Sparkles size={16} />
                      </div>
                    ) : (
                      tab.icon
                    )}
                  </div>
                  <span className="font-medium">{tab.name}</span>
                  {isActive(tab.path) && (
                    <div className="ml-auto w-2 h-2 rounded-full bg-white" />
                  )}
                </button>
              ))}
              
              {/* Profile option in mobile menu */}
              <button
                onClick={() => {
                  navigate("/profile");
                  setMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 py-3 px-4 rounded-xl text-sm font-medium transition-all duration-150
                  ${isActive("/profile") 
                    ? "text-white bg-gradient-to-r from-blue-500 to-purple-500 shadow-md" 
                    : theme === "dark" 
                      ? "text-gray-200 hover:bg-gray-800/40" 
                      : "text-gray-800 hover:bg-gray-100"
                  }
                `}
              >
                <div className={`p-2 rounded-lg transition-transform duration-200 ${isActive("/profile") ? "bg-white/20 scale-110" : theme === "dark" ? "bg-gray-800/60" : "bg-gray-100"}`}>
                  <User size={16} />
                </div>
                <span className="font-medium">Profile</span>
                {isActive("/profile") && (
                  <div className="ml-auto w-2 h-2 rounded-full bg-white" />
                )}
              </button>
            </div>
          </div>
        )}
      </nav>
      
      {/* PERFECT SPACER - Matches navbar height exactly */}
      <div className="navbar-spacer" />
    </>
  );
};

export default Navbar;