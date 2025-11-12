// src/pages/ShowDetails.js
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const ShowDetails = () => {
    const { id } = useParams(); // movie/show ID from URL
    const [details, setDetails] = useState(null);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState("");

    useEffect(() => {
        // Example using TMDb API
        const fetchDetails = async () => {
            try {
                const res = await fetch(
                    `https://api.themoviedb.org/3/movie/${id}?api_key=YOUR_TMDB_API_KEY&append_to_response=videos,recommendations,credits`
                );
                const data = await res.json();
                setDetails(data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchDetails();
    }, [id]);

    const handleComment = () => {
        if (newComment.trim()) {
            setComments([...comments, newComment]);
            setNewComment("");
        }
    };

    if (!details) return <div className="text-center text-gray-500 mt-20">Loading...</div>;

    return (
        <div className="pt-24 px-8 max-w-6xl mx-auto text-gray-100">
            <div className="flex flex-col md:flex-row gap-8">
                {/* Poster */}
                <img
                    src={`https://image.tmdb.org/t/p/w500${details.poster_path}`}
                    alt={details.title}
                    className="w-72 rounded-xl shadow-lg"
                />

                {/* Info */}
                <div className="flex-1">
                    <h1 className="text-4xl font-bold mb-2">{details.title}</h1>
                    <p className="text-gray-400 mb-3">{details.release_date?.slice(0, 4)} • {details.runtime} min</p>
                    <div className="flex flex-wrap gap-2 mb-4">
                        {details.genres?.map(g => (
                            <span key={g.id} className="bg-gray-700 px-3 py-1 rounded-full text-xs">{g.name}</span>
                        ))}
                    </div>

                    <p className="text-gray-300 mb-5">{details.overview}</p>

                    <div className="flex gap-3 flex-wrap">
                        <button className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-sm">❤️ Like</button>
                        <button className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm">⭐ Favorite</button>
                        <button className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg text-sm">✅ Completed</button>
                        <button className="bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded-lg text-sm">🔁 Rewatch</button>
                        <button className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg text-sm">🗑 Dropped</button>
                    </div>
                </div>
            </div>

            {/* Comments */}
            <div className="mt-12">
                <h2 className="text-2xl font-semibold mb-4">User Reviews</h2>
                <div className="space-y-3">
                    {comments.map((c, idx) => (
                        <div key={idx} className="bg-gray-800 p-3 rounded-lg">{c}</div>
                    ))}
                </div>
                <div className="mt-4 flex gap-2">
                    <input
                        type="text"
                        placeholder="Add a comment..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="flex-1 bg-gray-900 border border-gray-700 rounded-lg p-2 text-gray-100"
                    />
                    <button onClick={handleComment} className="bg-red-600 px-4 py-2 rounded-lg">Post</button>
                </div>
            </div>

            {/* Recommendations */}
            <div className="mt-12">
                <h2 className="text-2xl font-semibold mb-4">Similar Shows</h2>
                <div className="flex overflow-x-scroll gap-4 pb-4">
                    {details.recommendations?.results?.map((rec) => (
                        <div
                            key={rec.id}
                            className="min-w-[160px] bg-gray-800 rounded-lg cursor-pointer hover:scale-105 transition"
                            onClick={() => window.location.assign(`/show/${rec.id}`)}
                        >
                            <img
                                src={`https://image.tmdb.org/t/p/w300${rec.poster_path}`}
                                alt={rec.title}
                                className="rounded-t-lg"
                            />
                            <p className="p-2 text-sm">{rec.title}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ShowDetails;
