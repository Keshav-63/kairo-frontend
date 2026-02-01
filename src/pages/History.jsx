// Kairo/src/pages/History.jsx

"use client"

import React, { useState, useEffect, useRef, useMemo } from "react"; // Import React
import toast from "react-hot-toast";
import { ParticleCard } from "../components/ParticleCard";
import { gsap } from "gsap";
import { getUserChats, getChatHistory } from "../api/axios"; // Import API functions
import useAuthStore from "../stores/authStore";
import ReactMarkdown from "react-markdown"; // Import ReactMarkdown
import remarkGfm from 'remark-gfm'; // Import remark-gfm if needed

// --- START MAGIC BENTO EFFECTS UTILITY CODE ---
// (Keep your existing Magic Bento code here - it's omitted for brevity)
const DEFAULT_SPOTLIGHT_RADIUS = 300;
const DEFAULT_GLOW_COLOR = '132, 0, 255';
const MOBILE_BREAKPOINT = 768;

const calculateSpotlightValues = radius => ({
  proximity: radius * 0.5,
  fadeDistance: radius * 0.75
});

const updateCardGlowProperties = (card, mouseX, mouseY, glow, radius) => {
  if (!card) return;
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
  glowColor = DEFAULT_GLOW_COLOR
}) => {
  const spotlightRef = useRef(null);

  useEffect(() => {
    // Check refs and conditions *before* creating elements or adding listeners
    if (disableAnimations || !pageRef?.current || !enabled) {
      const existingSpotlight = document.querySelector('.global-spotlight-history');
      if (existingSpotlight) existingSpotlight.remove();
      return; // Early return if conditions aren't met
    }

    // Ensure cleanup happens *before* creating a new spotlight if effect re-runs
    document.querySelector('.global-spotlight-history')?.remove();

    const spotlight = document.createElement('div');
    spotlight.className = 'global-spotlight-history';
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
        gsap.to(spotlightRef.current, { opacity: 0, duration: 0.3 });
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

      gsap.to(spotlightRef.current, { left: e.clientX, top: e.clientY, duration: 0.1 });

      const targetOpacity =
        minDistance <= proximity
          ? 0.8
          : minDistance <= fadeDistance
            ? ((fadeDistance - minDistance) / (fadeDistance - proximity)) * 0.8
            : 0;

      gsap.to(spotlightRef.current, {
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


const History = () => {
  // --- Hooks must be called unconditionally at the top ---
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null); // Keep storing the full selected chat object
  const [messages, setMessages] = useState([]);
  const [isLoadingChats, setIsLoadingChats] = useState(true); // Separate loading states
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const { user } = useAuthStore();
  const pageRef = useRef(null);
  const messagesEndRef = useRef(null);
  const isMobile = useMobileDetection(); // Call hook here

  // Ref to track if initial load has happened
  const initialLoadComplete = useRef(false);

  // Fetch chat list on user load
  useEffect(() => {
    let isMounted = true;
    const fetchAndSetChats = async () => {
      if (!user?.googleId) {
        if (isMounted) {
          setChats([]);
          setSelectedChat(null); // Clear selected chat object
          setMessages([]);
          setIsLoadingChats(false);
          initialLoadComplete.current = false; // Reset initial load flag
        }
        return;
      }

      if (isMounted) setIsLoadingChats(true);
      try {
        const userChats = await getUserChats(user.googleId);
        if (!isMounted) return;

        // *** Sort chats by creation date, most recent first ***
        const sortedChats = userChats.sort((a, b) => new Date(b.created_at.$date) - new Date(a.created_at.$date));
        setChats(sortedChats);

        // --- Automatically select and load the most recent chat ON INITIAL LOAD ---
        if (sortedChats.length > 0 && !initialLoadComplete.current) {
          await handleSelectChat(sortedChats[0]._id.$oid); // Load messages for the first chat
          initialLoadComplete.current = true; // Mark initial load as complete
        } else if (sortedChats.length === 0) {
          setSelectedChat(null);
          setMessages([]);
          initialLoadComplete.current = true; // Mark initial load complete even if no chats
        }
        // --- End automatic selection ---

      } catch (error) {
        console.error("Failed to fetch user chats:", error);
        if (isMounted) {
          toast.error("Could not load your chat history.");
          setChats([]);
          setSelectedChat(null);
          setMessages([]);
          initialLoadComplete.current = true; // Mark initial load complete even on error
        }
      } finally {
        if (isMounted) setIsLoadingChats(false);
      }
    };

    fetchAndSetChats();

    return () => {
      isMounted = false;
    };
  }, [user]); // Rerun only when user changes

  // Scroll to bottom when messages update
  useEffect(() => {
    scrollToBottom();
  }, [messages]);


  const handleSelectChat = async (sessionId) => {
    // Prevent reloading if the same chat is clicked again
    if (selectedChat?._id.$oid === sessionId) return;

    setIsLoadingMessages(true); // Show loading only for messages area
    setMessages([]); // Clear previous messages immediately
    try {
      const history = await getChatHistory(sessionId);
      setSelectedChat(history); // Store the entire chat object (including title etc.)
      const chatMessages = history?.history && Array.isArray(history.history) ? history.history : [];

      // Ensure messages have unique keys if needed later
      const formattedMessages = chatMessages.map((msg, index) => ({
        ...msg,
        id: `${sessionId}-${index}-${msg.timestamp?.$date || msg.timestamp}` // Make key more unique
      }));

      setMessages(formattedMessages);
    } catch (error) {
      console.error(`Failed to fetch history for session ${sessionId}:`, error);
      toast.error("Could not load the selected chat messages.");
      setSelectedChat(null); // Clear selection on error
      setMessages([]);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };


  const bentoProps = useMemo(() => ({
    enableTilt: false,
    enableMagnetism: !isMobile,
    clickEffect: true,
    glowColor: DEFAULT_GLOW_COLOR,
    particleCount: 8,
  }), [isMobile]); // Dependency is the result of the hook call

  // --- Render Logic ---
  return (
    <div className="min-h-screen bg-background p-6" ref={pageRef}>
      {/* GlobalSpotlight and Styles */}
      <GlobalSpotlight
        pageRef={pageRef}
        disableAnimations={isMobile}
        enabled={true}
        spotlightRadius={DEFAULT_SPOTLIGHT_RADIUS}
        glowColor={DEFAULT_GLOW_COLOR}
      />
      <style>
        {`
          /* Your existing styles here */
          .particle-card { position: relative; transform-style: preserve-3d; }
          .particle-card:hover { box-shadow: 0 4px 20px rgba(46, 24, 78, 0.4), 0 0 30px rgba(${DEFAULT_GLOW_COLOR}, 0.2); }
          .particle-card.card--border-glow::after { /* ... glow styles ... */ content: ''; position: absolute; inset: 0; padding: 6px; background: radial-gradient(${DEFAULT_SPOTLIGHT_RADIUS}px circle at var(--glow-x) var(--glow-y), rgba(${DEFAULT_GLOW_COLOR}, calc(var(--glow-intensity) * 0.8)) 0%, rgba(${DEFAULT_GLOW_COLOR}, calc(var(--glow-intensity) * 0.4)) 30%, transparent 60%); border-radius: inherit; mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0); mask-composite: subtract; -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0); -webkit-mask-composite: xor; pointer-events: none; transition: opacity 0.3s ease; z-index: 1; }
          .particle-card.card--border-glow:hover::after { opacity: 1; }
          .particle-card .particle { z-index: 101; }
          .chat-list::-webkit-scrollbar, .message-list::-webkit-scrollbar { width: 4px; }
          .chat-list::-webkit-scrollbar-track, .message-list::-webkit-scrollbar-track { background: transparent; }
          .chat-list::-webkit-scrollbar-thumb, .message-list::-webkit-scrollbar-thumb { background: rgba(var(--muted-foreground), 0.5); border-radius: 2px; }
          .chat-list::-webkit-scrollbar-thumb:hover, .message-list::-webkit-scrollbar-thumb:hover { background: rgba(var(--muted-foreground), 0.8); }
        `}
      </style>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold gradient-text mb-2">Chat History</h1>
            <p className="text-muted-foreground">
              View and manage all your conversations with Kairo ({chats.length} conversations)
            </p>
          </div>
        </div>

        {/* Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Chat List Column */}
          <div className="md:col-span-1">
            <ParticleCard {...bentoProps} className="particle-card card--border-glow rounded-2xl border border-border/50 h-[calc(100vh-12rem)]">
              <div className="backdrop-blur-glass p-4 h-full flex flex-col rounded-2xl overflow-hidden">
                <h2 className="text-xl font-semibold mb-4 flex-shrink-0">Your Conversations</h2>
                {isLoadingChats ? (
                  <div className="flex justify-center items-center flex-grow">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : chats.length === 0 ? (
                  <p className="text-muted-foreground text-center flex-grow flex items-center justify-center">No chat history found.</p>
                ) : (
                  <div className="space-y-2 overflow-y-auto flex-grow chat-list pr-1">
                    {chats.map((chat) => (
                      <button
                        key={chat._id.$oid}
                        onClick={() => handleSelectChat(chat._id.$oid)} // Pass only ID
                        className={`w-full text-left p-3 rounded-lg transition-colors ${selectedChat?._id.$oid === chat._id.$oid ? "bg-primary/20" : "hover:bg-muted/50"}`}
                      >
                        <p className="font-semibold truncate">{chat.title || "Chat Session"}</p>
                        <p className="text-sm text-muted-foreground">{new Date(chat.created_at.$date).toLocaleString()}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </ParticleCard>
          </div>

          {/* Message Display Column */}
          <div className="md:col-span-2">
            <ParticleCard {...bentoProps} className="particle-card card--border-glow rounded-2xl border border-border/50 h-[calc(100vh-12rem)]">
              <div className="backdrop-blur-glass p-6 h-full flex flex-col rounded-2xl overflow-hidden">
                {isLoadingMessages ? ( // Loading state specifically for messages
                  <div className="flex justify-center items-center flex-grow">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                  </div>
                ) : selectedChat ? ( // Check if a chat object exists
                  <>
                    <h2 className="text-xl font-semibold mb-4 flex-shrink-0 truncate">
                      {selectedChat.title || "Chat Details"} {/* Use title from selectedChat object */}
                    </h2>
                    <div className="space-y-4 overflow-y-auto flex-grow message-list pr-2">
                      {messages.length === 0 && !isLoadingMessages ? (
                        <p className="text-muted-foreground text-center py-8">No messages in this chat yet.</p>
                      ) : (
                        messages.map((msg) => (
                          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] px-4 py-2 rounded-lg ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                              {/* Conditionally render ReactMarkdown */}
                              {msg.role === 'assistant' || msg.role === 'ai' ? (
                                // Wrap ReactMarkdown in a div and apply styling there
                                <div className="prose prose-sm prose-invert max-w-none break-words">
                                  <ReactMarkdown
                                    // REMOVE className="prose ..." from here
                                    children={msg.content}
                                    remarkPlugins={[remarkGfm]}
                                  />
                                </div>
                              ) : (
                                <p className="text-sm break-words">{msg.content}</p> // Render plain text for user messages
                              )}
                              <p className="text-xs opacity-70 mt-1 text-right">{new Date(msg.timestamp?.$date || msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                            </div>
                          </div>
                        ))
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  </>
                ) : ( // Show placeholder if no chat is selected (and not loading initial list)
                  <div className="flex justify-center items-center flex-grow text-center text-muted-foreground">
                    {!isLoadingChats && chats.length > 0 && (
                      <div>
                        <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 5.523-4.477 10-10 10S1 17.523 1 12 5.477 2 11 2s10 4.477 10 10z"></path></svg>
                        <h3 className="text-xl font-semibold">Select a conversation</h3>
                        <p>Choose a chat from the left panel to see the messages.</p>
                      </div>
                    )}
                    {!isLoadingChats && chats.length === 0 && (
                      <div>
                        <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 5.523-4.477 10-10 10S1 17.523 1 12 5.477 2 11 2s10 4.477 10 10z"></path></svg>
                        <h3 className="text-xl font-semibold">No chats yet</h3>
                        <p>Start a conversation in Query AI!</p>
                      </div>
                    )}
                    {/* Added a case for when initial chat list is loading */}
                    {isLoadingChats && (
                      <div className="flex justify-center items-center flex-grow">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </ParticleCard>
          </div>
        </div>
      </div>
    </div>
  )
}

export default History;