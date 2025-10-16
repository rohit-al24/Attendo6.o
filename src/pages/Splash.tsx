import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import attendoLogo from "@/assets/attendo-logo.png";
import collegeBanner from "@/assets/college-banner.jpg";

const Splash = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/login-selection");
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gradient-primary relative overflow-hidden">
      {/* Animated background circles */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse delay-700"></div>
      </div>

      <div className="relative z-10 text-center space-y-8 animate-in fade-in zoom-in duration-700">
        {/* College Banner */}
        <div className="mb-8 rounded-2xl overflow-hidden shadow-large mx-auto max-w-2xl">
          <img 
            src={collegeBanner} 
            alt="College Banner" 
            className="w-full h-48 object-cover"
          />
        </div>

        {/* App Logo */}
        <div className="flex justify-center">
          <div className="bg-white p-6 rounded-3xl shadow-large transition-smooth hover:scale-105">
            <img 
              src={attendoLogo} 
              alt="Attendo Logo" 
              className="w-32 h-32"
            />
          </div>
        </div>

        {/* App Name */}
        <div className="space-y-2">
          <h1 className="text-6xl font-bold text-white tracking-tight">
            Attendo
          </h1>
          <p className="text-xl text-white/90 font-medium">
            Smart Attendance Management
          </p>
        </div>

        {/* Loading indicator */}
        <div className="flex justify-center pt-8">
          <div className="flex gap-2">
            <div className="w-3 h-3 bg-white rounded-full animate-bounce"></div>
            <div className="w-3 h-3 bg-white rounded-full animate-bounce delay-100"></div>
            <div className="w-3 h-3 bg-white rounded-full animate-bounce delay-200"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Splash;
