// src/pages/AiChatTab.js
import React, { useState, useRef, useEffect, useCallback, memo } from "react";
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
// ✅ FIXED: Removed Firebase imports - now using localStorage

// Base URL for your backend
const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8080";

function AiChatTab() {
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
    const [backendStatus, setBackendStatus] = useState("checking");
    const [isSaving, setIsSaving] = useState(false);
    const [lastSavedHash, setLastSavedHash] = useState("");

    const chatEndRef = useRef(null);
    const recognitionRef = useRef(null);

    const mobileTextareaRef = useRef(null);
    const desktopTextareaRef = useRef(null);
    const mobileMenuRef = useRef(null);
    const { theme, toggleTheme } = useTheme();
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const isTypingRef = useRef(false);

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
        ? 'bg-gray-800/70 border border-gray-700 shadow-lg'
        : 'bg-white shadow-md border border-gray-200';
    const messageUserBg = theme === 'dark'
        ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-xl'
        : 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-xl';
    const suggestionBg = theme === 'dark'
        ? 'bg-gray-700/40 hover:bg-gray-700/60'
        : 'bg-white/70 hover:bg-white shadow-sm';
    const suggestionText = theme === 'dark' ? 'text-gray-200' : 'text-gray-800';
    const loadingBg = theme === 'dark'
        ? 'bg-gray-700/60 text-gray-400'
        : 'bg-white/80 text-gray-600';

    // ✅ FIX 1: Navigation tabs - Removed "AI Chat" from mobile sidebar menu
    const navigationTabs = [
        { id: "movies", label: "Movies", icon: Film, path: "/movies" },
        { id: "series", label: "Series", icon: Tv, path: "/series" },
        { id: "library", label: "My Library", icon: Bookmark, path: "/library" },
        { id: "profile", label: "Profile", icon: UserCircle, path: "/profile" }
    ];

    const handleQuestionChange = useCallback((e) => {
        isTypingRef.current = true;
        setQuestion(e.target.value);
    }, []);

    useEffect(() => {
        if (!currentUser && chat.length === 0) {
            const welcomeMessage = {
                sender: "ai",
                text: "Welcome to CineCoolAI! I'm your AI film & TV analyst. Ask me about movies, shows, characters, or get recommendations.",
                timestamp: new Date(),
                id: Date.now() + Math.random()
            };
            setChat([welcomeMessage]);
        }
    }, [currentUser]);

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
                setQuestion(transcript);
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

    // ✅ FIXED: Improved backend connection check
    useEffect(() => {
        checkBackendConnection();
        
        // Check backend status periodically
        const interval = setInterval(() => {
            checkBackendConnection();
        }, 30000); // Check every 30 seconds
        
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chat]);

    useEffect(() => {
    if (!isTypingRef.current) return;

    const ref = window.innerWidth < 1024
        ? mobileTextareaRef.current
        : desktopTextareaRef.current;

    if (!ref) return;

    requestAnimationFrame(() => {
        ref.style.height = "auto";
        ref.style.height = Math.min(ref.scrollHeight, 120) + "px";
    });
}, [question]);

    const generateChatHash = useCallback((chatData) => {
        if (!chatData || chatData.length === 0) return "";
        return chatData.map(msg => `${msg.sender}:${msg.text}:${msg.timestamp}`).join('|');
    }, []);

    const loadChatHistory = useCallback(async () => {
        try {
            console.log("📂 Loading chat history...");
            const localHistory = localStorage.getItem('cinecoolai_history');
            if (localHistory) {
                const sessions = JSON.parse(localHistory);
                const uniqueSessions = Array.from(new Map(sessions.map(s => [s.id, s])).values());
                const sortedSessions = uniqueSessions.sort((a, b) => 
                    new Date(b.timestamp) - new Date(a.timestamp)
                );
                console.log("📂 Loaded unique sessions:", sortedSessions.length);
                setChatHistory(sortedSessions);
            } else {
                console.log("📂 No chat history found");
                setChatHistory([]);
            }
        } catch (error) {
            console.error("❌ Error loading chat history:", error);
            setChatHistory([]);
        }
    }, []);

    // ✅ FIXED: Improved loadLikedMessages - now uses localStorage only
    const loadLikedMessages = useCallback(async () => {
        try {
            console.log("❤️ Loading liked messages...");
            const localLikes = localStorage.getItem('cinecoolai_likes');
            if (localLikes) {
                const likes = JSON.parse(localLikes);
                console.log("❤️ Loaded liked messages:", Object.keys(likes).length);
                setMessageLikes(likes);
            } else {
                console.log("❤️ No liked messages found");
                setMessageLikes({});
            }
        } catch (error) {
            console.error("❌ Error loading liked messages:", error);
            setMessageLikes({});
        }
    }, []);

    // ✅ FIXED: Load data when user logs in
    useEffect(() => {
        if (currentUser) {
            console.log("👤 User logged in, loading data...");
            loadChatHistory();
            loadLikedMessages();
        } else {
            console.log("👤 No user logged in");
            // Try to load from localStorage for guest users
            try {
                const localHistory = localStorage.getItem('cinecoolai_history');
                if (localHistory) {
                    setChatHistory(JSON.parse(localHistory));
                }
                
                const localLikes = localStorage.getItem('cinecoolai_likes');
                if (localLikes) {
                    setMessageLikes(JSON.parse(localLikes));
                }
            } catch (e) {
                console.error("Error loading from localStorage:", e);
            }
        }
    }, [currentUser, loadChatHistory, loadLikedMessages]);

    // ✅ FIXED: Save liked messages - now uses localStorage only
    const saveLikedMessages = async (newLikes) => {
        try {
            localStorage.setItem('cinecoolai_likes', JSON.stringify(newLikes));
            console.log("💾 Saved liked messages to localStorage");
            setMessageLikes(newLikes);
        } catch (error) {
            console.error("❌ Error saving liked messages:", error);
        }
    };

    // ✅ FIXED: Improved saveChatToHistory with hash check and debouncing
    const saveChatToHistory = useCallback(async (chatToSave = null) => {
        if (isSaving) {
            console.log("⚠️ Already saving, skipping...");
            return;
        }

        const chatData = chatToSave || chat;
        if (chatData.length === 0) {
            console.log("❌ Empty chat, not saving");
            return;
        }

        // Generate hash to check for duplicates
        const currentHash = generateChatHash(chatData);
        if (currentHash === lastSavedHash) {
            console.log("⚠️ Same chat content, not saving");
            return;
        }

        setIsSaving(true);
        
        try {
            console.log("💾 Saving chat to history...");
            
            // Create session
            const firstUserMessage = chatData.find(msg => msg.sender === "user");
            const sessionId = Date.now().toString();
            
            const session = {
                id: sessionId,
                messages: chatData.map(msg => ({
                    ...msg,
                    timestamp: msg.timestamp instanceof Date ? msg.timestamp.toISOString() : msg.timestamp
                })),
                timestamp: new Date().toISOString(),
                preview: firstUserMessage?.text?.substring(0, 50) + "..." || "New conversation",
                hash: currentHash
            };

            // Get existing sessions from localStorage
            const localHistory = localStorage.getItem('cinecoolai_history');
            let existingSessions = [];
            
            if (localHistory) {
                existingSessions = JSON.parse(localHistory);
            }

            // Remove any existing session with same hash
            const filteredSessions = existingSessions.filter(s => s.hash !== currentHash);
            
            // Add new session to beginning
            const updatedSessions = [session, ...filteredSessions];
            const finalSessions = updatedSessions;

            // Save to localStorage
            localStorage.setItem('cinecoolai_history', JSON.stringify(finalSessions));
            
            // Update local state
            setChatHistory(finalSessions);
            setLastSavedHash(currentHash);
            console.log("✅ Chat history saved successfully");
            
        } catch (error) {
            console.error("❌ Error saving chat history:", error);
        } finally {
            setIsSaving(false);
        }
    }, [currentUser, chat, isSaving, lastSavedHash, generateChatHash]);

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
            
            console.log("✅ History session loaded");
        } catch (error) {
            console.error("❌ Error loading history session:", error);
        }
    };

    const loadLikedMessage = async (messageId) => {
        console.log("❤️ Loading liked message:", messageId);
        
        try {
            // Find message in history
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
                const messagesWithDates = foundSession.messages.map(msg => ({
                    ...msg,
                    timestamp: new Date(msg.timestamp)
                }));

                setChat(messagesWithDates);
                setShowLiked(false);
                setShowHistory(false);
                setActiveMobileView("chat");
                setMobileMenuOpen(false);
            }
        } catch (error) {
            console.error("❌ Error loading liked message:", error);
        }
    };

    // ✅ FIX 3: Delete history session WITHOUT popup - localStorage only
    const deleteHistorySession = async (sessionId) => {
        try {
            const localHistory = localStorage.getItem('cinecoolai_history');
            if (localHistory) {
                const updatedSessions = JSON.parse(localHistory).filter(s => s.id !== sessionId);
                localStorage.setItem('cinecoolai_history', JSON.stringify(updatedSessions));
            }
            
            setChatHistory(prev => prev.filter(s => s.id !== sessionId));
            console.log("✅ Session deleted");
        } catch (error) {
            console.error("❌ Error deleting session:", error);
        }
    };

    // ✅ FIX 3: Delete liked message WITHOUT popup
    const deleteLikedMessage = async (messageId) => {
        // ✅ No confirmation popup - instant deletion
        try {
            const newLikes = { ...messageLikes };
            delete newLikes[messageId];
            
            await saveLikedMessages(newLikes);
            console.log("✅ Liked message deleted");
        } catch (error) {
            console.error("❌ Error deleting liked message:", error);
        }
    };

    const clearAllHistory = async () => {
        try {
            localStorage.removeItem('cinecoolai_history');
            setChatHistory([]);
            setLastSavedHash("");
            console.log("✅ All history cleared");
        } catch (error) {
            console.error("❌ Error clearing history:", error);
        }
    };

    const clearAllLikes = async () => {
        try {
            localStorage.removeItem('cinecoolai_likes');
            setMessageLikes({});
            console.log("✅ All likes cleared");
        } catch (error) {
            console.error("❌ Error clearing likes:", error);
        }
    };

    const startNewChat = async () => {
        console.log("🆕 Starting new chat...");
        
        if (chat.length > 0) {
            await saveChatToHistory();
        }
        
        setChat([]);
        setQuestion("");
        setShowHistory(false);
        setShowLiked(false);
        setSearchTerm("");
        setActiveMobileView("chat");
        setMobileMenuOpen(false);
        setLastSavedHash("");
        
        console.log("✅ New chat started");
    };

    // ✅ FIXED: Improved backend connection check with timeout
    const checkBackendConnection = async () => {
        setConnectionStatus("checking");
        
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);

            const response = await fetch(`${API_BASE_URL}/api/health`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (response.ok) {
                const data = await response.json();
                setConnectionStatus("connected");
                setBackendStatus(data.status || "healthy");
                setRetryCount(0);
            } else {
                setConnectionStatus("error");
                setBackendStatus("unhealthy");
            }
        } catch (error) {
            console.log("🌐 Backend not reachable:", error.message);
            setConnectionStatus("error");
            setBackendStatus("offline");
        }
    };

    // ✅ FIXED: Improved backend AI call with better error handling and retry
    const callBackendAI = async (userQuestion) => {
        const maxRetries = 2;
        
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                console.log(`🤖 Sending request to AI backend (attempt ${attempt + 1}/${maxRetries + 1})...`);
                
                const response = await fetch(`${API_BASE_URL}/api/ai/ask`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify({
                        question: userQuestion,
                        sessionId: currentUser?.uid || 'guest'
                    }),
                    signal: AbortSignal.timeout(30000) // 30 second timeout
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error(`Backend error (${response.status}):`, errorText);
                    
                    if (response.status === 500) {
                        // Try local fallback first
                        throw new Error(`Backend server error (500). Please check your backend server.`);
                    }
                    
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                return data;
            } catch (error) {
                if (attempt === maxRetries) {
                    console.error(`❌ AI request failed after ${maxRetries + 1} attempts:`, error);
                    throw error;
                }
                
                // Wait before retrying (exponential backoff)
                await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
            }
        }
    };

    const streamResponse = async (text, messageId) => {
        setIsStreaming(true);
        setStreamingMessageId(messageId);

        const words = text.split(' ');
        let currentDisplayedText = '';

        for (let i = 0; i < words.length; i++) {
            if (!isStreaming) break;
            currentDisplayedText += (currentDisplayedText === '' ? '' : ' ') + words[i];
            
            setChat(prevChat => prevChat.map(msg =>
                msg.id === messageId ? { ...msg, text: currentDisplayedText } : msg
            ));
            
            await new Promise(resolve => setTimeout(resolve, 30));
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

    const toggleLike = (messageId) => {
    setMessageLikes(prev => {
        const updated = {
            ...prev,
            [messageId]: !prev[messageId]
        };

        // persist AFTER state update
        saveLikedMessages(updated);
        return updated;
    });
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

            const aiResponse = await callBackendAI(userMessage.text);
            const newAIMessage = {
                sender: "ai",
                text: aiResponse.answer || aiResponse.message || "Here's my analysis...",
                movies: aiResponse.movies || [],
                timestamp: new Date(),
                id: Date.now() + Math.random()
            };

            const finalChat = [...chatWithoutAIResponse, newAIMessage];
            setChat(finalChat);
            await streamResponse(newAIMessage.text, newAIMessage.id);
            
            await saveChatToHistory(finalChat);

        } catch (error) {
            console.error("❌ Regeneration error:", error);
            // ✅ FIXED: Better fallback response
            const fallbackResponses = [
                "I can help you analyze movies and TV shows! Based on your query, I'd recommend checking out IMDb or Rotten Tomatoes for detailed reviews and ratings.",
                "For character analysis, shows like Breaking Bad, The Sopranos, and Game of Thrones have excellent character development worth exploring.",
                "When comparing shows, consider factors like character depth, plot complexity, and audience reception across different streaming platforms.",
                "For recommendations, Netflix's algorithm is quite good, but also check out curated lists on Letterboxd or Trakt for community favorites."
            ];
            
            const fallbackResponse = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
            
            const fallbackMessage = {
                sender: "ai",
                text: fallbackResponse,
                movies: [],
                timestamp: new Date(),
                id: Date.now() + Math.random()
            };
            
            const finalChat = [...chat.slice(0, aiMessageIndex), fallbackMessage];
            setChat(finalChat);
            await streamResponse(fallbackMessage.text, fallbackMessage.id);
            
            await saveChatToHistory(finalChat);
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

        // Current chat
        chat.forEach(message => {
            if (messageLikes[message.id] && message.sender === "ai") {
                likedWithContent.push({
                    ...message,
                    sessionPreview: "Current conversation",
                    sessionTimestamp: message.timestamp
                });
            }
        });

        // History
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

        return likedWithContent.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    };

    const likedMessagesWithContent = getLikedMessagesWithContent();

    // ✅ FIXED: Improved sendMessage with better error handling and debouncing
    const sendMessage = async (customQuestion = null) => {
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
        setQuestion("");
        setLoading(true);

        try {
            // Try backend first
            const aiResponse = await callBackendAI(messageText);
            
            // ✅ FIX 1: Turn off loading state on success
            setLoading(false);
            
            const aiMessage = {
                sender: "ai",
                text: aiResponse.answer || aiResponse.message || "Thanks for your question! I'm analyzing it now...",
                movies: aiResponse.movies || [],
                timestamp: new Date(),
                id: Date.now() + Math.random()
            };

            const finalChat = [...newChat, aiMessage];
            setChat(finalChat);
            await streamResponse(aiMessage.text, aiMessage.id);
            
            await saveChatToHistory(finalChat);

        } catch (error) {
            console.error("❌ AI request failed, using fallback:", error);
            
            // ✅ FIX 1: Turn off loading state on error too
            setLoading(false);
            
            // ✅ FIXED: Better fallback responses
            const fallbackResponses = [
                "I can help you analyze movies and TV shows! Based on your query, I'd recommend checking out IMDb or Rotten Tomatoes for detailed reviews and ratings.",
                "For character analysis, shows like Breaking Bad, The Sopranos, and Game of Thrones have excellent character development worth exploring.",
                "When comparing shows, consider factors like character depth, plot complexity, and audience reception across different streaming platforms.",
                "For recommendations, Netflix's algorithm is quite good, but also check out curated lists on Letterboxd or Trakt for community favorites."
            ];
            
            const randomResponse = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
            
            const aiMessage = {
                sender: "ai",
                text: randomResponse,
                movies: [],
                timestamp: new Date(),
                id: Date.now() + Math.random()
            };

            const finalChat = [...newChat, aiMessage];
            setChat(finalChat);
            await streamResponse(aiMessage.text, aiMessage.id);
            
            await saveChatToHistory(finalChat);
            
            // Update connection status
            setConnectionStatus("error");
            setBackendStatus("offline");
        }
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
        if (!text) return null;

        const lines = text.split('\n');
        const formattedLines = [];
        const textColor = theme === 'dark' ? 'text-gray-200' : 'text-gray-800';

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

            // ✅ FIX 1: Bold + Italic headings (***Heading*** or **Heading**)
            if (/^\*{2,3}.+?\*{2,3}$/.test(trimmedLine)) {
                formattedLines.push(
                    <div key={i} className="font-bold italic my-3 text-lg">
                        {trimmedLine.replace(/\*/g, '')}
                    </div>
                );
                return;
            }

            // ✅ FIX 1: Detect subheadings like "Initial Characterization (Season 1)"
            if (/^[A-Z].+:\s*$/.test(trimmedLine) || /^[A-Z].+\(.*\)$/.test(trimmedLine)) {
                formattedLines.push(
                    <div key={i} className="font-bold italic my-2 text-base">
                        {trimmedLine}
                    </div>
                );
                return;
            }

            if (/^[🔸•-]/.test(trimmedLine)) {
                formattedLines.push(
                    <div key={i} className={`${textColor} my-2 ml-4 flex items-start`}>
                        <span className="mr-2 mt-1">•</span>
                        <span className="flex-1">{trimmedLine.replace(/^[🔸•-]\s*/, '')}</span>
                    </div>
                );
                return;
            }

            formattedLines.push(
                <div key={i} className={`${textColor} my-2`}>
                    {trimmedLine}
                </div>
            );
        });

        return formattedLines;
    };

    // Navigation handlers
    const handleNavigation = (tabId, path) => {
        setActiveTab(tabId);
        setMobileMenuOpen(false);
        
        if (path) {
            navigate(path);
        }
    };

    const handleCineCoolTVClick = () => {
        setActiveMobileView("chat");
        setShowHistory(false);
        setShowLiked(false);
        setMobileMenuOpen(false);
    };

    // ✅ FIX 1: Mobile Header with memo
    const MobileHeader = memo(() => (
        <div className={`lg:hidden fixed top-0 left-0 right-0 z-50 ${headerBg} p-4 shadow-lg`}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div 
                        className="relative cursor-pointer"
                        onClick={handleCineCoolTVClick}
                    >
                        <div className="p-2 bg-gradient-to-br from-purple-500 via-blue-500 to-cyan-500 rounded-2xl shadow-lg">
                            <Bot className="w-6 h-6 text-white" />
                        </div>
                    </div>
                    <div>
                        <div className="flex items-baseline gap-1">
                            <h1 
                                className="text-lg font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent cursor-pointer"
                                onClick={handleCineCoolTVClick}
                            >
                                CineCoolAI
                            </h1>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-500/20">
                                <div className={`w-2 h-2 rounded-full ${
                                    connectionStatus === 'connected'
                                        ? 'bg-green-500'
                                        : connectionStatus === 'error'
                                            ? 'bg-red-500'
                                            : 'bg-yellow-500 animate-pulse'
                                }`} />
                                <span className="text-green-400">AI Assistant</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="flex items-center gap-2">
                    {chat.length > 0 && (
                        <button
                            onClick={startNewChat}
                            className={`w-10 h-10 flex items-center justify-center rounded-xl ${
                                theme === 'dark'
                                    ? 'bg-green-500/20 hover:bg-green-500/30 text-green-400'
                                    : 'bg-green-500/20 hover:bg-green-500/30 text-green-600'
                            }`}
                            title="New Chat"
                        >
                            <Plus className="w-5 h-5" />
                        </button>
                    )}
                    
                    {/* ✅ FIX 2: Theme toggle button */}
                    <button
                        onClick={toggleTheme}
                        className={`w-10 h-10 flex items-center justify-center rounded-xl ${
                            theme === 'dark'
                                ? 'bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400'
                                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                        }`}
                        title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                    >
                        {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                    </button>

                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className={`w-10 h-10 flex items-center justify-center rounded-xl ${
                            theme === 'dark'
                                ? 'bg-gray-700/50 hover:bg-gray-700 text-gray-300'
                                : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                        }`}
                    >
                        <Menu className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    ));

    // ✅ FIX 1 & 2: Enhanced Mobile Navigation Menu without AI Chat tab and no duplicate theme toggle
    // ✅ FIX 3: Removed Tips tab completely
    const MobileNavigationMenu = memo(() => (
        <div 
            ref={mobileMenuRef}
            className={`lg:hidden fixed inset-0 z-50 transition-transform duration-300 ${
                mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
        >
            <div 
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={() => setMobileMenuOpen(false)}
            />
            
            <div className={`absolute left-0 top-0 bottom-0 w-80 ${sidebarBg} rounded-r-3xl overflow-hidden`}>
                <div className="p-6 h-full flex flex-col">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl">
                                <Bot className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                                    CineCoolTV
                                </h1>
                                <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Your Entertainment Hub</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setMobileMenuOpen(false)}
                            className={`w-10 h-10 flex items-center justify-center rounded-xl ${
                                theme === 'dark'
                                    ? 'bg-gray-700/50 hover:bg-gray-700 text-gray-300'
                                    : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                            }`}
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-3">
                        {/* ✅ FIX 1: Navigation tabs without AI Chat */}
                        {navigationTabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => handleNavigation(tab.id, tab.path)}
                                className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${
                                    theme === 'dark'
                                        ? 'bg-gray-700/30 hover:bg-gray-700/50 text-gray-300 hover:text-white'
                                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-900'
                                }`}
                            >
                                <div className={`p-2 rounded-xl ${
                                    theme === 'dark' ? 'bg-gray-600/50' : 'bg-gray-300'
                                }`}>
                                    <tab.icon className="w-5 h-5" />
                                </div>
                                <span className="font-semibold text-base">{tab.label}</span>
                            </button>
                        ))}

                        <div className={`my-6 border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-300'}`}></div>

                        <div className="space-y-3">
                            <div className={`px-3 py-2 rounded-xl ${
                                theme === 'dark' ? 'bg-purple-500/10' : 'bg-purple-500/10'
                            }`}>
                                <p className={`text-xs font-semibold ${theme === 'dark' ? 'text-purple-400' : 'text-purple-600'}`}>AI CHAT FEATURES</p>
                            </div>

                            <button
                                onClick={() => {
                                    setActiveMobileView("chat");
                                    setShowHistory(false);
                                    setShowLiked(false);
                                    setMobileMenuOpen(false);
                                }}
                                className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${
                                    activeMobileView === "chat" 
                                        ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white' 
                                        : theme === 'dark'
                                            ? 'bg-gray-700/30 hover:bg-gray-700/50 text-gray-300'
                                            : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                }`}
                            >
                                <div className={`p-2 rounded-xl ${
                                    activeMobileView === "chat" 
                                        ? 'bg-white/20' 
                                        : theme === 'dark'
                                            ? 'bg-gray-600/50'
                                            : 'bg-gray-300'
                                }`}>
                                    <Bot className="w-5 h-5" />
                                </div>
                                <span className="font-semibold text-base">New Chat</span>
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
                                        className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${
                                            activeMobileView === "history" 
                                                ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white' 
                                                : theme === 'dark'
                                                    ? 'bg-gray-700/30 hover:bg-gray-700/50 text-gray-300'
                                                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                        }`}
                                    >
                                        <div className={`p-2 rounded-xl ${
                                            activeMobileView === "history" 
                                                ? 'bg-white/20' 
                                                : theme === 'dark'
                                                    ? 'bg-gray-600/50'
                                                    : 'bg-gray-300'
                                        }`}>
                                            <History className="w-5 h-5" />
                                        </div>
                                        <span className="font-semibold text-base">History</span>
                                        {chatHistory.length > 0 && (
                                            <span className={`ml-auto text-xs px-2 py-1 rounded-full ${
                                                theme === 'dark'
                                                    ? 'bg-gray-600 text-gray-300'
                                                    : 'bg-gray-300 text-gray-700'
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
                                        className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${
                                            activeMobileView === "liked" 
                                                ? 'bg-gradient-to-r from-yellow-600 to-orange-600 text-white' 
                                                : theme === 'dark'
                                                    ? 'bg-gray-700/30 hover:bg-gray-700/50 text-gray-300'
                                                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                        }`}
                                    >
                                        <div className={`p-2 rounded-xl ${
                                            activeMobileView === "liked" 
                                                ? 'bg-white/20' 
                                                : theme === 'dark'
                                                    ? 'bg-gray-600/50'
                                                    : 'bg-gray-300'
                                        }`}>
                                            <Star className="w-5 h-5" />
                                        </div>
                                        <span className="font-semibold text-base">Liked</span>
                                        {likedMessagesWithContent.length > 0 && (
                                            <span className={`ml-auto text-xs px-2 py-1 rounded-full ${
                                                theme === 'dark'
                                                    ? 'bg-gray-600 text-gray-300'
                                                    : 'bg-gray-300 text-gray-700'
                                            }`}>
                                                {likedMessagesWithContent.length}
                                            </span>
                                        )}
                                    </button>
                                </>
                            )}

                            {/* ✅ FIX 3: REMOVED Tips button entirely */}
                        </div>
                    </div>

                    <div className={`pt-6 border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-300'}`}>
                        <div className={`text-center text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                            <p className="font-semibold">CineCoolAI Assistant</p>
                            <p className="mt-1 text-xs">Your AI Film & TV Expert</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    ));

    // ✅ FIX 1: Enhanced Mobile Welcome Header with memo
    const MobileWelcomeHeader = memo(() => (
        <div className="text-center py-8 px-4">
            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center shadow-2xl">
                <Bot className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'">
                CineCoolAI
            </h3>
            <p className="mb-6 text-sm leading-relaxed max-w-md mx-auto ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600">
                Your AI film & TV analyst. Ask about characters, shows, or get recommendations.
            </p>
        </div>
    ));

    const MobileInputArea = memo(() => (
        <div className={`lg:hidden fixed bottom-0 left-0 right-0 z-40 p-4 ${
            theme === 'dark'
                ? 'bg-gray-800/95 backdrop-blur-lg border-t border-gray-700'
                : 'bg-white/95 backdrop-blur-lg border-t border-gray-200'
        }`}>
            <div className="flex items-center gap-3">
                <IsolatedTextarea
                textareaRef={mobileTextareaRef}
                value={question}
                onChange={handleQuestionChange}
                onKeyDown={handleKey}
                placeholder="Ask about movies or shows..."
                theme={theme}

                />
                    
                {/* MIC BUTTON */}
                <button
                    onClick={toggleVoiceInput}
                    className={`w-[48px] h-[48px] flex items-center justify-center rounded-2xl shadow-lg ${
                        isListening
                            ? "bg-red-500 text-white animate-pulse"
                            : theme === 'dark'
                                ? "bg-gray-600 text-gray-300 hover:bg-gray-500"
                                : "bg-gray-300 text-gray-700 hover:bg-gray-400"
                    }`}
                >
                    {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>

                {/* SEND BUTTON */}
                <button
                    onClick={() => sendMessage()}
                    disabled={loading || !question.trim()}
                    className="w-[48px] h-[48px] rounded-2xl bg-gradient-to-r from-purple-500 to-blue-500 
                            hover:from-purple-600 hover:to-blue-600 disabled:from-gray-400 disabled:to-gray-500 
                            text-white flex items-center justify-center"
                >
                    {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <Send className="w-5 h-5" />
                    )}
                </button>
            </div>
        </div>
    ));

    // ✅ FIX 1: Enhanced Mobile Chat Message with memo
    const MobileChatMessage = memo(({ msg, index }) => (
        <div
            key={index}
            className={`flex grows="1"ap-3 ${msg.sender === "user" ? "flex-row-reverse" : "flex-row"} items-start p-4`}
        >
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                msg.sender === "user"
                    ? "bg-gradient-to-br from-blue-500 to-blue-600"
                    : "bg-gradient-to-br from-purple-500 to-blue-500"
            }`}>
                {msg.sender === "user" ? (
                    <User className="w-4 h-4 text-white" />
                ) : (
                    <Bot className="w-4 h-4 text-white" />
                )}
            </div>

            <div className={`flex-1 ${msg.sender === "user" ? "text-right" : "text-left"}`}>
                <div className={`inline-block p-4 rounded-2xl ${
                    msg.sender === "user"
                        ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white"
                        : theme === 'dark'
                            ? "bg-gray-800/70 border border-gray-700"
                            : "bg-white border border-gray-200 shadow-sm"
                }`}>
                    {msg.sender === "user" ? (
                        <div>
                            <div className="text-white text-base">{msg.text}</div>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div className={`text-base ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>
                                {renderText(msg.text)}
                            </div>

                            <div className={`flex flex-wrap gap-2 justify-between items-center mt-3 pt-3 border-t ${
                                theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                            }`}>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => regenerateResponse(msg.id)}
                                        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium ${
                                            theme === 'dark'
                                                ? 'bg-gray-600/70 hover:bg-gray-600 text-gray-200'
                                                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                        }`}
                                        disabled={loading}
                                    >
                                        <RefreshCw className="w-4 h-4" />
                                        Regenerate
                                    </button>
                                    <button
                                        onClick={() => toggleLike(msg.id)}
                                        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium ${
                                            messageLikes[msg.id]
                                                ? 'bg-yellow-500/20 text-yellow-600'
                                                : theme === 'dark'
                                                    ? 'bg-gray-600/70 hover:bg-gray-600 text-gray-200'
                                                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                        }`}
                                    >
                                        <ThumbsUp className={`w-4 h-4 ${messageLikes[msg.id] ? 'fill-current' : ''}`} />
                                        {messageLikes[msg.id] ? 'Liked' : 'Like'}
                                    </button>
                                </div>
                                <button
                                    onClick={() => copyToClipboard(msg.text, msg.id)}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium ${
                                        theme === 'dark'
                                            ? 'bg-gray-600/70 hover:bg-gray-600 text-gray-200'
                                            : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                    }`}
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
                <div className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                    {formatTimestamp(msg.timestamp)}
                </div>
            </div>
        </div>
    ));

    // ✅ FIX 1: Enhanced Mobile Welcome Screen with memo
    const MobileWelcomeScreen = memo(() => (
        <div className="text-center">
            <MobileWelcomeHeader />

            <div className="grid grid-cols-1 gap-3 mb-8 px-4">
                {suggestions.slice(0, 4).map((suggestion, index) => (
                    <button
                        key={index}
                        onClick={() => setQuestion(suggestion)}
                        className={`p-4 text-left rounded-2xl group ${
                            theme === 'dark'
                                ? 'bg-gray-700/40 hover:bg-gray-700/60'
                                : 'bg-white/70 hover:bg-white shadow-sm'
                        }`}
                    >
                        <div className="flex items-center gap-3">
                            <Sparkles className="w-5 h-5 text-purple-400" />
                            <span className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>
                                {suggestion}
                            </span>
                        </div>
                    </button>
                ))}
            </div>

            <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-4 mx-4">
                <div className="flex items-center gap-2 text-blue-400 mb-2 justify-center">
                    <Zap className="w-5 h-5" />
                    <span className="text-sm font-semibold">AI Powered</span>
                </div>
                <p className="text-xs text-blue-300">
                    Character analysis • Show recommendations • Movie insights
                </p>
            </div>
        </div>
    ));

    const MobileSidebarView = memo(() => {
        if (activeMobileView === "chat") return null;

        const renderContent = () => {
            switch (activeMobileView) {
                case "history":
                    return (
                        <div className="h-full flex flex-col">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className={`font-semibold flex items-center gap-2 ${
                                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                                }`}>
                                    <History className="w-5 h-5" />
                                    Chat History
                                </h3>
                                {chatHistory.length > 0 && (
                                    <button
                                        onClick={clearAllHistory}
                                        className={`p-2 rounded-xl hover:bg-red-500/20 ${
                                            theme === 'dark' ? 'text-red-500' : 'text-red-600'
                                        }`}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                            
                            {chatHistory.length > 0 && (
                                <div className="relative mb-4">
                                    <SearchIcon className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
                                        theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                                    }`} />
                                    <input
                                        type="text"
                                        placeholder="Search conversations..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className={`w-full pl-10 pr-4 py-2 rounded-xl ${
                                            theme === 'dark'
                                                ? 'bg-gray-700/50 border border-gray-600 text-white placeholder-gray-400'
                                                : 'bg-gray-100 border border-gray-300 text-gray-900 placeholder-gray-500'
                                        } focus:outline-none focus:border-purple-500`}
                                    />
                                    {searchTerm && (
                                        <button
                                            onClick={() => setSearchTerm('')}
                                            className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${
                                                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                                            }`}
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            )}

                            <div className="flex-1 overflow-y-auto">
                                {filteredHistory.length === 0 ? (
                                    <div className={`text-center py-8 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                        <History className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                        <p className="text-sm">No chat history yet</p>
                                        <p className="text-xs mt-1">Start a conversation!</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {filteredHistory.map((session) => (
                                            // ✅ FIX 4: Improved History Card UI
                                            <div
                                                key={session.id}
                                                className="pointer-events-none"
                                                className={`p-4 rounded-2xl transition cursor-pointer shadow-sm
                                                    ${theme === 'dark'
                                                        ? 'bg-gray-800/50 hover:bg-gray-700/60 border border-gray-700'
                                                        : 'bg-white hover:bg-gray-100 border border-gray-200'}`}
                                                onClick={() => loadHistorySession(session)}
                                            >
                                                <div className="flex justify-between items-start">
                                                    <div className="flex-1">
                                                        <p className={`font-semibold text-sm line-clamp-2 mb-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                                            {session.preview}
                                                        </p>
                                                        <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                                            {formatDate(session.timestamp)} • {session.messages.length} messages
                                                        </p>
                                                    </div>

                                                    <button
                                                    className="ml-3 p-2 rounded-lg hover:bg-red-500/20 pointer-events-auto"
                                                    onClick={(e) => { 
                                                        e.stopPropagation(); 
                                                        deleteHistorySession(session.id); 
                                                        }}
                                                        >
                                                        <Trash2 className={`w-4 h-4 ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`} />
                                                        </button>
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
                                <h3 className={`font-semibold flex items-center gap-2 ${
                                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                                }`}>
                                    <Star className="w-5 h-5" />
                                    Liked Responses
                                </h3>
                                {likedMessagesWithContent.length > 0 && (
                                    <button
                                        onClick={clearAllLikes}
                                        className={`p-2 rounded-xl hover:bg-red-500/20 ${
                                            theme === 'dark' ? 'text-red-500' : 'text-red-600'
                                        }`}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                            <div className="flex-1 overflow-y-auto">
                                {likedMessagesWithContent.length === 0 ? (
                                    <div className={`text-center py-8 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                        <Star className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                        <p className="text-sm">No liked responses yet</p>
                                        <p className="text-xs mt-1">Like AI responses to save them here</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {likedMessagesWithContent.map((message) => (
                                            // ✅ FIX 4: Improved Liked Card UI
                                            <div
                                                key={message.id}
                                                className={`p-4 rounded-2xl cursor-pointer shadow-sm relative
                                                    ${theme === 'dark'
                                                        ? 'bg-gray-800/50 border border-gray-700 hover:bg-gray-700/60'
                                                        : 'bg-white border border-gray-200 hover:bg-gray-100'}`}
                                                onClick={() => loadLikedMessage(message.id)}
                                            >
                                                <p className={`font-medium text-sm line-clamp-3 mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                                    {message.text}
                                                </p>

                                                <div className="flex justify-between items-center">
                                                    <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                                        {formatDate(message.timestamp)}
                                                    </p>
                                                    <Star className="w-4 h-4 text-yellow-500" />
                                                </div>

                                                {/* ✅ FIX 2: Improved delete button with proper event stopping */}
                                                <button
                                                    onClick={(e) => { 
                                                        e.stopPropagation(); 
                                                        deleteLikedMessage(message.id); 
                                                    }}
                                                    className="absolute top-3 right-3 p-2 rounded-lg hover:bg-red-500/20"
                                                >
                                                    <Trash2 className={`w-4 h-4 ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    );

                // ✅ FIX 3: Removed Tips case entirely
                default:
                    return null;
            }
        };

        return (
            <div className="lg:hidden fixed inset-0 z-40 pt-16 pb-32">
                <div className={`h-full rounded-t-3xl overflow-hidden ${
                    theme === 'dark' ? 'bg-gray-800/95' : 'bg-white/95'
                }`}>
                    <div className="p-6 h-full overflow-y-auto">
                        {renderContent()}
                    </div>
                </div>
            </div>
        );
    });

    // ✅ FIX 1: Main Mobile Chat Interface with memo
    const MobileChatInterface = memo(() => (
        <div className="lg:hidden flex-1 flex flex-col pb-32 pt-16">
            <div className="flex-1 overflow-y-auto">
                {chat.length === 0 ? (
                    <MobileWelcomeScreen />
                ) : (
                    chat.map((msg, index) => (
                        <MobileChatMessage key={index} msg={msg} index={index} />
                    ))
                )}

                {loading && (
                    <div className="flex gap-4 p-4 items-start">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
                            <Bot className="w-4 h-4 text-white" />
                        </div>
                        <div className={`rounded-2xl p-4 flex-1 ${
                            theme === 'dark' ? 'bg-gray-700/60' : 'bg-gray-100'
                        }`}>
                            <div className="flex items-center gap-3">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span className={`text-sm font-medium ${
                                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                                }`}>Thinking...</span>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={chatEndRef} />
            </div>
        </div>
    ));

    const DesktopInputArea = memo(() => (
        <div className={`hidden lg:block mt-4 p-4 rounded-2xl ${
            theme === 'dark'
                ? 'bg-gray-800/30 border border-gray-700/50'
                : 'bg-white/50 border border-gray-200'
        }`}>
            <div className="w-full flex items-center gap-3">
                <div className="flex-1 relative">
                    <textarea
                        ref={desktopTextareaRef} // ✅ FIX 1: Separate desktop ref
                        rows="1"
                        className={`w-full rounded-xl resize-none focus:outline-none focus:border-purple-500 px-4 py-3 pr-20 ${
                            theme === 'dark'
                                ? 'bg-gray-700/50 border border-gray-600/50 text-white placeholder-gray-400'
                                : 'bg-white border border-gray-300 text-gray-900 placeholder-gray-500'
                        }`}
                        placeholder="Ask about character analysis, show comparisons, or genre insights..."
                        value={question}
                        onChange={handleQuestionChange}
                        onKeyDown={handleKey}
                        style={{ minHeight: '48px', maxHeight: '120px' }}
                    />
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                        {/* ✅ FIX 3: Clean mic icon without grey box */}
                        <button
                            onClick={toggleVoiceInput}
                            className="p-2 text-gray-700 hover:text-purple-600 transition font-bold bg-transparent"
                        >
                            {isListening ? (
                                <MicOff className="w-5 h-5 text-red-500" />
                            ) : (
                                <Mic className="w-5 h-5" />
                            )}
                        </button>
                    </div>
                </div>
                <button
                    onClick={() => sendMessage()}
                    disabled={loading || !question.trim()}
                    className="w-[48px] h-[48px] rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 disabled:from-gray-400 disabled:to-gray-500 text-white flex items-center justify-center disabled:cursor-not-allowed"
                >
                    {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <Send className="w-4 h-4" />
                    )}
                </button>
            </div>
        </div>
    ));

    const DesktopChatMessage = memo(({ msg, index }) => (
        <div
            key={index}
            className={`flex gap-4 ${msg.sender === "user" ? "flex-row-reverse" : "flex-row"} items-start p-6`}
        >
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                msg.sender === "user"
                    ? "bg-gradient-to-br from-blue-500 to-blue-600"
                    : "bg-gradient-to-br from-purple-500 to-blue-500"
            }`}>
                {msg.sender === "user" ? (
                    <User className="w-4 h-4 text-white" />
                ) : (
                    <Bot className="w-4 h-4 text-white" />
                )}
            </div>

            <div className={`flex-1 ${msg.sender === "user" ? "text-right" : "text-left"} max-w-[80%]`}>
                <div className={`inline-block p-5 rounded-2xl ${
                    msg.sender === "user"
                        ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white"
                        : theme === 'dark'
                            ? "bg-gray-800/70 border border-gray-700"
                            : "bg-white border border-gray-200 shadow-sm"
                }`}>
                    {msg.sender === "user" ? (
                        <div className="space-y-3">
                            <div className="text-white text-base">{msg.text}</div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {renderText(msg.text)}

                            <div className={`flex justify-between items-center mt-4 pt-3 border-t ${
                                theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                            }`}>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => regenerateResponse(msg.id)}
                                        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium ${
                                            theme === 'dark'
                                                ? 'bg-gray-600/70 hover:bg-gray-600 text-gray-200'
                                                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                        }`}
                                        disabled={loading}
                                    >
                                        <RefreshCw className="w-4 h-4" />
                                        Regenerate
                                    </button>
                                    <button
                                        onClick={() => toggleLike(msg.id)}
                                        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium ${
                                            messageLikes[msg.id]
                                                ? 'bg-yellow-500/20 text-yellow-600'
                                                : theme === 'dark'
                                                    ? 'bg-gray-600/70 hover:bg-gray-600 text-gray-200'
                                                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                        }`}
                                    >
                                        <ThumbsUp className={`w-4 h-4 ${messageLikes[msg.id] ? 'fill-current' : ''}`} />
                                        {messageLikes[msg.id] ? 'Liked' : 'Like'}
                                    </button>
                                </div>
                                <button
                                    onClick={() => copyToClipboard(msg.text, msg.id)}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium ${
                                        theme === 'dark'
                                            ? 'bg-gray-600/70 hover:bg-gray-600 text-gray-200'
                                            : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                    }`}
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
                <div className={`text-xs mt-2 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                    {formatTimestamp(msg.timestamp)}
                </div>
            </div>
        </div>
    ));

    const IsolatedTextarea = memo(function IsolatedTextarea({
        textareaRef,
        value,
        onChange,
        onKeyDown,
        placeholder,
        theme
    }) {
    return (
        <textarea
            ref={textareaRef}
            rows="1"
            className={`flex-1 rounded-2xl resize-none px-4 py-3 focus:outline-none text-base ${
                theme === 'dark'
                    ? "bg-gray-700/80 border border-gray-600 text-white placeholder-gray-400"
                    : "bg-white border border-gray-300 text-gray-900 placeholder-gray-500"
            }`}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            onKeyDown={onKeyDown}
            style={{ minHeight: "48px", maxHeight: "120px" }}
        />
    );
});


    return (
        <div className={`flex flex-col min-h-screen ${bgGradient} text-gray-100`}>
            {/* Mobile Header */}
            <MobileHeader />

            {/* Mobile Navigation Menu */}
            <MobileNavigationMenu />

            <div className={`hidden lg:block ${headerBg} p-3 sticky top-0 z-30`}>
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div 
                                className="p-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl cursor-pointer"
                                onClick={handleCineCoolTVClick}
                            >
                                <Bot className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h1 
                                    className="text-lg font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent cursor-pointer"
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
                                <span className="text-xs text-gray-400">
                                    {connectionStatus === 'connected' ? 'Connected' : 
                                     connectionStatus === 'error' ? 'Backend Offline' : 'Connecting...'}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {chat.length > 0 && (
                                <button
                                    onClick={() => exportConversation('txt')}
                                    className={`flex items-center gap-2 px-3 py-1 rounded-lg text-sm ${
                                        theme === 'dark'
                                            ? 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-400'
                                            : 'bg-blue-100 hover:bg-blue-200 text-blue-600'
                                    }`}
                                >
                                    <Download className="w-4 h-4" />
                                    <span>Export</span>
                                </button>
                            )}
                            <button
                                onClick={startNewChat}
                                className={`flex items-center gap-2 px-3 py-1 rounded-lg text-sm ${
                                    theme === 'dark'
                                        ? 'bg-green-500/20 hover:bg-green-500/30 text-green-400'
                                        : 'bg-green-100 hover:bg-green-200 text-green-600'
                                }`}
                            >
                                <Plus className="w-4 h-4" />
                                <span>New Chat</span>
                            </button>
                            {currentUser && (
                                <>
                                    <button
                                        onClick={async () => {
                                            setShowLiked(!showLiked);
                                            setShowHistory(false);
                                            if (!showLiked) {
                                                await loadLikedMessages();
                                            }
                                        }}
                                        className={`flex items-center gap-2 px-3 py-1 rounded-lg text-sm ${
                                            showLiked
                                                ? 'bg-yellow-500/30 text-yellow-600'
                                                : theme === 'dark'
                                                    ? 'bg-gray-700/50 hover:bg-gray-700 text-gray-300'
                                                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                                        }`}
                                    >
                                        <Star className="w-4 h-4" />
                                        <span>Liked ({likedMessagesWithContent.length})</span>
                                    </button>
                                    <button
                                        onClick={async () => {
                                            setShowHistory(!showHistory);
                                            setShowLiked(false);
                                            if (!showHistory) {
                                                await loadChatHistory();
                                            }
                                        }}
                                        className={`flex items-center gap-2 px-3 py-1 rounded-lg text-sm ${
                                            showHistory
                                                ? 'bg-purple-500/30 text-purple-400'
                                                : theme === 'dark'
                                                    ? 'bg-gray-700/50 hover:bg-gray-700 text-gray-300'
                                                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                                        }`}
                                    >
                                        <History className="w-4 h-4" />
                                        <span>History ({chatHistory.length})</span>
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex max-w-7xl mx-auto w-full p-4 gap-6 mt-16 lg:mt-2">
        
                {(currentUser && (showHistory || showLiked)) && (
                    <div className={`w-80 hidden lg:block ${sidebarBg} rounded-2xl p-4 overflow-y-auto`}>
                        {showHistory ? (
                            <div className="h-full flex flex-col">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className={`font-semibold flex items-center gap-2 ${
                                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                                    }`}>
                                        <History className="w-5 h-5" />
                                        Chat History ({chatHistory.length})
                                    </h3>
                                    {chatHistory.length > 0 && (
                                        <button
                                            onClick={clearAllHistory}
                                            className={`p-1 rounded hover:bg-red-500/20 ${
                                                theme === 'dark' ? 'text-red-500' : 'text-red-600'
                                            }`}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>

                                {chatHistory.length > 0 && (
                                    <div className="relative mb-4">
                                        <SearchIcon className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
                                            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                                        }`} />
                                        <input
                                            type="text"
                                            placeholder="Search conversations..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className={`w-full pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:border-purple-500 ${
                                                theme === 'dark'
                                                    ? 'bg-gray-700/50 border border-gray-600 text-white placeholder-gray-400'
                                                    : 'bg-gray-100 border border-gray-300 text-gray-900 placeholder-gray-500'
                                            }`}
                                        />
                                        {searchTerm && (
                                            <button
                                                onClick={() => setSearchTerm('')}
                                                className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${
                                                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                                                }`}
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                )}

                                <div className="flex-1 overflow-y-auto">
                                    {filteredHistory.length === 0 ? (
                                        <div className={`text-center py-8 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                            <History className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                            <p className="text-sm">No chat history yet</p>
                                            <p className="text-xs mt-1">Start a conversation!</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {filteredHistory.map((session) => (
                                                
                                                <div
                                                    key={session.id}
                                                    className={`p-3 rounded-xl cursor-pointer shadow-sm
                                                        ${theme === 'dark'
                                                            ? 'bg-gray-800/50 hover:bg-gray-700/60 border border-gray-700'
                                                            : 'bg-white hover:bg-gray-100 border border-gray-300'}`}
                                                    onClick={() => loadHistorySession(session)}
                                                >
                                                    <div className="flex justify-between items-start">
                                                        <div className="flex-1">
                                                            <p className={`font-semibold text-sm line-clamp-2 mb-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                                                {session.preview}
                                                            </p>
                                                            <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                                                {formatDate(session.timestamp)} • {session.messages.length} messages
                                                            </p>
                                                        </div>

                                                        {/* ✅ FIX 2: Improved delete button with proper event stopping */}
                                                        <button
                                                            onClick={(e) => { 
                                                                e.stopPropagation(); 
                                                                deleteHistorySession(session.id); 
                                                            }}
                                                            className="ml-2 p-1 rounded hover:bg-red-500/20"
                                                        >
                                                            <Trash2 className={`w-3 h-3 ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className={`font-semibold flex items-center gap-2 ${
                                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                                    }`}>
                                        <Star className="w-5 h-5" />
                                        Liked Responses ({likedMessagesWithContent.length})
                                    </h3>
                                    {likedMessagesWithContent.length > 0 && (
                                        <button
                                            onClick={clearAllLikes}
                                            className={`p-1 rounded hover:bg-red-500/20 ${
                                                theme === 'dark' ? 'text-red-500' : 'text-red-600'
                                            }`}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>

                                <div className="flex-1 overflow-y-auto">
                                    {likedMessagesWithContent.length === 0 ? (
                                        <div className={`text-center py-8 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                            <Star className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                            <p className="text-sm">No liked responses yet</p>
                                            <p className="text-xs mt-1">Like AI responses to save them here</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {likedMessagesWithContent.map((message) => (
                                           
                                                <div
                                                    key={message.id}
                                                    className={`p-3 rounded-xl cursor-pointer shadow-sm relative
                                                        ${theme === 'dark'
                                                            ? 'bg-gray-800/50 border border-gray-700 hover:bg-gray-700/60'
                                                            : 'bg-white border border-gray-300 hover:bg-gray-100'}`}
                                                    onClick={() => loadLikedMessage(message.id)}
                                                >
                                                    <p className={`font-medium text-sm line-clamp-2 mb-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                                        {message.text.substring(0, 80)}...
                                                    </p>

                                                    <div className="flex justify-between items-center">
                                                        <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                                            {formatDate(message.timestamp)}
                                                        </p>
                                                        <Star className="w-3 h-3 text-yellow-500" />
                                                    </div>

                                                    {/* ✅ FIX 2: Improved delete button with proper event stopping */}
                                                    <button
                                                        onClick={(e) => { 
                                                            e.stopPropagation(); 
                                                            deleteLikedMessage(message.id); 
                                                        }}
                                                        className="absolute top-2 right-2 p-1 rounded hover:bg-red-500/20"
                                                    >
                                                        <Trash2 className={`w-3 h-3 ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`} />
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
                <div className={`hidden lg:flex flex-1 flex-col max-w-4xl mx-auto px-6 py-6 
                    backdrop-blur-xl rounded-3xl shadow-2xl border ${
                    theme === 'dark'
                        ? 'bg-gradient-to-b from-gray-900/40 to-gray-800/20 border-gray-700/40'
                        : 'bg-gradient-to-b from-white/80 to-gray-50/60 border-gray-300'
                } ${
                    (currentUser && (showHistory || showLiked)) ? 'lg:max-w-[calc(100%-320px)]' : 'max-w-full'
                }`}>
                    <div className="flex-1 overflow-y-auto">
                        {chat.length === 0 ? (
                            <div className="text-center py-16">
                                <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center shadow-2xl">
                                    <Bot className="w-10 h-10 text-white" />
                                </div>
                                <h3 className={`text-2xl font-bold mb-3 ${
                                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                                }`}>
                                    CineCoolAI Assistant
                                </h3>
                                <p className={`mb-8 text-lg max-w-2xl mx-auto ${
                                theme === 'dark' ? 'text-gray-400' : 'text-gray-700'
                                }`}>
                                    Your AI-powered film and television analyst. I specialize in deep character analysis, show comparisons, and storytelling insights.
                                </p>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto mb-8">
                                    {suggestions.map((suggestion, index) => (
                                        <button
                                            key={index}
                                            onClick={() => setQuestion(suggestion)}
                                            className={`p-4 text-left rounded-xl group ${
                                                theme === 'dark'
                                                    ? 'bg-gray-700/40 hover:bg-gray-700/60'
                                                    : 'bg-white hover:bg-gray-50 border border-gray-200'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <Sparkles className="w-5 h-5 text-purple-400" />
                                                <span className={`text-sm font-medium ${
                                                    theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
                                                }`}>
                                                    {suggestion}
                                                </span>
                                            </div>
                                        </button>
                                    ))}
                                </div>

                                {connectionStatus === "error" && (
                                    <div className={`border rounded-xl p-6 max-w-md mx-auto mb-6 ${
                                        theme === 'dark'
                                            ? 'bg-red-500/10 border-red-500/30'
                                            : 'bg-red-50 border-red-200'
                                    }`}>
                                        <div className="flex items-center gap-2 mb-2 justify-center">
                                            <span className={`text-lg font-semibold ${
                                                theme === 'dark' ? 'text-red-400' : 'text-red-600'
                                            }`}>⚠️ Backend Offline</span>
                                        </div>
                                        <p className={`text-sm text-center ${
                                            theme === 'dark' ? 'text-red-300' : 'text-red-500'
                                        }`}>
                                            AI backend is currently unavailable. Using enhanced fallback responses.
                                        </p>
                                        <button
                                            onClick={checkBackendConnection}
                                            className={`mt-3 px-4 py-2 rounded-lg text-sm mx-auto block ${
                                                theme === 'dark'
                                                    ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400'
                                                    : 'bg-red-100 hover:bg-red-200 text-red-600'
                                            }`}
                                        >
                                            Retry Connection
                                        </button>
                                    </div>
                                )}

                                <div className={`border rounded-xl p-6 max-w-md mx-auto ${
                                    theme === 'dark'
                                        ? 'bg-blue-500/10 border-blue-500/30'
                                        : 'bg-blue-50 border-blue-200'
                                }`}>
                                    <div className="flex items-center gap-2 text-blue-400 mb-2 justify-center">
                                        <Zap className="w-5 h-5" />
                                        <span className="text-lg font-semibold">Powered by AI</span>
                                    </div>
                                    <p className={`text-sm ${
                                        theme === 'dark' ? 'text-blue-300' : 'text-blue-600'
                                    }`}>
                                        Character analysis • Show recommendations • Movie insights
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
                                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
                                    <Bot className="w-4 h-4 text-white" />
                                </div>
                                <div className={`rounded-2xl p-5 flex-1 backdrop-blur-xl ${
                                    theme === 'dark' ? 'bg-gray-700/60' : 'bg-gray-100'
                                }`}>
                                    <div className="flex items-center gap-3">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span className={`text-sm font-medium ${
                                            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                                        }`}>CineCoolAI is thinking...</span>
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

export default memo(AiChatTab);