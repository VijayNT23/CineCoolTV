import React, { useState } from "react";

const ShowsTab = () => {
    const [shows] = useState([
        { id: 1, title: "Breaking Bad", genre: "Crime", rating: 9.5 },
        { id: 2, title: "Stranger Things", genre: "Sci-Fi", rating: 8.7 },
        { id: 3, title: "Attack on Titan", genre: "Anime", rating: 9.0 },
    ]);

    return (
        <div className="min-h-screen bg-white text-gray-900 dark:bg-black dark:text-white transition-colors duration-300">

        <h2>📺 TV Shows</h2>
            {shows.map((show) => (
                <div key={show.id} style={{ margin: "10px 0" }}>
                    <strong>{show.title}</strong> – {show.genre} ⭐{show.rating}
                </div>
            ))}
        </div>
    );
};

export default ShowsTab;
