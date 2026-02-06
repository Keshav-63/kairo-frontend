"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import toast from "react-hot-toast";
import useAuthStore from "../stores/authStore";
import { getTasks, completeTask } from "../api/axios";
import { ParticleCard } from "../components/ParticleCard";
import { gsap } from "gsap";
import {
  Calendar,
  List,
  CheckCircle,
  BrainCircuit,
  AlertTriangle,
} from "lucide-react";

// --- (Magic Bento effects utility code is included for styling) ---
const DEFAULT_SPOTLIGHT_RADIUS = 300;
const DEFAULT_GLOW_COLOR = "239, 68, 68"; // Destructive/Red color for tasks
const MOBILE_BREAKPOINT = 768;

const useMobileDetection = () => {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () =>
      setIsMobile(window.innerWidth <= MOBILE_BREAKPOINT);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);
  return isMobile;
};

const GlobalSpotlight = ({
  pageRef,
  disableAnimations = false,
  enabled = true,
  spotlightRadius = DEFAULT_SPOTLIGHT_RADIUS,
  glowColor = DEFAULT_GLOW_COLOR,
}) => {
  const spotlightRef = useRef(null);
  useEffect(() => {
    if (disableAnimations || !pageRef?.current || !enabled) return;
    const spotlight = document.createElement("div");
    spotlight.className = "global-spotlight-tasks";
    spotlight.style.cssText = `position: fixed; width: 800px; height: 800px; border-radius: 50%; pointer-events: none; background: radial-gradient(circle, rgba(${glowColor}, 0.1) 0%, transparent 70%); z-index: 200; opacity: 0; transform: translate(-50%, -50%); mix-blend-mode: screen;`;
    document.body.appendChild(spotlight);
    const handleMouseMove = (e) => {
      if (!spotlightRef.current || !pageRef.current) return;
      gsap.to(spotlightRef.current, {
        left: e.clientX,
        top: e.clientY,
        duration: 0.1,
        opacity: 1,
      });
    };
    document.addEventListener("mousemove", handleMouseMove);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      spotlight.remove();
    };
  }, [pageRef, disableAnimations, enabled, spotlightRadius, glowColor]);
  return null;
};
// --- (End of Magic Bento utility code) ---

