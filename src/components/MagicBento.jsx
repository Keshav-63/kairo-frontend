// // Kairo/src/components/MagicBento.jsx

// import { useRef, useEffect, useState, useCallback } from 'react';
// import { gsap } from 'gsap';
// import { ParticleCard } from './ParticleCard';

// const DEFAULT_PARTICLE_COUNT = 12;
// const DEFAULT_SPOTLIGHT_RADIUS = 300;
// const DEFAULT_GLOW_COLOR = '132, 0, 255';
// const MOBILE_BREAKPOINT = 768;

// const cardData = [
//   {
//     color: '#060010',
//     title: 'Analytics',
//     description: 'Track user behavior',
//     label: 'Insights'
//   },
//   {
//     color: '#060010',
//     title: 'Dashboard',
//     description: 'Centralized data view',
//     label: 'Overview'
//   },
//   {
//     color: '#060010',
//     title: 'Collaboration',
//     description: 'Work together seamlessly',
//     label: 'Teamwork'
//   },
//   {
//     color: '#060010',
//     title: 'Automation',
//     description: 'Streamline workflows',
//     label: 'Efficiency'
//   },
//   {
//     color: '#060010',
//     title: 'Integration',
//     description: 'Connect favorite tools',
//     label: 'Connectivity'
//   },
//   {
//     color: '#060010',
//     title: 'Security',
//     description: 'Enterprise-grade protection',
//     label: 'Protection'
//   }
// ];

// const calculateSpotlightValues = radius => ({
//   proximity: radius * 0.5,
//   fadeDistance: radius * 0.75
// });

// const updateCardGlowProperties = (card, mouseX, mouseY, glow, radius) => {
//   const rect = card.getBoundingClientRect();
//   const relativeX = ((mouseX - rect.left) / rect.width) * 100;
//   const relativeY = ((mouseY - rect.top) / rect.height) * 100;

//   card.style.setProperty('--glow-x', `${relativeX}%`);
//   card.style.setProperty('--glow-y', `${relativeY}%`);
//   card.style.setProperty('--glow-intensity', glow.toString());
//   card.style.setProperty('--glow-radius', `${radius}px`);
// };

// const GlobalSpotlight = ({
//   gridRef,
//   disableAnimations = false,
//   enabled = true,
//   spotlightRadius = DEFAULT_SPOTLIGHT_RADIUS,
//   glowColor = DEFAULT_GLOW_COLOR
// }) => {
//   const spotlightRef = useRef(null);
//   const isInsideSection = useRef(false);

//   useEffect(() => {
//     if (disableAnimations || !gridRef?.current || !enabled) return;

//     const spotlight = document.createElement('div');
//     spotlight.className = 'global-spotlight';
//     spotlight.style.cssText = `
//       position: fixed;
//       width: 800px;
//       height: 800px;
//       border-radius: 50%;
//       pointer-events: none;
//       background: radial-gradient(circle,
//         rgba(${glowColor}, 0.15) 0%,
//         rgba(${glowColor}, 0.08) 15%,
//         rgba(${glowColor}, 0.04) 25%,
//         rgba(${glowColor}, 0.02) 40%,
//         rgba(${glowColor}, 0.01) 65%,
//         transparent 70%
//       );
//       z-index: 200;
//       opacity: 0;
//       transform: translate(-50%, -50%);
//       mix-blend-mode: screen;
//     `;
//     document.body.appendChild(spotlight);
//     spotlightRef.current = spotlight;

//     const handleMouseMove = e => {
//       if (!spotlightRef.current || !gridRef.current) return;

//       const section = gridRef.current.closest('.bento-section');
//       const rect = section?.getBoundingClientRect();
//       const mouseInside =
//         rect && e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom;

//       isInsideSection.current = mouseInside || false;
//       const cards = gridRef.current.querySelectorAll('.card');

//       if (!mouseInside) {
//         gsap.to(spotlightRef.current, {
//           opacity: 0,
//           duration: 0.3,
//           ease: 'power2.out'
//         });
//         cards.forEach(card => {
//           card.style.setProperty('--glow-intensity', '0');
//         });
//         return;
//       }

//       const { proximity, fadeDistance } = calculateSpotlightValues(spotlightRadius);
//       let minDistance = Infinity;

//       cards.forEach(card => {
//         const cardElement = card;
//         const cardRect = cardElement.getBoundingClientRect();
//         const centerX = cardRect.left + cardRect.width / 2;
//         const centerY = cardRect.top + cardRect.height / 2;
//         const distance =
//           Math.hypot(e.clientX - centerX, e.clientY - centerY) - Math.max(cardRect.width, cardRect.height) / 2;
//         const effectiveDistance = Math.max(0, distance);

//         minDistance = Math.min(minDistance, effectiveDistance);

//         let glowIntensity = 0;
//         if (effectiveDistance <= proximity) {
//           glowIntensity = 1;
//         } else if (effectiveDistance <= fadeDistance) {
//           glowIntensity = (fadeDistance - effectiveDistance) / (fadeDistance - proximity);
//         }

