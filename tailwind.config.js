// /** @type {import('tailwindcss').Config} */
// module.exports = {
//   content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}", "*.{js,ts,jsx,tsx,mdx}"],
//   theme: {
//     extend: {
//       colors: {
//         card: "hsl(var(--card))",
//         "card-foreground": "hsl(var(--card-foreground))",
//         accent: "hsl(var(--accent))",
//         "accent-foreground": "hsl(var(--accent-foreground))",
//       },
//       animation: {
//         "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
//       },
//     },
//   },
//   plugins: [require("tailwindcss-animate")],
// }






// /** @type {import('tailwindcss').Config} */
// module.exports = {
//   content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}", "*.{js,ts,jsx,tsx,mdx}"],
//   theme: {
//     extend: {
//       colors: {
//         card: "hsl(var(--card))",
//         "card-foreground": "hsl(var(--card-foreground))",
//         accent: "hsl(var(--accent))",
//         "accent-foreground": "hsl(var(--accent-foreground))",
//       },
//       animation: {
//         "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
//       },
//     },
//   },
//   plugins: [require("tailwindcss-animate")],
// }



















// // Kairo/tailwind.config.js
// /** @type {import('tailwindcss').Config} */
// module.exports = {
//   content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}", "*.{js,ts,jsx,tsx,mdx}"],
//   theme: {
//     extend: {
//       colors: {
//         card: "hsl(var(--card))",
//         "card-foreground": "hsl(var(--card-foreground))",
//         accent: "hsl(var(--accent))",
//         "accent-foreground": "hsl(var(--accent-foreground))",
//       },
//       keyframes: {
//         "pulse-slow": {
//           "0%, 100%": { opacity: 1 },
//           "50%": { opacity: 0.5 },
//         },
//         // GLITCH KEYFRAMES
//         glitch: {
//           "0%": { "clip-path": "inset(20% 0 50% 0)" },
//           "5%": { "clip-path": "inset(10% 0 60% 0)" },
//           "10%": { "clip-path": "inset(15% 0 55% 0)" },
//           "15%": { "clip-path": "inset(25% 0 35% 0)" },
//           "20%": { "clip-path": "inset(30% 0 40% 0)" },
//           "25%": { "clip-path": "inset(40% 0 20% 0)" },
//           "30%": { "clip-path": "inset(10% 0 60% 0)" },
//           "35%": { "clip-path": "inset(15% 0 55% 0)" },
//           "40%": { "clip-path": "inset(25% 0 35% 0)" },
//           "45%": { "clip-path": "inset(30% 0 40% 0)" },
//           "50%": { "clip-path": "inset(20% 0 50% 0)" },
//           "55%": { "clip-path": "inset(10% 0 60% 0)" },
//           "60%": { "clip-path": "inset(15% 0 55% 0)" },
//           "65%": { "clip-path": "inset(25% 0 35% 0)" },
//           "70%": { "clip-path": "inset(30% 0 40% 0)" },
//           "75%": { "clip-path": "inset(40% 0 20% 0)" },
//           "80%": { "clip-path": "inset(20% 0 50% 0)" },
//           "85%": { "clip-path": "inset(10% 0 60% 0)" },
//           "90%": { "clip-path": "inset(15% 0 55% 0)" },
//           "95%": { "clip-path": "inset(25% 0 35% 0)" },
//           "100%": { "clip-path": "inset(30% 0 40% 0)" },
//         },
//         // GRADIENT KEYFRAMES
//         gradient: {
//           '0%': { backgroundPosition: '0% 50%' },
//           '50%': { backgroundPosition: '100% 50%' },
//           '100%': { backgroundPosition: '0% 50%' },
//         },
//       },
//       animation: {
//         "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
//         "glitch-after": "glitch var(--after-duration) infinite linear alternate-reverse",
//         "glitch-before": "glitch var(--before-duration) infinite linear alternate-reverse",
//         gradient: 'gradient var(--animation-duration) linear infinite',
//       },
//     },
//   },
//   plugins: [require("tailwindcss-animate")],
// }
















const { fontFamily } = require('tailwindcss/defaultTheme');

// Kairo/tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}", "*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        // Add 'Inter' as the first font in the 'sans' stack
        sans: ['Inter', ...fontFamily.sans],
      },
      colors: {
        card: "hsl(var(--card))",
        "card-foreground": "hsl(var(--card-foreground))",
        accent: "hsl(var(--accent))",
        "accent-foreground": "hsl(var(--accent-foreground))",
      },
      keyframes: {
        "pulse-slow": {
          "0%, 100%": { opacity: 1 },
          "50%": { opacity: 0.5 },
        },
        // GLITCH KEYFRAMES (Keeping these for other pages like QueryAI)
        glitch: {
          "0%": { "clip-path": "inset(20% 0 50% 0)" },
          "5%": { "clip-path": "inset(10% 0 60% 0)" },
          "10%": { "clip-path": "inset(15% 0 55% 0)" },
          "15%": { "clip-path": "inset(25% 0 35% 0)" },
          "20%": { "clip-path": "inset(30% 0 40% 0)" },
          "25%": { "clip-path": "inset(40% 0 20% 0)" },
          "30%": { "clip-path": "inset(10% 0 60% 0)" },
          "35%": { "clip-path": "inset(15% 0 55% 0)" },
          "40%": { "clip-path": "inset(25% 0 35% 0)" },
          "45%": { "clip-path": "inset(30% 0 40% 0)" },
          "50%": { "clip-path": "inset(20% 0 50% 0)" },
          "55%": { "clip-path": "inset(10% 0 60% 0)" },
          "60%": { "clip-path": "inset(15% 0 55% 0)" },
          "65%": { "clip-path": "inset(25% 0 35% 0)" },
          "70%": { "clip-path": "inset(30% 0 40% 0)" },
          "75%": { "clip-path": "inset(40% 0 20% 0)" },
          "80%": { "clip-path": "inset(20% 0 50% 0)" },
          "85%": { "clip-path": "inset(10% 0 60% 0)" },
          "90%": { "clip-path": "inset(15% 0 55% 0)" },
          "95%": { "clip-path": "inset(25% 0 35% 0)" },
          "100%": { "clip-path": "inset(30% 0 40% 0)" },
        },
        // GRADIENT KEYFRAMES
        gradient: {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "glitch-after": "glitch var(--after-duration) infinite linear alternate-reverse",
        "glitch-before": "glitch var(--before-duration) infinite linear alternate-reverse",
        // GRADIENT ANIMATION
        gradient: 'gradient var(--animation-duration) linear infinite',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}