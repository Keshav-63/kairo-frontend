// kairo-frontend/src/pages/QueryAI.jsx

"use client";

import React, { useState, useRef, useEffect, useMemo } from "react"; // Import React
import toast from "react-hot-toast";
import { ParticleCard } from "../components/ParticleCard";
import { gsap } from "gsap";
import {
  pipelineApi,
  createChatSession,
  getUserChats,
  getChatHistory,
  generateChatTitle,
} from "../api/axios";
import useAuthStore from "../stores/authStore";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight"; // You might need to install this: npm install rehype-highlight

// --- START MAGIC BENTO EFFECTS UTILITY CODE ---
// (Keep your existing Magic Bento code here - it's omitted for brevity)
const DEFAULT_SPOTLIGHT_RADIUS = 300;
const DEFAULT_GLOW_COLOR = '132, 0, 255'; // Keep default defined outside
const MOBILE_BREAKPOINT = 768;

const calculateSpotlightValues = radius => ({
  proximity: radius * 0.5,
  fadeDistance: radius * 0.75
});

const updateCardGlowProperties = (card, mouseX, mouseY, glow, radius) => {
  if (!card) return; // Add null check for card
  const rect = card.getBoundingClientRect();
  const relativeX = ((mouseX - rect.left) / rect.width) * 100;
  const relativeY = ((mouseY - rect.top) / rect.height) * 100;

  card.style.setProperty('--glow-x', `${relativeX}%`);
  card.style.setProperty('--glow-y', `${relativeY}%`);
  card.style.setProperty('--glow-intensity', glow.toString());
  card.style.setProperty('--glow-radius', `${radius}px`);
};


const useMobileDetection = () => {
  // Ensure useState is always called
  const [isMobile, setIsMobile] = useState(false);

  // Ensure useEffect is always called
  useEffect(() => {
    // Check if window is defined (for server-side rendering safety, though less likely with "use client")
    if (typeof window === 'undefined') return;

    const checkMobile = () => setIsMobile(window.innerWidth <= MOBILE_BREAKPOINT);
    checkMobile(); // Initial check
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile); // Cleanup listener
  }, []); // Empty dependency array ensures this runs once on mount and cleans up on unmount

  return isMobile;
};


const GlobalSpotlight = ({
  pageRef,
  disableAnimations = false,
  enabled = true,
  spotlightRadius = DEFAULT_SPOTLIGHT_RADIUS,
  glowColor = DEFAULT_GLOW_COLOR // Use passed prop or default
}) => {
  const spotlightRef = useRef(null);

  useEffect(() => {
    // Check refs and conditions *before* creating elements or adding listeners
    if (disableAnimations || !pageRef?.current || !enabled) {
      const existingSpotlight = document.querySelector('.global-spotlight-queryai');
      if (existingSpotlight) existingSpotlight.remove();
      return; // Early return if conditions aren't met
    }

    // Ensure cleanup happens *before* creating a new spotlight if effect re-runs
    document.querySelector('.global-spotlight-queryai')?.remove();

    const spotlight = document.createElement('div');
    spotlight.className = 'global-spotlight-queryai';
    spotlight.style.cssText = `
      position: fixed;
      width: 800px;
      height: 800px;
      border-radius: 50%;
      pointer-events: none;
      background: radial-gradient(circle,
        rgba(${glowColor}, 0.15) 0%,
        rgba(${glowColor}, 0.08) 15%,
        rgba(${glowColor}, 0.04) 25%,
        rgba(${glowColor}, 0.02) 40%,
        rgba(${glowColor}, 0.01) 65%,
        transparent 70%
      );
      z-index: 200;
      opacity: 0;
      transform: translate(-50%, -50%);
      mix-blend-mode: screen;
    `;
    document.body.appendChild(spotlight);
    spotlightRef.current = spotlight;

    const handleMouseMove = e => {
      // Check refs inside the handler as well
      if (!spotlightRef.current || !pageRef.current) return;

      const pageRect = pageRef.current.getBoundingClientRect();
      const mouseInside =
        e.clientX >= pageRect.left && e.clientX <= pageRect.right && e.clientY >= pageRect.top && e.clientY <= pageRect.bottom;

      const cards = pageRef.current.querySelectorAll('.particle-card');

      if (!mouseInside) {
         // Check ref before animating
        if (spotlightRef.current) gsap.to(spotlightRef.current, { opacity: 0, duration: 0.3 });
        cards.forEach(card => card.style.setProperty('--glow-intensity', '0'));
        return;
      }

      const { proximity, fadeDistance } = calculateSpotlightValues(spotlightRadius);
      let minDistance = Infinity;

      cards.forEach(card => {
        const cardRect = card.getBoundingClientRect();
        const centerX = cardRect.left + cardRect.width / 2;
        const centerY = cardRect.top + cardRect.height / 2;
        const distance = Math.hypot(e.clientX - centerX, e.clientY - centerY);
        const effectiveDistance = Math.max(0, distance - cardRect.width / 2);

        minDistance = Math.min(minDistance, effectiveDistance);

        let glowIntensity = 0;
        if (effectiveDistance <= proximity) {
          glowIntensity = 1;
        } else if (effectiveDistance <= fadeDistance) {
          glowIntensity = (fadeDistance - effectiveDistance) / (fadeDistance - proximity);
        }

        updateCardGlowProperties(card, e.clientX, e.clientY, glowIntensity, spotlightRadius);
      });
      // Check ref before animating
      if (spotlightRef.current) gsap.to(spotlightRef.current, { left: e.clientX, top: e.clientY, duration: 0.1 });


      const targetOpacity =
        minDistance <= proximity
          ? 0.8
          : minDistance <= fadeDistance
            ? ((fadeDistance - minDistance) / (fadeDistance - proximity)) * 0.8
            : 0;
       // Check ref before animating
      if (spotlightRef.current) gsap.to(spotlightRef.current, {
        opacity: targetOpacity,
        duration: targetOpacity > 0 ? 0.2 : 0.5,
      });
    };

    document.addEventListener('mousemove', handleMouseMove);

    // Cleanup function
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      // Use the ref for cleanup to ensure the correct element is removed
      if (spotlightRef.current) {
        spotlightRef.current.remove();
        spotlightRef.current = null; // Clear the ref
      }
    };
    // Ensure dependencies cover all props used inside the effect
  }, [pageRef, disableAnimations, enabled, spotlightRadius, glowColor]);

  return null;
};
// --- END MAGIC BENTO EFFECTS UTILITY CODE ---


