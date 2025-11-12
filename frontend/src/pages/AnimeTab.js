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
                <div className="relative h-[80vh] bg-cover bg-center flex flex-col justify-end">
                    <div className="absolute inset-0 shimmer-cinematic-banner"></div>

                    {/* Content Shimmer */}
                    <div className="relative z-10 px-10 pb-20 max-w-2xl">
                        <div className="backdrop-blur-sm bg-black/30 rounded-xl p-6 shadow-lg">
                            {/* Title Shimmer */}
                            <div className="h-12 bg-gray-700/50 rounded-lg shimmer-inline mb-4"></div>

                            {/* Description Shimmer */}
                            <div className="space-y-2 mb-6">
                                <div className="h-4 bg-gray-600/50 rounded shimmer-inline"></div>
                                <div className="h-4 bg-gray-600/50 rounded shimmer-inline w-3/4"></div>
                                <div className="h-4 bg-gray-600/50 rounded shimmer-inline w-1/2"></div>
                            </div>

                            {/* Buttons Shimmer */}
                            <div className="flex items-center gap-4">
                                <div className="h-10 bg-gray-500/50 rounded-lg shimmer-inline w-32"></div>
                                <div className="h-8 bg-gray-600/50 rounded shimmer-inline w-20"></div>
                            </div>
                        </div>
                    </div>

                    {/* Slide indicators shimmer */}
                    <div className="absolute bottom-6 right-10 flex gap-2">
                        {[1, 2, 3, 4].map((_, i) => (
                            <div
                                key={i}
                                className="w-3 h-3 rounded-full bg-gray-600/50 shimmer-inline"
                            />
                        ))}
                    </div>
                </div>

                {/* Rows Shimmer */}
                <div className="space-y-8 py-8">
                    {[1, 2, 3, 4, 5, 6].map((row) => (
                        <div key={row} className="px-6">
                            <div className="h-8 bg-gray-700/50 rounded shimmer-inline w-64 mb-4"></div>
                            <div className="flex gap-4 overflow-x-auto">
                                {[1, 2, 3, 4, 5, 6].map((card) => (
                                    <div key={card} className="min-w-[180px] h-[270px] rounded-xl shimmer-cinematic"></div>
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