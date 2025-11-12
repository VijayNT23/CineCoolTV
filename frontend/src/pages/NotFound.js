// src/pages/NotFound.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

const NotFound = () => {
    const navigate = useNavigate();
    const { isDark } = useTheme();

    return (
        <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
            <div className="text-center">
                <h1 className={`text-6xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>404</h1>
                <p className={`text-xl mb-8 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Page not found</p>
                <button
                    onClick={() => navigate('/')}
                    className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
                >
                    Go Home
                </button>
            </div>
        </div>
    );
};

export default NotFound;