//         updateCardGlowProperties(cardElement, e.clientX, e.clientY, glowIntensity, spotlightRadius);
//       });

//       gsap.to(spotlightRef.current, {
//         left: e.clientX,
//         top: e.clientY,
//         duration: 0.1,
//         ease: 'power2.out'
//       });

//       const targetOpacity =
//         minDistance <= proximity
//           ? 0.8
//           : minDistance <= fadeDistance
//             ? ((fadeDistance - minDistance) / (fadeDistance - proximity)) * 0.8
//             : 0;

//       gsap.to(spotlightRef.current, {
//         opacity: targetOpacity,
//         duration: targetOpacity > 0 ? 0.2 : 0.5,
//         ease: 'power2.out'
//       });
//     };

//     const handleMouseLeave = () => {
//       isInsideSection.current = false;
//       gridRef.current?.querySelectorAll('.card').forEach(card => {
//         card.style.setProperty('--glow-intensity', '0');
//       });
//       if (spotlightRef.current) {
//         gsap.to(spotlightRef.current, {
//           opacity: 0,
//           duration: 0.3,
//           ease: 'power2.out'
//         });
//       }
//     };

//     document.addEventListener('mousemove', handleMouseMove);
//     document.addEventListener('mouseleave', handleMouseLeave);

//     return () => {
//       document.removeEventListener('mousemove', handleMouseMove);
//       document.removeEventListener('mouseleave', handleMouseLeave);
//       spotlightRef.current?.parentNode?.removeChild(spotlightRef.current);
//     };
//   }, [gridRef, disableAnimations, enabled, spotlightRadius, glowColor]);

//   return null;
// };

// const BentoCardGrid = ({ children, gridRef }) => (
//   <div
//     className="bento-section grid gap-2 p-3 max-w-[54rem] select-none relative"
//     style={{ fontSize: 'clamp(1rem, 0.9rem + 0.5vw, 1.5rem)' }}
//     ref={gridRef}
//   >
//     {children}
//   </div>
// );

// const useMobileDetection = () => {
//   const [isMobile, setIsMobile] = useState(false);

//   useEffect(() => {
//     const checkMobile = () => setIsMobile(window.innerWidth <= MOBILE_BREAKPOINT);

//     checkMobile();
//     window.addEventListener('resize', checkMobile);

//     return () => window.removeEventListener('resize', checkMobile);
//   }, []);

//   return isMobile;
// };

// const MagicBento = ({
//   textAutoHide = true,
//   enableStars = true,
//   enableSpotlight = true,
//   enableBorderGlow = true,
//   disableAnimations = false,
//   spotlightRadius = DEFAULT_SPOTLIGHT_RADIUS,
//   particleCount = DEFAULT_PARTICLE_COUNT,
//   enableTilt = false,
//   glowColor = DEFAULT_GLOW_COLOR,
//   clickEffect = true,
//   enableMagnetism = true
// }) => {
//   const gridRef = useRef(null);
//   const isMobile = useMobileDetection();
//   const shouldDisableAnimations = disableAnimations || isMobile;

//   return (
//     <div className="flex justify-center items-center py-10 bg-transparent">
//       <style>
//         {`
//           .bento-section {
//             --glow-x: 50%;
//             --glow-y: 50%;
//             --glow-intensity: 0;
//             --glow-radius: ${spotlightRadius}px;
//             --glow-color: ${glowColor};
//             /* Using TailWind CSS variables here */
//             --border-color: #392e4e; 
//             --background-dark: #060010;
//             --white: rgb(var(--foreground)); 
//             --purple-primary: rgb(var(--primary));
//             --purple-glow: rgba(var(--primary), 0.2);
//             --purple-border: rgba(var(--primary), 0.8);
//           }
          
//           .card-responsive {
//             grid-template-columns: 1fr;
//             width: 100%;
//             margin: 0;
//             padding: 0.5rem;
//           }
          
//           @media (min-width: 600px) {
//             .card-responsive {
//               grid-template-columns: repeat(2, 1fr);
//             }
//           }
          
//           @media (min-width: 1024px) {
//             .card-responsive {
//               grid-template-columns: repeat(4, 1fr);
//             }
            
//             .card-responsive .card:nth-child(3) {
//               grid-column: span 2;
//               grid-row: span 2;
//             }
            
//             .card-responsive .card:nth-child(4) {
//               grid-column: 1 / span 2;
//               grid-row: 2 / span 2;
//             }
            
//             .card-responsive .card:nth-child(6) {
//               grid-column: 4;
//               grid-row: 3;
//             }
//           }
          
