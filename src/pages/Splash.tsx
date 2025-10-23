import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import attendoLogo from "@/assets/attendo-logo.png";

const Splash = () => {
  const navigate = useNavigate();

  // Intro phase: fluid background + Attendo text
  const [showIntro, setShowIntro] = useState(true);
  // Black overlay fade for transition
  const [blackOn, setBlackOn] = useState(false);
  // Logo presentation on black
  const [logoVisible, setLogoVisible] = useState(false);
  const [logoOut, setLogoOut] = useState(false);

  useEffect(() => {
    const INTRO_MS = 3000; // requested 3 seconds
    const BLACK_FADE_MS = 500; // smooth fade to black
    const LOGO_HOLD_BEFORE_OUT_MS = 2000; // hold before zooming out
    const LOGO_OUT_MS = 1000; // zoom-out duration

    const t1 = setTimeout(() => setBlackOn(true), INTRO_MS);
    const t2 = setTimeout(() => {
      setShowIntro(false);
      setLogoVisible(true); // logo appears on black
    }, INTRO_MS + BLACK_FADE_MS);
    const t3 = setTimeout(() => setLogoOut(true), INTRO_MS + BLACK_FADE_MS + LOGO_HOLD_BEFORE_OUT_MS);
    const t4 = setTimeout(() => navigate("/login-selection"), INTRO_MS + BLACK_FADE_MS + LOGO_HOLD_BEFORE_OUT_MS + LOGO_OUT_MS);

    return () => {
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4);
    };
  }, [navigate]);

  return (
    <div className="relative h-screen w-screen overflow-hidden flex items-center justify-center bg-black">
      <style>{`
        /* Subtle, moody fluid backdrop */
        .fluid-bg {
          position: absolute;
          inset: 0;
          z-index: 0;
          /* Deep ink-like blues with a faint center glow */
          background: radial-gradient(1200px 800px at 50% 40%, #0b1220 0%, #0b1220 25%, #0a1020 45%, #0a0f1f 60%, #070e1b 75%, #050a14 100%);
          /* Gentle motion to feel "alive" */
          animation: fluid-motion 25s ease-in-out infinite alternate;
          will-change: transform;
        }

        @keyframes fluid-motion {
          0%   { transform: scale(1) rotate(0deg) translate3d(0, 0, 0); }
          100% { transform: scale(1.06) rotate(1.2deg) translate3d(0.6%, 0.8%, 0); }
        }

        /* Professional brand entrance: tracking + settle */
        .brand-in { animation: brand-in 900ms cubic-bezier(.22,.61,.36,1) both; }
        @keyframes brand-in {
          0% { opacity: 0; transform: translateY(8px) scale(0.995); filter: blur(0.6px); }
          60% { opacity: 1; transform: translateY(0) scale(1.008); filter: blur(0); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .tracking-anim { animation: tracking-anim 1200ms ease-out both; }
        @keyframes tracking-anim {
          0% { letter-spacing: 0.06em; }
          100% { letter-spacing: 0em; }
        }

        /* Subtle vignette for depth */
        .vignette {
          position: absolute;
          inset: 0;
          z-index: 2;
          pointer-events: none;
          background: radial-gradient(120% 120% at 50% 50%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.35) 100%);
        }

        /* Royal aurora sheen overlay */
        .aurora {
          position: absolute;
          inset: -10%;
          z-index: 1;
          pointer-events: none;
          opacity: 0.18;
          mix-blend-mode: screen;
          background: conic-gradient(from 210deg at 50% 50%, rgba(111,252,255,0.1), rgba(76,29,149,0.12), rgba(23,37,84,0.16), rgba(111,252,255,0.1));
          filter: blur(24px) saturate(120%);
          animation: aurora-drift 30s ease-in-out infinite alternate;
        }
        @keyframes aurora-drift {
          0% { transform: translate3d(-2%, -1%, 0) rotate(-4deg) scale(1.05); }
          100% { transform: translate3d(2%, 1%, 0) rotate(4deg) scale(1.08); }
        }

        /* Ultra subtle moving grain to avoid banding on gradients */
        .grain {
          position: absolute;
          inset: 0;
          z-index: 1;
          pointer-events: none;
          opacity: 0.035;
          background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="140" height="140" viewBox="0 0 140 140"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/></filter><rect width="100%" height="100%" filter="url(%23n)" opacity="0.6"/></svg>');
          mix-blend-mode: overlay;
          animation: grain-move 7s linear infinite;
        }
        @keyframes grain-move {
          0% { transform: translate3d(0,0,0); }
          100% { transform: translate3d(-3%, -2%, 0); }
        }

        /* Bokeh particles for elegance */
        .bokeh {
          position: absolute; border-radius: 9999px; filter: blur(8px);
          background: radial-gradient(circle at 30% 30%, rgba(111,252,255,0.2), rgba(111,252,255,0) 60%);
          opacity: 0.08; mix-blend-mode: screen; pointer-events: none; z-index: 1;
          animation: bokeh-float 26s ease-in-out infinite;
        }
        .bokeh.b2 { width: 120px; height: 120px; animation-duration: 32s; opacity: 0.06; filter: blur(10px); }
        .bokeh.b3 { width: 90px; height: 90px; animation-duration: 22s; opacity: 0.07; filter: blur(12px); }
        @keyframes bokeh-float {
          0% { transform: translate3d(5%, 12%, 0) scale(1); }
          50% { transform: translate3d(-3%, -8%, 0) scale(1.08); }
          100% { transform: translate3d(5%, 12%, 0) scale(1); }
        }

        /* Netflix-like logo choreography */
        .logo-pop-in { animation: logo-pop-in 700ms cubic-bezier(.2,.8,.2,1) both; }
        @keyframes logo-pop-in {
          0% { opacity: 0; transform: scale(0.85); filter: blur(1px); }
          60% { opacity: 1; transform: scale(1.08); filter: blur(0); }
          100% { opacity: 1; transform: scale(1); filter: blur(0); }
        }
        .logo-zoom-out { animation: logo-zoom-out 1000ms cubic-bezier(.4,0,.2,1) forwards; }
        @keyframes logo-zoom-out {
          0% { transform: scale(1); opacity: 1; }
          70% { transform: scale(2.4); opacity: 1; }
          100% { transform: scale(6); opacity: 0; }
        }

        /* Logo flash ring when it appears */
        .logo-flash { position: absolute; width: 280px; height: 280px; border-radius: 9999px; pointer-events: none; }
        .logo-flash.play { animation: logo-flash 650ms cubic-bezier(.3,.7,.2,1) both; }
        @keyframes logo-flash {
          0% { opacity: 0; transform: scale(0.8); box-shadow: 0 0 0 rgba(111,252,255,0); }
          20% { opacity: 0.6; transform: scale(1); }
          60% { opacity: 0.25; transform: scale(1.4); }
          100% { opacity: 0; transform: scale(1.9); }
        }

        /* Brand text base styling */
        .brand-text { position: relative; text-rendering: optimizeLegibility; -webkit-font-smoothing: antialiased; text-shadow: 0 2px 16px rgba(0,0,0,0.35); }

        /* Subtle radial rays behind text */
        .rays { position: absolute; width: 520px; height: 520px; border-radius: 9999px; opacity: 0.06; filter: blur(18px); pointer-events: none; z-index: 0;
          background: conic-gradient(from 220deg, rgba(111,252,255,0.18) 0deg, rgba(111,252,255,0) 18deg, rgba(111,252,255,0.12) 36deg, rgba(111,252,255,0) 54deg, rgba(111,252,255,0.14) 72deg, rgba(111,252,255,0) 90deg);
          transform: rotate(-8deg) scale(0.96);
          animation: rays-settle 2400ms ease-out both;
        }
        @keyframes rays-settle {
          0% { opacity: 0; transform: rotate(-16deg) scale(0.92); }
          60% { opacity: 0.08; transform: rotate(-4deg) scale(1.02); }
          100% { opacity: 0.06; transform: rotate(0deg) scale(1); }
        }

        /* Underline accent grow */
        .underline-grow { position: absolute; left: 50%; transform: translateX(-50%) scaleX(0.2); transform-origin: center; bottom: -12px; height: 2px; width: 220px; border-radius: 9999px; opacity: 0.0; background: linear-gradient(90deg, rgba(111,252,255,0), rgba(111,252,255,0.35), rgba(111,252,255,0)); animation: underline-grow 1100ms cubic-bezier(.2,.8,.2,1) 350ms both; filter: blur(0.2px); }
        @keyframes underline-grow {
          0% { opacity: 0; transform: translateX(-50%) scaleX(0.2); }
          60% { opacity: 1; transform: translateX(-50%) scaleX(1.06); }
          100% { opacity: 0.55; transform: translateX(-50%) scaleX(1); }
        }

        /* Underline glint alternative (small light runs across) */
        .underline-glint { position: absolute; left: 50%; bottom: -12px; height: 6px; width: 220px; transform: translateX(-50%); pointer-events: none; overflow: visible; }
        .underline-glint::before { content: ""; position: absolute; top: -2px; left: 0; width: 14px; height: 10px; border-radius: 9999px; background: radial-gradient(circle, rgba(111,252,255,0.85) 0%, rgba(111,252,255,0.35) 55%, rgba(111,252,255,0) 70%); filter: blur(0.4px); opacity: 0; animation: glint-run 1100ms ease-in-out 450ms both; }
        @keyframes glint-run {
          0% { transform: translateX(10%); opacity: 0; }
          20% { opacity: 0.6; }
          60% { opacity: 0.35; }
          100% { transform: translateX(90%); opacity: 0; }
        }

        /* Respect reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .fluid-bg { animation: none; }
          .grain { display: none; }
          .attendo-appear { animation-duration: 1ms; }
          .logo-pop-in { animation-duration: 1ms; }
          .logo-zoom-out { animation-duration: 1ms; }
          .aurora { display: none; }
          .bokeh { display: none; }
          .underline-glint { display: none; }
          .rays { display: none; }
          .underline-grow { display: none; }
        }
      `}</style>

      {/* Background layers (intro only) */}
      {showIntro && (
        <>
          <div className="fluid-bg" />
          <div className="aurora" />
          <div className="grain" />
          <div className="vignette" />
          {/* Bokeh elements */}
          <span className="bokeh" style={{ width: 140, height: 140, left: '12%', top: '68%' }} />
          <span className="bokeh b2" style={{ left: '76%', top: '22%' }} />
          <span className="bokeh b3" style={{ left: '64%', top: '74%' }} />

          {/* Foreground brand text during intro */}
          <div className="relative z-10 flex flex-col items-center justify-center">
            {/* Rays backdrop behind text */}
            <div className="rays" aria-hidden="true" />
            <span className="brand-text text-white tracking-tight font-semibold text-4xl sm:text-5xl brand-in tracking-anim select-none relative">
              Attendo
              <span className="underline-grow" aria-hidden="true" />
              <span className="underline-glint" aria-hidden="true" />
            </span>
          </div>
        </>
      )}

      {/* Fade to black overlay */}
      <div className={`absolute inset-0 bg-black z-20 pointer-events-none transition-opacity duration-500 ${blackOn ? 'opacity-100' : 'opacity-0'}`} />

      {/* Logo on black */}
      {logoVisible && (
        <div className="absolute inset-0 z-30 flex items-center justify-center">
          {/* Flash ring */}
          {!logoOut && <div className="logo-flash play" style={{ background: 'radial-gradient(circle, rgba(111,252,255,0.3) 0%, rgba(111,252,255,0.08) 40%, rgba(111,252,255,0) 60%)' }} />}
          <img
            src={attendoLogo}
            alt="Attendo"
            className={`w-28 h-28 sm:w-32 sm:h-32 object-contain drop-shadow-[0_0_22px_rgba(111,252,255,0.15)] ${logoOut ? 'logo-zoom-out' : 'logo-pop-in'}`}
            style={{ filter: 'brightness(1.12) contrast(1.08)' }}
          />
        </div>
      )}
    </div>
  );
};

export default Splash;
