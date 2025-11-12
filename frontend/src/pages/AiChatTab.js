// src/pages/AiChatTab.js
import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Sparkles, Loader2, Film, Zap, Lightbulb, TrendingUp, Heart, Search, MessageCircle, RefreshCw, History, Trash2, Plus } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { doc, setDoc, getDoc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase";

// Base URL for your backend - Updated to PORT 8080
const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8080";

// Log the API URL being used (for debugging)
console.log("🔧 API Base URL configured:", API_BASE_URL);

export default function AiChatTab() {
    const [question, setQuestion] = useState("");
    const [chat, setChat] = useState([]);
    const [loading, setLoading] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState("checking"); // checking, connected, error
    const [showHistory, setShowHistory] = useState(false);
    const [chatHistory, setChatHistory] = useState([]);
    const chatEndRef = useRef(null);
    const { theme } = useTheme();
    const { currentUser } = useAuth();

    const suggestions = [
        "Should I watch Breaking Bad?",
        "Compare The Mentalist with similar shows",
        "Best character development in TV series",
        "Who is stronger: Naruto or Sasuke?",
        "Analyze Walter White's character arc",
        "Psychological thriller recommendations",
        "Is Game of Thrones worth watching?",
        "Compare Marvel and DC movies"
    ];

    const proTips = [
        {
            icon: <Search className="w-4 h-4" />,
            title: "Be Specific",
            description: "Mention character names, specific seasons, or particular aspects you want analyzed"
        },
        {
            icon: <TrendingUp className="w-4 h-4" />,
            title: "Compare & Contrast",
            description: "Ask to compare characters, shows, or genres for deeper insights"
        },
        {
            icon: <Heart className="w-4 h-4" />,
            title: "Character Focus",
            description: "I specialize in character psychology and development arcs"
        },
        {
            icon: <MessageCircle className="w-4 h-4" />,
            title: "Follow-up Questions",
            description: "Ask follow-ups to dive deeper into any analysis"
        }
    ];

    // Check backend connection on component mount
    useEffect(() => {
        checkBackendConnection();
    }, []);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chat]);

    // Load chat history when user logs in
    useEffect(() => {
        if (currentUser) {
            loadChatHistory();
        } else {
            setChatHistory([]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentUser]);

    // Save chat to history after each message (only for logged-in users)
    // Debounced to prevent duplicate saves
    useEffect(() => {
        if (currentUser && chat.length > 0) {
            const timeoutId = setTimeout(() => {
                saveChatToHistory();
            }, 1000); // Wait 1 second before saving to avoid duplicates
            return () => clearTimeout(timeoutId);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [chat, currentUser]);

    const loadChatHistory = async () => {
        if (!currentUser) return;

        try {
            const historyRef = doc(db, "users", currentUser.uid, "aiChat", "history");
            const historySnap = await getDoc(historyRef);

            if (historySnap.exists()) {
                const data = historySnap.data();
                setChatHistory(data.sessions || []);
            }
        } catch (error) {
            console.error("Error loading chat history:", error);
        }
    };

    const saveChatToHistory = async () => {
        if (!currentUser || chat.length === 0) return;

        try {
            const historyRef = doc(db, "users", currentUser.uid, "aiChat", "history");
            const historySnap = await getDoc(historyRef);

            let sessions = [];
            if (historySnap.exists()) {
                sessions = historySnap.data().sessions || [];
            }

            // Find existing session by matching first user message text
            const firstUserMessage = chat.find(msg => msg.sender === "user");
            const existingIndex = sessions.findIndex(s => {
                const firstMsg = s.messages.find(msg => msg.sender === "user");
                return firstMsg?.text === firstUserMessage?.text;
            });

            const session = {
                id: existingIndex >= 0 ? sessions[existingIndex].id : Date.now(),
                messages: chat,
                timestamp: new Date().toISOString(),
                preview: firstUserMessage?.text?.substring(0, 50) || "New conversation"
            };

            if (existingIndex >= 0) {
                // Update existing session
                sessions[existingIndex] = session;
            } else {
                // Add new session at the beginning
                sessions.unshift(session);
                // Keep only last 20 sessions
                sessions = sessions.slice(0, 20);
            }

            await setDoc(historyRef, { sessions });
            setChatHistory(sessions);
        } catch (error) {
            console.error("Error saving chat history:", error);
        }
    };

    const loadHistorySession = (session) => {
        setChat(session.messages);
        setShowHistory(false);
    };

    const deleteHistorySession = async (sessionId) => {
        if (!currentUser) return;

        try {
            const updatedSessions = chatHistory.filter(s => s.id !== sessionId);
            const historyRef = doc(db, "users", currentUser.uid, "aiChat", "history");
            await setDoc(historyRef, { sessions: updatedSessions });
            setChatHistory(updatedSessions);
        } catch (error) {
            console.error("Error deleting session:", error);
        }
    };

    const clearAllHistory = async () => {
        if (!currentUser) return;

        if (window.confirm("Are you sure you want to clear all chat history?")) {
            try {
                const historyRef = doc(db, "users", currentUser.uid, "aiChat", "history");
                await deleteDoc(historyRef);
                setChatHistory([]);
            } catch (error) {
                console.error("Error clearing history:", error);
            }
        }
    };

    const startNewChat = () => {
        setChat([]);
        setShowHistory(false);
    };

    const checkBackendConnection = async () => {
        setConnectionStatus("checking");
        const healthUrl = `${API_BASE_URL}/api/health`;
        console.log("🔍 Checking backend connection at:", healthUrl);
        
        try {
            const response = await fetch(healthUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                const data = await response.json();
                setConnectionStatus("connected");
                console.log("✅ Backend connected successfully:", data);
            } else {
                setConnectionStatus("error");
                console.error("❌ Backend health check failed with status:", response.status);
            }
        } catch (error) {
            console.error('❌ Backend connection failed:', error);
            console.error('   Attempted URL:', healthUrl);
            setConnectionStatus("error");
        }
    };

    // Call your backend API
    const callBackendAI = async (userQuestion) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/ai/ask`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    question: userQuestion
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error calling backend AI:', error);
            throw error;
        }
    };

    const sendMessage = async () => {
        if (!question.trim()) return;

        const userMessage = { sender: "user", text: question, timestamp: new Date() };
        const newChat = [...chat, userMessage];
        setChat(newChat);
        setQuestion("");

        // Only show loading if backend is connected
        if (connectionStatus === "connected") {
            setLoading(true);
            
            try {
                // Call your backend API
                const aiResponse = await callBackendAI(question);

                setChat([
                    ...newChat,
                    {
                        sender: "ai",
                        text: aiResponse.answer,
                        movies: aiResponse.movies || [],
                        timestamp: new Date()
                    },
                ]);
        } catch (error) {
                console.error('AI request failed:', error);
                // Use fallback response when backend fails
                handleFallbackResponse(newChat, question);
        } finally {
            setLoading(false);
            }
        } else {
            // Use immediate fallback response when backend is offline
            handleFallbackResponse(newChat, question);
        }
    };

    const handleFallbackResponse = (newChat, userQuestion) => {
        const fallbackResponse = "I'm currently unable to connect to the backend server. Please make sure the backend is running on " + API_BASE_URL + " and try again.";
        
        setChat([
            ...newChat,
            {
                sender: "ai",
                text: fallbackResponse,
                movies: [],
                timestamp: new Date()
            },
        ]);
    };

    // Fallback movie data when backend fails (currently unused but kept for future use)
    // eslint-disable-next-line no-unused-vars
    const getFallbackMovies = (userQuestion) => {
        const lowerQuestion = userQuestion.toLowerCase();

        if (lowerQuestion.includes('breaking bad') || lowerQuestion.includes('walter white')) {
            return [
                {
                    title: "Breaking Bad",
                    rating: 9.5,
                    poster: "https://image.tmdb.org/t/p/w500/3xnWaLQjelJDDF7LT1WBo6f4BRe.jpg",
                    url: "https://www.themoviedb.org/tv/1396-breaking-bad"
                },
                {
                    title: "Better Call Saul",
                    rating: 9.0,
                    poster: "https://image.tmdb.org/t/p/w500/fA2nptCpQjJ1XBx0dF6izzxHv6d.jpg",
                    url: "https://www.themoviedb.org/tv/60059-better-call-saul"
                },
                {
                    title: "The Sopranos",
                    rating: 9.2,
                    poster: "https://image.tmdb.org/t/p/w500/icmmSD4vTTt0pD2h1rGMdNSVUu.jpg",
                    url: "https://www.themoviedb.org/tv/1398-the-sopranos"
                }
            ];
        }

        if (lowerQuestion.includes('mentalist') || lowerQuestion.includes('patrick jane') || lowerQuestion.includes('monk') || lowerQuestion.includes('lie to me')) {
            return [
                {
                    title: "The Mentalist",
                    rating: 8.1,
                    poster: "https://image.tmdb.org/t/p/w500/3dPhS4pJBEcR3y6aZ3MBBzSb2Mo.jpg",
                    url: "https://www.themoviedb.org/tv/824-mentalist"
                },
                {
                    title: "Monk",
                    rating: 8.2,
                    poster: "https://image.tmdb.org/t/p/w500/lJScdX2EP5OHdbVx3G4dfpjvSaT.jpg",
                    url: "https://www.themoviedb.org/tv/1695-monk"
                },
                {
                    title: "Lie to Me",
                    rating: 8.0,
                    poster: "https://image.tmdb.org/t/p/w500/4yeVWoxfvKXwK44pfaKvkcwmaLh.jpg",
                    url: "https://www.themoviedb.org/tv/832-lie-to-me"
                }
            ];
        }

        if (lowerQuestion.includes('naruto') || lowerQuestion.includes('sasuke') || lowerQuestion.includes('anime')) {
            return [
                {
                    title: "Naruto: Shippuden",
                    rating: 8.7,
                    poster: "https://image.tmdb.org/t/p/w500/zxC3HFREH4nAthLdLqYGbrrvEOI.jpg",
                    url: "https://www.themoviedb.org/tv/4629-naruto-shippuden"
                },
                {
                    title: "Attack on Titan",
                    rating: 9.1,
                    poster: "https://image.tmdb.org/t/p/w500/huco9pXbOxzP8xKYZPdR2LqXpUq.jpg",
                    url: "https://www.themoviedb.org/tv/1429-attack-on-titan"
                },
                {
                    title: "Death Note",
                    rating: 8.9,
                    poster: "https://image.tmdb.org/t/p/w500/iigTJJskR1PcjjXqxdyJwVB3BoU.jpg",
                    url: "https://www.themoviedb.org/tv/13916-death-note"
                }
            ];
        }

        if (lowerQuestion.includes('game of thrones') || lowerQuestion.includes('got')) {
            return [
                {
                    title: "Game of Thrones",
                    rating: 9.3,
                    poster: "https://image.tmdb.org/t/p/w500/7WUHnWGx5OO145IRxPDUkQSh4C7.jpg",
                    url: "https://www.themoviedb.org/tv/1399-game-of-thrones"
                },
                {
                    title: "House of the Dragon",
                    rating: 8.8,
                    poster: "https://image.tmdb.org/t/p/w500/z2yahl2uefxDCl0nogcRBstwruJ.jpg",
                    url: "https://www.themoviedb.org/tv/94997-house-of-the-dragon"
                },
                {
                    title: "The Last of Us",
                    rating: 8.8,
                    poster: "https://image.tmdb.org/t/p/w500/uKvVjHNqB5VmOrdxqAt2F7J78ED.jpg",
                    url: "https://www.themoviedb.org/tv/100088-the-last-of-us"
                }
            ];
        }

        // Default fallback movies
        return [
            {
                title: "Breaking Bad",
                rating: 9.5,
                poster: "https://image.tmdb.org/t/p/w500/3xnWaLQjelJDDF7LT1WBo6f4BRe.jpg",
                url: "https://www.themoviedb.org/tv/1396-breaking-bad"
            },
            {
                title: "Game of Thrones",
                rating: 9.3,
                poster: "https://image.tmdb.org/t/p/w500/7WUHnWGx5OO145IRxPDUkQSh4C7.jpg",
                url: "https://www.themoviedb.org/tv/1399-game-of-thrones"
            },
            {
                title: "Stranger Things",
                rating: 8.7,
                poster: "https://image.tmdb.org/t/p/w500/49WJfeN0moxb9IPfGn8AIqMGskD.jpg",
                url: "https://www.themoviedb.org/tv/66732-stranger-things"
            }
        ];
    };

    const handleKey = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const formatTimestamp = (date) => {
        return new Date(date).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Enhanced text renderer matching the example format
    const renderText = (text) => {
        if (!text) {
            const textColor = theme === 'dark' ? 'text-gray-300' : 'text-gray-700';
            return <div className={textColor}>No response received</div>;
        }

        const lines = text.split('\n');
        const formattedLines = [];
        const textColor = theme === 'dark' ? 'text-gray-200' : 'text-gray-800';
        const titleColor = theme === 'dark' ? 'text-white' : 'text-gray-900';
        const subtitleColor = theme === 'dark' ? 'text-gray-100' : 'text-gray-800';

        lines.forEach((line, i) => {
            const trimmedLine = line.trim();
            
            // Handle separators (---)
            if (trimmedLine === '---' || trimmedLine.match(/^-{3,}$/)) {
                formattedLines.push(
                    <div key={i} className={`my-4 border-t ${theme === 'dark' ? 'border-gray-600' : 'border-gray-300'}`}></div>
                );
                return;
            }
            
            // Skip empty lines
            if (!trimmedLine) {
                formattedLines.push(<div key={i} className="my-1"></div>);
                return;
            }

            // Check for numbered list items with emoji (💥 **1. *Title** or 💥 2. *Title*)
            const numberedWithEmoji = /^([🎬🎞📺💡🎯🍿⭐🎭🎪🎨🎪🎬📽️🎥🎬💥🔸🌟🧠🕵️‍♂️🎩🔍💉🔥💻🕶️🧩])\s*\*?\*?(\d+)\.\s*\*?(.+?)\*?\*?$/.exec(trimmedLine);
            if (numberedWithEmoji) {
                const [, emoji, num, title] = numberedWithEmoji;
                // Clean up any remaining asterisks from title
                const cleanTitle = title.replace(/^\*+|\*+$/g, '');
                formattedLines.push(
                    <div key={i} className={`${titleColor} font-bold my-4 text-lg leading-relaxed`}>
                        <span>{emoji}</span> <strong>{num}.</strong> <em className="font-semibold">{cleanTitle}</em>
                    </div>
                );
                return;
            }

            // Check for emoji + bold title pattern (💥 **Title**)
            const emojiBoldTitle = /^([🎬🎞📺💡🎯🍿⭐🎭🎪🎨🎪🎬📽️🎥🎬💥🔸🌟🧠🕵️‍♂️🎩🔍💉🔥💻🕶️🧩])\s*\*\*(.+?)\*\*/.exec(trimmedLine);
            if (emojiBoldTitle) {
                const [, emoji, title] = emojiBoldTitle;
                formattedLines.push(
                    <div key={i} className={`${titleColor} font-bold my-3 text-base leading-relaxed`}>
                        <span>{emoji}</span> <strong>{formatInlineFormatting(title)}</strong>
                    </div>
                );
                return;
            }

            // Check for italic subtitle (🧠 *When reading faces...*)
            const emojiItalicSubtitle = /^([🎬🎞📺💡🎯🍿⭐🎭🎪🎨🎪🎬📽️🎥🎬💥🔸🌟🧠🕵️‍♂️🎩🔍💉🔥💻🕶️🧩])\s*\*(.+?)\*$/.exec(trimmedLine);
            if (emojiItalicSubtitle && trimmedLine.length < 100) {
                const [, emoji, subtitle] = emojiItalicSubtitle;
                formattedLines.push(
                    <div key={i} className={`${subtitleColor} italic my-2 text-sm leading-relaxed`}>
                        <span>{emoji}</span> <em>{formatInlineFormatting(subtitle)}</em>
                    </div>
                );
                return;
            }

            // Check for main title (starts with emoji or bold)
            if (/^\*\*/.test(trimmedLine) || /^[🎬🎞📺💡🎯🍿⭐🎭🎪🎨🎪🎬📽️🎥🎬💥🔸🌟]/.test(trimmedLine)) {
                formattedLines.push(
                    <div key={i} className={`${titleColor} font-bold my-4 text-lg leading-relaxed`}>
                        {formatInlineFormatting(trimmedLine)}
                    </div>
                );
                return;
            }

            // Bullet points (🔸 or •)
            if (/^[🔸•-]/.test(trimmedLine)) {
                const bulletColor = theme === 'dark' ? 'text-purple-400' : 'text-purple-600';
                formattedLines.push(
                    <div key={i} className={`${textColor} my-2 ml-4 leading-relaxed flex items-start`}>
                        <span className={`${bulletColor} mr-2 mt-1`}>•</span>
                        <span className="flex-1">{formatInlineFormatting(trimmedLine.replace(/^[🔸•-]\s*/, ''))}</span>
                    </div>
                );
                return;
            }

            // Regular text
            formattedLines.push(
                <div key={i} className={`${textColor} my-2 leading-relaxed`}>
                    {formatInlineFormatting(trimmedLine)}
                </div>
            );
        });

        return formattedLines;
    };

    // Helper function to format inline markdown (bold, italic, emojis)
    const formatInlineFormatting = (line) => {
        // Clean up any malformed asterisks (e.g., *** or ****)
        let cleanedLine = line.replace(/\*{3,}/g, '**');

        // Process bold (**text**), italic (*text*), and preserve emojis
        const parts = cleanedLine.split(/(\*\*.*?\*\*|\*[^*\n]+?\*)/g);

        return parts.map((part, idx) => {
            // Bold text (**text**)
            if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
                const boldText = part.slice(2, -2);
                const boldColor = theme === 'dark' ? 'text-white' : 'text-gray-900';
                return <strong key={idx} className={`${boldColor} font-bold`}>{boldText}</strong>;
            }
            // Italic text (*text*)
            if (part.startsWith('*') && part.endsWith('*') && part.length > 2 && !part.startsWith('**')) {
                const italicText = part.slice(1, -1);
                const italicColor = theme === 'dark' ? 'text-gray-200' : 'text-gray-700';
                return <em key={idx} className={`${italicColor} italic`}>{italicText}</em>;
            }
            // Regular text (preserves emojis)
            return <span key={idx}>{part}</span>;
        });
    };

    // Theme-aware styles
    const bgGradient = theme === 'dark' 
        ? 'bg-gradient-to-br from-gray-900 to-gray-950' 
        : 'bg-gradient-to-br from-gray-50 to-blue-50';
    const headerBg = theme === 'dark'
        ? 'bg-gray-800/50 backdrop-blur-lg border-b border-gray-700'
        : 'bg-white/80 backdrop-blur-lg border-b border-gray-200 shadow-sm';
    const chatWindowBg = theme === 'dark'
        ? 'bg-gray-800/30 backdrop-blur-sm border border-gray-700/50'
        : 'bg-white/60 backdrop-blur-md border border-gray-200/80 shadow-lg';
    const inputAreaBg = theme === 'dark'
        ? 'bg-gray-800/30 backdrop-blur-sm border border-gray-700/50'
        : 'bg-white/70 backdrop-blur-md border border-gray-200/80 shadow-md';
    const sidebarBg = theme === 'dark'
        ? 'bg-gray-800/30 backdrop-blur-sm border border-gray-700/50'
        : 'bg-white/70 backdrop-blur-md border border-gray-200/80 shadow-lg';
    const textPrimary = theme === 'dark' ? 'text-gray-100' : 'text-gray-900';
    const textSecondary = theme === 'dark' ? 'text-gray-400' : 'text-gray-600';
    const titleColor = theme === 'dark' ? 'text-white' : 'text-gray-900';
    const messageAIBg = theme === 'dark'
        ? 'bg-gray-700/80 text-gray-100 border border-gray-600/50'
        : 'bg-white/90 text-gray-900 border border-gray-200/60 shadow-md';
    const messageUserBg = theme === 'dark'
        ? 'bg-blue-600 text-white'
        : 'bg-blue-500 text-white';
    const suggestionBg = theme === 'dark'
        ? 'bg-gray-700/50 hover:bg-gray-700 border border-gray-600/50'
        : 'bg-white/80 hover:bg-white border border-gray-200/60 shadow-sm';
    const suggestionText = theme === 'dark' ? 'text-gray-200' : 'text-gray-800';
    const loadingBg = theme === 'dark'
        ? 'bg-gray-700/80 border border-gray-600/50 text-gray-400'
        : 'bg-white/90 border border-gray-200/60 text-gray-600';

    return (
        <div className={`flex flex-col h-screen ${bgGradient} ${textPrimary}`}>
            {/* Header with Connection Status */}
            <div className={`${headerBg} p-6`}>
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl">
                                <Bot className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className={`text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent ${theme === 'light' ? 'from-purple-700 to-blue-700' : ''}`}>
                                    CineCoolAI Assistant
                                </h1>
                                <div className="flex items-center gap-2 mt-1">
                                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${
                                        theme === 'dark' ? 'bg-green-500/20' : 'bg-green-100'
                                    }`}>
                                        <Zap className={`w-3 h-3 ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`} />
                                        <span className={`text-xs font-medium ${theme === 'dark' ? 'text-green-400' : 'text-green-700'}`}>Movie & TV Expert</span>
                                    </div>
                                    {/* Connection Status Dot */}
                                    <div className="flex items-center gap-1.5" title={
                                        connectionStatus === 'connected' ? 'Backend Connected' :
                                        connectionStatus === 'error' ? 'Backend Disconnected' : 'Connecting...'
                                    }>
                                        <div className={`w-2 h-2 rounded-full ${
                                            connectionStatus === 'connected'
                                                ? 'bg-green-500 shadow-lg shadow-green-500/50'
                                                : connectionStatus === 'error'
                                                    ? 'bg-red-500 shadow-lg shadow-red-500/50'
                                                    : 'bg-yellow-500 animate-pulse shadow-lg shadow-yellow-500/50'
                                        }`} />
                                        <span className={`text-xs font-medium ${
                                            connectionStatus === 'connected'
                                                ? theme === 'dark' ? 'text-green-400' : 'text-green-700'
                                                : connectionStatus === 'error'
                                                    ? theme === 'dark' ? 'text-red-400' : 'text-red-700'
                                                    : theme === 'dark' ? 'text-yellow-400' : 'text-yellow-700'
                                        }`}>
                                            {connectionStatus === 'connected'
                                                ? 'Connected'
                                                : connectionStatus === 'error'
                                                    ? 'Backend Offline'
                                                    : 'Checking Connection'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {/* New Chat Button */}
                            <button
                                onClick={startNewChat}
                                className={`flex items-center gap-2 px-3 py-1 rounded-lg text-sm transition-colors ${
                                    theme === 'dark'
                                        ? 'bg-green-500/20 hover:bg-green-500/30 text-green-400'
                                        : 'bg-green-500/20 hover:bg-green-500/30 text-green-600'
                                }`}
                                title="Start a new chat"
                            >
                                <Plus className="w-4 h-4" />
                                New Chat
                            </button>
                            {/* History Button - Only show when logged in */}
                            {currentUser && (
                                <button
                                    onClick={() => setShowHistory(!showHistory)}
                                    className={`flex items-center gap-2 px-3 py-1 rounded-lg text-sm transition-colors ${
                                        showHistory
                                            ? 'bg-purple-500/30 text-purple-400'
                                            : theme === 'dark'
                                                ? 'bg-gray-700/50 hover:bg-gray-700 text-gray-300'
                                                : 'bg-gray-200/50 hover:bg-gray-200 text-gray-700'
                                    }`}
                                >
                                    <History className="w-4 h-4" />
                                    History ({chatHistory.length})
                                </button>
                            )}
                            {connectionStatus === 'error' && (
                                <button
                                    onClick={checkBackendConnection}
                                    className="flex items-center gap-2 px-3 py-1 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg text-blue-400 text-sm transition-colors"
                                >
                                    <RefreshCw className="w-3 h-3" />
                                    Retry Connection
                                </button>
                            )}
                        </div>
                    </div>
                    <p className={`${textSecondary} text-sm`}>
                        Character psychology • Show comparisons • Genre deep dives • Writing analysis • Recommendations
                        {currentUser && <span className="ml-2">• 💾 History saved automatically</span>}
                    </p>
                </div>
            </div>

            <div className="flex-1 flex max-w-7xl mx-auto w-full p-4 gap-6">
                {/* History Sidebar - Only show when logged in and history is open */}
                {currentUser && showHistory && (
                    <div className={`w-80 ${sidebarBg} rounded-2xl p-4 overflow-y-auto`}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className={`font-semibold ${titleColor} flex items-center gap-2`}>
                                <History className="w-5 h-5" />
                                Chat History
                            </h3>
                            {chatHistory.length > 0 && (
                                <button
                                    onClick={clearAllHistory}
                                    className={`p-1 rounded hover:bg-red-500/20 text-red-500 transition-colors`}
                                    title="Clear all history"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        {chatHistory.length === 0 ? (
                            <div className={`text-center py-8 ${textSecondary}`}>
                                <History className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">No chat history yet</p>
                                <p className="text-xs mt-1">Start a conversation!</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {chatHistory.map((session) => (
                                    <div
                                        key={session.id}
                                        className={`p-3 rounded-xl cursor-pointer transition-all border ${
                                            theme === 'dark'
                                                ? 'bg-gray-700/30 hover:bg-gray-700/50 border-gray-600/30'
                                                : 'bg-white/60 hover:bg-white border-gray-200/60'
                                        }`}
                                    >
                                        <div
                                            onClick={() => loadHistorySession(session)}
                                            className="flex-1"
                                        >
                                            <p className={`text-sm font-medium ${titleColor} line-clamp-2 mb-1`}>
                                                {session.preview}
                                            </p>
                                            <p className={`text-xs ${textSecondary}`}>
                                                {new Date(session.timestamp).toLocaleDateString()} • {session.messages.length} messages
                                            </p>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                deleteHistorySession(session.id);
                                            }}
                                            className={`mt-2 p-1 rounded hover:bg-red-500/20 text-red-500 transition-colors`}
                                            title="Delete session"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Main Chat Area */}
                <div className="flex-1 flex flex-col">
                    {/* Chat Window */}
                    <div className={`flex-1 overflow-y-auto space-y-6 p-4 rounded-2xl ${chatWindowBg}`}>
                        {chat.length === 0 && (
                            <div className="text-center py-12">
                                <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center">
                                    <Film className="w-10 h-10 text-white" />
                                </div>
                                <h3 className={`text-xl font-semibold ${titleColor} mb-2`}>
                                    CineCoolAI Assistant 🎬
                                </h3>
                                <p className={`${textSecondary} mb-2 max-w-md mx-auto`}>
                                    Your AI-powered film and television analyst. I specialize in deep character analysis, show comparisons, and storytelling insights.
                                </p>

                                {/* Connection Status Alert */}
                                {connectionStatus === 'error' && (
                                    <div className={`${theme === 'dark' ? 'bg-red-500/10 border-red-500/30' : 'bg-red-50 border-red-200'} border rounded-xl p-4 max-w-md mx-auto mb-4`}>
                                        <div className={`flex items-center gap-2 ${theme === 'dark' ? 'text-red-400' : 'text-red-600'} mb-2`}>
                                            <RefreshCw className="w-4 h-4" />
                                            <span className="text-sm font-semibold">Backend Connection Required</span>
                                        </div>
                                        <p className={`text-xs ${theme === 'dark' ? 'text-red-300' : 'text-red-700'}`}>
                                            Spring Boot backend is offline. Using local analysis mode. Start your backend for full AI features.
                                        </p>
                                        <div className={`mt-2 text-xs ${theme === 'dark' ? 'text-red-300' : 'text-red-700'}`}>
                                            <strong>Backend URL:</strong> {API_BASE_URL}
                                        </div>
                                    </div>
                                )}


                                {/* Quick Suggestions */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto mb-6">
                                    {suggestions.map((suggestion, index) => (
                                        <button
                                            key={index}
                                            onClick={() => setQuestion(suggestion)}
                                            className={`p-3 text-left ${suggestionBg} transition-all hover:border-purple-500/30 group ${theme === 'light' ? 'hover:shadow-md' : ''}`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <Sparkles className={`w-4 h-4 ${theme === 'dark' ? 'text-purple-400' : 'text-purple-600'} group-hover:scale-110 transition-transform`} />
                                                <span className={`text-sm ${suggestionText} ${theme === 'dark' ? 'group-hover:text-white' : 'group-hover:text-gray-900'}`}>
                                                    {suggestion}
                                                </span>
                                            </div>
                                        </button>
                                    ))}
                                </div>

                                <div className={`${theme === 'dark' ? 'bg-blue-500/10 border-blue-500/30' : 'bg-blue-50 border-blue-200'} border rounded-xl p-4 max-w-md mx-auto`}>
                                    <div className={`flex items-center gap-2 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'} mb-2`}>
                                        <Zap className="w-4 h-4" />
                                        <span className="text-sm font-semibold">Powered by AI + TMDB</span>
                                    </div>
                                    <p className={`text-xs ${theme === 'dark' ? 'text-blue-300' : 'text-blue-700'}`}>
                                        Real-time movie data • AI-powered analysis • Character insights • Show recommendations
                                    </p>
                                </div>
                            </div>
                        )}

                        {chat.map((msg, i) => (
                            <div
                                key={i}
                                className={`flex gap-3 ${msg.sender === "user" ? "flex-row-reverse" : "flex-row"}`}
                            >
                                {/* Avatar */}
                                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                                    msg.sender === "user"
                                        ? "bg-blue-500"
                                        : "bg-gradient-to-r from-purple-500 to-blue-500"
                                }`}>
                                    {msg.sender === "user" ? (
                                        <User className="w-4 h-4 text-white" />
                                    ) : (
                                        <Bot className="w-4 h-4 text-white" />
                                    )}
                                </div>

                                {/* Message */}
                                <div className={`flex-1 max-w-[85%] ${msg.sender === "user" ? "text-right" : "text-left"}`}>
                                    <div className={`inline-block p-4 rounded-2xl ${
                                        msg.sender === "user"
                                            ? `${messageUserBg} rounded-br-none`
                                            : `${messageAIBg} rounded-bl-none ${theme === 'light' ? 'shadow-sm' : ''}`
                                    }`}>
                                        {msg.sender === "user" ? (
                                            <div className="text-white">{msg.text}</div>
                                        ) : (
                                            <div className="space-y-3">
                                                {renderText(msg.text)}
                                    </div>
                                        )}

                                        {/* Movie Cards - Removed as per user request */}
                                    </div>
                                    <div className={`text-xs ${textSecondary} mt-1 ${msg.sender === "user" ? "text-right" : "text-left"}`}>
                                        {formatTimestamp(msg.timestamp)}
                                </div>
                            </div>
                        </div>
                    ))}

                        {loading && (
                            <div className="flex gap-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                                    <Bot className="w-4 h-4 text-white" />
                                </div>
                                <div className={`${loadingBg} rounded-2xl rounded-bl-none p-4 ${theme === 'light' ? 'shadow-sm' : ''}`}>
                                    <div className="flex items-center gap-2">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span className="text-sm">CineCoolAI assistant thinking<span className="animate-pulse">...</span></span>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={chatEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className={`mt-4 p-4 ${inputAreaBg} rounded-2xl ${theme === 'light' ? 'shadow-md' : ''}`}>
                        <div className="flex gap-3">
                            <div className="flex-1 relative">
                                <textarea
                                    rows="1"
                                    className={`w-full ${theme === 'dark' ? 'bg-gray-700/50 border-gray-600/50 text-gray-100 placeholder-gray-400' : 'bg-white/90 border-gray-300/60 text-gray-900 placeholder-gray-500'} border rounded-xl px-4 py-3 pr-12 resize-none focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all`}
                                    placeholder="Ask about character analysis, show comparisons, or genre insights..."
                                    value={question}
                                    onChange={(e) => setQuestion(e.target.value)}
                                    onKeyDown={handleKey}
                                    style={{ minHeight: '48px', maxHeight: '120px' }}
                                />
                            </div>
                            <button
                                onClick={sendMessage}
                                disabled={loading || !question.trim()}
                                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 disabled:from-gray-600 disabled:to-gray-700 text-white rounded-xl font-semibold transition-all duration-200 flex items-center gap-2 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
                            >
                                {loading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Send className="w-4 h-4" />
                                )}
                                Send
                            </button>
                        </div>
                        <div className="flex justify-between items-center mt-2 px-1">
                            <span className={`text-xs ${textSecondary}`}>
                                Press Enter to send, Shift+Enter for new line
                            </span>
                            <span className={`text-xs ${
                                connectionStatus === 'connected' 
                                    ? theme === 'dark' ? 'text-green-400' : 'text-green-600'
                                    : connectionStatus === 'error' 
                                        ? theme === 'dark' ? 'text-red-400' : 'text-red-600' 
                                        : theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600'
                            }`}>
                                {connectionStatus === 'connected' ? 'Backend Connected' :
                                    connectionStatus === 'error' ? 'Local Mode Active' : 'Checking Connection'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Pro Tips Sidebar */}
                <div className="w-80 hidden lg:block">
                    <div className={`${sidebarBg} rounded-2xl p-6 sticky top-6 ${theme === 'light' ? 'shadow-lg' : ''}`}>
                        <div className="flex items-center gap-2 mb-4">
                            <Lightbulb className={`w-5 h-5 ${theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600'}`} />
                            <h3 className={`font-semibold ${titleColor}`}>Pro Tips</h3>
                        </div>

                        <div className="space-y-4">
                            {proTips.map((tip, index) => (
                                <div key={index} className={`${theme === 'dark' ? 'bg-gray-700/30 border-gray-600/30' : 'bg-white/60 border-gray-200/60'} rounded-xl p-4 border hover:border-purple-500/30 transition-colors ${theme === 'light' ? 'shadow-sm' : ''}`}>
                                    <div className="flex items-start gap-3">
                                        <div className={`p-2 ${theme === 'dark' ? 'bg-purple-500/20' : 'bg-purple-100'} rounded-lg flex-shrink-0`}>
                                            {tip.icon}
                                        </div>
                                        <div>
                                            <h4 className={`font-semibold ${titleColor} text-sm mb-1`}>
                                                {tip.title}
                                            </h4>
                                            <p className={`text-xs ${textSecondary}`}>
                                                {tip.description}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className={`mt-6 pt-4 border-t ${theme === 'dark' ? 'border-gray-700/50' : 'border-gray-300/50'}`}>
                            <h4 className={`font-semibold ${titleColor} text-sm mb-3`}>Quick Examples</h4>
                            <div className="space-y-2">
                                <button
                                    onClick={() => setQuestion("Should I watch Breaking Bad?")}
                                    className={`w-full text-left p-2 text-xs ${textSecondary} ${theme === 'dark' ? 'hover:text-white hover:bg-gray-700/30' : 'hover:text-gray-900 hover:bg-gray-100'} rounded-lg transition-colors`}
                                >
                                    "Should I watch Breaking Bad?"
                                </button>
                                <button
                                    onClick={() => setQuestion("Compare Patrick Jane and Adrian Monk")}
                                    className={`w-full text-left p-2 text-xs ${textSecondary} ${theme === 'dark' ? 'hover:text-white hover:bg-gray-700/30' : 'hover:text-gray-900 hover:bg-gray-100'} rounded-lg transition-colors`}
                                >
                                    "Compare Patrick Jane and Adrian Monk"
                                </button>
                                <button
                                    onClick={() => setQuestion("Analyze Walter White's character")}
                                    className={`w-full text-left p-2 text-xs ${textSecondary} ${theme === 'dark' ? 'hover:text-white hover:bg-gray-700/30' : 'hover:text-gray-900 hover:bg-gray-100'} rounded-lg transition-colors`}
                                >
                                    "Analyze Walter White's character"
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}