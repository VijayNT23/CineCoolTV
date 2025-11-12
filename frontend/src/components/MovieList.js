import React, { useEffect, useState } from "react";

const MovieList = () => {
    const [movies, setMovies] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetch("http://localhost:8080/api/movies")
            .then((res) => {
                if (!res.ok) {
                    throw new Error("Failed to fetch movies");
                }
                return res.json();
            })
            .then((data) => {
                console.log("Fetched movies:", data); // 🧠 Debugging
                if (Array.isArray(data)) {
                    setMovies(data);
                } else {
                    console.warn("Expected array, got:", data);
                    setMovies([]);
                }
            })
            .catch((err) => {
                console.error("Error fetching movies:", err);
                setError("Failed to load movies. Please try again later.");
            });
    }, []);

    const toggleFavorite = async (id) => {
        try {
            const res = await fetch(`http://localhost:8080/api/movies/${id}/favorite`, {
                method: "PUT",
            });
            if (!res.ok) throw new Error("Failed to toggle favorite");

            // ✅ Update UI immediately after successful API call
            setMovies((prev) =>
                prev.map((m) =>
                    m.id === id ? { ...m, favorite: !m.favorite } : m
                )
            );
        } catch (error) {
            console.error("Error toggling favorite:", error);
        }
    };

    if (error) {
        return <p style={{ color: "red" }}>{error}</p>;
    }

    return (
        <div>
            <h2>🎬 Your Movies</h2>
            {Array.isArray(movies) && movies.length > 0 ? (
                movAies.map((m) => (
                    <div
                        key={m.id}
                        style={{
                            margin: "10px 0",
                            background: "#f8f9fa",
                            padding: "8px 12px",
                            borderRadius: "8px",
                        }}
                    >
                        <strong>{m.title}</strong> ({m.releaseYear || m.year}) – {m.genre} ⭐
                        {m.rating}
                        <button
                            style={{
                                marginLeft: 10,
                                background: m.favorite ? "#ffb3b3" : "#e6e6e6",
                                border: "none",
                                padding: "5px 10px",
                                borderRadius: "5px",
                                cursor: "pointer",
                            }}
                            onClick={() => toggleFavorite(m.id)}
                        >
                            {m.favorite ? "💖 Unfavorite" : "🤍 Favorite"}
                        </button>
                    </div>
                ))
            ) : (
                <p>No movies found. Try adding one!</p>
            )}
        </div>
    );
};

export default MovieList;
