// src/App.jsx
import { useEffect, useState } from "react"; // <-- Import useState
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import AuthPage from "./components/AuthPage";
import HomePage from "./pages/HomePage";
import QueryAI from "./pages/QueryAI";
import History from "./pages/History";
import Recordings from "./pages/Recordings";
import VoiceEnrollment from "./pages/VoiceEnrollment";
import Profile from "./pages/Profile";
import Sidebar from "./components/Sidebar";
import useAuthStore from "./stores/authStore";
import Memories from "./pages/Memories";
import KairoPlus from "./pages/KairoPlus";
import Tasks from "./pages/Tasks";
import "./App.css";

function App() {
  const { isAuthenticated, user, loading, checkAuth, logout } = useAuthStore();
  const [isCollapsed, setIsCollapsed] = useState(false); // <-- Manage state here

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <AuthPage />
        <Toaster position="top-right" />
      </>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-background text-foreground">
        <div className="flex">
          <Sidebar
            user={user}
            onLogout={logout}
            isCollapsed={isCollapsed} // <-- Pass state
            setIsCollapsed={setIsCollapsed} // <-- Pass setter function
          />
          {/* Dynamically adjust margin based on isCollapsed state */}
          <main className={`flex-1 w-full transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/query" element={<QueryAI />} />
              <Route path="/history" element={<History />} />
              <Route path="/recordings" element={<Recordings />} />
              <Route path="/voice-enrollment" element={<VoiceEnrollment />} />
              <Route path="/profile" element={<Profile user={user} />} />
              <Route path="/kairo-plus" element={<KairoPlus />} />
              <Route path="/tasks" element={<Tasks />} />
              <Route path="/memories" element={<Memories />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
        <Toaster position="top-right" />
      </div>
    </Router>
  );
}

export default App;