//           .card--border-glow::after {
//             content: '';
//             position: absolute;
//             inset: 0;
//             padding: 6px;
//             background: radial-gradient(var(--glow-radius) circle at var(--glow-x) var(--glow-y),
//               rgba(${glowColor}, calc(var(--glow-intensity) * 0.8)) 0%,
//               rgba(${glowColor}, calc(var(--glow-intensity) * 0.4)) 30%,
//               transparent 60%);
//             border-radius: inherit;
//             mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
//             mask-composite: subtract;
//             -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
//             -webkit-mask-composite: xor;
//             pointer-events: none;
//             transition: opacity 0.3s ease;
//             z-index: 1;
//           }
          
//           .card--border-glow:hover::after {
//             opacity: 1;
//           }
          
//           .card--border-glow:hover {
//             box-shadow: 0 4px 20px rgba(46, 24, 78, 0.4), 0 0 30px rgba(${glowColor}, 0.2);
//           }
          
//           .particle::before {
//             content: '';
//             position: absolute;
//             top: -2px;
//             left: -2px;
//             right: -2px;
//             bottom: -2px;
//             background: rgba(${glowColor}, 0.2);
//             border-radius: 50%;
//             z-index: -1;
//           }
          
//           .particle-container:hover {
//             box-shadow: 0 4px 20px rgba(46, 24, 78, 0.2), 0 0 30px rgba(${glowColor}, 0.2);
//           }
          
//           .text-clamp-1 {
//             display: -webkit-box;
//             -webkit-box-orient: vertical;
//             -webkit-line-clamp: 1;
//             line-clamp: 1;
//             overflow: hidden;
//             text-overflow: ellipsis;
//           }
          
//           .text-clamp-2 {
//             display: -webkit-box;
//             -webkit-box-orient: vertical;
//             -webkit-line-clamp: 2;
//             line-clamp: 2;
//             overflow: hidden;
//             text-overflow: ellipsis;
//             }
          
//           @media (max-width: 599px) {
//             .card-responsive {
//               grid-template-columns: 1fr;
//               width: 90%;
//               margin: 0 auto;
//               padding: 0.5rem;
//             }
            
//             .card-responsive .card {
//               width: 100%;
//               min-height: 180px;
//             }
//           }
//         `}
//       </style>

//       {enableSpotlight && (
//         <GlobalSpotlight
//           gridRef={gridRef}
//           disableAnimations={shouldDisableAnimations}
//           enabled={enableSpotlight}
//           spotlightRadius={spotlightRadius}
//           glowColor={glowColor}
//         />
//       )}

//       <BentoCardGrid gridRef={gridRef}>
//         <div className="card-responsive grid gap-4">
//           {cardData.map((card, index) => {
//             const baseClassName = `card flex flex-col justify-between relative aspect-[4/3] min-h-[200px] w-full max-w-full p-5 rounded-2xl border border-solid font-light overflow-hidden transition-all duration-300 ease-in-out hover:-translate-y-0.5 hover:shadow-[0_8px_25px_rgba(0,0,0,0.15)] ${
//               enableBorderGlow ? 'card--border-glow' : ''
//             }`;

//             const cardStyle = {
//               backgroundColor: card.color || 'var(--background-dark)',
//               borderColor: 'var(--border-color)',
//               color: 'var(--white)',
//               '--glow-x': '50%',
//               '--glow-y': '50%',
//               '--glow-intensity': '0',
//               '--glow-radius': '200px'
//             };

//             if (enableStars) {
//               return (
//                 <ParticleCard
//                   key={index}
//                   className={baseClassName}
//                   style={cardStyle}
//                   disableAnimations={shouldDisableAnimations}
//                   particleCount={particleCount}
//                   glowColor={glowColor}
//                   enableTilt={enableTilt}
//                   clickEffect={clickEffect}
//                   enableMagnetism={enableMagnetism}
//                 >
//                   <div className="card__header flex justify-between gap-3 relative text-white">
//                     <span className="card__label text-base">{card.label}</span>
//                   </div>
//                   <div className="card__content flex flex-col relative text-white">
//                     <h3 className={`card__title font-normal text-xl m-0 mb-1 ${textAutoHide ? 'text-clamp-1' : ''}`}>
//                       {card.title}
//                     </h3>
//                     <p
//                       className={`card__description text-sm leading-5 opacity-90 ${textAutoHide ? 'text-clamp-2' : ''}`}
//                     >
//                       {card.description}
//                     </p>
//                   </div>
//                 </ParticleCard>
//               );
//             }

//             // Fallback for non-ParticleCard
//             return (
//               <div
//                 key={index}
//                 className={baseClassName}
//                 style={cardStyle}
//               >
//                 <div className="card__header flex justify-between gap-3 relative text-white">
//                   <span className="card__label text-base">{card.label}</span>
//                 </div>
//                 <div className="card__content flex flex-col relative text-white">
//                   <h3 className={`card__title font-normal text-xl m-0 mb-1 ${textAutoHide ? 'text-clamp-1' : ''}`}>
//                     {card.title}
//                   </h3>
//                   <p className={`card__description text-sm leading-5 opacity-90 ${textAutoHide ? 'text-clamp-2' : ''}`}>
//                     {card.description}
//                   </p>
//                 </div>
//               </div>
//             );
//           })}
//         </div>
//       </BentoCardGrid>
//     </div>
//   );
// };















































