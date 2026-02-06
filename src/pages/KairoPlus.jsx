// src/pages/KairoPlus.jsx
"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import toast from "react-hot-toast";
import useAuthStore from "../stores/authStore";
import { getAnalyticsSummary, getDailyAnalytics } from "../api/axios";
import { ParticleCard } from "../components/ParticleCard";
import { gsap } from "gsap";
import { BrainCircuit, Calendar, Clock, BarChart2, TrendingUp, Mic, Headphones } from "lucide-react";

// --- (Magic Bento effects utility code is included for styling) ---
const DEFAULT_SPOTLIGHT_RADIUS = 300;
const DEFAULT_GLOW_COLOR = '16, 185, 129'; // Using accent color for this page
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
    document.querySelector('.global-spotlight-kairo-plus')?.remove();
    const spotlight = document.createElement('div');
    spotlight.className = 'global-spotlight-kairo-plus';
    spotlight.style.cssText = `position: fixed; width: 800px; height: 800px; border-radius: 50%; pointer-events: none; background: radial-gradient(circle, rgba(${glowColor}, 0.15) 0%, rgba(${glowColor}, 0.08) 15%, rgba(${glowColor}, 0.04) 25%, transparent 70%); z-index: 200; opacity: 0; transform: translate(-50%, -50%); mix-blend-mode: screen;`;
    document.body.appendChild(spotlight);
    spotlightRef.current = spotlight;
    const handleMouseMove = e => {
      if (!spotlightRef.current || !pageRef.current) return;
      const cards = pageRef.current.querySelectorAll('.particle-card');
      const { proximity, fadeDistance } = calculateSpotlightValues(spotlightRadius);
      let minDistance = Infinity;
      cards.forEach(card => {
        const cardRect = card.getBoundingClientRect();
        const centerX = cardRect.left + cardRect.width / 2;
        const centerY = cardRect.top + cardRect.height / 2;
        const distance = Math.hypot(e.clientX - centerX, e.clientY - centerY);
        const effectiveDistance = Math.max(0, distance - cardRect.width / 2);
        minDistance = Math.min(minDistance, effectiveDistance);
        let glowIntensity = effectiveDistance <= proximity ? 1 : effectiveDistance <= fadeDistance ? (fadeDistance - effectiveDistance) / (fadeDistance - proximity) : 0;
        updateCardGlowProperties(card, e.clientX, e.clientY, glowIntensity, spotlightRadius);
      });
      gsap.to(spotlightRef.current, { left: e.clientX, top: e.clientY, duration: 0.1 });
      const targetOpacity = minDistance <= proximity ? 0.8 : minDistance <= fadeDistance ? ((fadeDistance - minDistance) / (fadeDistance - proximity)) * 0.8 : 0;
      gsap.to(spotlightRef.current, { opacity: targetOpacity, duration: 0.2 });
    };
    document.addEventListener('mousemove', handleMouseMove);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.querySelector('.global-spotlight-kairo-plus')?.remove();
    };
  }, [pageRef, disableAnimations, enabled, spotlightRadius, glowColor]);
  return null;
};
// --- (End of Magic Bento utility code) ---

