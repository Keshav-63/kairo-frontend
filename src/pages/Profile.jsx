// Kairo/src/pages/Profile.jsx

"use client"

import { useState, useRef, useMemo, useEffect } from "react"
import toast from "react-hot-toast"
import { ParticleCard } from "../components/ParticleCard" 
import { gsap } from "gsap"; 

// --- START MAGIC BENTO EFFECTS UTILITY CODE ---

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

const GlobalSpotlight = ({
  pageRef, 
  disableAnimations = false,
  enabled = true,
  spotlightRadius = DEFAULT_SPOTLIGHT_RADIUS,
  glowColor = DEFAULT_GLOW_COLOR
}) => {
  const spotlightRef = useRef(null);
  
  useEffect(() => {
    if (disableAnimations || !pageRef?.current || !enabled) return;

    // Remove existing spotlight instance on re-render to prevent duplication
    document.querySelector('.global-spotlight-profile')?.remove();
    
    const spotlight = document.createElement('div');
    spotlight.className = 'global-spotlight-profile'; // Unique class name
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
      if (!spotlightRef.current || !pageRef.current) return;

      const pageRect = pageRef.current.getBoundingClientRect();
      const mouseInside =
        e.clientX >= pageRect.left && e.clientX <= pageRect.right && e.clientY >= pageRect.top && e.clientY <= pageRect.bottom;

      const cards = pageRef.current.querySelectorAll('.particle-card'); // Target elements using the ParticleCard class
      
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

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.querySelector('.global-spotlight-profile')?.remove();
    };
  }, [pageRef, disableAnimations, enabled, spotlightRadius, glowColor]);

  return null;
};

// --- END MAGIC BENTO EFFECTS UTILITY CODE ---