// // Kairo/src/components/MagicBento.jsx

// import { useRef, useEffect, useState, useCallback } from 'react';
// import { gsap } from 'gsap';
// import { ParticleCard } from './ParticleCard'; // Correctly imported as named export

// const DEFAULT_PARTICLE_COUNT = 12;
// const DEFAULT_SPOTLIGHT_RADIUS = 300;
// const DEFAULT_GLOW_COLOR = '132, 0, 255';
// const MOBILE_BREAKPOINT = 768;

// const cardData = [
//   {
//     color: '#060010',
//     title: 'Analytics',
//     description: 'Track user behavior',
//     label: 'Insights'
//   },
//   {
//     color: '#060010',
//     title: 'Dashboard',
//     description: 'Centralized data view',
//     label: 'Overview'
//   },
//   {
//     color: '#060010',
//     title: 'Collaboration',
//     description: 'Work together seamlessly',
//     label: 'Teamwork'
//   },
//   {
//     color: '#060010',
//     title: 'Automation',
//     description: 'Streamline workflows',
//     label: 'Efficiency'
//   },
//   {
//     color: '#060010',
//     title: 'Integration',
//     description: 'Connect favorite tools',
//     label: 'Connectivity'
//   },
//   {
//     color: '#060010',
//     title: 'Security',
//     description: 'Enterprise-grade protection',
//     label: 'Protection'
//   }
// ];

// const calculateSpotlightValues = radius => ({
//   proximity: radius * 0.5,
//   fadeDistance: radius * 0.75
// });

// const updateCardGlowProperties = (card, mouseX, mouseY, glow, radius) => {
//   const rect = card.getBoundingClientRect();
//   const relativeX = ((mouseX - rect.left) / rect.width) * 100;
//   const relativeY = ((mouseY - rect.top) / rect.height) * 100;

//   card.style.setProperty('--glow-x', `${relativeX}%`);
//   card.style.setProperty('--glow-y', `${relativeY}%`);
//   card.style.setProperty('--glow-intensity', glow.toString());
//   card.style.setProperty('--glow-radius', `${radius}px`);
// };

// const GlobalSpotlight = ({
//   gridRef,
//   disableAnimations = false,
//   enabled = true,
//   spotlightRadius = DEFAULT_SPOTLIGHT_RADIUS,
//   glowColor = DEFAULT_GLOW_COLOR
// }) => {
//   const spotlightRef = useRef(null);
//   const isInsideSection = useRef(false);

//   useEffect(() => {
//     if (disableAnimations || !gridRef?.current || !enabled) return;

//     const spotlight = document.createElement('div');
//     spotlight.className = 'global-spotlight';
//     spotlight.style.cssText = `
//       position: fixed;
//       width: 800px;
//       height: 800px;
//       border-radius: 50%;
//       pointer-events: none;
//       background: radial-gradient(circle,
//         rgba(${glowColor}, 0.15) 0%,
//         rgba(${glowColor}, 0.08) 15%,
//         rgba(${glowColor}, 0.04) 25%,
//         rgba(${glowColor}, 0.02) 40%,
//         rgba(${glowColor}, 0.01) 65%,
//         transparent 70%
//       );
//       z-index: 200;
//       opacity: 0;
//       transform: translate(-50%, -50%);
//       mix-blend-mode: screen;
//     `;
//     document.body.appendChild(spotlight);
//     spotlightRef.current = spotlight;

//     const handleMouseMove = e => {
//       if (!spotlightRef.current || !gridRef.current) return;

//       const section = gridRef.current.closest('.bento-section');
//       const rect = section?.getBoundingClientRect();
//       const mouseInside =
//         rect && e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom;

//       isInsideSection.current = mouseInside || false;
//       const cards = gridRef.current.querySelectorAll('.card');

//       if (!mouseInside) {
//         gsap.to(spotlightRef.current, {
//           opacity: 0,
//           duration: 0.3,
//           ease: 'power2.out'
//         });
//         cards.forEach(card => {
//           card.style.setProperty('--glow-intensity', '0');
//         });
//         return;
//       }

//       const { proximity, fadeDistance } = calculateSpotlightValues(spotlightRadius);
//       let minDistance = Infinity;

//       cards.forEach(card => {
//         const cardElement = card;
//         const cardRect = cardElement.getBoundingClientRect();
//         const centerX = cardRect.left + cardRect.width / 2;
//         const centerY = cardRect.top + cardRect.height / 2;
//         const distance =
//           Math.hypot(e.clientX - centerX, e.clientY - centerY) - Math.max(cardRect.width, cardRect.height) / 2;
//         const effectiveDistance = Math.max(0, distance);

//         minDistance = Math.min(minDistance, effectiveDistance);

