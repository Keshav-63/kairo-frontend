// kairo-frontend/src/pages/HomePage.jsx

"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import Script from "next/script"
import { ParticleCard } from "../components/ParticleCard";
// We need 'gsap' if it's used in the utility code
import { gsap } from "gsap"; 

// --- START: Dedicated GradientText Component for Animated Fill ---
const GradientText = ({ children, className, colors, animationSpeed }) => {
  const gradientStyle = {
    backgroundImage: `linear-gradient(to right, ${colors.join(', ')})`,
    animationDuration: `${animationSpeed}s`,
  };

  return (
    <span
      className={`inline-block relative text-transparent animate-gradient ${className}`}
      style={{
        ...gradientStyle,
        backgroundClip: 'text',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundSize: '300% 100%'
      }}
    >
      {children}
    </span>
  );
};
// --- END: Dedicated GradientText Component ---


// --- START MAGIC BENTO EFFECTS UTILITY CODE ---
// (Your existing code... no changes needed here)

const DEFAULT_SPOTLIGHT_RADIUS = 300;
// *** MODIFICATION: Changed default glow to a vibrant Gold ***
const DEFAULT_GLOW_COLOR = '251, 176, 59'; // This is our new gold: #FBB03B
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
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const checkMobile = () => setIsMobile(window.innerWidth <= MOBILE_BREAKPOINT);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
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
    if (disableAnimations || !pageRef?.current || !enabled) {
      const existingSpotlight = document.querySelector('.global-spotlight-homepage');
      if (existingSpotlight) existingSpotlight.remove();
      return;
    }

    document.querySelector('.global-spotlight-homepage')?.remove();

    const spotlight = document.createElement('div');
    spotlight.className = 'global-spotlight-homepage';
    spotlight.style.cssText = `
      position: fixed; width: 800px; height: 800px; border-radius: 50%;
      pointer-events: none; z-index: 200; opacity: 0; transform: translate(-50%, -50%);
      mix-blend-mode: screen;
      background: radial-gradient(circle,
        rgba(${glowColor}, 0.15) 0%, rgba(${glowColor}, 0.08) 15%, rgba(${glowColor}, 0.04) 25%,
        rgba(${glowColor}, 0.02) 40%, rgba(${glowColor}, 0.01) 65%, transparent 70%);
    `;
    document.body.appendChild(spotlight);
    spotlightRef.current = spotlight;

    const handleMouseMove = e => {
      const spot = spotlightRef.current;
      const page = pageRef.current;
      if (!spot || !page) return;

      const pageRect = page.getBoundingClientRect();
      const mouseInside = e.clientX >= pageRect.left && e.clientX <= pageRect.right &&
                          e.clientY >= pageRect.top && e.clientY <= pageRect.bottom;

      const cards = page.querySelectorAll('.particle-card'); 

      if (!mouseInside) {
        if (spot) gsap.to(spot, { opacity: 0, duration: 0.3 });
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
        const effectiveDistance = Math.max(0, distance - Math.max(cardRect.width, cardRect.height) / 3);

        minDistance = Math.min(minDistance, effectiveDistance);

        let glowIntensity = 0;
        if (effectiveDistance <= proximity) {
          glowIntensity = 1;
        } else if (effectiveDistance <= fadeDistance) {
          glowIntensity = (fadeDistance - effectiveDistance) / (fadeDistance - proximity);
        }
        updateCardGlowProperties(card, e.clientX, e.clientY, glowIntensity, spotlightRadius);
      });

      if (spot) gsap.to(spot, { left: e.clientX, top: e.clientY, duration: 0.1 });

      const targetOpacity =
        minDistance <= proximity ? 0.8 :
        minDistance <= fadeDistance ? ((fadeDistance - minDistance) / (fadeDistance - proximity)) * 0.8 : 0;

      if (spot) gsap.to(spot, { opacity: targetOpacity, duration: targetOpacity > 0 ? 0.2 : 0.5 });
    };

    document.addEventListener('mousemove', handleMouseMove);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      if (spotlightRef.current) {
        spotlightRef.current.remove();
        spotlightRef.current = null;
      }
    };
  }, [pageRef, disableAnimations, enabled, spotlightRadius, glowColor]);

  return null;
};
// --- END MAGIC BENTO EFFECTS UTILITY CODE ---


