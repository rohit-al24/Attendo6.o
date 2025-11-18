import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

type Props = {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  iconText?: string;
  right?: React.ReactNode;
  style?: React.CSSProperties;
};

const MobileHeader: React.FC<Props> = ({ title, showBack = true, onBack, iconText, right, style }) => {
  const location = useLocation?.();
  const navigate = useNavigate();
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
  const resolvedTitle = title || (location?.pathname ? routeTitleMap[location.pathname] : "") || "";

  const handleBack = () => {
    if (onBack) return onBack();
    // Prefer Android interface if available
    // @ts-ignore
    if (window.AndroidInterface && typeof window.AndroidInterface.goBack === "function") {
      // @ts-ignore
      window.AndroidInterface.goBack();
      return;
    }
    if (window.history.length > 1) {
      window.history.back();
    } else {
      navigate(-1);
    }
  };

  const letter = (iconText || resolvedTitle || "?").trim().charAt(0).toUpperCase() || "?";

  return (
    <>
      {/* Small status bar strip for mobile */}
        {/* Status/notification bar spacer: gray and adaptive height */}
        <div
          className="sticky top-0 z-50 bg-slate-200"
          style={{ height: "calc(env(safe-area-inset-top, 0px) + 10px)" }}
        ></div>
      <header className="border-b bg-card shadow-soft" style={style}>
      <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {showBack && (
            <button
              onClick={handleBack}
              aria-label="Go back"
              className="w-8 h-8 rounded-lg border bg-background hover:bg-muted flex items-center justify-center text-foreground"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-white text-xl font-bold leading-none">{letter}</span>
          </div>
          <div className="min-w-0">
            <h1 className="text-base md:text-lg font-bold leading-tight truncate">{resolvedTitle}</h1>
          </div>
        </div>
        {right && (
          <div className="flex flex-row flex-wrap items-center justify-end md:gap-4 gap-2 text-xs md:text-sm font-semibold text-muted-foreground">
            {right}
          </div>
        )}
      </div>
      </header>
    </>
  );
};

export default MobileHeader;