const Profile = ({ user }) => {
  const pageRef = useRef(null) 

  const [isEditing, setIsEditing] = useState(false)
  const [profileData, setProfileData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: "",
    location: "",
    timezone: "UTC-5",
    language: "English",
    notifications: {
      email: true,
      push: true,
      sms: false,
    },
    privacy: {
      dataCollection: true,
      analytics: true,
      marketing: false,
    },
  })
  const [avatar, setAvatar] = useState(user?.avatar || "")
  const fileInputRef = useRef(null)

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    if (name.includes(".")) {
      const [section, field] = name.split(".")
      setProfileData((prev) => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: type === "checkbox" ? checked : value,
        },
      }))
    } else {
      setProfileData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }))
    }
  }

  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader()
        reader.onload = (e) => {
          setAvatar(e.target.result)
          toast.success("Avatar updated successfully!")
        }
        reader.readAsDataURL(file)
      } else {
        toast.error("Please upload a valid image file.")
      }
    }
  }

  const handleSave = () => {
    // In a real app, you would save to backend
    localStorage.setItem("kairo_user_profile", JSON.stringify({ ...profileData, avatar }))
    setIsEditing(false)
    toast.success("Profile updated successfully!")
  }

  const handleCancel = () => {
    setIsEditing(false)
    // Reset to original values
    setProfileData({
      name: user?.name || "",
      email: user?.email || "",
      phone: "",
      location: "",
      timezone: "UTC-5",
      language: "English",
      notifications: {
        email: true,
        push: true,
        sms: false,
      },
      privacy: {
        dataCollection: true,
        analytics: true,
        marketing: false,
      },
    })
    setAvatar(user?.avatar || "")
  }

  const exportData = () => {
    const userData = {
      profile: profileData,
      history: JSON.parse(localStorage.getItem("kairo_query_history") || "[]"),
      enrolledVoices: JSON.parse(localStorage.getItem("kairo_enrolled_voices") || "[]"),
      exportDate: new Date().toISOString(),
    }

    const dataStr = JSON.stringify(userData, null, 2)
    const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr)
    const exportFileDefaultName = `kairo-data-export-${new Date().toISOString().split("T")[0]}.json`

    const linkElement = document.createElement("a")
    linkElement.setAttribute("href", dataUri)
    linkElement.setAttribute("download", exportFileDefaultName)
    linkElement.click()

    toast.success("Data exported successfully!")
  }

  const deleteAccount = () => {
    if (window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      localStorage.clear()
      toast.success("Account deleted successfully!")
      // In a real app, you would redirect to login or handle logout
    }
  }

  const stats = [
    {
      label: "Queries Asked",
      value: JSON.parse(localStorage.getItem("kairo_query_history") || "[]").length,
      icon: "町",
    },
    {
      label: "Voices Enrolled",
      value: JSON.parse(localStorage.getItem("kairo_enrolled_voices") || "[]").length,
      icon: "痔",
    },
    {
      label: "Days Active",
      value: Math.floor((Date.now() - new Date(user?.joinedAt || Date.now()).getTime()) / (1000 * 60 * 60 * 24)),
      icon: "套",
    },
    {
      label: "Storage Used",
      value: "2.4 GB",
      icon: "沈",
    },
  ]
  
  // --- Magic Bento Setup ---
  const isMobile = useMobileDetection();
  const shouldDisableAnimations = isMobile;
  const glowColor = DEFAULT_GLOW_COLOR;
  const spotlightRadius = DEFAULT_SPOTLIGHT_RADIUS;
  
  const bentoProps = useMemo(() => ({
    enableTilt: false, // *** CHANGED: Tilt disabled here ***
    enableMagnetism: true,
    clickEffect: true,
    glowColor: glowColor,
    particleCount: 12,
  }), [glowColor]);
  // --- End Magic Bento Setup ---


  return (
    <div className="min-h-screen bg-background p-6" ref={pageRef}>
      
      {/* 1. Inject Global Spotlight and CSS Variables */}
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
            /* Injecting CSS variables and styles for card effects on this page */
            .particle-card { 
                position: relative; 
                transform-style: preserve-3d;
            }
            .particle-card:hover {
                 box-shadow: 0 4px 20px rgba(46, 24, 78, 0.4), 0 0 30px rgba(${glowColor}, 0.2);
            }
            .particle-card.card--border-glow::after {
                content: '';
                position: absolute;
                inset: 0;
                padding: 6px;
                background: radial-gradient(${spotlightRadius}px circle at var(--glow-x) var(--glow-y),
                  rgba(${glowColor}, calc(var(--glow-intensity) * 0.8)) 0%,
                  rgba(${glowColor}, calc(var(--glow-intensity) * 0.4)) 30%,
                  transparent 60%);
                border-radius: inherit;
                mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
                mask-composite: subtract;
                -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
                -webkit-mask-composite: xor;
                pointer-events: none;
                transition: opacity 0.3s ease;
                z-index: 1;
            }
            .particle-card.card--border-glow:hover::after { opacity: 1; }
            .particle-card .particle { z-index: 101; }
            `}
          </style>
        </>
      )}

      <div className="max-w-7xl mx-auto">
        {/* Header (No Card Wrap) */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold gradient-text mb-2">Profile Settings</h1>
            <p className="text-muted-foreground">Manage your account information and preferences</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={exportData}
              className="px-4 py-2 bg-accent/10 hover:bg-accent/20 text-accent border border-accent/20 rounded-lg transition-colors"
            >
              Export Data
            </button>
            {isEditing ? (
              <div className="flex gap-2">
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 bg-muted hover:bg-muted/80 text-muted-foreground rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors glow-primary"
                >
                  Save Changes
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-lg transition-colors"
              >
                Edit Profile
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Info (lg:col-span-2) */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Basic Information - Wrapped with ParticleCard */}
            <ParticleCard {...bentoProps} className="particle-card card--border-glow backdrop-blur-glass rounded-2xl border border-border/50 p-8">
              <h2 className="text-xl font-semibold mb-6 text-foreground">Basic Information</h2>

              {/* ... (rest of Basic Info content) ... */}
              <div className="flex items-center space-x-6 mb-8">
                <div className="relative">
                  <img
                    src={avatar || "/placeholder.svg"}
                    alt="Profile"
                    className="w-24 h-24 rounded-full border-4 border-primary/20 object-cover"
                  />
                  {isEditing && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute -bottom-2 -right-2 w-8 h-8 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full flex items-center justify-center transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                    </button>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </div>
                <div>
                  <h3 className="text-2xl font-semibold text-foreground">{profileData.name}</h3>
                  <p className="text-muted-foreground">{profileData.email}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Member since {new Date(user?.joinedAt || Date.now()).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2 text-foreground">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={profileData.name}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-foreground">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={profileData.email}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-foreground">Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={profileData.phone}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    placeholder="Enter phone number"
                    className="w-full px-4 py-3 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-foreground">Location</label>
                  <input
                    type="text"
                    name="location"
                    value={profileData.location}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    placeholder="Enter location"
                    className="w-full px-4 py-3 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-foreground">Timezone</label>
                  <select
                    name="timezone"
                    value={profileData.timezone}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors disabled:opacity-50"
                  >
                    <option value="UTC-12">UTC-12</option>
                    <option value="UTC-8">UTC-8 (PST)</option>
                    <option value="UTC-5">UTC-5 (EST)</option>
                    <option value="UTC+0">UTC+0 (GMT)</option>
                    <option value="UTC+1">UTC+1 (CET)</option>
                    <option value="UTC+8">UTC+8 (CST)</option>
                    <option value="UTC+9">UTC+9 (JST)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-foreground">Language</label>
                  <select
                    name="language"
                    value={profileData.language}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors disabled:opacity-50"
                  >
                    <option value="English">English</option>
                    <option value="Spanish">Spanish</option>
                    <option value="French">French</option>
                    <option value="German">German</option>
                    <option value="Chinese">Chinese</option>
                    <option value="Japanese">Japanese</option>
                  </select>
                </div>
              </div>
            </ParticleCard>

            {/* Notification Settings - Wrapped with ParticleCard */}
            <ParticleCard {...bentoProps} className="particle-card card--border-glow backdrop-blur-glass rounded-2xl border border-border/50 p-8">
              <h2 className="text-xl font-semibold mb-6 text-foreground">Notification Preferences</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-foreground">Email Notifications</h3>
                    <p className="text-sm text-muted-foreground">Receive updates and alerts via email</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="notifications.email"
                      checked={profileData.notifications.email}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-foreground">Push Notifications</h3>
                    <p className="text-sm text-muted-foreground">Receive push notifications on your device</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="notifications.push"
                      checked={profileData.notifications.push}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-foreground">SMS Notifications</h3>
                    <p className="text-sm text-muted-foreground">Receive important alerts via SMS</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="notifications.sms"
                      checked={profileData.notifications.sms}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
              </div>
            </ParticleCard>

            {/* Privacy Settings - Wrapped with ParticleCard */}
            <ParticleCard {...bentoProps} className="particle-card card--border-glow backdrop-blur-glass rounded-2xl border border-border/50 p-8">
              <h2 className="text-xl font-semibold mb-6 text-foreground">Privacy & Data</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-foreground">Data Collection</h3>
                    <p className="text-sm text-muted-foreground">Allow collection of usage data to improve services</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="privacy.dataCollection"
                      checked={profileData.privacy.dataCollection}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-foreground">Analytics</h3>
                    <p className="text-sm text-muted-foreground">Help us understand how you use Kairo</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="privacy.analytics"
                      checked={profileData.privacy.analytics}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-foreground">Marketing Communications</h3>
                    <p className="text-sm text-muted-foreground">Receive promotional emails and updates</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="privacy.marketing"
                      checked={profileData.privacy.marketing}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
              </div>
            </ParticleCard>

            {/* Danger Zone - Wrapped with ParticleCard (using a different color scheme for visual distinction) */}
            <ParticleCard 
                {...bentoProps} 
                glowColor="239, 68, 68" // Red glow for danger zone
                className="particle-card card--border-glow backdrop-blur-glass rounded-2xl border border-destructive/20 p-8"
            >
              <h2 className="text-xl font-semibold mb-6 text-destructive">Danger Zone</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-destructive/5 rounded-lg border border-destructive/20">
                  <div>
                    <h3 className="font-medium text-foreground">Delete Account</h3>
                    <p className="text-sm text-muted-foreground">
                      Permanently delete your account and all associated data
                    </p>
                  </div>
                  <button
                    onClick={deleteAccount}
                    className="px-4 py-2 bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-lg transition-colors"
                  >
                    Delete Account
                  </button>
                </div>
              </div>
            </ParticleCard>
          </div>

          {/* Stats Sidebar (lg:col-span-1) */}
          {/* <div className="lg:col-span-1">
            <ParticleCard {...bentoProps} className="particle-card card--border-glow backdrop-blur-glass rounded-2xl border border-border/50 p-6 sticky top-6">
              <h3 className="text-xl font-semibold mb-6 text-foreground">Account Statistics</h3>
              <div className="space-y-6">
                {stats.map((stat, index) => (
                  <div key={index} className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-2xl">
                      {stat.icon}
                    </div>
                    <div>
                      <div className="text-2xl font-bold gradient-text">{stat.value}</div>
                      <div className="text-sm text-muted-foreground">{stat.label}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 pt-6 border-t border-border/50">
                <h4 className="font-semibold mb-4 text-foreground">Quick Actions</h4>
                <div className="space-y-3">
                  <button className="w-full text-left p-3 hover:bg-muted/20 rounded-lg transition-colors text-sm">
                    Download Mobile App
                  </button>
                  <button className="w-full text-left p-3 hover:bg-muted/20 rounded-lg transition-colors text-sm">
                    Connect Kairo Device
                  </button>
                  <button className="w-full text-left p-3 hover:bg-muted/20 rounded-lg transition-colors text-sm">
                    View Usage Analytics
                  </button>
                  <button className="w-full text-left p-3 hover:bg-muted/20 rounded-lg transition-colors text-sm">
                    Contact Support
                  </button>
                </div>
              </div>
            </ParticleCard>
          </div> */}
        </div>
      </div>
    </div>
  )
}

export default Profile