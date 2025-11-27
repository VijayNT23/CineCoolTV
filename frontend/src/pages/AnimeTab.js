// src/pages/AnimeTab.js
import React, { useState, useEffect } from "react";
import Banner from "../components/Banner";
import Row from "../components/Row";
import requests from "../requests";

const AnimeTab = () => {
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Simulate initial load
        const timer = setTimeout(() => {
            setLoading(false);
        }, 500);

        return () => clearTimeout(timer);
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen themed-bg-primary">
                {/* Banner Shimmer */}
                <div className="relative h-[60vh] sm:h-[80vh] bg-cover bg-center flex flex-col justify-end">
                    <div className="absolute inset-0 shimmer-cinematic-banner"></div>

                    {/* Content Shimmer */}
                    <div className="relative z-10 px-4 sm:px-10 pb-12 sm:pb-20 max-w-2xl">
                        <div className="backdrop-blur-sm bg-black/30 rounded-xl p-4 sm:p-6 shadow-lg">
                            {/* Title Shimmer */}
                            <div className="h-8 sm:h-12 bg-gray-700/50 rounded-lg shimmer-inline mb-3 sm:mb-4"></div>

                            {/* Description Shimmer */}
                            <div className="space-y-2 mb-4 sm:mb-6">
                                <div className="h-3 sm:h-4 bg-gray-600/50 rounded shimmer-inline"></div>
                                <div className="h-3 sm:h-4 bg-gray-600/50 rounded shimmer-inline w-3/4"></div>
                                <div className="h-3 sm:h-4 bg-gray-600/50 rounded shimmer-inline w-1/2"></div>
                            </div>

                            {/* Buttons Shimmer */}
                            <div className="flex items-center gap-3 sm:gap-4">
                                <div className="h-8 sm:h-10 bg-gray-500/50 rounded-lg shimmer-inline w-24 sm:w-32"></div>
                                <div className="h-6 sm:h-8 bg-gray-600/50 rounded shimmer-inline w-16 sm:w-20"></div>
                            </div>
                        </div>
                    </div>

                    {/* Slide indicators shimmer */}
                    <div className="absolute bottom-4 sm:bottom-6 right-4 sm:right-10 flex gap-1 sm:gap-2">
                        {[1, 2, 3, 4].map((_, i) => (
                            <div
                                key={i}
                                className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-gray-600/50 shimmer-inline"
                            />
                        ))}
                    </div>
                </div>

                {/* Rows Shimmer */}
                <div className="space-y-6 sm:space-y-8 py-6 sm:py-8">
                    {[1, 2, 3, 4, 5, 6].map((row) => (
                        <div key={row} className="px-4 sm:px-6">
                            <div className="h-6 sm:h-8 bg-gray-700/50 rounded shimmer-inline w-48 sm:w-64 mb-3 sm:mb-4"></div>
                            <div className="flex gap-3 sm:gap-4 overflow-x-auto">
                                {[1, 2, 3, 4, 5, 6].map((card) => (
                                    <div key={card} className="min-w-[120px] sm:min-w-[150px] md:min-w-[180px] h-[170px] sm:h-[225px] md:h-[270px] rounded-lg sm:rounded-xl shimmer-cinematic"></div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen themed-bg-primary">
            {/* ✅ FIXED: Pass type as "anime" to Banner and Rows */}
            <Banner fetchUrl={requests.animeTrending} type="anime" />

            <Row title="🔥 Trending Anime" fetchUrl={requests.animeTrending} type="anime" isLargeRow />
            <Row title="⭐ Top Rated Anime" fetchUrl={requests.animeTopRated} type="anime" />
            <Row title="⚔️ Action Anime" fetchUrl={requests.animeAction} type="anime" />
            <Row title="💘 Romance Anime" fetchUrl={requests.animeRomance} type="anime" />
            <Row title="😂 Comedy Anime" fetchUrl={requests.animeComedy} type="anime" />
            <Row title="🕵️ Mystery Anime" fetchUrl={requests.animeMystery} type="anime" />
        </div>
    );
};

export default AnimeTab;