//         let glowIntensity = 0;
//         if (effectiveDistance <= proximity) {
//           glowIntensity = 1;
//         } else if (effectiveDistance <= fadeDistance) {
//           glowIntensity = (fadeDistance - effectiveDistance) / (fadeDistance - proximity);
//         }

//         updateCardGlowProperties(cardElement, e.clientX, e.clientY, glowIntensity, spotlightRadius);
//       });

//       gsap.to(spotlightRef.current, {
//         left: e.clientX,
//         top: e.clientY,
//         duration: 0.1,
//         ease: 'power2.out'
//       });

//       const targetOpacity =
//         minDistance <= proximity
//           ? 0.8
//           : minDistance <= fadeDistance
//             ? ((fadeDistance - minDistance) / (fadeDistance - proximity)) * 0.8
//             : 0;

//       gsap.to(spotlightRef.current, {
//         opacity: targetOpacity,
//         duration: targetOpacity > 0 ? 0.2 : 0.5,
//         ease: 'power2.out'
//       });
//     };

//     const handleMouseLeave = () => {
//       isInsideSection.current = false;
//       gridRef.current?.querySelectorAll('.card').forEach(card => {
//         card.style.setProperty('--glow-intensity', '0');
//       });
//       if (spotlightRef.current) {
//         gsap.to(spotlightRef.current, {
//           opacity: 0,
//           duration: 0.3,
//           ease: 'power2.out'
//         });
//       }
//     };

//     document.addEventListener('mousemove', handleMouseMove);
//     document.addEventListener('mouseleave', handleMouseLeave);

//     return () => {
//       document.removeEventListener('mousemove', handleMouseMove);
//       document.removeEventListener('mouseleave', handleMouseLeave);
//       spotlightRef.current?.parentNode?.removeChild(spotlightRef.current);
//     };
//   }, [gridRef, disableAnimations, enabled, spotlightRadius, glowColor]);

//   return null;
// };

// const BentoCardGrid = ({ children, gridRef }) => (
//   <div
//     className="bento-section grid gap-2 p-3 max-w-[54rem] select-none relative"
//     style={{ fontSize: 'clamp(1rem, 0.9rem + 0.5vw, 1.5rem)' }}
//     ref={gridRef}
//   >
//     {children}
//   </div>
// );

// const useMobileDetection = () => {
//   const [isMobile, setIsMobile] = useState(false);

//   useEffect(() => {
//     const checkMobile = () => setIsMobile(window.innerWidth <= MOBILE_BREAKPOINT);

//     checkMobile();
//     window.addEventListener('resize', checkMobile);

//     return () => window.removeEventListener('resize', checkMobile);
//   }, []);

//   return isMobile;
// };

// const MagicBento = ({
//   textAutoHide = true,
//   enableStars = true,
//   enableSpotlight = true,
//   enableBorderGlow = true,
//   disableAnimations = false,
//   spotlightRadius = DEFAULT_SPOTLIGHT_RADIUS,
//   particleCount = DEFAULT_PARTICLE_COUNT,
//   enableTilt = false,
//   glowColor = DEFAULT_GLOW_COLOR,
//   clickEffect = true,
//   enableMagnetism = true
// }) => {
//   const gridRef = useRef(null);
//   const isMobile = useMobileDetection();
//   const shouldDisableAnimations = disableAnimations || isMobile;

//   return (
//     <div className="flex justify-center items-center py-10 bg-transparent">
//       <style>
//         {`
//           .bento-section {
//             --glow-x: 50%;
//             --glow-y: 50%;
//             --glow-intensity: 0;
//             --glow-radius: ${spotlightRadius}px;
//             --glow-color: ${glowColor};
//             /* Using TailWind CSS variables here */
//             --border-color: #392e4e; 
//             --background-dark: #060010;
//             --white: rgb(var(--foreground)); 
//             --purple-primary: rgb(var(--primary));
//             --purple-glow: rgba(var(--primary), 0.2);
//             --purple-border: rgba(var(--primary), 0.8);
//           }
          
//           .card-responsive {
//             grid-template-columns: 1fr;
//             width: 100%;
//             margin: 0;
//             padding: 0.5rem;
//           }
          
//           @media (min-width: 600px) {
//             .card-responsive {
//               grid-template-columns: repeat(2, 1fr);
//             }
//           }
          
//           @media (min-width: 1024px) {
//             .card-responsive {
//               grid-template-columns: repeat(4, 1fr);
//             }
            
//             .card-responsive .card:nth-child(3) {
//               grid-column: span 2;
//               grid-row: span 2;
//             }
            
//             .card-responsive .card:nth-child(4) {
//               grid-column: 1 / span 2;
//               grid-row: 2 / span 2;
//             }
            
//             .card-responsive .card:nth-child(6) {
//               grid-column: 4;
//               grid-row: 3;
//             }
//           }
          