const Tasks = () => {
  const { user } = useAuthStore();
  const [tasks, setTasks] = useState([]);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [view, setView] = useState("list"); // 'list' or 'calendar'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const pageRef = useRef(null);
  const [currentDate, setCurrentDate] = useState(new Date());

  const fetchAllTasks = async () => {
    if (!user?.googleId) return;
    try {
      setLoading(true);
      const [pending, completed] = await Promise.all([
        getTasks(user.googleId, "pending"),
        getTasks(user.googleId, "complete"),
      ]);
      setTasks(pending);
      setCompletedTasks(completed);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch tasks:", err);
      setError("Could not load your tasks.");
      toast.error("Could not load your tasks.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllTasks();
  }, [user]);

  const handleCompleteTask = async (taskId) => {
    try {
      await completeTask(taskId);
      toast.success("Task marked as complete!");
      // Refresh tasks from the backend
      fetchAllTasks();
    } catch (err) {
      toast.error("Failed to update task.");
    }
  };

  const isMobile = useMobileDetection();
  const bentoProps = useMemo(
    () => ({
      enableTilt: false,
      enableMagnetism: !isMobile,
      clickEffect: true,
      glowColor: DEFAULT_GLOW_COLOR,
      particleCount: 8,
    }),
    [isMobile]
  );

  // --- Calendar View Logic ---
  const daysInMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0
  ).getDate();
  const firstDayOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  ).getDay();
  const monthName = currentDate.toLocaleString("default", { month: "long" });
  const year = currentDate.getFullYear();

  const tasksByDate = useMemo(() => {
    const allTasks = [...tasks, ...completedTasks];
    return allTasks.reduce((acc, task) => {
      if (task.due_date_time) {
        const date = new Date(task.due_date_time).toISOString().split("T")[0];
        if (!acc[date]) {
          acc[date] = [];
        }
        acc[date].push(task);
      }
      return acc;
    }, {});
  }, [tasks, completedTasks]);

  const changeMonth = (offset) => {
    setCurrentDate(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + offset, 1)
    );
  };

  return (
    <>
      <div className="min-h-screen bg-background p-6" ref={pageRef}>
        <GlobalSpotlight
          pageRef={pageRef}
          disableAnimations={isMobile}
          enabled={true}
          glowColor={DEFAULT_GLOW_COLOR}
        />
        <style>{`.particle-card.card--border-glow::after { background: radial-gradient(300px circle at var(--glow-x) var(--glow-y), rgba(${DEFAULT_GLOW_COLOR}, calc(var(--glow-intensity) * 0.4)) 0%, transparent 60%); }`}</style>

        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold gradient-text mb-2">
                Your Tasks & Reminders
              </h1>
              <p className="text-muted-foreground">
                Automatically detected action items from your conversations.
              </p>
            </div>
            <div className="flex items-center gap-2 p-1 bg-muted rounded-lg">
              <button
                onClick={() => setView("list")}
                className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
                  view === "list"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-card"
                }`}
              >
                <List className="inline-block mr-2 h-4 w-4" />
                List View
              </button>
              <button
                onClick={() => setView("calendar")}
                className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
                  view === "calendar"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-card"
                }`}
              >
                <Calendar className="inline-block mr-2 h-4 w-4" />
                Calendar View
              </button>
            </div>
          </div>

          {loading && (
            <div className="flex justify-center items-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-destructive"></div>
            </div>
          )}

          {!loading && error && (
            <div className="text-center py-16 text-destructive">
              <AlertTriangle className="mx-auto h-12 w-12 mb-4" />
              <h3 className="text-xl font-semibold">{error}</h3>
            </div>
          )}

          {!loading && !error && view === "list" && (
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-semibold mb-4 text-foreground">
                  Pending Tasks ({tasks.length})
                </h2>
                {tasks.length === 0 ? (
                  <p className="text-muted-foreground">
                    No pending tasks. Great job!
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {tasks.map((task) => (
                      <ParticleCard
                        key={task._id.$oid}
                        {...bentoProps}
                        className="particle-card card--border-glow p-5 rounded-2xl border border-border/50"
                      >
                        <div className="flex flex-col h-full">
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-semibold text-foreground flex-grow">
                              {task.task_description}
                            </p>
                            {task.googleCalendarEventId && (
                              <span className="ml-2 px-2 py-1 text-xs bg-blue-500/10 text-blue-400 rounded">
                                Calendar
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground italic mt-2 mb-4">
                            "{task.context}"
                          </p>
                          <div className="flex items-center justify-between text-xs text-muted-foreground mt-auto">
                            <span>
                              Due:{" "}
                              {task.due_date_time
                                ? new Date(task.due_date_time).toLocaleString()
                                : "No date"}
                              {task.status === "scheduled" &&
                                !task.googleCalendarEventId && (
                                  <span className="ml-2 text-yellow-400">
                                    (Not synced)
                                  </span>
                                )}
                            </span>
                            <button
                              onClick={() => handleCompleteTask(task._id.$oid)}
                              className="p-2 rounded-full hover:bg-green-500/10 text-green-500 transition-colors"
                              title="Mark as complete"
                            >
                              <CheckCircle className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                      </ParticleCard>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <h2 className="text-2xl font-semibold mb-4 text-foreground">
                  Completed Tasks ({completedTasks.length})
                </h2>
                {completedTasks.length === 0 ? (
                  <p className="text-muted-foreground">
                    No tasks completed yet.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {completedTasks.slice(0, 5).map((task) => (
                      <div
                        key={task._id.$oid}
                        className="p-4 bg-card/50 rounded-lg border border-border/50 flex items-center justify-between opacity-60"
                      >
                        <p className="text-muted-foreground line-through">
                          {task.task_description}
                        </p>
                        <span className="text-xs text-green-500">
                          Completed on{" "}
                          {new Date(
                            task.completed_at.$date
                          ).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {!loading && !error && view === "calendar" && (
            <ParticleCard
              {...bentoProps}
              className="particle-card card--border-glow p-6 rounded-2xl border border-border/50"
            >
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => changeMonth(-1)}
                  className="p-2 rounded-md hover:bg-muted"
                >
                  &lt;
                </button>
                <h2 className="text-xl font-semibold text-foreground">
                  {monthName} {year}
                </h2>
                <button
                  onClick={() => changeMonth(1)}
                  className="p-2 rounded-md hover:bg-muted"
                >
                  &gt;
                </button>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground mb-2">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                  (day) => (
                    <div key={day}>{day}</div>
                  )
                )}
              </div>
              <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                  <div
                    key={`empty-${i}`}
                    className="border border-transparent rounded-md"
                  ></div>
                ))}
                {Array.from({ length: daysInMonth }).map((_, day) => {
                  const date = day + 1;
                  const dateStr = `${year}-${String(
                    currentDate.getMonth() + 1
                  ).padStart(2, "0")}-${String(date).padStart(2, "0")}`;
                  const tasksForDay = tasksByDate[dateStr] || [];
                  const isToday =
                    new Date().toDateString() ===
                    new Date(year, currentDate.getMonth(), date).toDateString();
                  return (
                    <div
                      key={date}
                      className={`p-2 border border-border/50 rounded-md h-28 flex flex-col ${
                        isToday ? "bg-primary/10" : ""
                      }`}
                    >
                      <span
                        className={`font-semibold ${
                          isToday ? "text-primary" : "text-foreground"
                        }`}
                      >
                        {date}
                      </span>
                      <div className="space-y-1 mt-1 overflow-y-auto text-left">
                        {tasksForDay.map((task) => (
                          <div
                            key={task._id.$oid}
                            className={`p-1 text-xs rounded ${
                              task.status === "complete"
                                ? "bg-green-500/10 text-green-400 line-through"
                                : task.googleCalendarEventId
                                ? "bg-blue-500/10 text-blue-400"
                                : "bg-destructive/10 text-red-400"
                            }`}
                          >
                            {task.task_description}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ParticleCard>
          )}
        </div>
      </div>
    </>
  );
};

export default Tasks;
