// src/components/BannerShimmer.js - FIXED VERSION
import React from "react";
import { useTheme } from "../context/ThemeContext";

const BannerShimmer = () => {
    const { theme } = useTheme();
    const isDark = theme === "dark";

    return (
        <div className="banner-wrapper relative w-full h-[80vh] min-h-[500px] max-h-[700px] overflow-hidden">
            {/* Main background with gradient */}
            <div
                className={`
                    absolute inset-0 
                    ${isDark ? "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900" : "bg-gradient-to-br from-gray-300 via-gray-200 to-gray-300"}
                `}
            />
            
            {/* Shimmer overlay effect */}
            <div className="shimmer-cinematic" />

            {/* Dark overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
            
            {/* Content area */}
            <div className="relative z-10 h-full flex items-end pb-8 md:pb-12 px-4 md:px-8">
                <div className="w-full max-w-3xl">
                    {/* Badges */}
                    <div className="flex gap-2 md:gap-3 mb-4 md:mb-6">
                        <div className={`h-6 md:h-7 w-20 md:w-24 rounded-full animate-pulse ${isDark ? "bg-gray-700" : "bg-gray-400"}`} />
                        <div className={`h-6 md:h-7 w-16 md:w-20 rounded-full animate-pulse ${isDark ? "bg-gray-700" : "bg-gray-400"}`} />
                    </div>

                    {/* Title */}
                    <div className="mb-4 md:mb-6">
                        <div className={`h-10 md:h-12 w-3/4 md:w-2/3 rounded-lg mb-3 animate-pulse ${isDark ? "bg-gray-700" : "bg-gray-400"}`} />
                        <div className={`h-5 md:h-6 w-1/2 md:w-1/3 rounded-md animate-pulse ${isDark ? "bg-gray-700" : "bg-gray-400"}`} />
                    </div>

                    {/* Description */}
                    <div className="mb-6 md:mb-8 space-y-2 max-w-2xl">
                        <div className={`h-3 md:h-4 w-full rounded animate-pulse ${isDark ? "bg-gray-700" : "bg-gray-400"}`} />
                        <div className={`h-3 md:h-4 w-11/12 rounded animate-pulse ${isDark ? "bg-gray-700" : "bg-gray-400"}`} />
                        <div className={`h-3 md:h-4 w-10/12 rounded animate-pulse ${isDark ? "bg-gray-700" : "bg-gray-400"}`} />
                    </div>

                    {/* Stats */}
                    <div className="flex gap-4 md:gap-8 mb-6 md:mb-10">
                        {[1, 2, 3].map((item) => (
                            <div key={item}>
                                <div className={`h-8 md:h-10 w-12 md:w-16 rounded mb-1 md:mb-2 animate-pulse ${isDark ? "bg-gray-700" : "bg-gray-400"}`} />
                                <div className={`h-2 md:h-3 w-10 md:w-12 rounded animate-pulse ${isDark ? "bg-gray-700" : "bg-gray-300"}`} />
                            </div>
                        ))}
                    </div>

                    {/* Buttons */}
                    <div className="flex flex-wrap gap-3 md:gap-4">
                        <div className={`h-10 md:h-12 w-32 md:w-40 rounded-xl animate-pulse ${isDark ? "bg-gray-700" : "bg-gray-400"}`} />
                        <div className={`h-10 md:h-12 w-24 md:w-28 rounded-xl animate-pulse ${isDark ? "bg-gray-700" : "bg-gray-400"}`} />
                        <div className={`h-10 md:h-12 w-10 md:w-12 rounded-xl animate-pulse ${isDark ? "bg-gray-700" : "bg-gray-400"}`} />
                        <div className={`h-10 md:h-12 w-10 md:w-12 rounded-xl animate-pulse ${isDark ? "bg-gray-700" : "bg-gray-400"}`} />
                    </div>
                </div>
            </div>

            {/* Slide indicators */}
            <div className="banner-indicators">
                {[1, 2, 3, 4, 5, 6, 7].map((dot, index) => (
                    <div
                        key={dot}
                        className={`
                            rounded-full transition-all duration-300
                            ${index === 0 ? `w-2.5 h-2.5 md:w-3 md:h-3 ${isDark ? "bg-gray-600" : "bg-gray-500"}` : `w-2 h-2 md:w-2.5 md:h-2.5 ${isDark ? "bg-gray-700/50" : "bg-gray-400/50"}`}
                        `}
                    />
                ))}
            </div>

            {/* Bottom gradient */}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black via-black/70 to-transparent" />
        </div>
    );
};

export default BannerShimmer;