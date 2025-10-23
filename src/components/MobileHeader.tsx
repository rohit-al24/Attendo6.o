import React from "react";
import { useLocation } from "react-router-dom";

type Props = {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  style?: React.CSSProperties;
};

const MobileHeader: React.FC<Props> = ({ title, showBack = true, onBack, style }) => {
  const location = useLocation?.();
  const routeTitleMap: Record<string, string> = {
    "/": "Home",
    "/login-selection": "Login",
    "/student-login": "Student Login",
    "/faculty-login": "Faculty Login",
    "/admin-login": "Admin Login",
    "/student-dashboard": "Student Portal",
    "/student/attendance": "Attendance",
    "/student/announcements": "Announcements",
    "/student/results": "Results",
    "/student/profile": "Profile",
    "/faculty-dashboard": "Faculty Portal",
    "/admin-dashboard": "Admin Portal",
    "/admin/faculty": "Faculty Management",
    "/admin/students": "Student Management",
    "/admin/faculty-activities": "Faculty Activities",
    "/admin/exams": "Exam Management",
    "/admin/announcements": "Announcements",
    "/faculty/attendance-marking": "Attendance Marking",
    "/faculty/timetable-management": "Timetable",
    "/faculty/advisor-attendance-report": "Advisor Report",
    "/faculty/AdvisorAttendanceEdit": "Edit Attendance",
    "/faculty/publish-results": "Publish Results",
  };
  const inferredTitle = title || (location?.pathname ? (routeTitleMap[location.pathname] || "") : "");
  const handleBack = () => {
    if (onBack) return onBack();
    // Prefer Android interface if available
    // @ts-ignore
    if (window.AndroidInterface && typeof window.AndroidInterface.goBack === "function") {
      // @ts-ignore
      window.AndroidInterface.goBack();
    } else {
      window.history.back();
    }
  };

  return (
    <div
      style={{
        height: 32,
        background: "linear-gradient(90deg, #f8fafc 0%, #e2e8f0 100%)",
        display: "flex",
        alignItems: "center",
        boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
        position: "sticky",
        top: 0,
        zIndex: 30,
        paddingLeft: 8,
        paddingRight: 8,
        ...style,
      }}
    >
      <span style={{ display: "flex", alignItems: "center" }}>
        {showBack && (
          <button
            aria-label="Back"
            onClick={handleBack}
            style={{
              background: "none",
              border: "none",
              padding: 0,
              fontSize: 18,
              color: "#333",
              cursor: "pointer",
              height: "100%",
              display: "flex",
              alignItems: "center",
              marginRight: 6,
            }}
          >
            &#8592;
          </button>
        )}
        {(inferredTitle || title) && (
          <span style={{ fontWeight: 500, fontSize: 15, color: "#444" }}>{inferredTitle || title}</span>
        )}
      </span>
    </div>
  );
};

export default MobileHeader;
