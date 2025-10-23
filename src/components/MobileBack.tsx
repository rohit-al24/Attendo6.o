import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

// A small floating back button shown on mobile screens across all pages.
// It prefers AndroidInterface.goBack() when present (for WebView apps),
// otherwise falls back to window.history.back().
// Hidden on desktop via `md:hidden`.
const HIDE_ON_ROUTES = new Set<string>(["/"]);

const MobileBack: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Hide on some root routes if desired
  if (HIDE_ON_ROUTES.has(location.pathname)) return null;

  const handleBack = () => {
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

  return (
    <button
      aria-label="Go back"
      onClick={handleBack}
      className="md:hidden fixed top-3 left-3 z-50 rounded-full bg-white/95 hover:bg-white shadow-lg border border-slate-200 p-2 active:scale-95 transition transform"
      style={{ WebkitTapHighlightColor: "transparent" }}
    >
      <span className="block w-5 h-5" style={{ lineHeight: 1, fontSize: 18 }}>←</span>
    </button>
  );
};

export default MobileBack;
