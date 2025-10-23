import React from "react";
import MobileHeader from "@/components/MobileHeader";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GraduationCap, Users, Shield } from "lucide-react";
import attendoLogo from "@/assets/pc.png";
import orgLogo from "@/assets/images.jpg";

const LoginSelection = () => {
  const navigate = useNavigate();

  const loginOptions = [
    {
      title: "Student Login",
      icon: GraduationCap,
      path: "/student-login",
      gradient: "gradient-primary"
    },
    {
      title: "Faculty Login",
      icon: Users,
      path: "/faculty-login",
      gradient: "gradient-secondary"
    },
    {
      title: "Admin Login",
      icon: Shield,
      path: "/admin-login",
      gradient: "gradient-accent"
    }
  ];

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-b from-[#181c2a] via-[#23284a] to-[#0a0d15] px-4 py-8">
      <MobileHeader title="Login" />
      {/* Logos at top */}
      <div className="flex flex-col items-center mb-10 mt-2">
  <div className="flex flex-row items-center justify-center gap-10 mb-6 pt-2">
          <div className="logo-drop-left p-2 rounded-2xl bg-gradient-to-br from-cyan-400/30 to-white/5 shadow-2xl border-4 border-cyan-400/70 transition-transform duration-300 hover:scale-110 hover:shadow-cyan-400/40">
            <img src={attendoLogo} alt="Attendo" className="w-24 h-24 rounded-2xl bg-white/10" />
          </div>
          <div className="logo-drop-right p-2 rounded-2xl bg-gradient-to-br from-indigo-400/30 to-white/5 shadow-2xl border-4 border-indigo-400/70 transition-transform duration-300 hover:scale-110 hover:shadow-indigo-400/40">
            <img src={orgLogo} alt="Org Logo" className="w-24 h-24 rounded-2xl bg-white/10" />
          </div>
        </div>
        <style>{`
          .logo-drop-left {
            animation: logoDropLeft 1.2s cubic-bezier(.6,1.6,.4,1) 0s both, logoBounceLive 2.8s cubic-bezier(.4,0,.2,1) 1.2s infinite alternate;
            will-change: transform, filter;
          }
          .logo-drop-right {
            animation: logoDropRight 1.2s cubic-bezier(.6,1.6,.4,1) 0.5s both, logoBounceLive 2.8s cubic-bezier(.4,0,.2,1) 1.7s infinite alternate;
            will-change: transform, filter;
          }
          @keyframes logoDropLeft {
            0% { opacity: 0; transform: translateX(-120px) translateY(-80px) scale(0.7) rotate(-18deg); }
            60% { opacity: 1; transform: translateX(0) translateY(10px) scale(1.08) rotate(0deg); }
            80% { transform: translateY(-18px) scale(0.96); }
            100% { opacity: 1; transform: translateY(0) scale(1) rotate(0deg); }
          }
          @keyframes logoDropRight {
            0% { opacity: 0; transform: translateX(120px) translateY(-80px) scale(0.7) rotate(18deg); }
            60% { opacity: 1; transform: translateX(0) translateY(10px) scale(1.08) rotate(0deg); }
            80% { transform: translateY(-18px) scale(0.96); }
            100% { opacity: 1; transform: translateY(0) scale(1) rotate(0deg); }
          }
          @keyframes logoBounceLive {
            0% { filter: drop-shadow(0 0 0px #fff0); transform: scale(1) translateY(0); }
            60% { filter: drop-shadow(0 0 24px #6ffcff66); transform: scale(1.04) translateY(-6px); }
            100% { filter: drop-shadow(0 0 0px #fff0); transform: scale(1) translateY(0); }
          }
        `}</style>
        <style>{`
          .logo-anim-live {
            animation: logoFloat 4.5s ease-in-out infinite alternate, logoPulseLive 2.8s cubic-bezier(.4,0,.2,1) infinite alternate;
            will-change: transform, filter;
          }
          @keyframes logoFloat {
            0% { transform: translateY(0) rotate(-2deg) scale(1); }
            30% { transform: translateY(-8px) rotate(2deg) scale(1.04); }
            60% { transform: translateY(6px) rotate(-3deg) scale(0.98); }
            100% { transform: translateY(0) rotate(0deg) scale(1); }
          }
          @keyframes logoPulseLive {
            0% { filter: drop-shadow(0 0 0px #fff0); }
            60% { filter: drop-shadow(0 0 24px #6ffcff66); }
            100% { filter: drop-shadow(0 0 0px #fff0); }
          }
        `}</style>
        <style>{`
          .logo-anim {
            animation: logoPulse 2.8s cubic-bezier(.4,0,.2,1) infinite alternate;
          }
          @keyframes logoPulse {
            0% { filter: drop-shadow(0 0 0px #fff0); }
            60% { filter: drop-shadow(0 0 16px #6ffcff44); }
            100% { filter: drop-shadow(0 0 0px #fff0); }
          }
        `}</style>
  <>
    <h1
      className="text-3xl md:text-4xl font-extrabold tracking-tight mt-2 text-white drop-shadow-lg"
      style={{ animation: "fadeInUp 0.7s cubic-bezier(.4,0,.2,1) both" }}
    >
      Welcome to{" "}
      <span className="bg-gradient-to-r from-cyan-300 via-sky-300 to-indigo-400 bg-clip-text text-transparent">
        Attendo
      </span>
    </h1>
    <p
      className="text-sm md:text-base text-white/70 mt-2"
      style={{ animation: "fadeInUp 0.7s cubic-bezier(.4,0,.2,1) both", animationDelay: "80ms" }}
    >
      Choose your role to continue
    </p>
    <div
      className="mt-3 h-px w-56 md:w-72 bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent"
      style={{ animation: "fadeInUp 0.7s cubic-bezier(.4,0,.2,1) both", animationDelay: "140ms" }}
    />
  </>
      </div>
      {/* Login Options - mobile-first pill buttons */}
      <div className="flex flex-col items-center w-full max-w-sm mx-auto">
        <div className="flex flex-row justify-center gap-12 mb-8">
          {loginOptions.slice(0,2).map((option, index) => (
            <button
              key={option.title}
              onClick={() => navigate(option.path)}
              className={
                `flex flex-col items-center justify-center w-48 h-28 rounded-[2.8rem] bg-gradient-to-br from-cyan-400/90 to-indigo-600/90 shadow-2xl border-2 border-cyan-300/40 focus:outline-none active:scale-97 transition-all duration-200 hover:scale-102 relative overflow-hidden`
              }
              style={{ animation: `fadeInUp 0.7s cubic-bezier(.4,0,.2,1) both`, animationDelay: `${index * 120}ms` }}
            >
              <span className="flex items-center justify-center w-16 h-16 rounded-full bg-white/10 shadow-lg mb-2">
                <option.icon className="w-10 h-10 text-white drop-shadow-lg" />
              </span>
              <span className="text-xl font-bold text-white tracking-wide drop-shadow-md">
                {option.title.replace(' Login', '')}
              </span>
              {/* Ripple effect */}
              <span className="absolute inset-0 pointer-events-none" style={{zIndex:0}} />
            </button>
          ))}
        </div>
        <div className="flex flex-row justify-center">
          <button
            key={loginOptions[2].title}
            onClick={() => navigate(loginOptions[2].path)}
            className={
              `flex flex-col items-center justify-center w-48 h-28 rounded-[2.8rem] bg-gradient-to-br from-cyan-400/90 to-indigo-600/90 shadow-2xl border-2 border-cyan-300/40 focus:outline-none active:scale-97 transition-all duration-200 hover:scale-102 relative overflow-hidden`
            }
            style={{ animation: `fadeInUp 0.7s cubic-bezier(.4,0,.2,1) both`, animationDelay: `240ms` }}
          >
            <span className="flex items-center justify-center w-16 h-16 rounded-full bg-white/10 shadow-lg mb-2">
              {React.createElement(loginOptions[2].icon, { className: "w-10 h-10 text-white drop-shadow-lg" })}
            </span>
            <span className="text-xl font-bold text-white tracking-wide drop-shadow-md">
              {loginOptions[2].title.replace(' Login', '')}
            </span>
            {/* Ripple effect */}
            <span className="absolute inset-0 pointer-events-none" style={{zIndex:0}} />
          </button>
        </div>
      </div>
      <style>{`
        @keyframes fadeInUp {
          0% { opacity: 0; transform: translateY(40px) scale(0.98); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .active\:scale-97:active { transform: scale(0.97); }
        .hover\:scale-102:hover { transform: scale(1.02); }
      `}</style>
      {/* Footer */}
      <div className="text-center text-xs text-white/60 mt-10">
        <p>© 2025 Attendo. All rights reserved.</p>
      </div>
    </div>
  );
};

export default LoginSelection;
