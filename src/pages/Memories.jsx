// --- START MAGIC BENTO EFFECTS UTILITY CODE ---
// (Keep your existing Magic Bento utility code here:
// DEFAULT_SPOTLIGHT_RADIUS, DEFAULT_GLOW_COLOR, MOBILE_BREAKPOINT,
// calculateSpotlightValues, updateCardGlowProperties, useMobileDetection, GlobalSpotlight
// Ensure GlobalSpotlight targets '.particle-card' within the pageRef)

const DEFAULT_SPOTLIGHT_RADIUS = 300;
const DEFAULT_GLOW_COLOR = '132, 0, 255'; // Purple glow for memories
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
  pageRef, // Target the main page div
  disableAnimations = false,
  enabled = true,
  spotlightRadius = DEFAULT_SPOTLIGHT_RADIUS,
  glowColor = DEFAULT_GLOW_COLOR
}) => {
  const spotlightRef = useRef(null);

  useEffect(() => {
    // Check refs and conditions before proceeding
    if (disableAnimations || !pageRef?.current || !enabled) {
      const existingSpotlight = document.querySelector('.global-spotlight-memories');
      if (existingSpotlight) existingSpotlight.remove();
      return;
    }

    // Clean up previous spotlight instance first
    document.querySelector('.global-spotlight-memories')?.remove();

    const spotlight = document.createElement('div');
    spotlight.className = 'global-spotlight-memories'; // Unique class
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
      // Only activate spotlight when mouse is over the main page area (excluding sidebar maybe?)
      // Adjust boundaries if needed, e.g., pageRect.left + sidebarWidth
      const mouseInside = e.clientX >= pageRect.left && e.clientX <= pageRect.right &&
                          e.clientY >= pageRect.top && e.clientY <= pageRect.bottom;

      // Target ParticleCards *within* the pageRef
      const cards = page.querySelectorAll('.particle-card');

      if (!mouseInside) {
        gsap.to(spot, { opacity: 0, duration: 0.3 });
        cards.forEach(card => card.style.setProperty('--glow-intensity', '0'));
        return;
      }

      const { proximity, fadeDistance } = calculateSpotlightValues(spotlightRadius);
      let minDistance = Infinity;

      cards.forEach(card => {
        const cardRect = card.getBoundingClientRect();
        const centerX = cardRect.left + cardRect.width / 2;
        const centerY = cardRect.top + cardRect.height / 2;
        // Calculate distance from mouse to card *center*
        const distance = Math.hypot(e.clientX - centerX, e.clientY - centerY);
        // Reduce distance by approx half card size for glow activation near edge
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

      gsap.to(spot, { left: e.clientX, top: e.clientY, duration: 0.1 });

      const targetOpacity =
        minDistance <= proximity ? 0.8 :
        minDistance <= fadeDistance ? ((fadeDistance - minDistance) / (fadeDistance - proximity)) * 0.8 : 0;

      gsap.to(spot, { opacity: targetOpacity, duration: targetOpacity > 0 ? 0.2 : 0.5 });
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


// --- Memory Detail Modal Component (Keep existing) ---
const MemoryDetailModal = ({ memory, onClose }) => {
  if (!memory) return null;

  const getSentimentIcon = (sentimentLabel) => {
    const label = sentimentLabel?.toLowerCase();
    if (label?.includes("positive") || label?.includes("productive")) {
      return <Smile className="text-green-400 inline-block mr-2 h-5 w-5" />;
    }
    if (label?.includes("negative") || label?.includes("concerned")) {
      return <AlertCircle className="text-red-400 inline-block mr-2 h-5 w-5" />;
    }
    return <Smile className="text-blue-400 inline-block mr-2 h-5 w-5" />; // Neutral
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex justify-center items-center p-4 transition-opacity duration-300"
      onClick={onClose}
    >
      <div
        className="bg-black border border-purple-800 rounded-2xl shadow-2xl shadow-purple-900/40 w-full max-w-3xl max-h-[90vh] overflow-y-auto p-8 relative modal-scroll" // <<< CHANGED HERE and added modal-scroll
        onClick={(e) => e.stopPropagation()} // Prevent closing modal when clicking inside
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors p-1 bg-card/50 rounded-full"
          aria-label="Close memory details"
        >
           <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>

        {/* Header */}
        <h2 className="text-2xl md:text-3xl font-bold gradient-text mb-2 pr-8">
          {memory.title}
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          {new Date(memory.created_at?.$date).toLocaleString(undefined, {
              year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
          })}
        </p>

        {/* Content Sections */}
        <div className="space-y-6">
          {/* Summary */}
          <div>
            <h3 className="font-semibold text-lg mb-2 text-primary">Summary</h3>
            <p className="text-foreground/90 leading-relaxed">{memory.summary}</p>
          </div>

          {/* Sentiment */}
          {memory.sentiment && (
            <div>
              <h3 className="font-semibold text-lg mb-2 text-primary">Sentiment</h3>
              <div className="flex items-start text-foreground/90 bg-card/50 p-3 rounded-lg border border-border/50">
                <span className="mt-0.5">{getSentimentIcon(memory.sentiment.label)}</span>
                <div>
                  <span className="font-semibold mr-2 capitalize">{memory.sentiment.label}:</span>
                  <span>{memory.sentiment.justification}</span>
                </div>
              </div>
            </div>
          )}

          {/* Action Items */}
          {memory.action_items && memory.action_items.length > 0 && (
            <div>
              <h3 className="font-semibold text-lg mb-2 text-primary">Action Items</h3>
              <ul className="list-disc list-inside space-y-1.5 text-foreground/90 pl-2">
                {memory.action_items.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Key Points */}
          {memory.key_points && memory.key_points.length > 0 && (
            <div>
              <h3 className="font-semibold text-lg mb-2 text-primary">Key Points</h3>
              <ul className="list-disc list-inside space-y-1.5 text-foreground/90 pl-2">
                {memory.key_points.map((point, index) => (
                  <li key={index}>{point}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Key Quotes */}
          {memory.key_quotes && memory.key_quotes.length > 0 && (
            <div>
              <h3 className="font-semibold text-lg mb-2 text-primary">Key Quotes</h3>
              <div className="space-y-3">
                {memory.key_quotes.map((quote, index) => (
                  <blockquote key={index} className="border-l-4 border-accent pl-4 italic bg-card/40 p-3 rounded-r-lg">
                    <p className="text-foreground/90">"{quote.quote}"</p>
                    {quote.speaker && quote.speaker !== "Unknown" && (
                         <cite className="text-sm text-muted-foreground not-italic mt-1 block">- {quote.speaker}</cite>
                    )}
                  </blockquote>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


// --- Main Memories Page Component ---
const Memories = () => {
  // --- Hooks ---
  const { user } = useAuthStore();
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMemory, setSelectedMemory] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [sentimentFilter, setSentimentFilter] = useState("all");
  const pageRef = useRef(null); // Ref for the main page container for spotlight
  const isMobile = useMobileDetection(); // Use the hook

  // --- Effects ---
  useEffect(() => {
    let isMounted = true;
    const fetchMemories = async () => {
      if (!user?.googleId) {
           if (isMounted) setLoading(false); // Stop loading if no user
           return;
      }
      if (isMounted) setLoading(true);
      try {
        const response = await api.get(
          `http://localhost:8000/memories/user/${user.googleId}`
        );
         if (!isMounted) return;

        const memoriesData = Array.isArray(response.data) ? response.data : [response.data].filter(Boolean); // Ensure array and filter null/undefined if single item fails
        const sortedMemories = memoriesData.sort(
          (a, b) => new Date(b.created_at?.$date) - new Date(a.created_at?.$date)
        );
        setMemories(sortedMemories);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch memories:", err);
         if (isMounted) setError("Could not load memories. Please try again.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchMemories();
    return () => { isMounted = false };
  }, [user]);

  const filteredMemories = useMemo(() => {
    return memories.filter((memory) => {
      // Basic check if memory object exists and has data
      if (!memory || !memory.created_at?.$date) return false;

      const searchLower = searchTerm.toLowerCase();
      const searchMatch = !searchTerm ||
        memory.title?.toLowerCase().includes(searchLower) ||
        memory.summary?.toLowerCase().includes(searchLower) ||
        memory.key_points?.some(p => p.toLowerCase().includes(searchLower)) ||
        memory.action_items?.some(a => a.toLowerCase().includes(searchLower)) ||
        memory.key_quotes?.some(q => q.quote.toLowerCase().includes(searchLower));

      const dateMatch = !dateFilter ||
        new Date(memory.created_at.$date).toISOString().startsWith(dateFilter);

      const sentimentMatch = sentimentFilter === "all" ||
        memory.sentiment?.label?.toLowerCase().includes(sentimentFilter.toLowerCase()); // Use includes for broader matching (e.g., "positive" matches "positive")


      return searchMatch && dateMatch && sentimentMatch;
    });
  }, [memories, searchTerm, dateFilter, sentimentFilter]);

  // --- Bento Props ---
  const bentoProps = useMemo(() => ({
    enableTilt: !isMobile,
    enableMagnetism: !isMobile,
    clickEffect: true,
    glowColor: DEFAULT_GLOW_COLOR, // Use defined color
    particleCount: 8,
  }), [isMobile]);

   // --- Sentiment Icon Helper (used on cards) ---
   const getSentimentIconMini = (sentimentLabel) => {
     const label = sentimentLabel?.toLowerCase();
     if (label?.includes("positive") || label?.includes("productive")) {
       return <Smile className="text-green-500 h-4 w-4" />;
     }
     if (label?.includes("negative") || label?.includes("concerned")) {
       return <AlertCircle className="text-red-500 h-4 w-4" />;
     }
     // Default to Neutral or hide if no sentiment
     return sentimentLabel ? <Smile className="text-blue-500 h-4 w-4" /> : null;
   };

  // --- Render Logic ---
  return (
    <>
      {/* Container with ref for spotlight */}
      <div className="min-h-screen bg-background p-6 md:p-8" ref={pageRef}>
        {/* Spotlight Effect */}
        <GlobalSpotlight
          pageRef={pageRef}
          disableAnimations={isMobile}
          enabled={true}
          glowColor={DEFAULT_GLOW_COLOR}
        />
         {/* Inline Styles for glow effect CSS variables */}
         <style>{`
           .particle-card {
               --glow-color: ${DEFAULT_GLOW_COLOR}; /* Pass color via CSS variable */
               position: relative;
               transform-style: preserve-3d;
           }
           .particle-card:hover {
                box-shadow: 0 6px 25px rgba(var(--glow-color), 0.2), 0 0 40px rgba(var(--glow-color), 0.1);
           }
           .particle-card.card--border-glow::after {
               content: ''; position: absolute; inset: 0; padding: 2px; /* Thinner glow border */
               background: radial-gradient(var(--glow-radius, 300px) circle at var(--glow-x) var(--glow-y),
                 rgba(var(--glow-color), calc(var(--glow-intensity, 0) * 0.6)) 0%,
                 transparent 50%); /* Adjusted gradient */
               border-radius: inherit;
               mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
               mask-composite: subtract;
               -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
               -webkit-mask-composite: xor;
               pointer-events: none; transition: opacity 0.3s ease; z-index: 1; opacity: var(--glow-intensity, 0);
           }
           /* Ensure particle effects are above glow */
           .particle-card .particle { z-index: 2; }
           /* Custom scrollbar */
           .modal-scroll::-webkit-scrollbar { width: 6px; }
           .modal-scroll::-webkit-scrollbar-track { background: rgb(var(--card) / 0.5); border-radius: 3px;}
           .modal-scroll::-webkit-scrollbar-thumb { background: rgb(var(--muted)); border-radius: 3px; }
           .modal-scroll::-webkit-scrollbar-thumb:hover { background: rgb(var(--muted-foreground)); }
         `}</style>

        {/* Header */}
        <h1 className="text-3xl md:text-4xl font-bold mb-6 md:mb-8 gradient-text">
          Your Memories
        </h1>

        {/* Filter Section - Improved Styling */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 p-4 bg-card/50 rounded-lg border border-border/50">
          {/* Search Filter */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Search memories..."
              className="w-full bg-input border border-border rounded-md pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary placeholder:text-muted-foreground"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Date Filter */}
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              type="date"
              className="w-full bg-input border border-border rounded-md pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-muted-foreground" // Style date input text
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              // Add style to show placeholder color when empty
              style={{ colorScheme: 'dark', color: dateFilter ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))' }}
            />
          </div>

          {/* Sentiment Filter */}
          <div className="relative">
            <Smile className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <select
              className="w-full bg-input border border-border rounded-md pl-9 pr-8 py-2 text-sm appearance-none focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary" // Added pr-8 for icon space
              value={sentimentFilter}
              onChange={(e) => setSentimentFilter(e.target.value)}
              // Style select text color
               style={{ color: sentimentFilter === 'all' ? 'hsl(var(--muted-foreground))' : 'hsl(var(--foreground))' }}
            >
              <option value="all">All Sentiments</option>
              <option value="positive">Positive</option>
              <option value="productive">Productive</option>
              <option value="neutral">Neutral</option>
              <option value="negative">Negative</option>
              <option value="concerned">Concerned</option> {/* Added if applicable */}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="text-center py-16 text-destructive">
            <AlertTriangle className="mx-auto h-12 w-12 mb-4" />
            <h3 className="text-xl font-semibold">{error}</h3>
          </div>
        )}

        {/* Memories Grid & Empty States */}
        {!loading && !error && (
          <>
            {memories.length === 0 ? (
              // Initial Empty State (No memories ever)
              <div className="text-center py-16 text-muted-foreground">
                <BrainCircuit className="mx-auto h-16 w-16 mb-4 opacity-50" />
                <h3 className="text-xl font-semibold text-foreground/80">No Memories Yet</h3>
                <p className="mt-2 text-foreground/60">
                  Your generated memories will appear here once processed.
                </p>
              </div>
            ) : filteredMemories.length === 0 ? (
               // Empty State When Filters Applied
              <div className="text-center py-16 text-muted-foreground">
                <FolderSearch className="mx-auto h-16 w-16 mb-4 opacity-50" />
                <h3 className="text-xl font-semibold text-foreground/80">No Matching Memories</h3>
                <p className="mt-2 text-foreground/60">Try adjusting your search or filter criteria.</p>
              </div>
            ) : (
              // Memories Grid - Enhanced Cards
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                {filteredMemories.map((memory) => (
                  <ParticleCard
                    key={memory._id?.$oid || memory._id} // Handle potential ID structure
                    {...bentoProps}
                    className="particle-card card--border-glow rounded-xl border border-border/50 bg-card/60 backdrop-blur-sm transition-all duration-300 hover:border-primary/50 hover:-translate-y-1"
                  >
                    <div
                      className="h-full p-4 flex flex-col justify-between cursor-pointer group"
                      onClick={() => setSelectedMemory(memory)}
                      role="button" // Accessibility
                      tabIndex={0} // Accessibility
                      onKeyDown={(e) => e.key === 'Enter' && setSelectedMemory(memory)} // Accessibility
                    >
                      {/* Card Content */}
                      <div className="flex-grow">
                        <div className="flex justify-between items-start mb-2">
                           <h3 className="font-semibold text-base md:text-lg text-foreground group-hover:text-primary transition-colors pr-2">
                             {memory.title}
                           </h3>
                           {/* Sentiment Icon */}
                           <div className="flex-shrink-0 pt-0.5">
                              {getSentimentIconMini(memory.sentiment?.label)}
                           </div>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-3">
                          {memory.summary}
                        </p>
                      </div>
                      {/* Footer: Date */}
                      <div className="mt-4 pt-3 border-t border-border/30 flex justify-end">
                        <p className="text-xs text-muted-foreground">
                          {new Date(memory.created_at?.$date).toLocaleDateString(undefined, {
                              month: 'short', day: 'numeric', year: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                  </ParticleCard>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal */}
      <MemoryDetailModal
        memory={selectedMemory}
        onClose={() => setSelectedMemory(null)}
      />
    </>
  );
};

export default Memories;