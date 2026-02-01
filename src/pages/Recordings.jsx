"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import toast from "react-hot-toast"
import { ParticleCard } from "../components/ParticleCard" 
import { gsap } from "gsap"; 
import { getRecordings } from "../api/axios"; // IMPORT the new API function
import useAuthStore from "../stores/authStore"; // IMPORT the auth store

// --- (Your Magic Bento utility code can remain exactly the same) ---
const DEFAULT_SPOTLIGHT_RADIUS = 300;
const DEFAULT_GLOW_COLOR = '132, 0, 255';
const MOBILE_BREAKPOINT = 768;

const calculateSpotlightValues = radius => ({
  proximity: radius * 0.5,
  fadeDistance: radius * 0.75
});

const updateCardGlowProperties = (card, mouseX, mouseY, glow, radius) => {
  const rect = card.getBoundingClientRect();
  const relativeX = ((mouseX - rect.left) / rect.width) * 100;
  const relativeY = ((mouseY - rect.top) / rect.height) * 100;
  card.style.setProperty('--glow-x', `${relativeX}%`);
  card.style.setProperty('--glow-y', `${relativeY}%`);
  card.style.setProperty('--glow-intensity', glow.toString());
  card.style.setProperty('--glow-radius', `${radius}px`);
};

const useMobileDetection = () => {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= MOBILE_BREAKPOINT);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  return isMobile;
};

const GlobalSpotlight = ({ pageRef, disableAnimations = false, enabled = true, spotlightRadius = DEFAULT_SPOTLIGHT_RADIUS, glowColor = DEFAULT_GLOW_COLOR }) => {
  const spotlightRef = useRef(null);
  useEffect(() => {
    if (disableAnimations || !pageRef?.current || !enabled) return;
    document.querySelector('.global-spotlight-recordings')?.remove();
    const spotlight = document.createElement('div');
    spotlight.className = 'global-spotlight-recordings';
    spotlight.style.cssText = `position: fixed; width: 800px; height: 800px; border-radius: 50%; pointer-events: none; background: radial-gradient(circle, rgba(${glowColor}, 0.15) 0%, rgba(${glowColor}, 0.08) 15%, rgba(${glowColor}, 0.04) 25%, rgba(${glowColor}, 0.02) 40%, rgba(${glowColor}, 0.01) 65%, transparent 70%); z-index: 200; opacity: 0; transform: translate(-50%, -50%); mix-blend-mode: screen;`;
    document.body.appendChild(spotlight);
    spotlightRef.current = spotlight;
    const handleMouseMove = e => {
      if (!spotlightRef.current || !pageRef.current) return;
      const pageRect = pageRef.current.getBoundingClientRect();
      const mouseInside = e.clientX >= pageRect.left && e.clientX <= pageRect.right && e.clientY >= pageRect.top && e.clientY <= pageRect.bottom;
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
      const targetOpacity = minDistance <= proximity ? 0.8 : minDistance <= fadeDistance ? ((fadeDistance - minDistance) / (fadeDistance - proximity)) * 0.8 : 0;
      gsap.to(spotlightRef.current, { opacity: targetOpacity, duration: targetOpacity > 0 ? 0.2 : 0.5, });
    };
    document.addEventListener('mousemove', handleMouseMove);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.querySelector('.global-spotlight-recordings')?.remove();
    };
  }, [pageRef, disableAnimations, enabled, spotlightRadius, glowColor]);
  return null;
};