//           .card--border-glow::after {
//             content: '';
//             position: absolute;
//             inset: 0;
//             padding: 6px;
//             background: radial-gradient(var(--glow-radius) circle at var(--glow-x) var(--glow-y),
//               rgba(${glowColor}, calc(var(--glow-intensity) * 0.8)) 0%,
//               rgba(${glowColor}, calc(var(--glow-intensity) * 0.4)) 30%,
//               transparent 60%);
//             border-radius: inherit;
//             mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
//             mask-composite: subtract;
//             -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
//             -webkit-mask-composite: xor;
//             pointer-events: none;
//             transition: opacity 0.3s ease;
//             z-index: 1;
//           }
          
//           .card--border-glow:hover::after {
//             opacity: 1;
//           }
          
//           .card--border-glow:hover {
//             box-shadow: 0 4px 20px rgba(46, 24, 78, 0.4), 0 0 30px rgba(${glowColor}, 0.2);
//           }
          
//           .particle::before {
//             content: '';
//             position: absolute;
//             top: -2px;
//             left: -2px;
//             right: -2px;
//             bottom: -2px;
//             background: rgba(${glowColor}, 0.2);
//             border-radius: 50%;
//             z-index: -1;
//           }
          
//           .particle-container:hover {
//             box-shadow: 0 4px 20px rgba(46, 24, 78, 0.2), 0 0 30px rgba(${glowColor}, 0.2);
//           }
          
//           .text-clamp-1 {
//             display: -webkit-box;
//             -webkit-box-orient: vertical;
//             -webkit-line-clamp: 1;
//             line-clamp: 1;
//             overflow: hidden;
//             text-overflow: ellipsis;
//           }
          
//           .text-clamp-2 {
//             display: -webkit-box;
//             -webkit-box-orient: vertical;
//             -webkit-line-clamp: 2;
//             line-clamp: 2;
//             overflow: hidden;
//             text-overflow: ellipsis;
//             }
          
//           @media (max-width: 599px) {
//             .card-responsive {
//               grid-template-columns: 1fr;
//               width: 90%;
//               margin: 0 auto;
//               padding: 0.5rem;
//             }
            
//             .card-responsive .card {
//               width: 100%;
//               min-height: 180px;
//             }
//           }
//         `}
//       </style>

//       {enableSpotlight && (
//         <GlobalSpotlight
//           gridRef={gridRef}
//           disableAnimations={shouldDisableAnimations}
//           enabled={enableSpotlight}
//           spotlightRadius={spotlightRadius}
//           glowColor={glowColor}
//         />
//       )}

//       <BentoCardGrid gridRef={gridRef}>
//         <div className="card-responsive grid gap-4">
//           {cardData.map((card, index) => {
//             const baseClassName = `card flex flex-col justify-between relative aspect-[4/3] min-h-[200px] w-full max-w-full p-5 rounded-2xl border border-solid font-light overflow-hidden transition-all duration-300 ease-in-out hover:-translate-y-0.5 hover:shadow-[0_8px_25px_rgba(0,0,0,0.15)] ${
//               enableBorderGlow ? 'card--border-glow' : ''
//             }`;

//             const cardStyle = {
//               backgroundColor: card.color || 'var(--background-dark)',
//               borderColor: 'var(--border-color)',
//               color: 'var(--white)',
//               '--glow-x': '50%',
//               '--glow-y': '50%',
//               '--glow-intensity': '0',
//               '--glow-radius': '200px'
//             };

//             if (enableStars) {
//               return (
//                 <ParticleCard
//                   key={index}
//                   className={baseClassName}
//                   style={cardStyle}
//                   disableAnimations={shouldDisableAnimations}
//                   particleCount={particleCount}
//                   glowColor={glowColor}
//                   enableTilt={enableTilt}
//                   clickEffect={clickEffect}
//                   enableMagnetism={enableMagnetism}
//                 >
//                   <div className="card__header flex justify-between gap-3 relative text-white">
//                     <span className="card__label text-base">{card.label}</span>
//                   </div>
//                   <div className="card__content flex flex-col relative text-white">
//                     <h3 className={`card__title font-normal text-xl m-0 mb-1 ${textAutoHide ? 'text-clamp-1' : ''}`}>
//                       {card.title}
//                     </h3>
//                     <p
//                       className={`card__description text-sm leading-5 opacity-90 ${textAutoHide ? 'text-clamp-2' : ''}`}
//                     >
//                       {card.description}
//                     </p>
//                   </div>
//                 </ParticleCard>
//               );
//             }

//             // Fallback for non-ParticleCard
//             return (
//               <div
//                 key={index}
//                 className={baseClassName}
//                 style={cardStyle}
//               >
//                 <div className="card__header flex justify-between gap-3 relative text-white">
//                   <span className="card__label text-base">{card.label}</span>
//                 </div>
//                 <div className="card__content flex flex-col relative text-white">
//                   <h3 className={`card__title font-normal text-xl m-0 mb-1 ${textAutoHide ? 'text-clamp-1' : ''}`}>
//                     {card.title}
//                   </h3>
//                   <p className={`card__description text-sm leading-5 opacity-90 ${textAutoHide ? 'text-clamp-2' : ''}`}>
//                     {card.description}
//                   </p>
//                 </div>
//               </div>
//             );
//           })}
//         </div>
//       </BentoCardGrid>
//     </div>
//   );
// };