const KairoPlus = () => {
  const { user } = useAuthStore();
  const [summaryData, setSummaryData] = useState([]);
  const [selectedDateData, setSelectedDateData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const pageRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.googleId) return;
      try {
        setLoading(true);
        const summary = await getAnalyticsSummary(user.googleId);
        setSummaryData(summary);
        if (summary.length > 0) {
          // Automatically load the details for the most recent day
          const mostRecentDate = summary[0].date;
          const dailyDetail = await getDailyAnalytics(user.googleId, mostRecentDate);
          setSelectedDateData(dailyDetail);
        }
        setError(null);
      } catch (err) {
        console.error("Failed to fetch analytics data:", err);
        setError("Could not load your Kairo Plus analytics.");
        toast.error("Could not load your analytics.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const handleDateSelect = async (date_str) => {
    try {
        const dailyDetail = await getDailyAnalytics(user.googleId, date_str);
        setSelectedDateData(dailyDetail);
    } catch (err) {
        toast.error(`Could not load details for ${date_str}.`);
    }
  };
  
  const formatSeconds = (seconds) => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    return `${minutes}m ${Math.round(seconds % 60)}s`;
  };

  const isMobile = useMobileDetection();
  const bentoProps = useMemo(() => ({
    enableTilt: false,
    enableMagnetism: !isMobile,
    clickEffect: true,
    glowColor: DEFAULT_GLOW_COLOR,
    particleCount: 8,
  }), [isMobile]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
      </div>
    );
  }

  if (error) {
    return <div className="p-8 text-center text-red-400">{error}</div>;
  }

  return (
    <>
      <div className="min-h-screen bg-background p-6" ref={pageRef}>
        <GlobalSpotlight
          pageRef={pageRef}
          disableAnimations={isMobile}
          enabled={true}
          glowColor={DEFAULT_GLOW_COLOR}
        />
        <style>{`
          .particle-card:hover { box-shadow: 0 4px 20px rgba(16, 185, 129, 0.2), 0 0 30px rgba(${DEFAULT_GLOW_COLOR}, 0.1); }
          .particle-card.card--border-glow::after { background: radial-gradient(300px circle at var(--glow-x) var(--glow-y), rgba(${DEFAULT_GLOW_COLOR}, calc(var(--glow-intensity) * 0.8)) 0%, transparent 60%); }
        `}</style>
        
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold gradient-text mb-2">Kairo Plus Analytics</h1>
            <p className="text-muted-foreground">Your daily communication insights.</p>
          </div>

          {summaryData.length === 0 ? (
             <div className="text-center py-16 text-gray-500">
               <BrainCircuit className="mx-auto h-16 w-16 mb-4" />
               <h3 className="text-xl font-semibold text-gray-300">No Analytics Yet</h3>
               <p className="mt-2">Once your sessions are processed, your Kairo Plus dashboard will appear here.</p>
             </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column: Date Selector */}
              <div className="lg:col-span-1">
                <ParticleCard {...bentoProps} className="particle-card card--border-glow p-6 rounded-2xl border border-border/50 h-full">
                  <h2 className="text-xl font-semibold mb-4 text-foreground">Your Activity</h2>
                  <div className="space-y-2 max-h-[70vh] overflow-y-auto">
                    {summaryData.map((day) => (
                      <button key={day.date} onClick={() => handleDateSelect(day.date)} className={`w-full text-left p-3 rounded-lg transition-colors ${selectedDateData?.date === day.date ? "bg-accent/20" : "hover:bg-muted"}`}>
                        <p className="font-semibold">{new Date(day.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        <p className="text-sm text-muted-foreground">Social Time: {formatSeconds(day.socialTime)}</p>
                      </button>
                    ))}
                  </div>
                </ParticleCard>
              </div>

              {/* Right Column: Detailed View */}
              <div className="lg:col-span-2 space-y-8">
                {selectedDateData && (
                  <>
                    <ParticleCard {...bentoProps} className="particle-card card--border-glow p-6 rounded-2xl border border-border/50">
                      <h3 className="text-xl font-semibold mb-4 text-foreground">Daily Summary for {new Date(selectedDateData.date).toLocaleDateString()}</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="p-4 bg-card/50 rounded-lg">
                            <Clock className="h-6 w-6 text-accent mb-2" />
                            <p className="text-sm text-muted-foreground">Total Social Time</p>
                            <p className="text-2xl font-bold">{formatSeconds(selectedDateData.socialTime)}</p>
                        </div>
                        <div className="p-4 bg-card/50 rounded-lg">
                            <Mic className="h-6 w-6 text-accent mb-2" />
                            <p className="text-sm text-muted-foreground">Speaking Time</p>
                            <p className="text-2xl font-bold">{formatSeconds(selectedDateData.totalSpeakingTime)}</p>
                        </div>
                        <div className="p-4 bg-card/50 rounded-lg">
                            <Headphones className="h-6 w-6 text-accent mb-2" />
                            <p className="text-sm text-muted-foreground">Listening Time</p>
                            <p className="text-2xl font-bold">{formatSeconds(selectedDateData.totalListeningTime)}</p>
                        </div>
                        <div className="p-4 bg-card/50 rounded-lg col-span-2 md:col-span-3">
                            <BarChart2 className="h-6 w-6 text-accent mb-2" />
                            <p className="text-sm text-muted-foreground">Speaking vs. Listening Ratio</p>
                            <p className="text-2xl font-bold">{selectedDateData.speakingToListeningRatio.toFixed(2)}</p>
                            <div className="w-full bg-muted rounded-full h-2.5 mt-2">
                                <div className="bg-accent h-2.5 rounded-full" style={{ width: `${Math.min(selectedDateData.speakingToListeningRatio * 50, 100)}%` }}></div>
                            </div>
                        </div>
                      </div>
                    </ParticleCard>

                    <ParticleCard {...bentoProps} className="particle-card card--border-glow p-6 rounded-2xl border border-border/50">
                        <h3 className="text-xl font-semibold mb-4 text-foreground">Sentiment Analysis</h3>
                        <div className="flex justify-around items-center">
                            <div className="text-center">
                                <p className="text-4xl">😊</p>
                                <p className="text-2xl font-bold text-green-400">{selectedDateData.positive_sentiment_count}</p>
                                <p className="text-sm text-muted-foreground">Positive</p>
                            </div>
                            <div className="text-center">
                                <p className="text-4xl">😐</p>
                                <p className="text-2xl font-bold text-blue-400">{selectedDateData.neutral_sentiment_count}</p>
                                <p className="text-sm text-muted-foreground">Neutral</p>
                            </div>
                            <div className="text-center">
                                <p className="text-4xl">😟</p>
                                <p className="text-2xl font-bold text-red-400">{selectedDateData.negative_sentiment_count}</p>
                                <p className="text-sm text-muted-foreground">Negative</p>
                            </div>
                        </div>
                    </ParticleCard>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default KairoPlus;