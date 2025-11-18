import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Home, BookOpen, Megaphone, FileBarChart, User2 } from "lucide-react";

const tabs = [
  { path: "/student-dashboard", label: "Home", icon: Home },
  { path: "/student/attendance", label: "Attendance", icon: BookOpen },
  { path: "/student/announcements", label: "Updates", icon: Megaphone },
  { path: "/student/results", label: "Results", icon: FileBarChart },
  { path: "/student/profile", label: "Profile", icon: User2 },
];

const StudentTabBar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  return (
    <nav
      aria-label="Student navigation"
      style={{
        width: '100%',
        zIndex: 60,
        background: "#ffffffcc",
        backdropFilter: "saturate(180%) blur(6px)",
        borderTop: "1px solid rgba(0,0,0,0.06)",
        // Prevent overlap with system nav bars (Android/iOS)
        paddingBottom: "calc(env(safe-area-inset-bottom) + 12px)",
        paddingTop: 6,
      }}
      className="safe-top"
    >
      <div className="max-w-screen-sm mx-auto grid grid-cols-5">
        {tabs.map(({ path, label, icon: Icon }) => {
          const active = location.pathname === path;
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`flex flex-col items-center justify-center py-2 text-xs ${active ? "text-primary" : "text-foreground/70"}`}
              style={{ background: "transparent", border: "none" }}
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span>{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default StudentTabBar;