// export default MagicBento;



// Kairo/src/components/MagicBento.jsx

import { useRef, useEffect, useState } from 'react';
import { gsap } from 'gsap';
import { ParticleCard } from './ParticleCard';

const DEFAULT_PARTICLE_COUNT = 12;
const DEFAULT_SPOTLIGHT_RADIUS = 300;
const DEFAULT_GLOW_COLOR = '132, 0, 255';
const MOBILE_BREAKPOINT = 768;

const cardData = [
  {
    color: '#060010',
    title: 'Analytics',
    description: 'Track user behavior',
    label: 'Insights'
  },
  {
    color: '#060010',
    title: 'Dashboard',
    description: 'Centralized data view',
    label: 'Overview'
  },
  {
    color: '#060010',
    title: 'Collaboration',
    description: 'Work together seamlessly',
    label: 'Teamwork'
  },
  {
    color: '#060010',
    title: 'Automation',
    description: 'Streamline workflows',
    label: 'Efficiency'
  },
  {
    color: '#060010',
    title: 'Integration',
    description: 'Connect favorite tools',
    label: 'Connectivity'
  },
  {
    color: '#060010',
    title: 'Security',
    description: 'Enterprise-grade protection',
    label: 'Protection'
  }
];

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

const GlobalSpotlight = ({
  gridRef,
  disableAnimations = false,
  enabled = true,
  spotlightRadius = DEFAULT_SPOTLIGHT_RADIUS,
  glowColor = DEFAULT_GLOW_COLOR
}) => {
  const spotlightRef = useRef(null);
  const isInsideSection = useRef(false);

  useEffect(() => {
    if (disableAnimations || !gridRef?.current || !enabled) return;

    const spotlight = document.createElement('div');
    spotlight.className = 'global-spotlight';
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
      if (!spotlightRef.current || !gridRef.current) return;

      const section = gridRef.current.closest('.bento-section');
      const rect = section?.getBoundingClientRect();
      const mouseInside =
        rect && e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom;

      isInsideSection.current = mouseInside || false;
      const cards = gridRef.current.querySelectorAll('.card');

      if (!mouseInside) {
        gsap.to(spotlightRef.current, {
          opacity: 0,
          duration: 0.3,
          ease: 'power2.out'
        });
        cards.forEach(card => {
          card.style.setProperty('--glow-intensity', '0');
        });
        return;
      }

      const { proximity, fadeDistance } = calculateSpotlightValues(spotlightRadius);
      let minDistance = Infinity;

      cards.forEach(card => {
        const cardElement = card;
        const cardRect = cardElement.getBoundingClientRect();
        const centerX = cardRect.left + cardRect.width / 2;
        const centerY = cardRect.top + cardRect.height / 2;
        const distance =
          Math.hypot(e.clientX - centerX, e.clientY - centerY) - Math.max(cardRect.width, cardRect.height) / 2;
        const effectiveDistance = Math.max(0, distance);

        minDistance = Math.min(minDistance, effectiveDistance);

        let glowIntensity = 0;
        if (effectiveDistance <= proximity) {
          glowIntensity = 1;
        } else if (effectiveDistance <= fadeDistance) {
          glowIntensity = (fadeDistance - effectiveDistance) / (fadeDistance - proximity);
        }

        updateCardGlowProperties(cardElement, e.clientX, e.clientY, glowIntensity, spotlightRadius);
      });

      gsap.to(spotlightRef.current, {
        left: e.clientX,
        top: e.clientY,
        duration: 0.1,
        ease: 'power2.out'
      });

      const targetOpacity =
        minDistance <= proximity
          ? 0.8
          : minDistance <= fadeDistance
            ? ((fadeDistance - minDistance) / (fadeDistance - proximity)) * 0.8
            : 0;

      gsap.to(spotlightRef.current, {
        opacity: targetOpacity,
        duration: targetOpacity > 0 ? 0.2 : 0.5,
        ease: 'power2.out'
      });
    };

    const handleMouseLeave = () => {
      isInsideSection.current = false;
      gridRef.current?.querySelectorAll('.card').forEach(card => {
        card.style.setProperty('--glow-intensity', '0');
      });
      if (spotlightRef.current) {
        gsap.to(spotlightRef.current, {
          opacity: 0,
          duration: 0.3,
          ease: 'power2.out'
        });
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      spotlightRef.current?.parentNode?.removeChild(spotlightRef.current);
    };
  }, [gridRef, disableAnimations, enabled, spotlightRadius, glowColor]);

  return null;
};

const BentoCardGrid = ({ children, gridRef }) => (
  <div
    className="bento-section grid gap-2 p-3 max-w-[54rem] select-none relative"
    style={{ fontSize: 'clamp(1rem, 0.9rem + 0.5vw, 1.5rem)' }}
    ref={gridRef}
  >
    {children}
  </div>
);

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

