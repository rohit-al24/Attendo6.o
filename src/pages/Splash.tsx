import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import attendoLogo from "@/assets/attendo-logo.png";

const Splash = () => {
  const navigate = useNavigate();
  const [stage, setStage] = useState<'text' | 'blur' | 'logo'>('text');
  const [showBlack, setShowBlack] = useState(false);

  useEffect(() => {
    let t1: any, t2: any, t3: any;
    t1 = setTimeout(() => {
      setShowBlack(true);
      setStage('blur');
    }, 3000); // after 3s, blur and fade bg

    t2 = setTimeout(() => setStage('logo'), 4400); // after 4.4s, show logo

    t3 = setTimeout(() => navigate("/login-selection"), 7000); // after 7s, navigate
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [navigate]);

  return (
    <div className="relative h-screen w-screen bg-black flex items-center justify-center overflow-hidden">
      <style>{`
        @keyframes attendo-fade-in {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        .attendo-fade-in {
          animation: attendo-fade-in 1.8s cubic-bezier(.4,0,.2,1) both;
        }
        @keyframes logo-zoom-out {
          0% { transform: scale(1); opacity: 1; }
          80% { transform: scale(2.5); opacity: 1; }
          100% { transform: scale(8); opacity: 0; }
        }
            .logo-zoom-out {
              animation: logo-zoom-out 2.6s cubic-bezier(.4,0,.2,1) forwards;
        }
        @keyframes fluid1 {
          0% { transform: translate(-30%, -10%) scale(1) rotate(0deg); }
          50% { transform: translate(-20%, 10%) scale(1.08) rotate(8deg); }
          100% { transform: translate(-30%, -10%) scale(1) rotate(0deg); }
        }
        @keyframes fluid2 {
          0% { transform: translate(40%, 20%) scale(1.1) rotate(0deg); }
          50% { transform: translate(30%, 0%) scale(1.18) rotate(-6deg); }
          100% { transform: translate(40%, 20%) scale(1.1) rotate(0deg); }
        }
        .fluid-blob1 {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 420px;
          height: 320px;
          background: radial-gradient(ellipse at 60% 40%, #222442cc 60%, #0A0D15 100%);
          opacity: 0.32;
          filter: blur(48px);
          border-radius: 60% 40% 50% 70% / 60% 50% 70% 40%;
          z-index: 1;
          animation: fluid1 12s ease-in-out infinite alternate;
          pointer-events: none;
        }
        .fluid-blob2 {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 340px;
          height: 260px;
          background: radial-gradient(ellipse at 40% 60%, #0A0D15 60%, #222442 100%);
          opacity: 0.22;
          filter: blur(36px);
          border-radius: 50% 60% 40% 70% / 70% 40% 60% 50%;
          z-index: 2;
          animation: fluid2 14s ease-in-out infinite alternate;
          pointer-events: none;
        }
        .fade-black {
          position: absolute;
          inset: 0;
          z-index: 5;
          background: #000;
          opacity: 0;
          transition: opacity 1.2s cubic-bezier(.4,0,.2,1);
          pointer-events: none;
        }
        .fade-black.show {
          opacity: 1;
        }
        /* Fluid droplet effects */
        @keyframes droplet1 {
          0% { transform: translate(-60%, -60%) scale(1) rotate(0deg); }
          50% { transform: translate(-55%, -65%) scale(1.12) rotate(8deg); }
          100% { transform: translate(-60%, -60%) scale(1) rotate(0deg); }
        }
        @keyframes droplet2 {
          0% { transform: translate(60%, 60%) scale(1.1) rotate(0deg); }
          50% { transform: translate(65%, 55%) scale(1.18) rotate(-6deg); }
          100% { transform: translate(60%, 60%) scale(1.1) rotate(0deg); }
        }
        @keyframes droplet3 {
          0% { transform: translate(-40%, 60%) scale(1.05) rotate(0deg); }
          50% { transform: translate(-45%, 65%) scale(1.15) rotate(10deg); }
          100% { transform: translate(-40%, 60%) scale(1.05) rotate(0deg); }
        }
        .droplet1 {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 180px;
          height: 180px;
          background: radial-gradient(ellipse at 60% 40%, #222442cc 60%, #0A0D15 100%);
          opacity: 0.38;
          filter: blur(32px);
          border-radius: 60% 40% 50% 70% / 60% 50% 70% 40%;
          z-index: 2;
          animation: droplet1 8s ease-in-out infinite alternate;
          pointer-events: none;
        }
        .droplet2 {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 120px;
          height: 120px;
          background: radial-gradient(ellipse at 40% 60%, #0A0D15 60%, #222442 100%);
          opacity: 0.28;
          filter: blur(24px);
          border-radius: 50% 60% 40% 70% / 70% 40% 60% 50%;
          z-index: 2;
          animation: droplet2 10s ease-in-out infinite alternate;
          pointer-events: none;
        }
        .droplet3 {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 90px;
          height: 90px;
          background: radial-gradient(ellipse at 60% 40%, #6ffcff33 60%, #222442 100%);
          opacity: 0.18;
          filter: blur(18px);
          border-radius: 60% 40% 50% 70% / 60% 50% 70% 40%;
          z-index: 2;
          animation: droplet3 7s ease-in-out infinite alternate;
          pointer-events: none;
        }
        @keyframes ripple-motion {
          0% { transform: scale(1.0) rotate(0deg) translate(0%, 0%); }
          50% { transform: scale(1.1) rotate(1deg) translate(2%, 3%); }
          100% { transform: scale(1.0) rotate(0deg) translate(0%, 0%); }
        }
        .fluid-bg {
          position: absolute;
          inset: 0;
          z-index: 0;
          background: radial-gradient(ellipse at 50% 40%, rgba(2,6,23,1) 60%, rgba(16,24,32,0.9) 100%);
          animation: ripple-motion 25s ease-in-out infinite alternate;
        }
        @keyframes foggy-blur {
          0% { opacity: 1; filter: blur(0px); }
          100% { opacity: 0; filter: blur(16px); }
        }
        .foggy-blur {
          animation: foggy-blur 1.4s cubic-bezier(.4,0,.2,1) forwards;
        }
      `}</style>
      {/* Animated sea water effect behind Attendo text */}
      {(stage === 'text' || stage === 'blur') && (
        <>
          {/* Sea water animated background */}
          <svg className={`absolute inset-0 w-full h-full z-0 transition-opacity duration-[1400ms] pointer-events-none ${stage === 'blur' ? 'opacity-0' : 'opacity-100'}`}>
            <defs>
              <filter id="sea-water" x="0" y="0">
                <feTurbulence id="turb" type="fractalNoise" baseFrequency="0.012 0.04" numOctaves="3" seed="2" result="turb"/>
                <feDisplacementMap in2="turb" in="SourceGraphic" scale="32" xChannelSelector="R" yChannelSelector="G"/>
                <feGaussianBlur stdDeviation="2"/>
              </filter>
              <linearGradient id="sea-gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0A0D15"/>
                <stop offset="60%" stopColor="#222442"/>
                <stop offset="100%" stopColor="#0A0D15"/>
              </linearGradient>
            </defs>
            <rect width="100%" height="100%" fill="url(#sea-gradient)" filter="url(#sea-water)">
              <animate attributeName="x" values="0;20;0" dur="7s" repeatCount="indefinite"/>
              <animate attributeName="y" values="0;10;0" dur="5s" repeatCount="indefinite"/>
            </rect>
          </svg>
          {/* Animated droplets */}
          <svg className={`absolute inset-0 w-full h-full z-0 transition-opacity duration-[1400ms] pointer-events-none ${stage === 'blur' ? 'opacity-0' : 'opacity-100'}`}>
            <circle cx="20%" cy="30%" r="12" fill="#6ffcff55">
              <animate attributeName="cy" values="30%;40%;30%" dur="3.2s" repeatCount="indefinite" />
              <animate attributeName="r" values="12;18;12" dur="2.8s" repeatCount="indefinite" />
            </circle>
            <circle cx="60%" cy="60%" r="8" fill="#6ffcff33">
              <animate attributeName="cx" values="60%;65%;60%" dur="2.6s" repeatCount="indefinite" />
              <animate attributeName="r" values="8;14;8" dur="2.2s" repeatCount="indefinite" />
            </circle>
            <ellipse cx="80%" cy="20%" rx="7" ry="11" fill="#6ffcff22">
              <animate attributeName="cx" values="80%;78%;80%" dur="2.9s" repeatCount="indefinite" />
              <animate attributeName="ry" values="11;16;11" dur="2.5s" repeatCount="indefinite" />
            </ellipse>
            <circle cx="35%" cy="75%" r="6" fill="#6ffcff44">
              <animate attributeName="cy" values="75%;70%;75%" dur="2.7s" repeatCount="indefinite" />
              <animate attributeName="r" values="6;10;6" dur="2.1s" repeatCount="indefinite" />
            </circle>
          </svg>
        </>
      )}
      <div className="fluid-bg" />
  {/* Fluid animated blobs behind text/logo */}
  <div className="fluid-blob1" />
  <div className="fluid-blob2" />
  {/* Fluid droplet effects */}
  <div className="droplet1" />
  <div className="droplet2" />
  <div className="droplet3" />
  {/* Black overlay fades in behind logo */}
  <div className={`fade-black${showBlack ? ' show' : ''}`} />
      <div className="relative z-10 flex flex-col items-center justify-center">
        {stage === 'text' && (
          <span className="text-white font-semibold text-4xl text-center attendo-fade-in">Attendo</span>
        )}
        {stage === 'blur' && (
          <span className="text-white font-semibold text-4xl text-center foggy-blur">Attendo</span>
        )}
        {stage === 'logo' && (
          <div className="flex items-center justify-center">
            <img
              src={attendoLogo}
              alt="Attendo Logo"
              className="w-32 h-32 object-contain drop-shadow-lg logo-zoom-out"
              style={{ filter: 'brightness(1.2) contrast(1.1)' }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Splash;