// --- START OF LOGIC CHANGES ---
const Recordings = () => {
  const [recordings, setRecordings] = useState([])
  const [filteredRecordings, setFilteredRecordings] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedFilter, setSelectedFilter] = useState("all")
  const [currentlyPlaying, setCurrentlyPlaying] = useState(null)
  const [playbackProgress, setPlaybackProgress] = useState({})
  const [selectedRecordings, setSelectedRecordings] = useState([])
  
  // This ref will now store actual <audio> elements
  const audioRefs = useRef({}) 
  const pageRef = useRef(null) 
  const { user } = useAuthStore();

  // 1. Fetch real recordings from the backend when the component mounts
  useEffect(() => {
    if (user?.googleId) {
      const fetchRecordings = async () => {
        const userRecordings = await getRecordings(user.googleId);
        setRecordings(userRecordings);
        setFilteredRecordings(userRecordings);
      };
      fetchRecordings();
    }
  }, [user]);

  // 2. Filter logic remains the same, but will now work on real data
  useEffect(() => {
    let filtered = recordings;
    if (searchTerm) {
      filtered = filtered.filter(
        (recording) =>
          recording.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          recording.speaker.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (selectedFilter !== "all") {
      filtered = filtered.filter((recording) => recording.category === selectedFilter);
    }
    setFilteredRecordings(filtered);
  }, [searchTerm, selectedFilter, recordings]);

  // 3. Implement real audio playback logic
  const togglePlayback = (recordingId) => {
    // Find the full recording object to get its sessionId
    const recording = recordings.find(r => r.id === recordingId);
    if (!recording) return;

    // Pause any other audio that might be playing
    if (currentlyPlaying && currentlyPlaying !== recordingId && audioRefs.current[currentlyPlaying]) {
        audioRefs.current[currentlyPlaying].pause();
    }

    // If the clicked recording is the one already playing, pause it
    if (currentlyPlaying === recordingId) {
        audioRefs.current[recordingId].pause();
        setCurrentlyPlaying(null);
        toast.success("Playback paused");
    } else {
        // If it's a new recording, start playback
        setCurrentlyPlaying(recordingId);
        
        // Construct the URL to your backend's streaming endpoint
        const audioUrl = `http://localhost:8000/audio/${recording.sessionId}?user_id=${user.googleId}`;
        
        // If an audio element for this ID doesn't exist, create it
        if (!audioRefs.current[recordingId]) {
            audioRefs.current[recordingId] = new Audio(audioUrl);
        }
        
        const audio = audioRefs.current[recordingId];
        
        // Reset progress before playing
        setPlaybackProgress(prev => ({ ...prev, [recordingId]: 0 }));
        
        audio.play().catch(e => {
            toast.error("Failed to stream audio.");
            console.error("Audio playback error:", e);
            setCurrentlyPlaying(null);
        });

        // Set up event listeners for the audio element
        audio.ontimeupdate = () => {
            setPlaybackProgress(prev => ({
                ...prev,
                [recordingId]: (audio.currentTime / audio.duration) * 100 || 0,
            }));
        };

        audio.onended = () => {
            setCurrentlyPlaying(null);
            setPlaybackProgress(prev => ({ ...prev, [recordingId]: 0 }));
        };

        toast.success(`Playing: ${recording.title}`);
    }
  };

  // 4. Implement real download logic
  const downloadRecording = (recording) => {
    if (!user?.googleId) {
        toast.error("You must be logged in to download recordings.");
        return;
    }
    const audioUrl = `http://localhost:8000/audio/${recording.sessionId}?user_id=${user.googleId}`;
    const link = document.createElement('a');
    link.href = audioUrl;
    link.download = `${recording.title.replace(/ /g, '_')}.wav`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Downloading ${recording.title}`);
  };

  // (The rest of the functions: deleteRecording, toggleSelect, formatDate, etc. can remain the same)
  const deleteRecording = (id) => {
    setRecordings((prev) => prev.filter((recording) => recording.id !== id))
    toast.success("Recording removed from view!")
  }

  const toggleSelectRecording = (id) => {
    setSelectedRecordings((prev) =>
      prev.includes(id) ? prev.filter((recordingId) => recordingId !== id) : [...prev, id],
    )
  }

  const deleteSelectedRecordings = () => {
    setRecordings((prev) => prev.filter((recording) => !selectedRecordings.includes(recording.id)))
    setSelectedRecordings([])
    toast.success(`${selectedRecordings.length} recordings deleted successfully!`)
  }

  const formatDate = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffTime = Math.abs(now - date)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    if (diffDays === 1) return "Yesterday"
    if (diffDays <= 7) return `${diffDays} days ago`
    if (diffDays <= 30) return `${Math.ceil(diffDays / 7)} weeks ago`
    return date.toLocaleDateString()
  }

  const getCategoryColor = (category) => {
    const colors = {
      work: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      business: "bg-green-500/10 text-green-500 border-green-500/20",
      personal: "bg-purple-500/10 text-purple-500 border-purple-500/20",
    }
    return colors[category] || colors.personal
  }

  const getQualityColor = (quality) => {
    const colors = {
      high: "text-green-500",
      medium: "text-yellow-500",
      low: "text-red-500",
    }
    return colors[quality] || colors.medium
  }

  const WaveformVisualization = ({ waveform, isPlaying, progress = 0 }) => {
    return (
      <div className="flex items-end space-x-1 h-12 w-full">
        {waveform.map((height, index) => {
          const isActive = (index / waveform.length) * 100 <= progress
          return (
            <div
              key={index}
              className={`flex-1 rounded-sm transition-all duration-200 ${
                isActive && isPlaying
                  ? "bg-primary"
                  : isActive
                  ? "bg-primary/60"
                  : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
              }`}
              style={{ height: `${Math.max(Math.random() * 40, 8)}px` }} // Use random height as placeholder
            />
          )
        })}
      </div>
    )
  }

  const isMobile = useMobileDetection();
  const shouldDisableAnimations = isMobile;
  const glowColor = DEFAULT_GLOW_COLOR;
  const spotlightRadius = DEFAULT_SPOTLIGHT_RADIUS;

  const bentoProps = useMemo(() => ({
    enableTilt: false,
    enableMagnetism: false,
    clickEffect: true,
    glowColor: glowColor,
    particleCount: 12,
  }), [glowColor]);
  
  // --- END OF LOGIC CHANGES ---

  return (
    <div className="min-h-screen bg-background p-6" ref={pageRef}>
      
      {!shouldDisableAnimations && (
        <>
          <GlobalSpotlight 
            pageRef={pageRef}
            disableAnimations={shouldDisableAnimations}
            enabled={true}
            spotlightRadius={spotlightRadius}
            glowColor={glowColor}
          />
          <style>
            {`
            .particle-card { 
                position: relative; 
                transform-style: preserve-3d;
            }
            .particle-card:hover {
                 box-shadow: 0 4px 20px rgba(46, 24, 78, 0.4), 0 0 30px rgba(${glowColor}, 0.2);
            }
            .particle-card.card--border-glow::after {
                content: ''; position: absolute; inset: 0; padding: 6px;
                background: radial-gradient(${spotlightRadius}px circle at var(--glow-x) var(--glow-y),
                  rgba(${glowColor}, calc(var(--glow-intensity) * 0.8)) 0%,
                  rgba(${glowColor}, calc(var(--glow-intensity) * 0.4)) 30%,
                  transparent 60%);
                border-radius: inherit;
                mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
                mask-composite: subtract;
                -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
                -webkit-mask-composite: xor;
                pointer-events: none; transition: opacity 0.3s ease; z-index: 1;
            }
            .particle-card.card--border-glow:hover::after { opacity: 1; }
            .particle-card .particle { z-index: 101; }
            `}
          </style>
        </>
      )}

      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold gradient-text mb-2">Voice Recordings</h1>
            <p className="text-muted-foreground">
              Manage and play your recorded conversations ({filteredRecordings.length} recordings)
            </p>
          </div>
          <div className="flex gap-3">
            {selectedRecordings.length > 0 && (
              <button
                onClick={deleteSelectedRecordings}
                className="px-4 py-2 bg-destructive/10 hover:bg-destructive/20 text-destructive border border-destructive/20 rounded-lg transition-colors"
              >
                Delete Selected ({selectedRecordings.length})
              </button>
            )}
            <button className="px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-lg transition-colors">
              Upload Recording
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24" > <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /> </svg>
              <input type="text" placeholder="Search recordings..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors" />
            </div>
          </div>
          <select value={selectedFilter} onChange={(e) => setSelectedFilter(e.target.value)} className="px-4 py-3 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors" >
            <option value="all">All Categories</option>
            <option value="work">Work</option>
            <option value="business">Business</option>
            <option value="personal">Personal</option>
          </select>
        </div>

        {filteredRecordings.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-muted/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24"> <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /> </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2 text-foreground">No Recordings Found</h3>
            <p className="text-muted-foreground mb-6">
              {searchTerm || selectedFilter !== "all"
                ? "No recordings match your search criteria"
                : "Your Kairo recordings will appear here once they are processed."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRecordings.map((recording) => (
              <ParticleCard 
                key={recording.id} 
                {...bentoProps} 
                className="particle-card card--border-glow overflow-hidden rounded-2xl transition-all duration-300"
              >
                <div
                  className="backdrop-blur-glass rounded-2xl border border-border/50 hover:border-primary/30 transition-all duration-300 overflow-hidden group"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start space-x-4 flex-1">
                        <input
                          type="checkbox"
                          checked={selectedRecordings.includes(recording.id)}
                          onChange={() => toggleSelectRecording(recording.id)}
                          className="mt-1 w-4 h-4 text-primary bg-input border-border rounded focus:ring-primary/50"
                        />
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-foreground mb-2">{recording.title}</h3>
                          <div className="flex flex-wrap items-center gap-3 mb-3">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getCategoryColor(recording.category)}`}> {recording.category} </span>
                            {/* <span className="text-sm text-muted-foreground">Speaker: {recording.speaker}</span> */}
                            {/* <span className="text-sm text-muted-foreground">{recording.duration}</span>
                            <span className="text-sm text-muted-foreground">{recording.size}</span> */}
                            <span className={`text-sm font-medium ${getQualityColor(recording.quality)}`}> {recording.quality} quality </span>
                            {/* <span className="text-sm text-muted-foreground">{formatDate(recording.date)}</span> */}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mb-4">
                      <WaveformVisualization
                        waveform={recording.waveform}
                        isPlaying={currentlyPlaying === recording.id}
                        progress={playbackProgress[recording.id] || 0}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => togglePlayback(recording.id)}
                          className="w-12 h-12 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full flex items-center justify-center transition-colors glow-primary"
                        >
                          {currentlyPlaying === recording.id ? (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"> <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6" /> </svg>
                          ) : (
                            <svg className="w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"> <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7V5z" /> </svg>
                          )}
                        </button>
                        <div className="text-sm text-muted-foreground">
                          {currentlyPlaying === recording.id ? "Playing..." : "Ready to play"}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => downloadRecording(recording)} className="p-2 hover:bg-muted rounded-lg transition-colors" title="Download" >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"> <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /> </svg>
                        </button>
                        <button onClick={() => deleteRecording(recording.id)} className="p-2 hover:bg-destructive/10 text-destructive rounded-lg transition-colors" title="Delete" >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"> <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /> </svg>
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-border/50">
                      <p className="text-sm text-muted-foreground italic">"{recording.transcript}"</p>
                    </div>
                  </div>
                </div>
              </ParticleCard>
            ))}
          </div>
        )}

        {recordings.length > 0 && (
          <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-6">
            <ParticleCard {...bentoProps} enableTilt={false} className="particle-card card--border-glow text-center p-6 bg-card/30 rounded-2xl border border-border/50">
              <div className="text-2xl font-bold gradient-text mb-2">{recordings.length}</div>
              <div className="text-sm text-muted-foreground">Total Recordings</div>
            </ParticleCard>
            <ParticleCard {...bentoProps} enableTilt={false} className="particle-card card--border-glow text-center p-6 bg-card/30 rounded-2xl border border-border/50">
              <div className="text-2xl font-bold gradient-text mb-2">
                {Math.floor(recordings.reduce((acc, r) => acc + r.durationSeconds, 0) / 3600)}h{" "}
                {Math.floor((recordings.reduce((acc, r) => acc + r.durationSeconds, 0) % 3600) / 60)}m
              </div>
              <div className="text-sm text-muted-foreground">Total Duration</div>
            </ParticleCard>
            <ParticleCard {...bentoProps} enableTilt={false} className="particle-card card--border-glow text-center p-6 bg-card/30 rounded-2xl border border-border/50">
              <div className="text-2xl font-bold gradient-text mb-2">
                {(recordings.reduce((acc, r) => acc + (parseFloat(r.size) || 0), 0)).toFixed(1)} MB
              </div>
              <div className="text-sm text-muted-foreground">Storage Used</div>
            </ParticleCard>
            <ParticleCard {...bentoProps} enableTilt={false} className="particle-card card--border-glow text-center p-6 bg-card/30 rounded-2xl border border-border/50">
              <div className="text-2xl font-bold gradient-text mb-2">
                {recordings.filter((r) => r.quality === "high").length}
              </div>
              <div className="text-sm text-muted-foreground">High Quality</div>
            </ParticleCard>
          </div>
        )}
      </div>
    </div>
  )
}

export default Recordings
