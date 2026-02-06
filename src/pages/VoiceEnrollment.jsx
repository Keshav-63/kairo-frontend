
// Kairo/src/pages/VoiceEnrollment.jsx
"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import toast from "react-hot-toast"
import { ParticleCard } from "../components/ParticleCard"
import { gsap } from "gsap";
import { enrollVoice } from "../api/axios"; // Import the API function
import useAuthStore from "../stores/authStore"; // Import the auth store

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

    document.querySelector('.global-spotlight-enrollment')?.remove();

    const spotlight = document.createElement('div');
    spotlight.className = 'global-spotlight-enrollment';
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

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.querySelector('.global-spotlight-enrollment')?.remove();
    };
  }, [pageRef, disableAnimations, enabled, spotlightRadius, glowColor]);

  return null;
};

// --- END MAGIC BENTO EFFECTS UTILITY CODE ---

const VoiceEnrollment = () => {
  const [enrollmentMethod, setEnrollmentMethod] = useState("record") // 'record' or 'upload'
  const [speakerName, setSpeakerName] = useState("")
  const [relationship, setRelationship] = useState(""); // ADDED: State for relationship
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioBlob, setAudioBlob] = useState(null)
  const [uploadedFile, setUploadedFile] = useState(null)
  const [enrolledVoices, setEnrolledVoices] = useState([])
  const [currentStep, setCurrentStep] = useState(1)
  const [isProcessing, setIsProcessing] = useState(false)
  const { user } = useAuthStore(); // ADDED: Get user from auth store

  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const fileInputRef = useRef(null)
  const timerRef = useRef(null)
  const pageRef = useRef(null)

  const sampleTexts = [
    "The quick brown fox jumps over the lazy dog. This pangram contains every letter of the alphabet and helps us analyze your unique voice patterns.",
    "In a hole in the ground there lived a hobbit. Not a nasty, dirty, wet hole filled with the ends of worms and an oozy smell, nor yet a dry, bare, sandy hole.",
    "To be or not to be, that is the question. Whether 'tis nobler in the mind to suffer the slings and arrows of outrageous fortune, or to take arms against a sea of troubles.",
    "It was the best of times, it was the worst of times. It was the age of wisdom, it was the age of foolishness, it was the epoch of belief, it was the epoch of incredulity.",
    "Call me Ishmael. Some years ago, never mind how long precisely, having little or no money in my purse, and nothing particular to interest me on shore.",
  ]

  const [selectedText, setSelectedText] = useState(sampleTexts[0])

  // ADDED: Relationship options
  const relationshipOptions = [
    "Self","mom", "dad", "friend", "boss", "sibling", "partner", "child", "relative", "colleague", "other"
  ];

  useEffect(() => {
    // Load enrolled voices from localStorage
    const savedVoices = JSON.parse(localStorage.getItem("kairo_enrolled_voices") || "[]")
    setEnrolledVoices(savedVoices)
  }, [])

  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1)
      }, 1000)
    } else {
      clearInterval(timerRef.current)
    }

    return () => clearInterval(timerRef.current)
  }, [isRecording])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
 // --- FIX: Use a more specific MIME type if available, otherwise let the browser decide ---
      const options = { mimeType: 'audio/webm;codecs=opus' };
      mediaRecorderRef.current = new MediaRecorder(stream, MediaRecorder.isTypeSupported(options.mimeType) ? options : undefined);
            // --- END FIX ---
      audioChunksRef.current = []

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data)
      }

      mediaRecorderRef.current.onstop = () => {
// --- FIX: Create blob with the recorder's mimeType ---
        const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorderRef.current.mimeType })
                // --- END FIX ---
        setAudioBlob(audioBlob)
        stream.getTracks().forEach((track) => track.stop())
      }

      mediaRecorderRef.current.start()
      setIsRecording(true)
      setRecordingTime(0)
      toast.success("Recording started!")
    } catch (error) {
      toast.error("Could not access microphone. Please check permissions.")
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      toast.success("Recording stopped!")
    }
  }

  const handleFileUpload = (event) => {
    const file = event.target.files[0]
    if (file) {
      if (file.type.startsWith("audio/")) {
        setUploadedFile(file)
        toast.success("Audio file uploaded successfully!")
      } else {
        toast.error("Please upload a valid audio file.")
      }
    }
  }

  // UPDATED: processEnrollment function to call the backend
  const processEnrollment = async () => {
    if (!speakerName.trim() || !relationship) {
      toast.error("Please enter the speaker's name and select a relationship.")
      return
    }

    const voiceSample = enrollmentMethod === 'record' ? audioBlob : uploadedFile;
    if (!voiceSample) {
      toast.error("Please provide a voice sample first.");
      return
    }

    if (!user?.googleId) {
      toast.error("You must be logged in to enroll a voice.");
      return;
    }

    setIsProcessing(true)

    const formData = new FormData();
    formData.append("user_id", user.googleId);
    formData.append("person_name", speakerName.toLowerCase().trim());
    formData.append("relationship", relationship.toLowerCase());
    formData.append("voice_sample", voiceSample, `${speakerName.trim()}_enrollment.webm`);

    try {
      const response = await enrollVoice(formData);

      const newVoice = {
        id: Date.now(),
        name: speakerName,
        relationship: relationship,
        method: enrollmentMethod,
        duration:
          enrollmentMethod === "record"
            ? formatTime(recordingTime)
            : "Unknown",
        enrolledAt: new Date().toISOString(),
        quality: "high", // Assuming high quality on successful upload
      }

      const updatedVoices = [...enrolledVoices, newVoice]
      setEnrolledVoices(updatedVoices)
      localStorage.setItem("kairo_enrolled_voices", JSON.stringify(updatedVoices))

      // Reset form
      setSpeakerName("")
      setRelationship("")
      setAudioBlob(null)
      setUploadedFile(null)
      setRecordingTime(0)
      setCurrentStep(1)

      toast.success(response.message || `Voice enrolled for ${newVoice.name}!`)
    } catch (error) {
      toast.error(error.response?.data?.error || "Enrollment failed. Please try again.");
    } finally {
      setIsProcessing(false)
    }
  }

  const deleteVoice = (id) => {
    const updatedVoices = enrolledVoices.filter((voice) => voice.id !== id)
    setEnrolledVoices(updatedVoices)
    localStorage.setItem("kairo_enrolled_voices", JSON.stringify(updatedVoices))
    toast.success("Voice deleted successfully!")
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const getQualityColor = (quality) => {
    const colors = {
      high: "text-green-500",
      medium: "text-yellow-500",
      low: "text-red-500",
    }
    return colors[quality] || colors.medium
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

      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold gradient-text mb-2">Voice Enrollment</h1>
          <p className="text-muted-foreground">Register new voices for personalized recognition and recall</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <ParticleCard {...bentoProps} className="particle-card card--border-glow" style={{ borderRadius: '1rem', minHeight: '600px' }}>
              <div className="backdrop-blur-glass rounded-2xl border border-border/50 p-8">
                <div className="flex items-center justify-center mb-8">
                  <div className="flex items-center space-x-4">
                    {[1, 2, 3].map((step) => (
                      <div key={step} className="flex items-center">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all duration-300 ${currentStep >= step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                            } ${currentStep === step ? "glow-primary shadow-xl" : ""}`}
                        >
                          {step}
                        </div>
                        {step < 3 && (
                          <div
                            className={`w-16 h-1 mx-2 transition-colors duration-300 ${currentStep > step ? "bg-primary" : "bg-muted"
                              }`}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {currentStep === 1 && (
                  <div className="space-y-6">
                    <div className="text-center mb-8">
                      <h2 className="text-2xl font-semibold mb-2 text-foreground">Choose Enrollment Method</h2>
                      <p className="text-muted-foreground">How would you like to provide the voice sample?</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <button
                        onClick={() => setEnrollmentMethod("record")}
                        className={`p-8 rounded-2xl border-2 transition-all hover:scale-105 ${enrollmentMethod === "record"
                            ? "border-primary bg-primary/10 glow-primary"
                            : "border-border hover:border-primary/50"
                          }`}
                      >
                        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                          <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                            />
                          </svg>
                        </div>
                        <h3 className="text-lg font-semibold mb-2 text-foreground">Record Now</h3>
                        <p className="text-sm text-muted-foreground">Record voice sample directly in the browser</p>
                      </button>

                      <button
                        onClick={() => setEnrollmentMethod("upload")}
                        className={`p-8 rounded-2xl border-2 transition-all hover:scale-105 ${enrollmentMethod === "upload"
                            ? "border-primary bg-primary/10 glow-primary"
                            : "border-border hover:border-primary/50"
                          }`}
                      >
                        <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                          <svg className="w-8 h-8 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                            />
                          </svg>
                        </div>
                        <h3 className="text-lg font-semibold mb-2 text-foreground">Upload File</h3>
                        <p className="text-sm text-muted-foreground">Upload a pre-recorded audio file</p>
                      </button>
                    </div>

                    <div className="flex justify-center">
                      <button
                        onClick={() => setCurrentStep(2)}
                        className="px-8 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors glow-primary"
                      >
                        Continue
                      </button>
                    </div>
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="space-y-6">
                    <div className="text-center mb-8">
                      <h2 className="text-2xl font-semibold mb-2 text-foreground">Speaker Information</h2>
                      <p className="text-muted-foreground">Provide speaker details and voice sample</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2 text-foreground">Speaker Name</label>
                      <input
                        type="text"
                        value={speakerName}
                        onChange={(e) => setSpeakerName(e.target.value)}
                        placeholder="Enter the speaker's name"
                        className="w-full px-4 py-3 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                      />
                    </div>

                    {/* ADDED: Relationship Dropdown */}
                    <div>
                      <label className="block text-sm font-medium mb-2 text-foreground">Relationship</label>
                      <select
                        value={relationship}
                        onChange={(e) => setRelationship(e.target.value)}
                        className="w-full px-4 py-3 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                      >
                        <option value="" disabled>Select a relationship</option>
                        {relationshipOptions.map((option) => (
                          <option key={option} value={option}>
                            {option.charAt(0).toUpperCase() + option.slice(1)}
                          </option>
                        ))}
                      </select>
                    </div>

                    {enrollmentMethod === 'record' && (
                      <div>
                        <label className="block text-sm font-medium mb-2 text-foreground">Sample Text to Read</label>
                        <select
                          value={selectedText}
                          onChange={(e) => setSelectedText(e.target.value)}
                          className="w-full px-4 py-3 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors mb-4"
                        >
                          {sampleTexts.map((text, index) => (
                            <option key={index} value={text}>
                              Sample Text {index + 1}
                            </option>
                          ))}
                        </select>
                        <div className="p-4 bg-muted/20 rounded-lg border border-border/50">
                          <p className="text-sm text-muted-foreground italic">"{selectedText}"</p>
                        </div>
                      </div>
                    )}


                    {enrollmentMethod === "record" ? (
                      <div className="text-center space-y-4">
                        <div className="p-8 bg-card/30 rounded-2xl border border-border/50">
                          <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg
                              className={`w-12 h-12 text-primary ${isRecording ? "animate-pulse" : ""}`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                              />
                            </svg>
                          </div>
                          {isRecording ? (
                            <div>
                              <p className="text-lg font-semibold text-foreground mb-2">Recording...</p>
                              <p className="text-2xl font-mono text-primary mb-4">{formatTime(recordingTime)}</p>
                              <button
                                onClick={stopRecording}
                                className="px-6 py-3 bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-lg transition-colors"
                              >
                                Stop Recording
                              </button>
                            </div>
                          ) : (
                            <div>
                              <p className="text-lg font-semibold text-foreground mb-4">
                                {audioBlob ? "Recording Complete!" : "Ready to Record"}
                              </p>
                              {audioBlob && (
                                <p className="text-sm text-muted-foreground mb-4">
                                  Duration: {formatTime(recordingTime)}
                                </p>
                              )}
                              <button
                                onClick={startRecording}
                                className="px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors glow-primary"
                              >
                                {audioBlob ? "Record Again" : "Start Recording"}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center space-y-4">
                        <div className="p-8 bg-card/30 rounded-2xl border border-border/50">
                          <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-12 h-12 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                              />
                            </svg>
                          </div>
                          {uploadedFile ? (
                            <div>
                              <p className="text-lg font-semibold text-foreground mb-2">File Uploaded!</p>
                              <p className="text-sm text-muted-foreground mb-4">{uploadedFile.name}</p>
                              <button
                                onClick={() => fileInputRef.current?.click()}
                                className="px-6 py-3 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-lg transition-colors"
                              >
                                Choose Different File
                              </button>
                            </div>
                          ) : (
                            <div>
                              <p className="text-lg font-semibold text-foreground mb-4">Upload Audio File</p>
                              <button
                                onClick={() => fileInputRef.current?.click()}
                                className="px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors glow-primary"
                              >
                                Choose File
                              </button>
                            </div>
                          )}
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="audio/*"
                            onChange={handleFileUpload}
                            className="hidden"
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between">
                      <button
                        onClick={() => setCurrentStep(1)}
                        className="px-6 py-3 bg-muted hover:bg-muted/80 text-muted-foreground rounded-lg transition-colors"
                      >
                        Back
                      </button>
                      <button
                        onClick={() => setCurrentStep(3)}
                        disabled={!speakerName.trim() || !relationship || (!audioBlob && !uploadedFile)}
                        className="px-6 py-3 bg-primary hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground text-primary-foreground rounded-lg transition-colors glow-primary disabled:glow-none"
                      >
                        Continue
                      </button>
                    </div>
                  </div>
                )}

                {currentStep === 3 && (
                  <div className="space-y-6">
                    <div className="text-center mb-8">
                      <h2 className="text-2xl font-semibold mb-2 text-foreground">Review & Process</h2>
                      <p className="text-muted-foreground">Confirm details and process voice enrollment</p>
                    </div>

                    <div className="space-y-4">
                      <div className="p-6 bg-card/30 rounded-2xl border border-border/50">
                        <h3 className="font-semibold mb-4 text-foreground">Enrollment Summary</h3>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Speaker Name:</span>
                            <span className="text-foreground font-medium">{speakerName}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Relationship:</span>
                            <span className="text-foreground font-medium capitalize">{relationship}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Method:</span>
                            <span className="text-foreground font-medium capitalize">{enrollmentMethod}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Duration:</span>
                            <span className="text-foreground font-medium">
                              {enrollmentMethod === "record" ? formatTime(recordingTime) : "Unknown"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {isProcessing ? (
                        <div className="text-center py-8">
                          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                            <svg className="w-8 h-8 text-primary animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              ></circle>
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              ></path>
                            </svg>
                          </div>
                          <p className="text-lg font-semibold text-foreground mb-2">Processing Voice Enrollment...</p>
                          <p className="text-sm text-muted-foreground">
                            Analyzing voice patterns and creating recognition profile
                          </p>
                        </div>
                      ) : (
                        <div className="flex justify-between">
                          <button
                            onClick={() => setCurrentStep(2)}
                            className="px-6 py-3 bg-muted hover:bg-muted/80 text-muted-foreground rounded-lg transition-colors"
                          >
                            Back
                          </button>
                          <button
                            onClick={processEnrollment}
                            className="px-8 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors glow-primary"
                          >
                            Process Enrollment
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </ParticleCard>
          </div>

          <div className="lg:col-span-1">
            <ParticleCard {...bentoProps} className="particle-card card--border-glow" style={{ borderRadius: '1rem', minHeight: '300px' }}>
              <div className="backdrop-blur-glass rounded-2xl border border-border/50 p-6">
                <h3 className="text-xl font-semibold mb-6 text-foreground">Enrolled Voices ({enrolledVoices.length})</h3>

                {enrolledVoices.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-muted/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg
                        className="w-8 h-8 text-muted-foreground"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                        />
                      </svg>
                    </div>
                    <p className="text-sm text-muted-foreground">No voices enrolled yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {enrolledVoices.map((voice) => (
                      <div
                        key={voice.id}
                        className="p-4 bg-card/30 rounded-lg border border-border/50 hover:border-primary/30 transition-colors group"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-foreground">{voice.name}</h4>
                          <button
                            onClick={() => deleteVoice(voice.id)}
                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/10 text-destructive rounded transition-all"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </div>
                        <div className="space-y-1 text-xs text-muted-foreground">
                          <p>Relationship: {voice.relationship}</p>
                          <p>Duration: {voice.duration}</p>
                          <p>Method: {voice.method}</p>
                          <p className={`${getQualityColor(voice.quality)}`}>Quality: {voice.quality}</p>
                          <p>Enrolled: {new Date(voice.enrolledAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                    ))}
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

export default VoiceEnrollment