const QueryAI = () => {
  // --- Hooks must be called unconditionally at the top ---
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: "ai",
      content:
        "Hello! I'm Kairo, your AI memory assistant. Ask me anything about your conversations, memories, or any topic you'd like to explore.",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const pageRef = useRef(null);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const { user, activeSessionId, setActiveSessionId } = useAuthStore();
  const [recentChats, setRecentChats] = useState([]);
  const [showRecentChats, setShowRecentChats] = useState(false);
  const effectRan = useRef(false); // Ref to prevent double effect run in StrictMode
  const isMobile = useMobileDetection(); // Call hook here
  const shouldDisableAnimations = isMobile; // Define based on hook result
  const glowColor = DEFAULT_GLOW_COLOR; // *** DEFINE glowColor HERE ***
  const spotlightRadius = DEFAULT_SPOTLIGHT_RADIUS; // *** DEFINE spotlightRadius HERE ***


  // --- useEffect Hooks ---
  useEffect(() => {
    let isMounted = true; // Flag for async cleanup
    const loadInitialData = async () => {
        if (user?.googleId) {
             if (isMounted) setIsLoading(true); // Indicate loading start
             try {
                 const chats = await getUserChats(user.googleId);
                 if (!isMounted) return; // Check mount status after await

                 setRecentChats(chats);
                 // Load active session or start new one
                 if (activeSessionId) {
                    await loadChatHistory(activeSessionId, isMounted);
                 } else if (chats.length === 0) {
                     // If no chats and no active session, start one implicitly
                     // No need to call startNewChat here, handleSubmit will handle it
                      setMessages([{
                          id: 1, type: "ai",
                          content: "Hello! Ask me anything to start a new chat.",
                          timestamp: new Date().toISOString(),
                      }]);
                      setShowSuggestions(true);
                      setActiveSessionId(null); // Ensure no session ID is set
                 } else {
                     // If chats exist but no active session, maybe load most recent?
                     // For now, just show the initial message until user interacts
                      setMessages([{
                          id: 1, type: "ai",
                          content: "Hello! Ask me anything or select a recent chat.",
                          timestamp: new Date().toISOString(),
                      }]);
                      setShowSuggestions(true);
                      setActiveSessionId(null);
                 }
             } catch (error) {
                 console.error("Failed initial load:", error);
                 if (isMounted) toast.error("Could not load chat data.");
             } finally {
                 if (isMounted) setIsLoading(false); // Loading finished
             }

        } else {
             // Reset if user logs out
             if (isMounted) {
                 setMessages([{
                     id: 1, type: "ai",
                     content: "Hello! Please log in to use Kairo.",
                     timestamp: new Date().toISOString(),
                 }]);
                 setRecentChats([]);
                 setActiveSessionId(null);
                 setShowSuggestions(true);
                 setIsLoading(false); // Stop loading if user logs out
             }
        }
    };

    loadInitialData();

    return () => {
        isMounted = false; // Cleanup flag
    };
}, [user]); // Rerun only when user changes, activeSessionId handled internally


  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // --- Helper Functions ---

  const fetchRecentChats = async (isMounted = true) => {
    if (!user?.googleId) return;
    try {
      const chats = await getUserChats(user.googleId);
       if (isMounted) setRecentChats(chats);
    } catch (error) {
      console.error("Failed to fetch recent chats:", error);
       if (isMounted) toast.error("Could not load recent chats.");
    }
  };

  const startNewChat = async (isMounted = true) => {
    if (!user?.googleId) {
      toast.error("You must be logged in to start a new chat.");
      return;
    }
    // Indicate loading while creating session
    if (isMounted) setIsLoading(true);
    try {
      const newSession = await createChatSession(user.googleId);
      if (isMounted) {
          setActiveSessionId(newSession.session_id); // Set the new session ID
          setMessages([ // Reset messages for the new chat
            {
              id: `${newSession.session_id}-start`, // Unique ID
              type: "ai",
              content: "New chat started. How can I help you?",
              timestamp: new Date().toISOString(),
            },
          ]);
          setShowSuggestions(true); // Show suggestions for new chat
          setShowRecentChats(false); // Close dropdown if open
      }
      fetchRecentChats(isMounted); // Refresh list in the background
    } catch (error) {
      console.error("Failed to create new chat session:", error);
       if (isMounted) toast.error("Could not start a new chat.");
    } finally {
       if (isMounted) setIsLoading(false);
    }
  };


  const loadChatHistory = async (sessionId, isMounted = true) => {
     if (!isMounted) return;
     if (sessionId === activeSessionId && messages.length > 1) {
         setShowRecentChats(false); // Just close dropdown if already active
         return;
     }


    setIsLoading(true); // Use main loading state for simplicity here
    setMessages([]); // Clear previous messages
    try {
      const history = await getChatHistory(sessionId);
      if (!isMounted) return;

      if (history && history.history) {
        const formattedMessages = history.history.map((msg, index) => ({
          id: `${sessionId}-${index}-${msg.timestamp?.$date || msg.timestamp}`,
          type: msg.role === 'assistant' ? 'ai' : msg.role,
          content: msg.content,
          timestamp: msg.timestamp.$date || msg.timestamp,
        }));
        setMessages(
          formattedMessages.length > 0
            ? formattedMessages
            : [ { id: `${sessionId}-empty`, type: "ai", content: "This chat is empty.", timestamp: new Date().toISOString() } ]
        );
        setActiveSessionId(sessionId); // Set this as the active session
        setShowSuggestions(formattedMessages.length === 0);
        setShowRecentChats(false);
      } else {
           setMessages([ { id: `${sessionId}-empty`, type: "ai", content: "Could not load messages, or chat is empty.", timestamp: new Date().toISOString() } ]);
           setShowSuggestions(true);
      }
    } catch (error) {
      console.error(`Failed to load chat history for session ${sessionId}:`, error);
      if (isMounted) toast.error("Could not load chat history.");
      if (isMounted) setMessages([ { id: `${sessionId}-error`, type: "ai", content: "Sorry, failed to load messages.", timestamp: new Date().toISOString() } ]);
    } finally {
        if (isMounted) setIsLoading(false);
    }
  };


  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    const currentQuery = query.trim();

    if (!currentQuery || !user?.googleId) {
      if (!user?.googleId) toast.error("You must be logged in.");
      return;
    }

    let currentSessionId = activeSessionId;
    let isFirstUserMsgInSession = messages.filter((m) => m.type === "user").length === 0;

    // --- Start a new session IF no activeSessionId exists ---
    if (!currentSessionId) {
        setIsLoading(true); // Indicate loading for session creation
        try {
            const newSession = await createChatSession(user.googleId);
            currentSessionId = newSession.session_id;
            setActiveSessionId(currentSessionId);
            setMessages([]); // Clear initial "Hello" message
            isFirstUserMsgInSession = true; // This will be the first message
            fetchRecentChats(); // Refresh list in background
        } catch (error) {
            toast.error("Could not start a new chat session.");
            setIsLoading(false);
            return;
        } finally {
             // setIsLoading(false); // Loading state will be handled by query processing
        }
    }
    // --- End session creation ---

    setShowSuggestions(false);
    // *** Keep the user's query in the input for now ***
    // setQuery(""); // Commented out to keep the query visible

    // *** Add user message to state IMMEDIATELY ***
    const userMessage = {
        id: Date.now(),
        type: "user",
        content: currentQuery,
        timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);
    // *** Clear the input AFTER adding the message to state ***
    setQuery("");

    setIsLoading(true); // Now loading for the query response

    try {
      const data = {
        user_id: user.googleId,
        query: currentQuery, // Use the captured currentQuery
        session_id: currentSessionId, // Use the definite session ID
      };

      const response = await pipelineApi.post("/query", data);

      const aiResponse = {
        id: Date.now() + 1,
        type: "ai",
        content: response.data.answer,
        contexts: response.data.contexts,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, aiResponse]);

      // Generate title only if it was the first user message in this session
      if (isFirstUserMsgInSession) {
          try {
             await generateChatTitle(currentSessionId);
             // Fetch chats again to update the title in the dropdown list
             fetchRecentChats();
          } catch (titleError) {
              console.error("Failed to generate title:", titleError);
          }
      }

    } catch (error) {
      console.error("Error querying pipeline:", error);
      const errorMessage = error.response?.data?.error || "An error occurred.";
      toast.error(errorMessage);
      const errorResponse = {
        id: Date.now() + 1,
        type: "ai",
        content: `Sorry, something went wrong. ${errorMessage}`,
        timestamp: new Date().toISOString(),
      };
       setMessages((prev) => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
       inputRef.current?.focus();
    }
  };


  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const clearChat = () => {
    // Clears the *current view* and prepares for a new chat session
    setActiveSessionId(null); // Clear the active session ID
    setMessages([ // Reset to the initial message
      {
        id: 1,
        type: "ai",
        content: "Hello! Ask me anything to start a new chat.",
        timestamp: new Date().toISOString(),
      },
    ]);
    setShowSuggestions(true); // Show suggestions again
    toast.success("Ready for a new chat!");
  };


  const suggestedQueries = [
    "What did I discuss on last Tuesday?",
    "Remind me about the meeting notes from yesterday",
    "What are the key points from my conversation with the client?",
    "Help me remember what I learned in the conference",
    "What were the action items from my team meeting?",
    "Summarize my conversations from this week",
  ];


  const bentoProps = useMemo(
    () => ({
      enableTilt: false,
      enableMagnetism: false,
      clickEffect: true,
      glowColor: glowColor, // Use defined variable
      particleCount: 8,
    }),
    [isMobile, glowColor] // Dependencies
  );

  return (
    <div className="min-h-screen bg-background p-6" ref={pageRef}>
      {!shouldDisableAnimations && (
        <>
          <GlobalSpotlight
            pageRef={pageRef}
            disableAnimations={shouldDisableAnimations}
            enabled={true}
            spotlightRadius={spotlightRadius} // Use defined variable
            glowColor={glowColor} // Use defined variable
          />
          <style>
            {`
              /* Your existing styles here */
               .particle-card { position: relative; transform-style: preserve-3d; }
               .particle-card:hover { box-shadow: 0 4px 20px rgba(46, 24, 78, 0.4), 0 0 30px rgba(${glowColor}, 0.2); }
               .particle-card.card--border-glow::after { /* ... glow styles ... */ content: ''; position: absolute; inset: 0; padding: 6px; background: radial-gradient(${spotlightRadius}px circle at var(--glow-x) var(--glow-y), rgba(${glowColor}, calc(var(--glow-intensity) * 0.8)) 0%, rgba(${glowColor}, calc(var(--glow-intensity) * 0.4)) 30%, transparent 60%); border-radius: inherit; mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0); mask-composite: subtract; -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0); -webkit-mask-composite: xor; pointer-events: none; transition: opacity 0.3s ease; z-index: 1; }
               .particle-card.card--border-glow:hover::after { opacity: 1; }
               .particle-card .particle { z-index: 101; }
               .message-list::-webkit-scrollbar { width: 4px; }
               .message-list::-webkit-scrollbar-track { background: transparent; }
               .message-list::-webkit-scrollbar-thumb { background: rgba(var(--muted-foreground), 0.5); border-radius: 2px; }
               .message-list::-webkit-scrollbar-thumb:hover { background: rgba(var(--muted-foreground), 0.8); }
               .chat-list-dropdown::-webkit-scrollbar { width: 4px; }
               .chat-list-dropdown::-webkit-scrollbar-track { background: transparent; }
               .chat-list-dropdown::-webkit-scrollbar-thumb { background: rgba(var(--muted-foreground), 0.5); border-radius: 2px; }
               .chat-list-dropdown::-webkit-scrollbar-thumb:hover { background: rgba(var(--muted-foreground), 0.8); }
               /* Add prose styles if using @tailwindcss/typography */
                .prose-invert { color: hsl(var(--foreground)); } /* Changed to foreground (white) */
                .prose code { color: hsl(var(--accent-foreground)); background-color: hsl(var(--accent) / 0.1); padding: 0.2em 0.4em; border-radius: 0.25rem; font-size: 0.9em; }
                .prose pre { background-color: hsl(var(--card) / 0.5); color: hsl(var(--card-foreground)); padding: 1em; border-radius: 0.5rem; overflow-x: auto;}
                .prose pre code { background-color: transparent; padding: 0; }
                .prose a { color: hsl(var(--primary)); text-decoration: underline; }
                .prose strong { font-weight: 600; }
                .prose blockquote { border-left-color: hsl(var(--border)); color: hsl(var(--muted-foreground));}
            `}
          </style>
        </>
      )}

      {/* Main container adjusted for full height */}
      <div className="max-w-7xl mx-auto flex flex-col h-[calc(100vh-3rem)]"> {/* Increased max-width */}
        {/* Header */}
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <div>
            <h1 className="text-3xl font-bold gradient-text mb-1">Kairo AI</h1>
            <p className="text-muted-foreground text-sm">
              Ask Kairo anything about your memories and conversations
            </p>
          </div>
          <div className="flex gap-2 relative">
            <button
              onClick={() => startNewChat()}
              className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors text-sm"
            >
              New Chat
            </button>
            <button
              onClick={() => setShowRecentChats(!showRecentChats)}
              className="px-4 py-2 bg-muted hover:bg-muted/80 text-muted-foreground rounded-lg transition-colors text-sm"
            >
              Recent Chats ({recentChats.length})
            </button>
            {showRecentChats && (
              <div className="absolute top-full right-0 mt-2 w-64 bg-card border border-border/50 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto chat-list-dropdown">
                <div className="p-2 space-y-1">
                  {recentChats.map((chat) => (
                    <button
                      key={chat._id.$oid}
                      onClick={() => loadChatHistory(chat._id.$oid)}
                      className={`w-full text-left p-2 rounded-md truncate text-sm ${
                        activeSessionId === chat._id.$oid ? "bg-primary/20 text-primary" : "hover:bg-muted/50"
                      }`}
                      title={chat.title || `Chat from ${new Date(chat.created_at.$date).toLocaleDateString()}`}
                    >
                      {chat.title || `Chat from ${new Date(chat.created_at.$date).toLocaleDateString()}`}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {/* Clear Chat is less useful now, consider removing or changing its function */}
            {/* <button
              onClick={clearChat}
              className="px-4 py-2 bg-destructive/10 hover:bg-destructive/20 text-destructive border border-destructive/20 rounded-lg transition-colors text-sm"
            >
              Clear View
            </button> */}
          </div>
        </div>

        {/* Chat Container */}
        <ParticleCard
          {...bentoProps}
          className="particle-card card--border-glow backdrop-blur-glass rounded-2xl border border-border/50 overflow-hidden flex-grow flex flex-col"
        >
          {/* Messages Area */}
        <div className="flex-grow overflow-y-auto p-6 space-y-4 message-list">
          
          {/* MODIFIED: Show full-page spinner ONLY if loading AND messages are empty */}
          {isLoading && messages.length === 0 && (
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
            </div>
          )}

          {/* MODIFIED: Always render messages, regardless of loading state */}
          {/* This ensures your new user message and old messages stay visible */}
          {messages.map((message) => (
            <div
              key={message.id} // Use the generated unique ID
              className={`flex ${
                message.type === "user" ? "justify-end" : "justify-start"
              } animate-fadeIn`}
            >
              <div
                className={`max-w-[85%] md:max-w-[75%] lg:max-w-[70%] px-4 py-3 rounded-2xl ${ // Adjusted max-width further
                  message.type === "user"
                    ? "bg-primary text-primary-foreground ml-4" // User: Primary bg, white text
                    : "bg-muted text-foreground mr-4" // AI: Muted bg, white text (foreground)
                }`}
              >
                {/* Content with increased text size */}
                <div className="text-base markdown-body">
                  {message.type === 'ai' || message.type === 'assistant' ? (
                    // Apply prose styles via the wrapper div
                    // *** Removed prose-invert, relying on base text-foreground ***
                    <div className="prose prose-sm max-w-none break-words">
                      <ReactMarkdown
                        children={message.content}
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[rehypeHighlight]} // Optional syntax highlighting
                        components={{ // Optional: Customize rendering
                          code({node, inline, className, children, ...props}) {
                            const match = /language-(\w+)/.exec(className || '')
                            return !inline ? (
                              <pre className={className} {...props}>
                                <code>{children}</code>
                              </pre>
                            ) : (
                              <code className={className} {...props}>
                                {children}
                              </code>
                            )
                          }
                        }}
                      />
                    </div>
                  ) : (
                    <p className="break-words">{message.content}</p> // User message
                  )}
                </div>
                <p className="text-xs opacity-70 mt-2 text-right">
                  {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}

          {/* Suggestions - Conditionally render WITHIN the scrollable area */}
          {showSuggestions && !isLoading && ( // Also hide suggestions when loading
            <div className="mb-6 pt-4 border-t border-border/20">
              <h3 className="text-base font-semibold mb-3 text-foreground text-center">
                Suggested Queries
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {suggestedQueries.map((suggestion, index) => (
                  <ParticleCard
                    key={index}
                    {...bentoProps}
                    enableTilt={false}
                    enableMagnetism={false}
                    className="particle-card card--border-glow overflow-hidden rounded-lg transition-all duration-300"
                  >
                    <button
                      onClick={() => {
                        setQuery(suggestion);
                        inputRef.current?.focus();
                      }}
                      className="text-left w-full h-full p-3 bg-card/50 hover:bg-muted/50 border border-border/50 hover:border-primary/30 rounded-lg transition-colors group"
                    >
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-primary/10 rounded-md flex items-center justify-center group-hover:bg-primary/20 transition-colors flex-shrink-0">
                          <svg className="w-3 h-3 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                          {suggestion}
                        </span>
                      </div>
                    </button>
                  </ParticleCard>
                ))}
              </div>
            </div>
          )}

          {/* This "thinking" indicator will now correctly show up AFTER the messages */}
          {isLoading && messages.length > 0 && ( // Show inline loading only if messages already exist
            <div className="flex justify-start animate-fadeIn py-2">
              <div className="bg-muted text-muted-foreground px-4 py-3 rounded-2xl mr-4 inline-flex"> {/* Use inline-flex */}
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                  </div>
                  <span className="text-sm">Kairo is thinking...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} /> {/* Scroll target */}
        </div>

          {/* Input Form - Stays at the bottom */}
          <div className="border-t border-border/50 p-4 flex-shrink-0">
            <form onSubmit={handleSubmit} className="flex space-x-3">
              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask Kairo anything..."
                   className="w-full pl-4 pr-12 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors resize-none text-base leading-tight min-h-[40px] max-h-32" // Added leading-tight, min/max height
                   rows={1}
                   disabled={isLoading}
                   style={{ scrollbarWidth: 'thin' }} // For Firefox scrollbar styling
                />
                 {/* Submit button positioned absolutely inside the input wrapper */}
                 <button
                   type="submit"
                   disabled={!query.trim() || isLoading}
                   className="absolute right-2 bottom-1.5 p-1.5 bg-primary hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground text-primary-foreground rounded-md transition-colors glow-primary disabled:opacity-50 disabled:glow-none flex items-center justify-center" // Positioned button
                 >
                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
                   </svg>
                 </button>
              </div>
            </form>
          </div>
        </ParticleCard>
      </div>
    </div>
  );
};

export default QueryAI;