// Kairo/src/components/GradientText.jsx

import React from 'react';

export default function GradientText({
  children,
  className = '',
  colors = ['#9966FF', '#40ffaa', '#9966FF'],
  animationSpeed = 8,
}) {
  const gradientStyle = {
    backgroundImage: `linear-gradient(to right, ${colors.join(', ')})`,
    // Use CSS variable for animation duration, defined in tailwind.config.js
    animationDuration: `${animationSpeed}s`, 
  };

  return (
    <div
      className={`relative mx-auto flex max-w-fit flex-row items-center justify-center font-bold transition-shadow duration-500 cursor-pointer ${className}`}
    >
      <span
        className="inline-block relative z-2 text-transparent animate-gradient"
        style={{
          ...gradientStyle,
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent', // Crucial for visibility
          backgroundSize: '300% 100%'
        }}
      >
        {children}
      </span>
    </div>
  );
}