const HomePage = () => {
  const [currentFeature, setCurrentFeature] = useState(0);
  const pageRef = useRef(null); 
  const isMobile = useMobileDetection();
  const shouldDisableAnimations = isMobile;
  const glowColor = DEFAULT_GLOW_COLOR; // This is now our Gold color
  const spotlightRadius = DEFAULT_SPOTLIGHT_RADIUS;
  const videoRef = useRef(null); // *** NEW: Create a ref for the video element ***

  // Gold color palette definitions
  const goldGradient = ["#FFD700", "#FBB03B", "#E6A919"]; // Liquid Gold
  const goldColor = "#FBB03B"; // Primary warm gold
  const goldColorBright = "#FFD700"; // Brighter gold for hover
  const goldDarkText = "#1F1F1F"; // Dark text for contrast on gold buttons

  const features = [
    {
      title: "Multilingual Support",
      description: "Communicate in over 100 languages with real-time translation",
      icon: "🌍", 
      color: "from-blue-500 to-cyan-500",
    },
    {
      title: "Cost Effective",
      description: "Premium AI technology at an affordable price point",
      icon: "💰",
      color: "from-green-500 to-emerald-500",
    },
    {
      title: "AI Memory Recall",
      description: "Never forget important conversations and moments",
      icon: "🧠",
      color: "from-purple-500 to-pink-500",
    },
    {
      title: "Voice Recognition",
      description: "Advanced voice enrollment and speaker identification",
      icon: "🎤",
      color: "from-orange-500 to-red-500",
    },
  ];

  const stats = [
    { label: "Active Users", value: "50K+" },
    { label: "Languages Supported", value: "100+" },
    { label: "Recall Accuracy", value: "99.9%" },
    { label: "Battery Life", value: "7 Days" },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [features.length]); 

  // --- Bento Props for ParticleCard ---
    const bentoProps = useMemo(() => ({
      enableTilt: !isMobile,
      enableMagnetism: !isMobile,
      clickEffect: true,
      glowColor: glowColor,
      particleCount: 8, 
    }), [isMobile, glowColor]);

  // *** NEW: Add event handler for when the video ends ***
  const handleVideoEnd = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 5.1; // Go to 5-second mark
      videoRef.current.pause(); // Ensure it stays paused
    }
  };


  return (
    <div className="min-h-screen bg-background font-sans" ref={pageRef}> {/* Added pageRef and font-sans */}
      <Script type="module" src="https://unpkg.com/@splinetool/viewer@1.10.71/build/spline-viewer.js" />

        {/* --- Inject Global Spotlight and Styles --- */}
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
              /* Define animation for gradient text */
              @keyframes gradient {
                0%, 100% { background-position: 0% 50%; }
                50% { background-position: 100% 50%; }
              }
              .animate-gradient {
                animation: gradient 5s ease infinite;
              }

              /* *** MODIFICATION: Redefined glows for new Gold theme *** */
              .glow-primary {
                box-shadow: 0 0 10px rgba(251, 176, 59, 0.7), 0 0 20px rgba(251, 176, 59, 0.5);
                transition: box-shadow 0.3s ease-in-out;
              }
              .glow-primary:hover {
                box-shadow: 0 0 20px rgba(255, 215, 0, 1), 0 0 30px rgba(255, 215, 0, 0.7);
              }
              /* Accent glow is now a clean, technical white */
              .glow-accent {
                box-shadow: 0 0 10px rgba(255, 255, 255, 0.7), 0 0 20px rgba(255, 255, 255, 0.5);
              }

              .particle-card {
                --glow-color: ${glowColor}; /* This now uses the gold RGB */
                position: relative;
                transform-style: preserve-3d;
              }
              .particle-card:hover {
                  box-shadow: 0 6px 25px rgba(var(--glow-color), 0.2), 0 0 40px rgba(var(--glow-color), 0.1);
              }
              .particle-card.card--border-glow::after {
                content: ''; position: absolute; inset: 0; padding: 2px; 
                background: radial-gradient(var(--glow-radius, ${spotlightRadius}px) circle at var(--glow-x) var(--glow-y),
                  rgba(var(--glow-color), calc(var(--glow-intensity, 0) * 0.6)) 0%,
                  transparent 50%); 
                border-radius: inherit;
                mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
                mask-composite: subtract;
                -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
                -webkit-mask-composite: xor;
                pointer-events: none; transition: opacity 0.3s ease; z-index: 1; opacity: var(--glow-intensity, 0);
              }
              .particle-card .particle { z-index: 2; }
            `}
          </style>
        </>
      )}
        {/* --- End Spotlight --- */}

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <video
          ref={videoRef} // *** NEW: Attach the ref to the video element ***
          autoPlay
          // loop // <-- Removed loop
          muted
          playsInline 
          onEnded={handleVideoEnd} // *** NEW: Call the handler when the video ends ***
          className="absolute z-0 w-full h-full object-cover"
        >
          <source src="/Pendant_Commercial_Video_Creation (1).mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        <div className="absolute inset-0 bg-black opacity-60 z-0"></div> {/* Slightly darker overlay for more contrast */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 text-center py-20">
          <div className="animate-fadeIn">
            {/* *** MODIFICATION: New Hero Text Styling *** */}
            <h1 className="text-6xl md:text-8xl font-black mb-6 text-balance"> {/* font-black for max impact */}
              <GradientText
                className="text-6xl md:text-8xl"
                // New "Liquid Gold" gradient
                colors={[goldColorBright, goldColor, "#E6A919", goldColorBright]} 
                animationSpeed={4}
              >
                Kairo
              </GradientText>
              <br />
              {/* Solid "Tungsten" white for high contrast */}
              <span className="text-white"> 
                AI Smart Pendant
              </span>
            </h1>
            {/* Solid, bright gray for subtitle. No gradient. */}
            <p
              className="text-xl md:text-2xl text-gray-200 mb-8 max-w-3xl mx-auto text-pretty font-normal"
            >
              A Wearable Conversational Memory Assistant with AI-Based Recall
            </p>
            {/* *** MODIFICATION: New Button Styling *** */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <button className={`px-8 py-4 bg-[${goldColor}] hover:bg-[${goldColorBright}] text-[${goldDarkText}] font-semibold rounded-xl transition-all glow-primary hover:scale-105`}>
                Get Started
              </button>
              <button className={`px-8 py-4 bg-transparent border-2 border-[${goldColor}] text-[${goldColor}] hover:bg-[${goldColor}]/10 font-semibold rounded-xl transition-all hover:scale-105`}>
                Watch Demo
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            {/* *** MODIFICATION: Replaced .gradient-text with GradientText component *** */}
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              <GradientText
                className="text-4xl md:text-5xl"
                colors={goldGradient}
                animationSpeed={5}
              >
                Why Choose Kairo?
              </GradientText>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Experience the future of wearable AI technology with features designed for your everyday life
            </p>
          </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 mb-16">
            {/* *** MODIFICATION: Updated hover border color *** */}
              <ParticleCard {...bentoProps} className={`particle-card card--border-glow rounded-2xl border border-border/50 transition-all duration-300 hover:border-[${goldColor}]/30`}>
                <div className="p-6 md:p-8 h-full flex flex-col">
                  <img
                    src="https://innovatureinc.com/wp-content/uploads/2021/12/Innovature-outsourcing-Vietnam_Customer-Services-6.jpg"
                    alt="Multilingual Support"
                    className="w-full h-40 object-cover rounded-xl mb-4"
                  />
                  <h3 className="text-xl font-semibold text-foreground mb-2">{features[0].title}</h3>
                  <p className="text-muted-foreground text-sm flex-grow">{features[0].description}</p>
                </div>
              </ParticleCard>

              <ParticleCard {...bentoProps} className={`particle-card card--border-glow rounded-2xl border border-border/50 transition-all duration-300 hover:border-[${goldColor}]/30 lg:col-span-2 flex flex-col`}>
                 <div className="p-6 md:p-8 h-full flex flex-col">
                     <div className="flex-grow w-full h-64 md:h-72 mb-4 rounded-xl overflow-hidden">
                       <spline-viewer loading-anim-type="spinner-small-light" url="https://prod.spline.design/YZmCU40ik-RXdWwB/scene.splinecode" className="w-full h-full"></spline-viewer>
                     </div>
                     <h3 className="text-xl font-semibold text-foreground mb-2">{features[2].title}</h3>
                     <p className="text-muted-foreground text-sm">{features[2].description}</p>
                 </div>
              </ParticleCard>

              <ParticleCard {...bentoProps} className={`particle-card card--border-glow rounded-2xl border border-border/50 transition-all duration-300 hover:border-[${goldColor}]/30`}>
                <div className="p-6 md:p-8 h-full flex flex-col">
                  <img
                    src="https://yourtechdiet.com/wp-content/uploads/2024/11/Voice-Recognition-1-696x418.jpg.webp"
                    alt="Voice Recognition"
                    className="w-full h-40 object-cover rounded-xl mb-4"
                  />
                  <h3 className="text-xl font-semibold text-foreground mb-2">{features[3].title}</h3>
                  <p className="text-muted-foreground text-sm flex-grow">{features[3].description}</p>
                </div>
              </ParticleCard>
            </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {stats.map((stat, index) => (
              <ParticleCard
                key={index}
                {...bentoProps} 
                enableTilt={false} 
                enableMagnetism={false}
                particleCount={4} 
                className={`particle-card card--border-glow rounded-xl border border-border/50 backdrop-blur-sm bg-card/30 transition-all duration-300 hover:border-[${goldColor}]/40`}
              >
                <div className="p-4 md:p-6 text-center">
                    {/* *** MODIFICATION: Replaced .gradient-text with GradientText component *** */}
                  <div className="text-3xl md:text-4xl font-bold mb-1">
                      <GradientText
                        className="text-3xl md:text-4xl"
                        colors={goldGradient}
                        animationSpeed={6}
                      >
                        {stat.value}
                      </GradientText>
                    </div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              </ParticleCard>
            ))}
          </div>
        </div>
      </section>

      {/* Product in Action Section */}
        <section className="py-20 px-6 bg-card/30">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                <GradientText
                  className="text-4xl md:text-5xl"
                  colors={goldGradient}
                  animationSpeed={5}
                >
                  Kairo: Your AI Copilot
                </GradientText>
              </h2>
              <p className="text-xl text-muted-foreground mb-6">
                Kairo is more than just a recording device; it's an intelligent copilot that captures, understands, and recalls your most important moments. With a seamless user experience, Kairo integrates into your daily life without distraction.
              </p>
              <div className="space-y-4">
                 <div className="flex items-start space-x-3">
                  {/* *** MODIFICATION: Updated icon background *** */}
                  <div className={`w-10 h-10 bg-[${goldColor}]/10 rounded-full flex items-center justify-center flex-shrink-0 glow-primary`}>
                    <span className="text-lg">✨</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">Effortless Integration</h4>
                    <p className="text-sm text-muted-foreground">The lightweight pendant and intuitive app work in harmony to provide a powerful, yet simple, experience.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-gray-500/10 rounded-full flex items-center justify-center flex-shrink-0 glow-accent">
                    <span className="text-lg">🔒</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">Secure & Private</h4>
                    <p className="text-sm text-muted-foreground">All your data is encrypted and stored securely, giving you full control over your memories and conversations.</p>
                  </div>
                </div>
              </div>
            </div>
            <ParticleCard {...bentoProps} className="particle-card card--border-glow rounded-2xl border border-border/50 overflow-hidden">
              <img
                src="https://media.wired.jp/photos/66b00adabceccc5410e95994/master/w_2560%2Cc_limit/friend_1-Gear.jpg"
                alt="Kairo in action"
                className="w-full h-auto object-cover" 
              />
            </ParticleCard>
          </div>
        </section>


      {/* How It Works Section */}
        <section className="py-20 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                <GradientText
                  className="text-4xl md:text-5xl"
                  colors={goldGradient}
                  animationSpeed={5}
                >
                  Simple to Use, Powerful in Practice
                </GradientText>
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Kairo's three-step process makes capturing and recalling memories easier than ever.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
              {[
                { step: "01", title: "Wear & Connect", description: "Simply wear your Kairo pendant and connect it to your smartphone via our app.", image: "https://i.etsystatic.com/39807424/r/il/d1b0fd/6927613280/il_1080xN.6927613280_fygb.jpg" },
                { step: "02", title: "Capture & Transcribe", description: "The pendant listens and transcribes your conversations, securely storing them in your personal memory.", image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSI1wwPSIqIVLSxUd5mXLu3uadvrAgOr9gprw&s" },
                { step: "03", title: "Recall & Discover", description: "Ask Kairo anything about your conversations and get instant, accurate responses.", image: "https://i.guim.co.uk/img/media/600fff7be418e0e9a6a514d2cae864bc59ec7560/0_0_2560_1536/master/2560.jpg?width=1200&height=1200&quality=85&auto=format&fit=crop&s=e42c5226268dbbb40c224b5886d830c1" },
              ].map((item, index) => (
                <ParticleCard key={index} {...bentoProps} className={`particle-card card--border-glow rounded-2xl border border-border/50 bg-card/30 backdrop-blur-sm transition-all duration-300 hover:border-[${goldColor}]/40`}>
                  <div className="text-center group p-6 h-full flex flex-col">
                    <div className="relative mb-6">
                      <div className={`w-full aspect-video mx-auto rounded-xl overflow-hidden border border-border/50 group-hover:border-[${goldColor}]/30 transition-colors`}>
                        <img src={item.image || "/placeholder.svg"} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      </div>
                       {/* *** MODIFICATION: Step number styled with new theme *** */}
                      <div className={`absolute -top-3 -right-3 w-10 h-10 bg-[${goldColor}] text-[${goldDarkText}] rounded-full flex items-center justify-center font-bold text-base glow-primary`}>
                        {item.step}
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold mb-2 text-foreground">{item.title}</h3>
                    <p className="text-muted-foreground text-sm flex-grow">{item.description}</p>
                  </div>
                </ParticleCard>
              ))}
            </div>
          </div>
        </section>

      {/* Use Cases Section */}
        <section className="py-20 px-6 bg-card/30">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                <GradientText
                  className="text-4xl md:text-5xl"
                  colors={goldGradient}
                  animationSpeed={5}
                >
                  Your Life, Powered by Kairo
                </GradientText>
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Whether you're in a meeting or in the classroom, Kairo has you covered.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {[
                  { title: "For Professionals", description: "Capture meeting minutes, track action items, and recall key discussion points to boost your productivity and stay organized.", image: "https://images.unsplash.com/photo-1552581234-26160f608093?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" },
                  { title: "For Students & Learners", description: "Record lectures and study sessions, then use Kairo's AI to summarize complex topics and find specific information instantly.", image: "https://www.shutterstock.com/image-photo/industry-40-concept-man-engineer-260nw-1558624259.jpg" },
                  { title: "For Travelers", description: "Communicate with ease in any country with real-time translation and remember the names and places you visit along the way.", image: "https://i.ebayimg.com/images/g/PoYAAOSwE4pnu4Vq/s-l1200.jpg" }
              ].map((useCase, index) => (
                 <ParticleCard key={index} {...bentoProps} className={`particle-card card--border-glow rounded-2xl border border-border/50 backdrop-blur-sm bg-background/20 transition-all duration-300 hover:border-[${goldColor}]/40`}>
                   <div className="p-6 md:p-8 h-full flex flex-col">
                     <img src={useCase.image} alt={useCase.title} className="w-full h-40 object-cover rounded-xl mb-4" />
                     <h3 className="text-xl font-semibold text-foreground mb-2">{useCase.title}</h3>
                     <p className="text-muted-foreground text-sm flex-grow">{useCase.description}</p>
                   </div>
                 </ParticleCard>
              ))}
            </div>
          </div>
        </section>

      {/* Technical Highlights Section */}
        <section className="py-20 px-6">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            {/* *** MODIFICATION: Changed glow to clean white 'glow-accent' *** */}
            <ParticleCard {...bentoProps} glowColor={glowColor} className="particle-card card--border-glow rounded-2xl border border-border/50 glow-accent overflow-hidden order-2 md:order-1 w-full aspect-square">
                 <spline-viewer loading-anim-type="spinner-small-dark" url="https://prod.spline.design/bijOXfUkuzywfqxf/scene.splinecode"></spline-viewer>
            </ParticleCard>
            <div className="order-1 md:order-2">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                <GradientText
                  className="text-4xl md:text-5xl"
                  colors={goldGradient}
                  animationSpeed={5}
                >
                  Designed for Tomorrow
                </GradientText>
              </h2>
              <p className="text-xl text-muted-foreground mb-8">
                Kairo's core is built on a powerful, scalable platform, providing unparalleled performance and features.
              </p>
              <ul className="space-y-4">
                {["Advanced AI Memory and recall algorithms", "Seamless Voice Recognition and speaker enrollment", "Full Multilingual Support for global communication", "Cost-effective with premium technology"].map((item, index) => (
                   <li key={index} className="flex items-center space-x-3">
                       <svg className={`w-5 h-5 text-[${goldColor}] flex-shrink-0`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                       <p className="text-lg text-foreground">{item}</p>
                   </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

      {/* Testimonials Section */}
        <section className="py-20 px-6 bg-card/30">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                <GradientText
                  className="text-4xl md:text-5xl"
                  colors={goldGradient}
                  animationSpeed={5}
                >
                  What Users Say
                </GradientText>
              </h2>
              <p className="text-xl text-muted-foreground">Real experiences from our community</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
              {[
                { name: "Sarah Chen", role: "Business Executive", content: "Kairo has revolutionized how I manage my meetings. I never miss important details anymore!", avatar: "https://t4.ftcdn.net/jpg/11/66/06/77/360_F_1166067709_2SooAuPWXp20XkGev7oOT7nuK1VThCsN.jpg", rating: 5 },
                { name: "Dr. Michael Rodriguez", role: "Medical Professional", content: "The multilingual support is incredible. I can communicate with patients in their native language.", avatar: "https://img.freepik.com/premium-psd/professional-male-doctor-avatar-medical-healthcare-use_971991-31735.jpg", rating: 5 },
                { name: "Emma Thompson", role: "Student", content: "As a student, Kairo helps me remember lectures and study sessions. It's like having a personal assistant!", avatar: "https://media.craiyon.com/2025-08-06/I4aOcDngQQOczPuLsTZVGA.webp", rating: 5 },
              ].map((testimonial, index) => (
                 <ParticleCard key={index} {...bentoProps} className={`particle-card card--border-glow rounded-2xl border border-border/50 backdrop-blur-sm bg-background/20 transition-all duration-300 hover:border-[${goldColor}]/40`}>
                   <div className="p-6 md:p-8 h-full flex flex-col">
                       <div className="flex items-center mb-3">
                         {[...Array(testimonial.rating)].map((_, i) => (
  <svg key={i} className="w-4 h-4 text-yellow-400 fill-current mr-0.5" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                         ))}
                       </div>
                       <p className="text-muted-foreground mb-4 italic text-sm flex-grow">"{testimonial.content}"</p>
                       <div className="flex items-center mt-auto">
                         <img src={testimonial.avatar || "/placeholder.svg"} alt={testimonial.name} className={`w-10 h-10 rounded-full border-2 border-[${goldColor}]/20 mr-3`} />
                         <div>
                           <div className="font-semibold text-foreground text-sm">{testimonial.name}</div>
                           <div className="text-xs text-muted-foreground">{testimonial.role}</div>
                         </div>
                       </div>
                    </div>
                 </ParticleCard>
              ))}
            </div>
          </div>
        </section>


      {/* Revised CTA Section */}
      <section className="relative py-20 px-6 overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-50">
          <spline-viewer loading-anim-type="spinner-small-light" url="https://prod.spline.design/mUvERXP1hXcwSmFC/scene.splinecode"></spline-viewer>
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent"></div>
        </div>
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            <GradientText
              className="text-4xl md:text-5xl"
              colors={goldGradient}
              animationSpeed={5}
            >
              Ready to Experience the Future?
            </GradientText>
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join thousands of users who have already transformed their daily interactions with Kairo
          </p>
          {/* *** MODIFICATION: Final CTA buttons themed *** */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className={`px-8 py-4 bg-[${goldColor}] hover:bg-[${goldColorBright}] text-[${goldDarkText}] font-semibold rounded-xl transition-all glow-primary hover:scale-105`}>
              Start Your Journey
            </button>
            {/* Secondary button is now Tungsten (white/gray) */}
            <button className="px-8 py-4 bg-transparent border-2 border-gray-300 text-gray-300 hover:bg-gray-300/10 font-semibold rounded-xl transition-all hover:scale-105">
              Learn More
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 text-center text-muted-foreground text-sm">
        <p>&copy; {new Date().getFullYear()} Kairo AI. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default HomePage;