// MODIFIED: Added 'children' to the props destructuring
const MagicBento = ({
  children,
  textAutoHide = true,
  enableStars = true,
  enableSpotlight = true,
  enableBorderGlow = true,
  disableAnimations = false,
  spotlightRadius = DEFAULT_SPOTLIGHT_RADIUS,
  particleCount = DEFAULT_PARTICLE_COUNT,
  enableTilt = false,
  glowColor = DEFAULT_GLOW_COLOR,
  clickEffect = true,
  enableMagnetism = true
}) => {
  const gridRef = useRef(null);
  const isMobile = useMobileDetection();
  const shouldDisableAnimations = disableAnimations || isMobile;

  return (
    <div className="flex justify-center items-center py-10 bg-transparent">
      <style>
        {`
          .bento-section {
            --glow-x: 50%;
            --glow-y: 50%;
            --glow-intensity: 0;
            --glow-radius: ${spotlightRadius}px;
            --glow-color: ${glowColor};
            --border-color: #392e4e; 
            --background-dark: #060010;
            --white: rgb(var(--foreground)); 
            --purple-primary: rgb(var(--primary));
            --purple-glow: rgba(var(--primary), 0.2);
            --purple-border: rgba(var(--primary), 0.8);
          }
          /* ... other styles are the same ... */
          .card-responsive {
            grid-template-columns: 1fr;
            width: 100%;
            margin: 0;
            padding: 0.5rem;
          }
          @media (min-width: 600px) { .card-responsive { grid-template-columns: repeat(2, 1fr); } }
          @media (min-width: 1024px) {
            .card-responsive { grid-template-columns: repeat(4, 1fr); }
            .card-responsive .card:nth-child(3) { grid-column: span 2; grid-row: span 2; }
            .card-responsive .card:nth-child(4) { grid-column: 1 / span 2; grid-row: 2 / span 2; }
            .card-responsive .card:nth-child(6) { grid-column: 4; grid-row: 3; }
          }
        `}
      </style>

      {enableSpotlight && (
        <GlobalSpotlight
          gridRef={gridRef}
          disableAnimations={shouldDisableAnimations}
          enabled={enableSpotlight}
          spotlightRadius={spotlightRadius}
          glowColor={glowColor}
        />
      )}

      <BentoCardGrid gridRef={gridRef}>
        {/* MODIFIED: Conditionally render children or the default grid */}
        {children ? (
          children
        ) : (
          <div className="card-responsive grid gap-4">
            {cardData.map((card, index) => {
              const baseClassName = `card flex flex-col justify-between relative aspect-[4/3] min-h-[200px] w-full max-w-full p-5 rounded-2xl border border-solid font-light overflow-hidden transition-all duration-300 ease-in-out hover:-translate-y-0.5 hover:shadow-[0_8px_25px_rgba(0,0,0,0.15)] ${
                enableBorderGlow ? 'card--border-glow' : ''
              }`;
              const cardStyle = {
                backgroundColor: card.color || 'var(--background-dark)',
                borderColor: 'var(--border-color)',
                color: 'var(--white)',
                '--glow-x': '50%',
                '--glow-y': '50%',
                '--glow-intensity': '0',
                '--glow-radius': '200px'
              };
              if (enableStars) {
                return (
                  <ParticleCard
                    key={index}
                    className={baseClassName}
                    style={cardStyle}
                    disableAnimations={shouldDisableAnimations}
                    particleCount={particleCount}
                    glowColor={glowColor}
                    enableTilt={enableTilt}
                    clickEffect={clickEffect}
                    enableMagnetism={enableMagnetism}
                  >
                    <div className="card__header flex justify-between gap-3 relative text-white">
                      <span className="card__label text-base">{card.label}</span>
                    </div>
                    <div className="card__content flex flex-col relative text-white">
                      <h3 className={`card__title font-normal text-xl m-0 mb-1 ${textAutoHide ? 'text-clamp-1' : ''}`}>
                        {card.title}
                      </h3>
                      <p className={`card__description text-sm leading-5 opacity-90 ${textAutoHide ? 'text-clamp-2' : ''}`}>
                        {card.description}
                      </p>
                    </div>
                  </ParticleCard>
                );
              }
              return (
                <div
                  key={index}
                  className={baseClassName}
                  style={cardStyle}
                >
                  <div className="card__header flex justify-between gap-3 relative text-white">
                    <span className="card__label text-base">{card.label}</span>
                  </div>
                  <div className="card__content flex flex-col relative text-white">
                    <h3 className={`card__title font-normal text-xl m-0 mb-1 ${textAutoHide ? 'text-clamp-1' : ''}`}>
                      {card.title}
                    </h3>
                    <p className={`card__description text-sm leading-5 opacity-90 ${textAutoHide ? 'text-clamp-2' : ''}`}>
                      {card.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </BentoCardGrid>
    </div>
  );
};

export default MagicBento;