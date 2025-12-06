// src/pages/AiChatTab.js
import React, { useState, useRef, useEffect, useCallback } from "react";
import {
    Send, Bot, User, Sparkles, Loader2, Film, Zap,
    TrendingUp, Heart, Search, MessageCircle, RefreshCw, History,
    Trash2, Plus, Copy, Check, Download, Mic, MicOff,
    ThumbsUp, Search as SearchIcon, X, Clock, Star, Menu,
    Moon, Sun, Bookmark, Tv, UserCircle
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { doc, setDoc, getDoc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase";

// Base URL for your backend
const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8080";

export default function AiChatTab() {
    const [question, setQuestion] = useState("");
    const [chat, setChat] = useState([]);
    const [loading, setLoading] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState("checking");
    const [showHistory, setShowHistory] = useState(false);
    const [showLiked, setShowLiked] = useState(false);
    const [chatHistory, setChatHistory] = useState([]);
    const [copiedMessageId, setCopiedMessageId] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [isListening, setIsListening] = useState(false);
    const [isStreaming, setIsStreaming] = useState(false);
    const [streamingMessageId, setStreamingMessageId] = useState(null);
    const [retryCount, setRetryCount] = useState(0);
    const [messageLikes, setMessageLikes] = useState({});
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [activeMobileView, setActiveMobileView] = useState("chat");
    const [activeTab, setActiveTab] = useState("ai-chat");

    const chatEndRef = useRef(null);
    const recognitionRef = useRef(null);
    const textareaRef = useRef(null);
    const profileMenuRef = useRef(null);
    const headerMenuRef = useRef(null);
    const mobileMenuRef = useRef(null);
    const { theme, toggleTheme } = useTheme();
    const { currentUser } = useAuth();
    const navigate = useNavigate();

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
            description: "Mention character names, specific seasons, or particular aspects"
        },
        {
            icon: <TrendingUp className="w-4 h-4" />,
            title: "Compare & Contrast",
            description: "Ask to compare characters, shows, or genres"
        },
        {
            icon: <Heart className="w-4 h-4" />,
            title: "Character Focus",
            description: "I specialize in character psychology and development"
        },
        {
            icon: <MessageCircle className="w-4 h-4" />,
            title: "Follow-up Questions",
            description: "Ask follow-ups to dive deeper into analysis"
        }
    ];

    // Theme-aware styles
    const bgGradient = theme === 'dark'
        ? 'bg-gradient-to-br from-gray-900 to-gray-950'
        : 'bg-gradient-to-br from-gray-50 to-blue-50';
    const headerBg = theme === 'dark'
        ? 'bg-gray-800/95 backdrop-blur-lg border-b border-gray-700'
        : 'bg-white/95 backdrop-blur-lg border-b border-gray-200 shadow-sm';
    const chatWindowBg = theme === 'dark'
        ? 'bg-transparent'
        : 'bg-transparent';
    const inputAreaBg = theme === 'dark'
        ? 'bg-gray-800/95 backdrop-blur-lg border-t border-gray-700/50'
        : 'bg-white/95 backdrop-blur-lg border-t border-gray-200/80 shadow-lg';
    const sidebarBg = theme === 'dark'
        ? 'bg-gray-800/95 backdrop-blur-lg'
        : 'bg-white/95 backdrop-blur-lg shadow-xl';
    const textPrimary = theme === 'dark' ? 'text-gray-100' : 'text-gray-900';
    const textSecondary = theme === 'dark' ? 'text-gray-400' : 'text-gray-600';
    const titleColor = theme === 'dark' ? 'text-white' : 'text-gray-900';
    const messageAIBg = theme === 'dark'
        ? 'bg-gray-700/40 text-gray-100'
        : 'bg-white text-gray-900 shadow-sm';
    const messageUserBg = theme === 'dark'
        ? 'bg-blue-600 text-white'
        : 'bg-blue-500 text-white';
    const suggestionBg = theme === 'dark'
        ? 'bg-gray-700/40 hover:bg-gray-700/60'
        : 'bg-white/70 hover:bg-white shadow-sm';
    const suggestionText = theme === 'dark' ? 'text-gray-200' : 'text-gray-800';
    const loadingBg = theme === 'dark'
        ? 'bg-gray-700/60 text-gray-400'
        : 'bg-white/80 text-gray-600';

    // Navigation tabs - Fixed: Only one AI Chat entry
    const navigationTabs = [
        { id: "ai-chat", label: "AI Chat", icon: Bot, path: "/ai-chat" },
        { id: "movies", label: "Movies", icon: Film, path: "/movies" },
        { id: "series", label: "Series", icon: Tv, path: "/series" },
        { id: "library", label: "My Library", icon: Bookmark, path: "/library" },
        { id: "profile", label: "Profile", icon: UserCircle, path: "/profile" }
    ];

    // Close menus when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
                setMobileMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Initialize speech recognition
    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = false;
            recognitionRef.current.lang = 'en-US';

            recognitionRef.current.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                setQuestion(prev => prev + (prev ? ' ' : '') + transcript);
                setIsListening(false);
            };

            recognitionRef.current.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                setIsListening(false);
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
            };
        }
    }, []);

    // Check backend connection on component mount
    useEffect(() => {
        checkBackendConnection();
    }, []);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chat]);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
        }
    }, [question]);

    // Load chat history and liked messages when user logs in or component mounts
    const loadChatHistory = useCallback(async () => {
        if (!currentUser) {
            console.log("❌ No user, cannot load history");
            return;
        }

        try {
            console.log("📂 Starting to load chat history...");
            const historyRef = doc(db, "users", currentUser.uid, "aiChat", "history");
            const historySnap = await getDoc(historyRef);

            if (historySnap.exists()) {
                const data = historySnap.data();
                const sessions = data.sessions || [];
                console.log("📂 Successfully loaded chat history:", sessions.length, "sessions");
                setChatHistory(sessions);
            } else {
                console.log("📂 No chat history found in Firebase");
                setChatHistory([]);
            }
        } catch (error) {
            console.error("❌ Error loading chat history:", error);
        }
    }, [currentUser]);

    const loadLikedMessages = useCallback(async () => {
        if (!currentUser) {
            console.log("❌ No user, cannot load liked messages");
            return;
        }

        try {
            console.log("❤️ Starting to load liked messages...");
            const likesRef = doc(db, "users", currentUser.uid, "aiChat", "likes");
            const likesSnap = await getDoc(likesRef);

            if (likesSnap.exists()) {
                const data = likesSnap.data();
                console.log("❤️ Successfully loaded liked messages:", Object.keys(data).length);
                setMessageLikes(data);
            } else {
                console.log("❤️ No liked messages found in Firebase");
                setMessageLikes({});
            }
        } catch (error) {
            console.error("❌ Error loading liked messages:", error);
        }
    }, [currentUser]);

    useEffect(() => {
        if (currentUser) {
            console.log("👤 User logged in, loading data...");
            loadChatHistory();
            loadLikedMessages();
        } else {
            console.log("👤 No user logged in, clearing data");
            setChatHistory([]);
            setMessageLikes({});
        }
    }, [currentUser, loadChatHistory, loadLikedMessages]);

    const saveLikedMessages = async (newLikes) => {
        if (!currentUser) {
            console.log("❌ No user, cannot save liked messages");
            return;
        }

        try {
            console.log("💾 Saving liked messages to Firebase...", newLikes);
            const likesRef = doc(db, "users", currentUser.uid, "aiChat", "likes");
            await setDoc(likesRef, newLikes);
            console.log("✅ Liked messages saved to Firebase successfully");
        } catch (error) {
            console.error("❌ Error saving liked messages:", error);
        }
    };

    const saveChatToHistory = useCallback(async (chatToSave = null) => {
        if (!currentUser) {
            console.log("❌ No user, cannot save history");
            return;
        }

        const chatData = chatToSave || chat;
        if (chatData.length === 0) {
            console.log("❌ Empty chat, cannot save history");
            return;
        }

        try {
            console.log("💾 Starting to save chat to history...");
            const historyRef = doc(db, "users", currentUser.uid, "aiChat", "history");
            const historySnap = await getDoc(historyRef);

            let sessions = [];
            if (historySnap.exists()) {
                sessions = historySnap.data().sessions || [];
                console.log("📂 Found existing sessions:", sessions.length);
            }

            const firstUserMessage = chatData.find(msg => msg.sender === "user");
            const sessionId = Date.now().toString();
            
            const session = {
                id: sessionId,
                messages: chatData.map(msg => ({
                    ...msg,
                    timestamp: msg.timestamp instanceof Date ? msg.timestamp.toISOString() : msg.timestamp
                })),
                timestamp: new Date().toISOString(),
                preview: firstUserMessage?.text?.substring(0, 50) + "..." || "New conversation"
            };

            // Always create a new session instead of updating existing ones
            sessions.unshift(session);
            sessions = sessions.slice(0, 20); // Keep only last 20 sessions

            console.log("💾 Saving session:", session);
            await setDoc(historyRef, { sessions });
            
            // Update local state
            setChatHistory(sessions);
            console.log("✅ Chat history saved successfully. Total sessions:", sessions.length);
        } catch (error) {
            console.error("❌ Error saving chat history:", error);
        }
    }, [currentUser, chat]);

    // Save chat to history when chat changes (with debouncing)
    useEffect(() => {
        if (currentUser && chat.length > 0) {
            const timeoutId = setTimeout(() => {
                saveChatToHistory();
            }, 2000);
            return () => clearTimeout(timeoutId);
        }
    }, [chat, currentUser, saveChatToHistory]);

    const loadHistorySession = async (session) => {
        console.log("📂 Loading history session:", session.preview);
        
        try {
            const messagesWithDates = session.messages.map(msg => ({
                ...msg,
                timestamp: new Date(msg.timestamp)
            }));

            setChat(messagesWithDates);
            setShowHistory(false);
            setShowLiked(false);
            setActiveMobileView("chat");
            setMobileMenuOpen(false);
            
            console.log("✅ History session loaded successfully");
        } catch (error) {
            console.error("❌ Error loading history session:", error);
        }
    };

    const loadLikedMessage = async (messageId) => {
        console.log("❤️ Loading liked message:", messageId);
        
        try {
            // Search through all history sessions for this message
            let foundMessage = null;
            let foundSession = null;

            for (const session of chatHistory) {
                const message = session.messages.find(msg => msg.id === messageId);
                if (message) {
                    foundMessage = message;
                    foundSession = session;
                    break;
                }
            }

            if (foundMessage && foundSession) {
                console.log("✅ Found liked message in session:", foundSession.preview);
                
                const messagesWithDates = foundSession.messages.map(msg => ({
                    ...msg,
                    timestamp: new Date(msg.timestamp)
                }));

                setChat(messagesWithDates);
                setShowLiked(false);
                setShowHistory(false);
                setActiveMobileView("chat");
                setMobileMenuOpen(false);
            } else {
                console.log("❌ Liked message not found in any session");
            }
        } catch (error) {
            console.error("❌ Error loading liked message:", error);
        }
    };

    const deleteHistorySession = async (sessionId) => {
        if (!currentUser) return;

        try {
            console.log("🗑️ Deleting session:", sessionId);
            const updatedSessions = chatHistory.filter(s => s.id !== sessionId);
            const historyRef = doc(db, "users", currentUser.uid, "aiChat", "history");
            await setDoc(historyRef, { sessions: updatedSessions });
            setChatHistory(updatedSessions);
            console.log("✅ Session deleted successfully");
        } catch (error) {
            console.error("❌ Error deleting session:", error);
        }
    };

    const deleteLikedMessage = async (messageId) => {
        if (!currentUser) return;

        try {
            console.log("🗑️ Deleting liked message:", messageId);
            const newLikes = { ...messageLikes };
            delete newLikes[messageId];
            await saveLikedMessages(newLikes);
            setMessageLikes(newLikes);
            console.log("✅ Liked message deleted successfully");
        } catch (error) {
            console.error("❌ Error deleting liked message:", error);
        }
    };

    const clearAllHistory = async () => {
        if (!currentUser) return;

        if (window.confirm("Are you sure you want to clear all chat history?")) {
            try {
                console.log("🗑️ Clearing all history...");
                const historyRef = doc(db, "users", currentUser.uid, "aiChat", "history");
                await deleteDoc(historyRef);
                setChatHistory([]);
                console.log("✅ All chat history cleared successfully");
            } catch (error) {
                console.error("❌ Error clearing history:", error);
            }
        }
    };

    const clearAllLikes = async () => {
        if (!currentUser) return;

        if (window.confirm("Are you sure you want to clear all liked messages?")) {
            try {
                console.log("🗑️ Clearing all likes...");
                const likesRef = doc(db, "users", currentUser.uid, "aiChat", "likes");
                await deleteDoc(likesRef);
                setMessageLikes({});
                console.log("✅ All liked messages cleared successfully");
            } catch (error) {
                console.error("❌ Error clearing likes:", error);
            }
        }
    };

    const startNewChat = async () => {
        console.log("🆕 Starting new chat...");
        
        if (currentUser && chat.length > 0) {
            console.log("💾 Saving current chat before starting new chat...");
            await saveChatToHistory();
        }
        
        setChat([]);
        setShowHistory(false);
        setShowLiked(false);
        setSearchTerm("");
        setActiveMobileView("chat");
        setMobileMenuOpen(false);
        
        console.log("✅ New chat started successfully");
        
        // Reload data after a short delay to ensure counts are updated
        if (currentUser) {
            setTimeout(() => {
                loadChatHistory();
                loadLikedMessages();
            }, 500);
        }
    };

    const checkBackendConnection = async () => {
        setConnectionStatus("checking");
        const healthUrl = `${API_BASE_URL}/api/health`;

        try {
            const response = await fetch(healthUrl, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });

            if (response.ok) {
                setConnectionStatus("connected");
                setRetryCount(0);
            } else {
                setConnectionStatus("error");
            }
        } catch (error) {
            setConnectionStatus("error");
        }
    };

    const callBackendAI = async (userQuestion, isRegeneration = false) => {
        const maxRetries = 3;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const requestBody = {
                    question: userQuestion,
                    sessionId: currentUser?.uid || 'default',
                    ...(isRegeneration && { variation: attempt })
                };

                const response = await fetch(`${API_BASE_URL}/api/ai/ask`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(requestBody),
                    signal: AbortSignal.timeout(30000)
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                setRetryCount(0);
                return data;
            } catch (error) {
                if (attempt === maxRetries) {
                    throw error;
                }
                await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            }
        }
    };

    const streamResponse = async (text, messageId) => {
        setIsStreaming(true);
        setStreamingMessageId(messageId);

        const words = text.split(' ');
        let currentDisplayedText = '';

        // Create a separate function to avoid the loop function warning
        const updateChatWithText = (textToDisplay) => {
            setChat(prevChat => prevChat.map(msg =>
                msg.id === messageId ? { ...msg, text: textToDisplay } : msg
            ));
        };

        for (let i = 0; i < words.length; i++) {
            if (!isStreaming) break;
            currentDisplayedText += (currentDisplayedText === '' ? '' : ' ') + words[i];
            updateChatWithText(currentDisplayedText);
            await new Promise(resolve => setTimeout(resolve, Math.random() * 50 + 20));
        }

        setIsStreaming(false);
        setStreamingMessageId(null);
    };

    const copyToClipboard = async (text, messageId) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedMessageId(messageId);
            setTimeout(() => setCopiedMessageId(null), 2000);
        } catch (err) {
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            setCopiedMessageId(messageId);
            setTimeout(() => setCopiedMessageId(null), 2000);
        }
    };

    const toggleVoiceInput = () => {
        if (!recognitionRef.current) {
            alert("Speech recognition not supported in your browser");
            return;
        }

        if (isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        } else {
            recognitionRef.current.start();
            setIsListening(true);
        }
    };

    const exportConversation = (format = 'txt') => {
        if (chat.length === 0) {
            alert("No conversation to export");
            return;
        }

        const conversation = chat.map(msg =>
            `${msg.sender.toUpperCase()} (${formatTimestamp(msg.timestamp)}): ${msg.text}`
        ).join('\n\n');

        if (format === 'txt') {
            const blob = new Blob([conversation], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `cinecoolai-chat-${Date.now()}.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
    };

    const toggleLike = async (messageId) => {
        const newLikedState = !messageLikes[messageId];
        const newLikes = {
            ...messageLikes,
            [messageId]: newLikedState
        };

        setMessageLikes(newLikes);

        if (currentUser) {
            await saveLikedMessages(newLikes);
            console.log(`❤️ Message ${messageId} ${newLikedState ? 'liked' : 'unliked'}`);
        } else {
            console.log("⚠️ User not logged in, like not saved to Firebase");
        }
    };

    const regenerateResponse = async (aiMessageId) => {
        const aiMessageIndex = chat.findIndex(msg => msg.id === aiMessageId);
        if (aiMessageIndex === -1) return;

        let userMessageIndex = aiMessageIndex - 1;
        while (userMessageIndex >= 0 && chat[userMessageIndex].sender !== "user") {
            userMessageIndex--;
        }

        if (userMessageIndex === -1) return;
        const userMessage = chat[userMessageIndex];

        setLoading(true);

        try {
            const chatWithoutAIResponse = chat.slice(0, aiMessageIndex);
            setChat(chatWithoutAIResponse);

            const aiResponse = await callBackendAI(userMessage.text, true);
            const newAIMessage = {
                sender: "ai",
                text: aiResponse.answer,
                movies: aiResponse.movies || [],
                timestamp: new Date(),
                id: Date.now() + Math.random()
            };

            setChat([...chatWithoutAIResponse, newAIMessage]);
            await streamResponse(aiResponse.answer, newAIMessage.id);

        } catch (error) {
            const fallbackMessage = {
                sender: "ai",
                text: "I encountered an error while regenerating the response. Please try again.",
                movies: [],
                timestamp: new Date(),
                id: Date.now() + Math.random()
            };
            setChat([...chat.slice(0, aiMessageIndex), fallbackMessage]);
            await streamResponse(fallbackMessage.text, fallbackMessage.id);
        } finally {
            setLoading(false);
        }
    };

    const filteredHistory = chatHistory.filter(session =>
        session.messages.some(msg =>
            msg.text.toLowerCase().includes(searchTerm.toLowerCase())
        ) ||
        session.preview.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getLikedMessagesWithContent = () => {
        const likedWithContent = [];

        // Add liked messages from current chat
        chat.forEach(message => {
            if (messageLikes[message.id] && message.sender === "ai") {
                likedWithContent.push({
                    ...message,
                    sessionPreview: "Current conversation",
                    sessionTimestamp: message.timestamp
                });
            }
        });

        // Add liked messages from history
        chatHistory.forEach(session => {
            session.messages.forEach(message => {
                if (messageLikes[message.id] && message.sender === "ai" &&
                    !likedWithContent.some(liked => liked.id === message.id)) {
                    likedWithContent.push({
                        ...message,
                        sessionPreview: session.preview,
                        sessionTimestamp: session.timestamp
                    });
                }
            });
        });

        console.log("❤️ Found liked messages:", likedWithContent.length);
        return likedWithContent.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    };

    const likedMessagesWithContent = getLikedMessagesWithContent();

    const sendMessage = async (customQuestion = null, isRetry = false) => {
        const messageText = customQuestion || question;
        if (!messageText.trim()) return;

        const userMessage = {
            sender: "user",
            text: messageText,
            timestamp: new Date(),
            id: Date.now() + Math.random()
        };

        const newChat = [...chat, userMessage];
        setChat(newChat);

        if (!isRetry) {
            setQuestion("");
        }

        if (connectionStatus === "connected") {
            setLoading(true);

            try {
                const aiResponse = await callBackendAI(messageText);
                const aiMessage = {
                    sender: "ai",
                    text: aiResponse.answer,
                    movies: aiResponse.movies || [],
                    timestamp: new Date(),
                    id: Date.now() + Math.random()
                };

                const finalChat = [...newChat, aiMessage];
                setChat(finalChat);
                await streamResponse(aiResponse.answer, aiMessage.id);

            } catch (error) {
                setRetryCount(prev => prev + 1);
                handleFallbackResponse(newChat, messageText);
            } finally {
                setLoading(false);
            }
        } else {
            handleFallbackResponse(newChat, messageText);
        }
    };

    const handleFallbackResponse = (newChat, userQuestion) => {
        const fallbackResponse = "I'm currently unable to connect to the backend server. Please make sure the backend is running and try again.";

        const aiMessage = {
            sender: "ai",
            text: fallbackResponse,
            movies: [],
            timestamp: new Date(),
            id: Date.now() + Math.random()
        };

        setChat([...newChat, aiMessage]);
        streamResponse(fallbackResponse, aiMessage.id);
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

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

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

            if (trimmedLine === '---' || trimmedLine.match(/^-{3,}$/)) {
                formattedLines.push(
                    <div key={i} className={`my-4 border-t ${theme === 'dark' ? 'border-gray-600' : 'border-gray-300'}`}></div>
                );
                return;
            }

            if (!trimmedLine) {
                formattedLines.push(<div key={i} className="my-1"></div>);
                return;
            }

            const numberedWithEmoji = /^([🎬🎞📺💡🎯🍿⭐🎭🎪🎨🎪🎬📽️🎥🎬💥🔸🌟🧠🕵️‍♂️🎩🔍💉🔥💻🕶️🧩])\s*\*?\*?(\d+)\.\s*\*?(.+?)\*?\*?$/.exec(trimmedLine);
            if (numberedWithEmoji) {
                const [, emoji, num, title] = numberedWithEmoji;
                const cleanTitle = title.replace(/^\*+|\*+$/g, '');
                formattedLines.push(
                    <div key={i} className={`${titleColor} font-bold my-4 text-lg leading-relaxed`}>
                        <span>{emoji}</span> <strong>{num}.</strong> <em className="font-semibold">{cleanTitle}</em>
                    </div>
                );
                return;
            }

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

            if (/^\*\*/.test(trimmedLine) || /^[🎬🎞📺💡🎯🍿⭐🎭🎪🎨🎪🎬📽️🎥🎬💥🔸🌟]/.test(trimmedLine)) {
                formattedLines.push(
                    <div key={i} className={`${titleColor} font-bold my-4 text-lg leading-relaxed`}>
                        {formatInlineFormatting(trimmedLine)}
                    </div>
                );
                return;
            }

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

            formattedLines.push(
                <div key={i} className={`${textColor} my-2 leading-relaxed`}>
                    {formatInlineFormatting(trimmedLine)}
                </div>
            );
        });

        return formattedLines;
    };

    const formatInlineFormatting = (line) => {
        let cleanedLine = line.replace(/\*{3,}/g, '**');
        const parts = cleanedLine.split(/(\*\*.*?\*\*|\*[^*\n]+?\*)/g);

        return parts.map((part, idx) => {
            if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
                const boldText = part.slice(2, -2);
                const boldColor = theme === 'dark' ? 'text-white' : 'text-gray-900';
                return <strong key={idx} className={`${boldColor} font-bold`}>{boldText}</strong>;
            }
            if (part.startsWith('*') && part.endsWith('*') && part.length > 2 && !part.startsWith('**')) {
                const italicText = part.slice(1, -1);
                const italicColor = theme === 'dark' ? 'text-gray-200' : 'text-gray-700';
                return <em key={idx} className={`${italicColor} italic`}>{italicText}</em>;
            }
            return <span key={idx}>{part}</span>;
        });
    };

    // Navigation handlers
    const handleNavigation = (tabId, path) => {
        console.log(`🔄 Navigating to: ${tabId} -> ${path}`);
        setActiveTab(tabId);
        setMobileMenuOpen(false);
        
        if (path) {
            navigate(path);
        }
    };

    // Handle CineCoolTV logo click - navigate to main chat
    const handleCineCoolTVClick = () => {
        setActiveMobileView("chat");
        setShowHistory(false);
        setShowLiked(false);
        setMobileMenuOpen(false);
        console.log("🎬 CineCoolTV clicked - navigating to main chat");
    };

    // Enhanced Mobile Header Component
    const MobileHeader = () => (
        <div className={`lg:hidden fixed top-0 left-0 right-0 z-50 ${headerBg} p-4 shadow-lg safe-area-top`}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    {/* Logo - Make it clickable */}
                    <div 
                        className="relative cursor-pointer"
                        onClick={handleCineCoolTVClick}
                    >
                        <div className="p-2 bg-gradient-to-br from-purple-500 via-blue-500 to-cyan-500 rounded-2xl shadow-lg transform rotate-3">
                            <Bot className="w-6 h-6 text-white" />
                        </div>
                    </div>
                    <div>
                        {/* Title and AI Assistant badge */}
                        <div className="flex items-baseline gap-1">
                            <h1 
                                className={`text-lg font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent cursor-pointer`}
                                onClick={handleCineCoolTVClick}
                            >
                                CineCoolAI
                            </h1>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${
                                theme === 'dark' ? 'bg-green-500/20' : 'bg-green-100'
                            }`}>
                                <Zap className={`w-3 h-3 ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`} />
                                <span className={theme === 'dark' ? 'text-green-400' : 'text-green-700'}>AI Assistant</span>
                            </div>
                            <div className={`w-2 h-2 rounded-full ${
                                connectionStatus === 'connected'
                                    ? 'bg-green-500 shadow-lg shadow-green-500/50'
                                    : connectionStatus === 'error'
                                        ? 'bg-red-500 shadow-lg shadow-red-500/50'
                                        : 'bg-yellow-500 animate-pulse shadow-lg shadow-yellow-500/50'
                            }`} />
                        </div>
                    </div>
                </div>
                
                <div className="flex items-center gap-2">
                    {chat.length > 0 && (
                        <button
                            onClick={startNewChat}
                            className={`p-2 rounded-xl transition-colors ${
                                theme === 'dark'
                                    ? 'bg-green-500/20 hover:bg-green-500/30 text-green-400'
                                    : 'bg-green-500/20 hover:bg-green-500/30 text-green-600'
                            }`}
                            title="New Chat"
                        >
                            <Plus className="w-5 h-5" />
                        </button>
                    )}
                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className={`p-2 rounded-xl transition-colors ${
                            theme === 'dark'
                                ? 'bg-gray-700/50 hover:bg-gray-700 text-gray-300'
                                : 'bg-gray-200/70 hover:bg-gray-300 text-gray-600'
                        }`}
                    >
                        <Menu className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Connection Status Bar */}
            <div className={`mt-3 px-3 py-2 rounded-xl text-xs font-medium ${
                connectionStatus === 'connected'
                    ? theme === 'dark' ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-700'
                    : connectionStatus === 'error'
                        ? theme === 'dark' ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-700'
                        : theme === 'dark' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-yellow-100 text-yellow-700'
            }`}>
                <div className="flex items-center justify-between">
                    <span>
                        {connectionStatus === 'connected' ? '✅ Connected' :
                         connectionStatus === 'error' ? '🌐 Local Mode' : '⏳ Connecting...'}
                    </span>
                    {connectionStatus === 'error' && (
                        <button
                            onClick={checkBackendConnection}
                            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
                        >
                            <RefreshCw className="w-3 h-3" />
                            Retry
                        </button>
                    )}
                </div>
            </div>
        </div>
    );

    // FIXED: Enhanced Mobile Navigation Menu with proper scrolling and single AI Chat
    const MobileNavigationMenu = () => (
        <div 
            ref={mobileMenuRef}
            className={`lg:hidden fixed inset-0 z-[99999] pointer-events-auto transition-transform duration-300 ${
                mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
        >
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={() => setMobileMenuOpen(false)}
            />
            
            {/* Menu Content */}
            <div className={`absolute left-0 top-0 bottom-0 w-80 ${sidebarBg} rounded-r-3xl overflow-hidden border-r ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} shadow-2xl`}>
                <div className="p-6 h-full flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl shadow-lg">
                                <Bot className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className={`text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent`}>
                                    CineCoolTV
                                </h1>
                                <p className={`text-xs ${textSecondary} mt-1`}>Your Entertainment Hub</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setMobileMenuOpen(false)}
                            className={`p-2 rounded-xl transition-all hover:scale-110 ${
                                theme === 'dark'
                                    ? 'bg-gray-700/50 hover:bg-gray-700 text-gray-300'
                                    : 'bg-gray-200/70 hover:bg-gray-300 text-gray-600'
                            }`}
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Navigation Items - FIXED: Scrollable container */}
                    <div className="flex-1 overflow-y-auto space-y-3">
                        {/* Main Navigation */}
                        {navigationTabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => handleNavigation(tab.id, tab.path)}
                                className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-200 group ${
                                    activeTab === tab.id
                                        ? theme === 'dark'
                                            ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg transform scale-105'
                                            : 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg transform scale-105'
                                        : theme === 'dark'
                                            ? 'bg-gray-700/30 hover:bg-gray-700/50 text-gray-300 hover:text-white hover:scale-105'
                                            : 'bg-white/60 hover:bg-white text-gray-700 hover:text-gray-900 hover:scale-105'
                                }`}
                            >
                                <div className={`p-2 rounded-xl transition-all ${
                                    activeTab === tab.id 
                                        ? 'bg-white/20' 
                                        : theme === 'dark' 
                                            ? 'bg-gray-600/50 group-hover:bg-gray-600' 
                                            : 'bg-gray-100 group-hover:bg-gray-200'
                                }`}>
                                    <tab.icon className={`w-5 h-5 ${
                                        activeTab === tab.id ? 'text-white' : theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                                    }`} />
                                </div>
                                <span className="font-semibold text-base">{tab.label}</span>
                                {activeTab === tab.id && (
                                    <div className="ml-auto w-2 h-2 bg-white rounded-full animate-pulse" />
                                )}
                            </button>
                        ))}

                        <div className="my-6 border-t border-gray-300/30"></div>

                        {/* Theme Toggle in Menu */}
                        <button
                            onClick={() => {
                                toggleTheme();
                                setMobileMenuOpen(false);
                            }}
                            className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-200 group ${
                                theme === 'dark'
                                    ? 'bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 hover:text-yellow-300 hover:scale-105'
                                    : 'bg-gray-700/20 hover:bg-gray-700/30 text-gray-600 hover:text-gray-800 hover:scale-105'
                            }`}
                        >
                            <div className={`p-2 rounded-xl ${
                                theme === 'dark' ? 'bg-yellow-500/20' : 'bg-gray-600/20'
                            }`}>
                                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                            </div>
                            <span className="font-semibold text-base">
                                {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                            </span>
                        </button>

                        <div className="my-6 border-t border-gray-300/30"></div>

                        {/* FIXED: AI Chat Features Section - Only one AI Chat entry */}
                        <div className="space-y-3">
                            <div className={`px-3 py-2 ${theme === 'dark' ? 'bg-purple-500/10' : 'bg-purple-50'} rounded-xl`}>
                                <p className={`text-xs font-semibold ${theme === 'dark' ? 'text-purple-400' : 'text-purple-600'}`}>
                                    AI CHAT FEATURES
                                </p>
                            </div>

                            {/* FIXED: Only one AI Chat button that navigates to main chat */}
                            <button
                                onClick={() => {
                                    setActiveMobileView("chat");
                                    setShowHistory(false);
                                    setShowLiked(false);
                                    setMobileMenuOpen(false);
                                }}
                                className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-200 group ${
                                    activeMobileView === "chat"
                                        ? theme === 'dark'
                                            ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg transform scale-105'
                                            : 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg transform scale-105'
                                        : theme === 'dark'
                                            ? 'bg-gray-700/30 hover:bg-gray-700/50 text-gray-300 hover:text-white hover:scale-105'
                                            : 'bg-white/60 hover:bg-white text-gray-700 hover:text-gray-900 hover:scale-105'
                                }`}
                            >
                                <div className={`p-2 rounded-xl ${
                                    activeMobileView === "chat" 
                                        ? 'bg-white/20' 
                                        : theme === 'dark' 
                                            ? 'bg-gray-600/50 group-hover:bg-gray-600' 
                                            : 'bg-gray-100 group-hover:bg-gray-200'
                                }`}>
                                    <Bot className={`w-5 h-5 ${
                                        activeMobileView === "chat" ? 'text-white' : theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                                    }`} />
                                </div>
                                <span className="font-semibold text-base">New Chat</span>
                                {activeMobileView === "chat" && (
                                    <div className="ml-auto w-2 h-2 bg-white rounded-full animate-pulse" />
                                )}
                            </button>

                            {currentUser && (
                                <>
                                    <button
                                        onClick={async () => {
                                            setActiveMobileView("history");
                                            setShowHistory(true);
                                            setShowLiked(false);
                                            await loadChatHistory();
                                            setMobileMenuOpen(false);
                                        }}
                                        className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-200 group ${
                                            activeMobileView === "history"
                                                ? theme === 'dark'
                                                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg transform scale-105'
                                                    : 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg transform scale-105'
                                                : theme === 'dark'
                                                    ? 'bg-gray-700/30 hover:bg-gray-700/50 text-gray-300 hover:text-white hover:scale-105'
                                                    : 'bg-white/60 hover:bg-white text-gray-700 hover:text-gray-900 hover:scale-105'
                                        }`}
                                    >
                                        <div className={`p-2 rounded-xl ${
                                            activeMobileView === "history" 
                                                ? 'bg-white/20' 
                                                : theme === 'dark' 
                                                    ? 'bg-gray-600/50 group-hover:bg-gray-600' 
                                                    : 'bg-gray-100 group-hover:bg-gray-200'
                                        }`}>
                                            <History className={`w-5 h-5 ${
                                                activeMobileView === "history" ? 'text-white' : theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                                            }`} />
                                        </div>
                                        <span className="font-semibold text-base">History</span>
                                        {chatHistory.length > 0 && (
                                            <span className={`ml-auto text-xs px-2 py-1 rounded-full font-bold ${
                                                theme === 'dark' ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-600'
                                            }`}>
                                                {chatHistory.length}
                                            </span>
                                        )}
                                    </button>

                                    <button
                                        onClick={async () => {
                                            setActiveMobileView("liked");
                                            setShowLiked(true);
                                            setShowHistory(false);
                                            await loadLikedMessages();
                                            setMobileMenuOpen(false);
                                        }}
                                        className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-200 group ${
                                            activeMobileView === "liked"
                                                ? theme === 'dark'
                                                    ? 'bg-gradient-to-r from-yellow-600 to-orange-600 text-white shadow-lg transform scale-105'
                                                    : 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg transform scale-105'
                                                : theme === 'dark'
                                                    ? 'bg-gray-700/30 hover:bg-gray-700/50 text-gray-300 hover:text-white hover:scale-105'
                                                    : 'bg-white/60 hover:bg-white text-gray-700 hover:text-gray-900 hover:scale-105'
                                        }`}
                                    >
                                        <div className={`p-2 rounded-xl ${
                                            activeMobileView === "liked" 
                                                ? 'bg-white/20' 
                                                : theme === 'dark' 
                                                    ? 'bg-gray-600/50 group-hover:bg-gray-600' 
                                                    : 'bg-gray-100 group-hover:bg-gray-200'
                                        }`}>
                                            <Star className={`w-5 h-5 ${
                                                activeMobileView === "liked" ? 'text-white' : theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                                            }`} />
                                        </div>
                                        <span className="font-semibold text-base">Liked</span>
                                        {likedMessagesWithContent.length > 0 && (
                                            <span className={`ml-auto text-xs px-2 py-1 rounded-full font-bold ${
                                                theme === 'dark' ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-600'
                                            }`}>
                                                {likedMessagesWithContent.length}
                                            </span>
                                        )}
                                    </button>
                                </>
                            )}

                            <button
                                onClick={() => {
                                    setActiveMobileView("tips");
                                    setShowHistory(false);
                                    setShowLiked(false);
                                    setMobileMenuOpen(false);
                                }}
                                className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-200 group ${
                                    activeMobileView === "tips"
                                        ? theme === 'dark'
                                            ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg transform scale-105'
                                            : 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg transform scale-105'
                                        : theme === 'dark'
                                            ? 'bg-gray-700/30 hover:bg-gray-700/50 text-gray-300 hover:text-white hover:scale-105'
                                            : 'bg-white/60 hover:bg-white text-gray-700 hover:text-gray-900 hover:scale-105'
                                }`}
                            >
                                <div className={`p-2 rounded-xl ${
                                    activeMobileView === "tips" 
                                        ? 'bg-white/20' 
                                        : theme === 'dark' 
                                            ? 'bg-gray-600/50 group-hover:bg-gray-600' 
                                            : 'bg-gray-100 group-hover:bg-gray-200'
                                }`}>
                                    <Zap className={`w-5 h-5 ${
                                        activeMobileView === "tips" ? 'text-white' : theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                                    }`} />
                                </div>
                                <span className="font-semibold text-base">Tips</span>
                            </button>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className={`pt-6 border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-300'}`}>
                        <div className={`text-center text-sm ${textSecondary}`}>
                            <p className="font-semibold">CineCoolAI Assistant</p>
                            <p className="mt-1 text-xs">Your AI Film & TV Expert</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    // Enhanced Mobile Welcome Header
    const MobileWelcomeHeader = () => (
        <div className="text-center py-8 px-6">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center shadow-2xl">
                <Bot className="w-8 h-8 text-white" />
            </div>
            <h3 className={`text-xl font-bold ${titleColor} mb-2`}>
                CineCoolAI
            </h3>
            <p className={`${textSecondary} mb-6 text-sm leading-relaxed max-w-md mx-auto`}>
                Your AI film & TV analyst. Ask about characters, shows, or get recommendations.
            </p>
        </div>
    );

    // Enhanced Mobile Input Area
    const MobileInputArea = () => (
        <div className={`lg:hidden fixed bottom-0 left-0 right-0 z-40 p-4 safe-area-bottom ${inputAreaBg}`}>
            <div className="flex gap-2 items-end">
                <div className="flex-1 relative">
                    <textarea
                        ref={textareaRef}
                        rows="1"
                        className={`w-full ${theme === 'dark' ? 'bg-gray-700/80 border-gray-600 text-gray-100 placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'} border-2 rounded-2xl px-4 py-3 pr-20 resize-none focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all text-base`}
                        placeholder="Ask about movies or shows..."
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        onKeyDown={handleKey}
                        style={{ 
                            minHeight: '52px',
                            maxHeight: '120px',
                            lineHeight: '1.4'
                        }}
                    />
                    {/* Voice Input Button */}
                    <div className="absolute right-2 bottom-2">
                        <button
                            onClick={toggleVoiceInput}
                            className={`p-3 rounded-xl transition-all shadow-lg ${
                                isListening
                                    ? 'bg-red-500 text-white animate-pulse'
                                    : theme === 'dark'
                                        ? 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                                        : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                            }`}
                            title={isListening ? "Stop listening" : "Start voice input"}
                        >
                            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                        </button>
                    </div>
                </div>
                <button
                    onClick={() => sendMessage()}
                    disabled={loading || !question.trim()}
                    className="px-5 py-3 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-2xl font-semibold transition-all duration-200 flex items-center gap-2 disabled:cursor-not-allowed shadow-lg active:scale-95 min-h-[52px]"
                >
                    {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <Send className="w-5 h-5" />
                    )}
                </button>
            </div>
        </div>
    );

    // FIXED: Enhanced Mobile Chat Message with better UI
    const MobileChatMessage = ({ msg, index }) => (
        <div
            key={index}
            className={`flex gap-4 ${msg.sender === "user" ? "flex-row-reverse" : "flex-row"} items-start p-4`}
        >
            {/* Profile Avatar */}
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                msg.sender === "user"
                    ? "bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg"
                    : "bg-gradient-to-br from-purple-500 to-blue-500 shadow-lg"
            }`}>
                {msg.sender === "user" ? (
                    <User className="w-4 h-4 text-white" />
                ) : (
                    <Bot className="w-4 h-4 text-white" />
                )}
            </div>

            {/* Message Content */}
            <div className={`flex-1 ${msg.sender === "user" ? "text-right" : "text-left"} max-w-[80%]`}>
                <div className={`inline-block p-4 rounded-2xl ${
                    msg.sender === "user"
                        ? `${messageUserBg} rounded-br-none shadow-lg`
                        : `${messageAIBg} rounded-bl-none shadow-lg`
                }`}>
                    {msg.sender === "user" ? (
                        <div className="space-y-3">
                            <div className="text-white text-base leading-relaxed">{msg.text}</div>
                            <div className="flex justify-end">
                                <button
                                    onClick={() => copyToClipboard(msg.text, msg.id)}
                                    className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-all ${
                                        theme === 'dark'
                                            ? 'bg-blue-500/30 hover:bg-blue-500/40 text-blue-300'
                                            : 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-700'
                                    } ${copiedMessageId === msg.id ? 'bg-green-500/20 text-green-600' : ''}`}
                                    title="Copy message"
                                >
                                    {copiedMessageId === msg.id ? (
                                        <>
                                            <Check className="w-3 h-3" />
                                            Copied!
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="w-3 h-3" />
                                            Copy
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* FIXED: Better text rendering */}
                            <div className="text-base leading-relaxed">
                                {renderText(msg.text)}
                            </div>

                            {/* Action Buttons for AI Messages */}
                            <div className="flex flex-wrap gap-2 justify-between items-center mt-4 pt-3 border-t border-gray-300/30">
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => regenerateResponse(msg.id)}
                                        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                                            theme === 'dark'
                                                ? 'bg-gray-600/70 hover:bg-gray-600 text-gray-200'
                                                : 'bg-gray-200/80 hover:bg-gray-300 text-gray-700'
                                        }`}
                                        title="Regenerate response"
                                        disabled={loading}
                                    >
                                        <RefreshCw className="w-4 h-4" />
                                        Regenerate
                                    </button>
                                    <button
                                        onClick={() => toggleLike(msg.id)}
                                        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                                            messageLikes[msg.id]
                                                ? 'bg-yellow-500/20 text-yellow-600 border border-yellow-500/30'
                                                : theme === 'dark'
                                                    ? 'bg-gray-600/70 hover:bg-gray-600 text-gray-200'
                                                    : 'bg-gray-200/80 hover:bg-gray-300 text-gray-700'
                                        }`}
                                        title={messageLikes[msg.id] ? "Unlike response" : "Like response"}
                                    >
                                        <ThumbsUp className={`w-4 h-4 ${messageLikes[msg.id] ? 'fill-current' : ''}`} />
                                        {messageLikes[msg.id] ? 'Liked' : 'Like'}
                                    </button>
                                </div>
                                <button
                                    onClick={() => copyToClipboard(msg.text, msg.id)}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                                        theme === 'dark'
                                            ? 'bg-gray-600/70 hover:bg-gray-600 text-gray-200 hover:text-white'
                                            : 'bg-gray-200/80 hover:bg-gray-300 text-gray-700 hover:text-gray-800'
                                    } ${copiedMessageId === msg.id ? 'bg-green-500/20 text-green-600' : ''}`}
                                    title="Copy response"
                                >
                                    {copiedMessageId === msg.id ? (
                                        <>
                                            <Check className="w-4 h-4" />
                                            Copied!
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="w-4 h-4" />
                                            Copy
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
                <div className={`text-xs ${textSecondary} mt-2 ${msg.sender === "user" ? "text-right" : "text-left"}`}>
                    {formatTimestamp(msg.timestamp)}
                    {streamingMessageId === msg.id && (
                        <span className="ml-2 animate-pulse">• Typing...</span>
                    )}
                </div>
            </div>
        </div>
    );

    // Enhanced Mobile Welcome Screen
    const MobileWelcomeScreen = () => (
        <div className="text-center">
            {/* Welcome Header */}
            <MobileWelcomeHeader />

            {/* Quick Suggestions */}
            <div className="grid grid-cols-1 gap-3 mb-8 px-6">
                {suggestions.slice(0, 4).map((suggestion, index) => (
                    <button
                        key={index}
                        onClick={() => setQuestion(suggestion)}
                        className={`p-4 text-left ${suggestionBg} transition-all hover:border-purple-500/50 active:scale-95 rounded-2xl group`}
                    >
                        <div className="flex items-center gap-3">
                            <Sparkles className={`w-5 h-5 ${theme === 'dark' ? 'text-purple-400' : 'text-purple-600'} group-hover:scale-110 transition-transform`} />
                            <span className={`text-sm font-medium ${suggestionText} ${theme === 'dark' ? 'group-hover:text-white' : 'group-hover:text-gray-900'}`}>
                                {suggestion}
                            </span>
                        </div>
                    </button>
                ))}
            </div>

            <div className={`${theme === 'dark' ? 'bg-blue-500/10 border-blue-500/30' : 'bg-blue-50 border-blue-200'} border rounded-2xl p-4 mx-6`}>
                <div className={`flex items-center gap-2 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'} mb-2 justify-center`}>
                    <Zap className="w-5 h-5" />
                    <span className="text-sm font-semibold">AI + TMDB Powered</span>
                </div>
                <p className={`text-xs ${theme === 'dark' ? 'text-blue-300' : 'text-blue-700'}`}>
                    Real-time data • Character analysis • Show recommendations
                </p>
            </div>
        </div>
    );

    // Mobile Sidebar Views
    const MobileSidebarView = () => {
        if (activeMobileView === "chat") return null;

        const renderContent = () => {
            switch (activeMobileView) {
                case "history":
                    return (
                        <div className="h-full flex flex-col">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className={`font-semibold ${titleColor} flex items-center gap-2`}>
                                    <History className="w-5 h-5" />
                                    Chat History
                                </h3>
                                {chatHistory.length > 0 && (
                                    <button
                                        onClick={clearAllHistory}
                                        className={`p-2 rounded-xl hover:bg-red-500/20 text-red-500 transition-colors`}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                            
                            {/* Search Bar for History */}
                            {chatHistory.length > 0 && (
                                <div className="relative mb-4">
                                    <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search conversations..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className={`w-full pl-10 pr-4 py-2 rounded-xl border ${
                                            theme === 'dark'
                                                ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400'
                                                : 'bg-white/80 border-gray-300 text-gray-900 placeholder-gray-500'
                                        } focus:outline-none focus:border-purple-500`}
                                    />
                                    {searchTerm && (
                                        <button
                                            onClick={() => setSearchTerm('')}
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            )}

                            <div className="flex-1 overflow-y-auto">
                                {filteredHistory.length === 0 ? (
                                    <div className={`text-center py-8 ${textSecondary}`}>
                                        {searchTerm ? (
                                            <>
                                                <SearchIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                                <p className="text-sm">No conversations found</p>
                                                <p className="text-xs mt-1">Try different search terms</p>
                                            </>
                                        ) : (
                                            <>
                                                <History className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                                <p className="text-sm">No chat history yet</p>
                                                <p className="text-xs mt-1">Start a conversation!</p>
                                            </>
                                        )}
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {filteredHistory.map((session) => (
                                            <div
                                                key={session.id}
                                                className={`p-4 rounded-2xl cursor-pointer transition-all ${
                                                    theme === 'dark'
                                                        ? 'bg-gray-700/30 hover:bg-gray-700/50'
                                                        : 'bg-white/60 hover:bg-white'
                                                }`}
                                                onClick={() => loadHistorySession(session)}
                                            >
                                                <p className={`text-sm font-medium ${titleColor} line-clamp-2 mb-2`}>
                                                    {session.preview}
                                                </p>
                                                <div className="flex items-center justify-between">
                                                    <p className={`text-xs ${textSecondary}`}>
                                                        {new Date(session.timestamp).toLocaleDateString()} • {session.messages.length} messages
                                                    </p>
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="w-3 h-3 text-gray-400" />
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                deleteHistorySession(session.id);
                                                            }}
                                                            className={`p-1 rounded hover:bg-red-500/20 text-red-500 transition-colors`}
                                                        >
                                                            <Trash2 className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    );

                case "liked":
                    return (
                        <div className="h-full flex flex-col">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className={`font-semibold ${titleColor} flex items-center gap-2`}>
                                    <Star className="w-5 h-5" />
                                    Liked Responses
                                </h3>
                                {likedMessagesWithContent.length > 0 && (
                                    <button
                                        onClick={clearAllLikes}
                                        className={`p-2 rounded-xl hover:bg-red-500/20 text-red-500 transition-colors`}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                            <div className="flex-1 overflow-y-auto">
                                {likedMessagesWithContent.length === 0 ? (
                                    <div className={`text-center py-8 ${textSecondary}`}>
                                        <Star className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                        <p className="text-sm">No liked responses yet</p>
                                        <p className="text-xs mt-1">Like AI responses to save them here</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {likedMessagesWithContent.map((message) => (
                                            <div
                                                key={message.id}
                                                className={`p-4 rounded-2xl cursor-pointer transition-all ${
                                                    theme === 'dark'
                                                        ? 'bg-gray-700/30 hover:bg-gray-700/50'
                                                        : 'bg-white/60 hover:bg-white'
                                                }`}
                                                onClick={() => loadLikedMessage(message.id)}
                                            >
                                                <p className={`text-sm font-medium ${titleColor} line-clamp-3 mb-2`}>
                                                    {message.text.substring(0, 100)}...
                                                </p>
                                                <div className="flex items-center justify-between">
                                                    <p className={`text-xs ${textSecondary}`}>
                                                        {formatDate(message.timestamp)}
                                                    </p>
                                                    <div className="flex items-center gap-2">
                                                        <Star className="w-3 h-3 text-yellow-500 fill-current" />
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                deleteLikedMessage(message.id);
                                                            }}
                                                            className={`p-1 rounded hover:bg-red-500/20 text-red-500 transition-colors`}
                                                        >
                                                            <Trash2 className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                </div>
                                                {message.sessionPreview && message.sessionPreview !== "Current conversation" && (
                                                    <p className={`text-xs ${textSecondary} mt-1`}>
                                                        From: {message.sessionPreview}
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    );

                case "tips":
                    return (
                        <div className="h-full flex flex-col">
                            <div className="flex items-center gap-2 mb-4">
                                <Zap className={`w-5 h-5 ${theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600'}`} />
                                <h3 className={`font-semibold ${titleColor}`}>Pro Tips</h3>
                            </div>
                            <div className="space-y-4 mb-6">
                                {proTips.map((tip, index) => (
                                    <div key={index} className={`${theme === 'dark' ? 'bg-gray-700/30' : 'bg-white/60'} rounded-2xl p-4`}>
                                        <div className="flex items-start gap-3">
                                            <div className={`p-2 ${theme === 'dark' ? 'bg-purple-500/20' : 'bg-purple-100'} rounded-xl flex-shrink-0`}>
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
                        </div>
                    );

                default:
                    return null;
            }
        };

        return (
            <div className="lg:hidden fixed inset-0 z-40 pt-16 pb-32">
                <div className={`h-full ${sidebarBg} rounded-t-3xl overflow-hidden`}>
                    <div className="p-6 h-full overflow-y-auto">
                        {renderContent()}
                    </div>
                </div>
            </div>
        );
    };

    // Main Mobile Chat Interface
    const MobileChatInterface = () => (
        <div className="lg:hidden flex-1 flex flex-col pb-32">
            {/* Chat Messages */}
            <div className={`flex-1 overflow-y-auto ${chatWindowBg}`}>
                {chat.length === 0 ? (
                    <MobileWelcomeScreen />
                ) : (
                    chat.map((msg, index) => (
                        <MobileChatMessage key={index} msg={msg} index={index} />
                    ))
                )}

                {loading && (
                    <div className="flex gap-4 p-4 items-start">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0 shadow-lg">
                            <Bot className="w-4 h-4 text-white" />
                        </div>
                        <div className={`${loadingBg} rounded-2xl rounded-bl-none p-4 flex-1 shadow-lg`}>
                            <div className="flex items-center gap-3">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span className="text-sm font-medium">Thinking<span className="animate-pulse">...</span></span>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={chatEndRef} />
            </div>
        </div>
    );

    // Desktop Input Area with Fixed Mic Button
    const DesktopInputArea = () => (
        <div className={`hidden lg:block mt-4 p-4 ${theme === 'dark' ? 'bg-gray-800/30 border border-gray-700/50' : 'bg-white/70 border border-gray-200/80 shadow-md'} rounded-2xl`}>
            <div className="flex gap-3">
                <div className="flex-1 relative">
                    <textarea
                        ref={textareaRef}
                        rows="1"
                        className={`w-full ${theme === 'dark' ? 'bg-gray-700/50 border-gray-600/50 text-gray-100 placeholder-gray-400' : 'bg-white/90 border-gray-300/60 text-gray-900 placeholder-gray-500'} border rounded-xl px-4 py-3 pr-20 resize-none focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all`}
                        placeholder="Ask about character analysis, show comparisons, or genre insights..."
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        onKeyDown={handleKey}
                        style={{ minHeight: '48px', maxHeight: '120px' }}
                    />
                    {/* Voice Input Button - Fixed position */}
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                        <button
                            onClick={toggleVoiceInput}
                            className={`p-2 rounded-lg transition-all ${
                                isListening
                                    ? 'bg-red-500 text-white animate-pulse'
                                    : theme === 'dark'
                                        ? 'bg-gray-600/50 text-gray-300 hover:bg-gray-600'
                                        : 'bg-gray-200/70 text-gray-600 hover:bg-gray-300'
                            }`}
                            title={isListening ? "Stop listening" : "Start voice input"}
                        >
                            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                        </button>
                    </div>
                </div>
                <button
                    onClick={() => sendMessage()}
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
                    {isListening && <span className="ml-2 text-red-500">• Listening...</span>}
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
    );

    // Desktop Chat Message with Profile Avatars
    const DesktopChatMessage = ({ msg, index }) => (
        <div
            key={index}
            className={`flex gap-4 ${msg.sender === "user" ? "flex-row-reverse" : "flex-row"} items-start p-6`}
        >
            {/* Profile Avatar */}
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                msg.sender === "user"
                    ? "bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg"
                    : "bg-gradient-to-br from-purple-500 to-blue-500 shadow-lg"
            }`}>
                {msg.sender === "user" ? (
                    <User className="w-4 h-4 text-white" />
                ) : (
                    <Bot className="w-4 h-4 text-white" />
                )}
            </div>

            {/* Message Content */}
            <div className={`flex-1 ${msg.sender === "user" ? "text-right" : "text-left"} max-w-[80%]`}>
                <div className={`inline-block p-4 rounded-2xl ${
                    msg.sender === "user"
                        ? `${messageUserBg} rounded-br-none shadow-lg`
                        : `${messageAIBg} rounded-bl-none shadow-lg`
                }`}>
                    {msg.sender === "user" ? (
                        <div className="space-y-3">
                            <div className="text-white">{msg.text}</div>
                            <div className="flex gap-1 justify-end">
                                <button
                                    onClick={() => copyToClipboard(msg.text, msg.id)}
                                    className="p-1 hover:bg-blue-400/30 rounded transition-colors"
                                    title="Copy message"
                                >
                                    <Copy className="w-3 h-3 text-white" />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {renderText(msg.text)}

                            {/* Action Buttons for AI Messages */}
                            <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-300/30">
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => regenerateResponse(msg.id)}
                                        className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-all ${
                                            theme === 'dark'
                                                ? 'bg-gray-600/50 hover:bg-gray-600 text-gray-300'
                                                : 'bg-gray-200/70 hover:bg-gray-300 text-gray-600'
                                        }`}
                                        title="Regenerate response"
                                        disabled={loading}
                                    >
                                        <RefreshCw className="w-3 h-3" />
                                        Regenerate
                                    </button>
                                    <button
                                        onClick={() => toggleLike(msg.id)}
                                        className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-all ${
                                            messageLikes[msg.id]
                                                ? 'bg-yellow-500/20 text-yellow-600 border border-yellow-500/30'
                                                : theme === 'dark'
                                                    ? 'bg-gray-600/50 hover:bg-gray-600 text-gray-300'
                                                    : 'bg-gray-200/70 hover:bg-gray-300 text-gray-600'
                                        }`}
                                        title={messageLikes[msg.id] ? "Unlike response" : "Like response"}
                                    >
                                        <ThumbsUp className={`w-3 h-3 ${messageLikes[msg.id] ? 'fill-current' : ''}`} />
                                        {messageLikes[msg.id] ? 'Liked' : 'Like'}
                                    </button>
                                </div>
                                <button
                                    onClick={() => copyToClipboard(msg.text, msg.id)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all ${
                                        theme === 'dark'
                                            ? 'bg-gray-600/50 hover:bg-gray-600 text-gray-300 hover:text-white'
                                            : 'bg-gray-200/70 hover:bg-gray-300 text-gray-600 hover:text-gray-800'
                                    } ${copiedMessageId === msg.id ? 'bg-green-500/20 text-green-600' : ''}`}
                                    title="Copy response"
                                >
                                    {copiedMessageId === msg.id ? (
                                        <>
                                            <Check className="w-3 h-3" />
                                            Copied!
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="w-3 h-3" />
                                            Copy
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
                <div className={`text-xs ${textSecondary} mt-1 ${msg.sender === "user" ? "text-right" : "text-left"}`}>
                    {formatTimestamp(msg.timestamp)}
                    {streamingMessageId === msg.id && (
                        <span className="ml-2 animate-pulse">• Typing...</span>
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <div className={`flex flex-col min-h-screen ${bgGradient} ${textPrimary}`}>
            {/* Mobile Header */}
            <MobileHeader />

            {/* Mobile Navigation Menu */}
            <MobileNavigationMenu />

            {/* SIMPLIFIED Desktop AI Chat Header - One Line Only */}
            <div className={`hidden lg:block ${headerBg} p-2 sticky top-0 z-30 shadow-sm`}>
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-between">
                        {/* Left side - AI Assistant info */}
                        <div className="flex items-center gap-3">
                            <div 
                                className="p-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl cursor-pointer"
                                onClick={handleCineCoolTVClick}
                            >
                                <Bot className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h1 
                                    className={`text-lg font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent cursor-pointer`}
                                    onClick={handleCineCoolTVClick}
                                >
                                    CineCoolAI Assistant
                                </h1>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${
                                    connectionStatus === 'connected'
                                        ? 'bg-green-500'
                                        : connectionStatus === 'error'
                                            ? 'bg-red-500'
                                            : 'bg-yellow-500 animate-pulse'
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
                                            ? `Offline${retryCount > 0 ? ` (${retryCount})` : ''}`
                                            : 'Checking'}
                                </span>
                            </div>
                        </div>

                        {/* Right side - Action buttons only */}
                        <div className="flex items-center gap-2">
                            {/* Export Button */}
                            {chat.length > 0 && (
                                <button
                                    onClick={() => exportConversation('txt')}
                                    className={`flex items-center gap-2 px-3 py-1 rounded-lg text-sm transition-colors ${
                                        theme === 'dark'
                                            ? 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-400'
                                            : 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-600'
                                    }`}
                                    title="Export conversation"
                                >
                                    <Download className="w-4 h-4" />
                                    <span>Export</span>
                                </button>
                            )}
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
                                <span>New Chat</span>
                            </button>
                            {/* Liked Button */}
                            {currentUser && (
                                <button
                                    onClick={async () => {
                                        setShowLiked(!showLiked);
                                        setShowHistory(false);
                                        if (!showLiked) {
                                            await loadLikedMessages();
                                        }
                                    }}
                                    className={`flex items-center gap-2 px-3 py-1 rounded-lg text-sm transition-colors ${
                                        showLiked
                                            ? 'bg-yellow-500/30 text-yellow-400'
                                            : theme === 'dark'
                                                ? 'bg-gray-700/50 hover:bg-gray-700 text-gray-300'
                                                : 'bg-gray-200/50 hover:bg-gray-200 text-gray-700'
                                    }`}
                                >
                                    <Star className="w-4 h-4" />
                                    <span>Liked ({likedMessagesWithContent.length})</span>
                                </button>
                            )}
                            {/* History Button */}
                            {currentUser && (
                                <button
                                    onClick={async () => {
                                        setShowHistory(!showHistory);
                                        setShowLiked(false);
                                        if (!showHistory) {
                                            await loadChatHistory();
                                        }
                                    }}
                                    className={`flex items-center gap-2 px-3 py-1 rounded-lg text-sm transition-colors ${
                                        showHistory
                                            ? 'bg-purple-500/30 text-purple-400'
                                            : theme === 'dark'
                                                ? 'bg-gray-700/50 hover:bg-gray-700 text-gray-300'
                                                : 'bg-gray-200/50 hover:bg-gray-200 text-gray-700'
                                    }`}
                                >
                                    <History className="w-4 h-4" />
                                    <span>History ({chatHistory.length})</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex max-w-7xl mx-auto w-full p-4 gap-6 mt-16 lg:mt-2">
                {/* Desktop Sidebars */}
                {(currentUser && (showHistory || showLiked)) && (
                    <div className={`w-80 hidden lg:block ${sidebarBg} rounded-2xl p-4 overflow-y-auto`}>
                        {showHistory ? (
                            <div className="h-full flex flex-col">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className={`font-semibold ${titleColor} flex items-center gap-2`}>
                                        <History className="w-5 h-5" />
                                        Chat History ({chatHistory.length})
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

                                {/* Search Bar */}
                                {chatHistory.length > 0 && (
                                    <div className="relative mb-4">
                                        <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            type="text"
                                            placeholder="Search conversations..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                                                theme === 'dark'
                                                    ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400'
                                                    : 'bg-white/80 border-gray-300 text-gray-900 placeholder-gray-500'
                                            } focus:outline-none focus:border-purple-500`}
                                        />
                                        {searchTerm && (
                                            <button
                                                onClick={() => setSearchTerm('')}
                                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                )}

                                <div className="flex-1 overflow-y-auto">
                                    {filteredHistory.length === 0 ? (
                                        <div className={`text-center py-8 ${textSecondary}`}>
                                            {searchTerm ? (
                                                <>
                                                    <SearchIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                                    <p className="text-sm">No conversations found</p>
                                                    <p className="text-xs mt-1">Try different search terms</p>
                                                </>
                                            ) : (
                                                <>
                                                    <History className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                                    <p className="text-sm">No chat history yet</p>
                                                    <p className="text-xs mt-1">Start a conversation!</p>
                                                </>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {filteredHistory.map((session) => (
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
                                                        <div className="flex items-center justify-between">
                                                            <p className={`text-xs ${textSecondary}`}>
                                                                {new Date(session.timestamp).toLocaleDateString()} • {session.messages.length} messages
                                                            </p>
                                                            <Clock className="w-3 h-3 text-gray-400" />
                                                        </div>
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
                            </div>
                        ) : (
                            <div className="h-full flex flex-col">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className={`font-semibold ${titleColor} flex items-center gap-2`}>
                                        <Star className="w-5 h-5" />
                                        Liked Responses ({likedMessagesWithContent.length})
                                    </h3>
                                    {likedMessagesWithContent.length > 0 && (
                                        <button
                                            onClick={clearAllLikes}
                                            className={`p-1 rounded hover:bg-red-500/20 text-red-500 transition-colors`}
                                            title="Clear all likes"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>

                                <div className="flex-1 overflow-y-auto">
                                    {likedMessagesWithContent.length === 0 ? (
                                        <div className={`text-center py-8 ${textSecondary}`}>
                                            <Star className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                            <p className="text-sm">No liked responses yet</p>
                                            <p className="text-xs mt-1">Like AI responses to save them here</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {likedMessagesWithContent.map((message) => (
                                                <div
                                                    key={message.id}
                                                    className={`p-3 rounded-xl transition-all border ${
                                                        theme === 'dark'
                                                            ? 'bg-gray-700/30 border-gray-600/30'
                                                            : 'bg-white/60 border-gray-200/60'
                                                    }`}
                                                >
                                                    <div
                                                        onClick={() => loadLikedMessage(message.id)}
                                                        className="flex-1 cursor-pointer"
                                                    >
                                                        <p className={`text-sm font-medium ${titleColor} line-clamp-2 mb-1`}>
                                                            {message.text.substring(0, 80)}...
                                                        </p>
                                                        <div className="flex items-center justify-between">
                                                            <p className={`text-xs ${textSecondary}`}>
                                                                {formatDate(message.timestamp)}
                                                            </p>
                                                            <div className="flex items-center gap-1">
                                                                <Star className="w-3 h-3 text-yellow-500 fill-current" />
                                                                <span className="text-xs text-yellow-500">Liked</span>
                                                            </div>
                                                        </div>
                                                        {message.sessionPreview && message.sessionPreview !== "Current conversation" && (
                                                            <p className={`text-xs ${textSecondary} mt-1`}>
                                                                From: {message.sessionPreview}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            deleteLikedMessage(message.id);
                                                        }}
                                                        className={`mt-2 p-1 rounded hover:bg-red-500/20 text-red-500 transition-colors`}
                                                        title="Remove from liked"
                                                    >
                                                        <Trash2 className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Mobile Content */}
                <div className="lg:hidden flex-1 w-full">
                    <MobileChatInterface />
                </div>

                {/* Desktop Main Chat Area */}
                <div className={`hidden lg:flex flex-1 flex-col ${
                    (currentUser && (showHistory || showLiked)) ? 'lg:max-w-[calc(100%-320px)]' : 'max-w-full'
                }`}>
                    {/* Desktop Chat Window */}
                    <div className={`flex-1 overflow-y-auto rounded-2xl ${theme === 'dark' ? 'bg-gray-800/20' : 'bg-white/30'}`}>
                        {chat.length === 0 ? (
                            <div className="text-center py-16">
                                <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center shadow-2xl">
                                    <Bot className="w-10 h-10 text-white" />
                                </div>
                                <h3 className={`text-2xl font-bold ${titleColor} mb-3`}>
                                    CineCoolAI Assistant
                                </h3>
                                <p className={`${textSecondary} mb-8 text-lg max-w-2xl mx-auto`}>
                                    Your AI-powered film and television analyst. I specialize in deep character analysis, show comparisons, and storytelling insights.
                                </p>

                                {connectionStatus === 'error' && (
                                    <div className={`${theme === 'dark' ? 'bg-red-500/10 border-red-500/30' : 'bg-red-50 border-red-200'} border rounded-xl p-4 max-w-md mx-auto mb-6`}>
                                        <div className={`flex items-center gap-2 ${theme === 'dark' ? 'text-red-400' : 'text-red-600'} mb-2`}>
                                            <RefreshCw className="w-4 h-4" />
                                            <span className="text-sm font-semibold">Backend Connection Required</span>
                                        </div>
                                        <p className={`text-xs ${theme === 'dark' ? 'text-red-300' : 'text-red-700'}`}>
                                            Spring Boot backend is offline. Using local analysis mode.
                                        </p>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto mb-8">
                                    {suggestions.map((suggestion, index) => (
                                        <button
                                            key={index}
                                            onClick={() => setQuestion(suggestion)}
                                            className={`p-4 text-left ${suggestionBg} transition-all hover:border-purple-500/30 group rounded-xl`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <Sparkles className={`w-5 h-5 ${theme === 'dark' ? 'text-purple-400' : 'text-purple-600'} group-hover:scale-110 transition-transform`} />
                                                <span className={`text-sm font-medium ${suggestionText} ${theme === 'dark' ? 'group-hover:text-white' : 'group-hover:text-gray-900'}`}>
                                                    {suggestion}
                                                </span>
                                            </div>
                                        </button>
                                    ))}
                                </div>

                                <div className={`${theme === 'dark' ? 'bg-blue-500/10 border-blue-500/30' : 'bg-blue-50 border-blue-200'} border rounded-xl p-6 max-w-md mx-auto`}>
                                    <div className={`flex items-center gap-2 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'} mb-2 justify-center`}>
                                        <Zap className="w-5 h-5" />
                                        <span className="text-lg font-semibold">Powered by AI + TMDB</span>
                                    </div>
                                    <p className={`text-sm ${theme === 'dark' ? 'text-blue-300' : 'text-blue-700'}`}>
                                        Real-time movie data • AI-powered analysis • Character insights • Show recommendations
                                    </p>
                                </div>
                            </div>
                        ) : (
                            chat.map((msg, i) => (
                                <DesktopChatMessage key={i} msg={msg} index={i} />
                            ))
                        )}

                        {loading && (
                            <div className="flex gap-4 p-6 items-start">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0 shadow-lg">
                                    <Bot className="w-4 h-4 text-white" />
                                </div>
                                <div className={`${loadingBg} rounded-2xl rounded-bl-none p-4 flex-1 shadow-lg`}>
                                    <div className="flex items-center gap-3">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span className="text-sm font-medium">CineCoolAI is thinking<span className="animate-pulse">...</span></span>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={chatEndRef} />
                    </div>

                    {/* Desktop Input Area */}
                    <DesktopInputArea />
                </div>
                
            </div>

            {/* Mobile Input Area */}
            <MobileInputArea />
            
            {/* Mobile Sidebar Views */}
            <MobileSidebarView />
        </div>
    );
}