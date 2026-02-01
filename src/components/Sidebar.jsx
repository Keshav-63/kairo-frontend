// import { Link, useLocation } from "react-router-dom";
// import useAuthStore from "../stores/authStore"; // Import the store

// const Sidebar = ({ user, isCollapsed, setIsCollapsed }) => {
//   const location = useLocation();
//   const logout = useAuthStore((state) => state.logout); // Get logout action from store
  

//   const menuItems = [
//     { path: "/", icon: "home", label: "Home" },
//     { path: "/query", icon: "search", label: "Query AI" },
//     { path: "/history", icon: "history", label: "History" },
//     { path: "/recordings", icon: "mic", label: "Recordings" },
//     { path: "/voice-enrollment", icon: "user-plus", label: "Voice Enrollment" },
//     { path: "/profile", icon: "user", label: "Profile" },
//   ];

//   const getIcon = (iconName) => {
//     const icons = {
//       home: (
//         <path
//           strokeLinecap="round"
//           strokeLinejoin="round"
//           strokeWidth={2}
//           d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
//         />
//       ),
//       search: (
//         <path
//           strokeLinecap="round"
//           strokeLinejoin="round"
//           strokeWidth={2}
//           d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
//         />
//       ),
//       history: (
//         <path
//           strokeLinecap="round"
//           strokeLinejoin="round"
//           strokeWidth={2}
//           d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
//         />
//       ),
//       mic: (
//         <path
//           strokeLinecap="round"
//           strokeLinejoin="round"
//           strokeWidth={2}
//           d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
//         />
//       ),
//       "user-plus": (
//         <path
//           strokeLinecap="round"
//           strokeLinejoin="round"
//           strokeWidth={2}
//           d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
//         />
//       ),
//       user: (
//         <path
//           strokeLinecap="round"
//           strokeLinejoin="round"
//           strokeWidth={2}
//           d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
//         />
//       ),
//       logout: (
//         <path
//           strokeLinecap="round"
//           strokeLinejoin="round"
//           strokeWidth={2}
//           d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
//         />
//       ),
//     };
//     return icons[iconName];
//   };

//   const handleLogout = () => {
//     logout(); // Call the logout action from the store
//   };

//   return (
//     <div
//       className={`fixed left-0 top-0 h-full bg-muted border-r border-border transition-all duration-300 z-50 ${isCollapsed ? "w-16" : "w-64"}`}
//     >
//       <div className="flex flex-col h-full">
//         {/* Header */}
//         <div className="p-6 border-b border-border">
//           <div className="flex items-center justify-between">
//             {!isCollapsed && (
//               <div className="flex items-center space-x-3">
//                 <div className="w-8 h-8">
//                 <img src="/kairo-logo.png" alt="kairo logo" className="w-full h-full object-contain" />
//                   {/* <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path
//                       strokeLinecap="round"
//                       strokeLinejoin="round"
//                       strokeWidth={2}
//                       d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
//                     />
//                   </svg> */}
//                 </div>
//                 <h2 className="text-xl font-bold gradient-text">Kairo</h2>
//               </div>
//             )}
//             <button
//               onClick={() => setIsCollapsed(!isCollapsed)}
//               className="p-2 hover:bg-muted/50 rounded-lg transition-colors text-muted-foreground"
//             >
//               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path
//                   strokeLinecap="round"
//                   strokeLinejoin="round"
//                   strokeWidth={2}
//                   d={isCollapsed ? "M9 5l7 7-7 7" : "M15 19l-7-7 7-7"}
//                 />
//               </svg>
//             </button>
//           </div>
//         </div>

//         {/* Navigation */}
//         <nav className="flex-1 p-4">
//           <ul className="space-y-2">
//             {menuItems.map((item) => (
//               <li key={item.path}>
//                 <Link
//                   to={item.path}
//                   className={`flex items-center space-x-3 px-3 py-3 rounded-lg transition-colors group ${
//                     location.pathname === item.path
//                       ? "bg-muted text-primary"
//                       : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
//                   }`}
//                 >
//                   <svg 
//                     className={`w-5 h-5 flex-shrink-0 transition-colors ${
//                         location.pathname === item.path ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
//                     }`} 
//                     fill="none" 
//                     stroke="currentColor" 
//                     viewBox="0 0 24 24"
//                   >
//                     {getIcon(item.icon)}
//                   </svg>
//                   {!isCollapsed && <span className="font-medium">{item.label}</span>}
//                 </Link>
//               </li>
//             ))}
//           </ul>
//         </nav>

