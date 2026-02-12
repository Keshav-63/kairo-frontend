# Kairo - AI Smart Pendant: Conversational Memory Assistant

Kairo is a modern, high-fidelity UI/UX prototype for a wearable conversational memory assistant. It features a dark, vibrant theme built with React and Tailwind CSS, incorporating interactive particle effects, advanced animations, and a dynamic layout to enhance user engagement.

## ✨ Key Features

This project focuses heavily on delivering a premium, interactive user interface:

| Feature Area | Description |
| :--- | :--- |
| **Dynamic Hero Background** | The landing page features an interactive **WebGL Orb animation** built with `ogl`, providing a futuristic and engaging visual centerpiece with hover distortion effects. |
| **Interactive UI Components** | All internal application pages (`QueryAI`, `History`, `Profile`, etc.) utilize **Magic Bento**-style animations. Major components are wrapped in a `ParticleCard` to enable: **Tilt/Magnetism effects**, **Particle animations**, and **Spotlight border glows** on hover. |
| **Core Functionality Mockup** | Includes dedicated pages for **Query AI** (chat interface), **Recordings** management (with waveform visualization), **Voice Enrollment** (multi-step process), and **User Profile** settings. |
| **Optimized Layout** | Features a responsive sidebar that correctly adjusts the main page content width (`ml-16` / `ml-64`) when collapsed or expanded, ensuring efficient screen usage. |
| **Consistent Dark Theme** | Uses a high-contrast dark theme with a distinct purple/cyan primary gradient (`.gradient-text`, `.glow-primary`) and a cohesive dark gray sidebar (`bg-muted`). |

***

## 🛠️ Tech Stack

* **Frontend Framework:** React (with Vite)
* **Styling:** Tailwind CSS, PostCSS (for utility-first, dark theme design)
* **Routing:** `react-router-dom`
* **Global State & Effects:** `useState`, `useEffect`, `useRef` hooks
* **Animations:** `gsap` (GreenSock Animation Platform) for UI effects (tilt, magnetism, particles)
* **WebGL Graphics:** `ogl` (for the Homepage Orb animation)
* **Utilities:** `clsx`, `tailwind-merge`, `react-hot-toast`

***

## 🚀 Installation and Setup

### Prerequisites

You need [Node.js](https://nodejs.org/) (version 18 or newer recommended) and npm/yarn installed.

### Steps

1.  **Install Dependencies:**
    Since the `ogl` library is used for the homepage, ensure all dependencies are installed.

    ```bash
    npm install
    # or
    yarn install
    ```

2.  **Run Development Server:**
    The project uses Vite for a fast development experience.

    ```bash
    npm run dev
    # or
    yarn dev
    ```

3.  **View the Application:**
    The application should now be running at [http://localhost:3000/](http://localhost:3000/) (as configured in `vite.config.js`).

***


