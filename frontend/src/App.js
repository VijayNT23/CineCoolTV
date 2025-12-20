import React from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import PerformanceOptimizer from "./components/PerformanceOptimizer";
import ErrorBoundary from "./components/ErrorBoundary";
import AiChatTab from "./pages/AiChatTab";
import SearchTab from "./pages/SearchTab";
import ProfileTab from "./pages/ProfileTab";
import MovieDetails from "./pages/MovieDetails";
import ShowDetails from "./pages/ShowDetails";
import DetailsPage from "./pages/DetailsPage";
import MoviesTab from "./pages/MoviesTab";
import SeriesTab from "./pages/SeriesTab";
import AnimeTab from "./pages/AnimeTab";
import LibraryPage from "./pages/LibraryPage";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import NotFound from "./pages/NotFound";
import ForgotPassword from "./pages/ForgotPassword";

const App = () => {
    return (
        <>
            <PerformanceOptimizer />
            <ErrorBoundary>
                <div className="min-h-screen themed-bg-primary">
                    <Navbar />
                    <div className="navbar-spacer">
                        <Routes>
                            <Route path="/" element={<MoviesTab />} />
                            <Route path="/movies" element={<MoviesTab />} />
                            <Route path="/series" element={<SeriesTab />} />
                            <Route path="/anime" element={<AnimeTab />} />
                            <Route path="/shows" element={<SeriesTab />} />
                            <Route path="/ai" element={<AiChatTab />} />
                            <Route path="/search" element={<SearchTab />} />
                            <Route path="/movie/:id" element={<MovieDetails type="movie" />} />
                            <Route path="/tv/:id" element={<MovieDetails type="tv" />} />
                            <Route path="/show/:id" element={<ShowDetails />} />
                            <Route path="/details/:type/:id" element={<DetailsPage />} />
                            <Route path="/library" element={<LibraryPage />} />
                            <Route path="/profile" element={<ProfileTab />} />
                            <Route path="/login" element={<Login />} />
                            <Route path="/signup" element={<Signup />} />
                            <Route path="*" element={<NotFound />} />
                            <Route path="/forgot-password" element={<ForgotPassword />} />
                        </Routes>
                    </div>
                </div>
            </ErrorBoundary>
        </>
    );
};

export default App;