//         {/* User section */}
//         <div className="p-4 border-t border-border">
//           {!isCollapsed && (
//             <div className="flex items-center space-x-3 mb-4">
//               <img
//                 src={user?.profilePhoto || "/placeholder.svg"}
//                 alt={user?.displayName}
//                 className="w-10 h-10 rounded-full border-2 border-primary/20"
//               />
//               <div className="flex-1 min-w-0">
//                 <p className="text-sm font-medium truncate text-foreground">{user?.displayName}</p>
//                 <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
//               </div>
//             </div>
//           )}

//           <button
//             onClick={handleLogout}
//             className="flex items-center space-x-3 w-full px-3 py-3 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors group"
//           >
//             <svg className="w-5 h-5 flex-shrink-0 text-muted-foreground group-hover:text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               {getIcon("logout")}
//             </svg>
//             {!isCollapsed && <span className="font-medium">Logout</span>}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Sidebar;

import { Link, useLocation } from "react-router-dom";
import useAuthStore from "../stores/authStore"; // Import the store

const Sidebar = ({ user, isCollapsed, setIsCollapsed }) => {
  const location = useLocation();
  const logout = useAuthStore((state) => state.logout); // Get logout action from store

  // 1. Add "Memories" to the menu items array
  const menuItems = [
    { path: "/", icon: "home", label: "Home" },
    { path: "/query", icon: "search", label: "Query AI" },
    { path: "/memories", icon: "brain", label: "Memories" }, // New item
    { path: "/kairo-plus", icon: "chart", label: "Kairo Plus" }, 
    { path: "/tasks", icon: "check", label: "Tasks" },
    { path: "/history", icon: "history", label: "History" },
    { path: "/recordings", icon: "mic", label: "Recordings" },
    { path: "/voice-enrollment", icon: "user-plus", label: "Voice Enrollment" },
    { path: "/profile", icon: "user", label: "Profile" },
  ];

  const getIcon = (iconName) => {
    const icons = {
      // 2. Add the new "brain" icon SVG path
      check: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      ),
      chart: (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
      ),
      brain: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 15a4 4 0 004 4h6a4 4 0 004-4v-3a4 4 0 00-4-4h-2a2 2 0 01-2-2V4a2 2 0 00-2-2h-2a2 2 0 00-2 2v2a2 2 0 01-2 2H7a4 4 0 00-4 4v3z"
        />
      ),
      home: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
        />
      ),
      search: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      ),
      history: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      ),
      mic: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
        />
      ),
      "user-plus": (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
        />
      ),
      user: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
        />
      ),
      logout: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
        />
      ),
    };
    return icons[iconName] || <path d="M12 12h.01" />;
  };

  const handleLogout = () => {
    logout(); // Call the logout action from the store
  };

  return (
    <div
      className={`fixed left-0 top-0 h-full bg-muted border-r border-border transition-all duration-300 z-50 ${
        isCollapsed ? "w-16" : "w-64"
      }`}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            {!isCollapsed && (
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8">
                  <img
                    src="/kairo-logo.png"
                    alt="kairo logo"
                    className="w-full h-full object-contain"
                  />
                </div>
                <h2 className="text-xl font-bold gradient-text">Kairo</h2>
              </div>
            )}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-2 hover:bg-muted/50 rounded-lg transition-colors text-muted-foreground"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={isCollapsed ? "M9 5l7 7-7 7" : "M15 19l-7-7 7-7"}
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center space-x-3 px-3 py-3 rounded-lg transition-colors group ${
                    location.pathname === item.path
                      ? "bg-muted text-primary"
                      : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <svg
                    className={`w-5 h-5 flex-shrink-0 transition-colors ${
                      location.pathname === item.path
                        ? "text-primary"
                        : "text-muted-foreground group-hover:text-foreground"
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    {getIcon(item.icon)}
                  </svg>
                  {!isCollapsed && (
                    <span className="font-medium">{item.label}</span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-border">
          {!isCollapsed && (
            <div className="flex items-center space-x-3 mb-4">
              <img
                src={user?.profilePhoto || "/placeholder.svg"}
                alt={user?.displayName}
                className="w-10 h-10 rounded-full border-2 border-primary/20"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate text-foreground">
                  {user?.displayName}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user?.email}
                </p>
              </div>
            </div>
          )}

          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 w-full px-3 py-3 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors group"
          >
            <svg
              className="w-5 h-5 flex-shrink-0 text-muted-foreground group-hover:text-destructive"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {getIcon("logout")}
            </svg>
            {!isCollapsed && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;