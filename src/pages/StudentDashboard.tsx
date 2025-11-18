import { supabase } from "@/integrations/supabase/client";
// F1 car style name animation with lightning effect
const F1NameLightning = ({ name }: { name?: string }) => {
  const [animating, setAnimating] = useState(true);
  const [style, setStyle] = useState<React.CSSProperties>({ transform: 'translateX(100vw)', filter: 'brightness(2) drop-shadow(0 0 8px #fff)' });
  useEffect(() => {
    let start = Date.now();
    let raf: number;
    const duration = 3000;
    const animate = () => {
      const elapsed = Date.now() - start;
      if (elapsed < duration) {
        // F1 car: fast to slow slide-in
        const progress = elapsed / duration;
        const ease = 1 - Math.pow(1 - progress, 2);
        const x = 100 - 100 * ease; // from 100vw to 0
        const glow = 2 - ease; // glow fades out
        setStyle({
          transform: `translateX(${x}vw)`,
          transition: 'transform 0.05s linear',
          filter: `brightness(${glow}) drop-shadow(0 0 ${8 * glow}px #fff)`,
        });
        raf = window.requestAnimationFrame(animate);
      } else {
        setStyle({
          transform: 'translateX(0)',
          transition: 'transform 0.5s cubic-bezier(0.22, 1, 0.36, 1)',
          filter: 'brightness(1.2) drop-shadow(0 0 12px #00f8) drop-shadow(0 0 24px #fff)',
        });
        setAnimating(false);
      }
    };
    animate();
    return () => { if (raf) window.cancelAnimationFrame(raf); };
  }, []);
  return (
    <h2
      className="text-2xl sm:text-3xl font-bold tracking-tight relative"
      style={style}
    >
      {name}
      {animating && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-10 h-2 bg-gradient-to-r from-yellow-400 via-white to-blue-400 animate-pulse" style={{ zIndex: 1, filter: 'blur(2px)' }} />
      )}
    </h2>
  );
};
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogOut, User, Megaphone, Vote, FileBarChart, MessageSquare, IdCard, Bell, Mic, Sparkles, Music } from "lucide-react";

// Kabali Voice Assistant Bar (persistent, expandable)
const kabaliLogo = (
  <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-black via-gray-800 to-slate-700 shadow-lg border-2 border-white">
    <Music className="w-6 h-6 text-yellow-400" />
  </span>
);

const KabaliBar = () => {
  const [expanded, setExpanded] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [replyLines, setReplyLines] = useState<string[]>([]);
  const [showLines, setShowLines] = useState(0);
  const [loading, setLoading] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Setup Web Speech API
  useEffect(() => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.lang = 'en-US';
    recognitionRef.current.interimResults = false;
    recognitionRef.current.maxAlternatives = 1;
    recognitionRef.current.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      setTranscript(text);
      setListening(false);
      handleSend(text);
    };
    recognitionRef.current.onerror = () => {
      setListening(false);
    };
    // eslint-disable-next-line
  }, []);

  // Stop speech synthesis if speaking
  const stopSpeaking = () => {
    if ('speechSynthesis' in window && window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }
  };

  const startListening = () => {
    stopSpeaking();
    setTranscript("");
    setReplyLines([]);
    setShowLines(0);
    setListening(true);
    recognitionRef.current?.start();
  };

  const stopListening = () => {
    setListening(false);
    recognitionRef.current?.stop();
    stopSpeaking();
  };

  async function handleSend(text: string) {
    setLoading(true);
    setReplyLines([]);
    setShowLines(0);
    try {
      const res = await fetch("http://localhost:4001/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text })
      });
      const data = await res.json();
      const replyText = data.reply || "(No response)";
      // Split reply into lines (simulate lyrics)
      const lines = replyText.split(/(?<=[.!?])\s+|\n+/g).filter(Boolean);
      setReplyLines(lines);
      setShowLines(0);
      // Animate lines one by one
      let idx = 0;
      function showNextLine() {
        setShowLines(i => i + 1);
        idx++;
        if (idx < lines.length) {
          setTimeout(showNextLine, 1200);
        } else {
          // Speak the reply after all lines are shown
          if ('speechSynthesis' in window) {
            const utter = new window.SpeechSynthesisUtterance(replyText);
            utter.lang = 'en-US';
            window.speechSynthesis.speak(utter);
          }
        }
      }
      setTimeout(showNextLine, 800);
    } catch (err) {
      setReplyLines(["Sorry, I couldn't reach the AI server."]);
      setShowLines(1);
    }
    setLoading(false);
  }

  // Collapse bar and reset state
  const collapse = () => {
    setExpanded(false);
    setListening(false);
    setTranscript("");
    setReplyLines([]);
    setShowLines(0);
    setLoading(false);
  };

  return (
    <div className="fixed bottom-24 right-5 z-50 flex items-end">
      <div
        className={`transition-all duration-300 flex items-center shadow-2xl ${expanded ? 'w-[380px] sm:w-[480px] h-20 bg-black/90 rounded-2xl px-4' : 'w-16 h-16 bg-black rounded-full px-0'} border-2 border-white`}
        style={{ boxShadow: '0 4px 24px 0 rgba(0,0,64,0.10)' }}
      >
        <button
          className={`flex items-center gap-2 focus:outline-none ${expanded ? 'mr-4' : ''}`}
          onClick={() => expanded ? collapse() : setExpanded(true)}
          aria-label={expanded ? 'Close Kabali' : 'Open Kabali'}
        >
          {kabaliLogo}
          {expanded && <span className="font-semibold text-yellow-400 text-lg">Kabali</span>}
        </button>
        {expanded && (
          <>
            <div className="flex-1 flex flex-col justify-center min-w-0">
              <div className="text-xs text-slate-300 mb-1 truncate">{listening ? 'Listening…' : transcript ? 'You: ' + transcript : 'Tap mic and speak'}</div>
              <div className="flex flex-col items-start min-h-[32px]">
                {replyLines.slice(0, showLines).map((line, i) => (
                  <div key={i} className="text-yellow-200 font-semibold text-base animate-fade-in mb-1" style={{animationDelay: `${i * 0.2}s`}}>{line}</div>
                ))}
                {loading && <div className="text-yellow-400 italic">Thinking…</div>}
              </div>
            </div>
            <button
              className={`ml-4 p-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg flex items-center justify-center transition-all ${listening ? 'animate-pulse' : ''}`}
              style={{ fontSize: 28 }}
              onClick={() => {
                if (listening || (typeof window !== 'undefined' && window.speechSynthesis?.speaking)) {
                  stopListening();
                } else {
                  startListening();
                }
              }}
              disabled={loading}
              aria-label={listening ? 'Stop listening' : 'Start listening'}
            >
              <Mic className="w-8 h-8" />
            </button>
          </>
        )}
      </div>
    </div>
  );
};
import { useNavigate, useLocation } from "react-router-dom";
import React, { useEffect, useState, useRef } from "react";
import MobileHeader from "@/components/MobileHeader";
import StudentTabBar from "@/components/StudentTabBar";
import { Dialog } from "@/components/ui/dialog";
import { X } from "lucide-react";
// Coin spinning animation for profile photo
const ProfilePhotoSpin = ({ profileUrl, fullName }: { profileUrl?: string; fullName?: string }) => {
  const imgRef = useRef<HTMLImageElement>(null);
  const [spinning, setSpinning] = useState(true);
  const [spinStyle, setSpinStyle] = useState<React.CSSProperties>({});

    useEffect(() => {
      let start = Date.now();
      let raf: number;
      const duration = 3000; // 3 seconds
      const animate = () => {
        const elapsed = Date.now() - start;
        if (elapsed < duration) {
          // Fast to slow: ease out
          const progress = elapsed / duration;
          const ease = 1 - Math.pow(1 - progress, 2);
          const deg = 1080 * (1 - ease) + 360 * ease; // 3 spins to 1 spin
          setSpinStyle({ transform: `rotateY(${deg}deg)`, transition: 'transform 0.05s linear' });
          raf = window.requestAnimationFrame(animate);
        } else {
          setSpinStyle({ transform: 'rotateY(0deg)', transition: 'transform 0.5s cubic-bezier(0.22, 1, 0.36, 1)' });
          setSpinning(false);
        }
      };
      animate();
      return () => { if (raf) window.cancelAnimationFrame(raf); };
    }, []);

    // If Supabase Storage, ensure public access or signed URL
    const getImageSrc = () => {
      if (!profileUrl) return '';
      // If already a public URL, use as is
      if (profileUrl.startsWith('http')) return profileUrl;
      // If it's a Supabase Storage path, you may need to generate a public/signed URL here
      // For now, fallback to direct usage
      return profileUrl;
    };
    const src = getImageSrc();
    const [imgError, setImgError] = useState(false);
    return (
      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-primary to-purple-500 shadow-lg flex items-center justify-center ring-2 ring-primary/20 overflow-hidden border-2 border-white" style={spinStyle}>
        {src && !imgError ? (
          <img
            ref={imgRef}
            src={src}
            alt="profile"
            className="w-full h-full object-cover"
            onError={e => {
              setImgError(true);
              e.currentTarget.onerror = null;
              e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName || 'Student')}`;
            }}
            style={{ aspectRatio: '1/1', background: 'white', backfaceVisibility: 'hidden' }}
          />
        ) : imgError ? (
          <div className="flex flex-col items-center justify-center w-full h-full bg-red-100">
            <User className="w-8 h-8 text-red-400" />
            <span className="text-xs text-red-400">Image failed to load</span>
            <span className="text-[10px] text-red-400 break-all">{src}</span>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center w-full h-full bg-slate-100">
            <User className="w-8 h-8 text-slate-400" />
            <span className="text-xs text-slate-400">No Photo</span>
          </div>
        )}
      </div>
    );
  };

const StudentDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [student, setStudent] = useState<any>(() => {
    try {
      const str = sessionStorage.getItem("student");
      return str ? JSON.parse(str) : null;
    } catch {
      return null;
    }
  });
  const [showAnnouncement, setShowAnnouncement] = useState(false);
  const [announcement, setAnnouncement] = useState<any>(null);
  const [classMap, setClassMap] = useState<{ [id: string]: string }>({});

  useEffect(() => {
    // Always refresh student from Supabase on mount (by id in sessionStorage)
    const fetchStudent = async () => {
      try {
        // If navigation brought a student, persist it
        const navStudent: any = (location.state as any)?.student;
        if (navStudent) {
          try { sessionStorage.setItem('student', JSON.stringify(navStudent)); } catch {}
          setStudent(navStudent);
          return;
        }
        const str = sessionStorage.getItem("student");
        const localStudent = str ? JSON.parse(str) : null;
        if (localStudent?.id) {
          const { data, error } = await supabase.from('students').select('*').eq('id', localStudent.id).single();
          if (data) {
            setStudent(data);
            sessionStorage.setItem('student', JSON.stringify(data));
          } else {
            setStudent(localStudent); // fallback
          }
        } else {
          setStudent(localStudent);
        }
      } catch {
        setStudent(null);
      }
    };
    fetchStudent();
  }, [location.state]);
  const [classInfo, setClassInfo] = useState<any>(null);

  // No auth gating for students; rely on in-app login and sessionStorage

  useEffect(() => {
    if (!student) {
      navigate('/student-login');
      return;
    }
    const fetchClass = async () => {
      const { data } = await supabase
        .from('classes')
        .select('class_name, department')
        .eq('id', student.class_id)
        .single();
      setClassInfo(data);
    };
    fetchClass();
  }, [student, navigate]);

  useEffect(() => {
    // Fetch all classes for mapping
    const fetchClasses = async () => {
      const { data } = await supabase.from("classes").select("id, class_name");
      if (data) {
        const map: { [id: string]: string } = {};
        data.forEach((c: any) => { map[c.id] = c.class_name; });
        setClassMap(map);
      }
    };
    fetchClasses();
    // Fetch announcement for popup
    const fetchAnnouncement = async () => {
      const { data } = await (supabase as any)
        .from("announcements")
        .select("*")
        .in("target", ["students", "both"])
        .eq("show_in_start", true)
        .order("created_at", { ascending: false })
        .limit(1);
      if (data && data.length > 0) {
        setAnnouncement(data[0]);
        setShowAnnouncement(true);
        // Auto-close after 5 seconds
        setTimeout(() => setShowAnnouncement(false), 5000);
      }
    };
    fetchAnnouncement();
  }, []);

  const [assistantOpen, setAssistantOpen] = useState(false);
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
      <MobileHeader 
        title="Student Portal"
        right={
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 py-1 text-xs rounded-md w-auto"
            onClick={() => { try { sessionStorage.removeItem('student'); } catch {}; navigate('/login-selection'); }}
          >
            <LogOut className="w-3.5 h-3.5 mr-1.5" />
            Logout
          </Button>
        }
      />
      {/* ...existing code... */}
      {/* Announcement Popup */}
      {showAnnouncement && announcement && (
        <Dialog open={showAnnouncement} onOpenChange={setShowAnnouncement}>
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/30">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative">
              <button className="absolute top-2 right-2" onClick={() => setShowAnnouncement(false)}>
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
              <h3 className="text-lg font-bold mb-2">Announcement</h3>
              <div className="mb-2">{announcement.message}</div>
              {announcement.image_url && (
                <img src={announcement.image_url} alt="Announcement" className="max-h-40 rounded mb-2" />
              )}
              {announcement.classes && announcement.classes.length > 0 && (
                <div className="text-xs text-muted-foreground mt-1">
                  Classes: {announcement.classes.map((id: string) => classMap[id] || id).join(', ')}
                </div>
              )}
            </div>
          </div>
        </Dialog>
      )}
      

  <main className="container mx-auto px-4 py-6 space-y-4 pb-20">
        {/* Welcome banner (blue gradient theme) */}
        <div className="w-full rounded-xl bg-gradient-to-b from-blue-500 to-blue-400 text-white shadow-md px-4 sm:px-6 py-5 sm:py-6 flex items-start justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold">
              {`Welcome back${student?.full_name ? ", " + (student.full_name.split(" ")[0] || student.full_name) : ""}!`}
            </h2>
            <p className="mt-1 text-sm opacity-90">Here's your academic overview</p>
          </div>
          <button
            type="button"
            aria-label="Notifications"
            className="mt-1 p-1.5 rounded-full hover:bg-white/15 transition-colors"
            onClick={() => navigate('/student/announcements')}
          >
            <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </button>
        </div>

        {/* 3x2 grid buttons */}
        <div className="grid grid-cols-2 gap-4">
          <Button
            className="flex items-center justify-start gap-4 h-20 sm:h-24 w-full rounded-full bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400 text-white shadow-lg hover:from-blue-700 hover:to-blue-500 transition-all text-lg font-semibold px-6 sm:px-8"
            onClick={() => navigate('/student/attendance', { state: { student } })}
          >
            <IdCard className="w-7 h-7 opacity-90" /> Attendance
          </Button>
          <Button
            className="flex items-center justify-start gap-4 h-20 sm:h-24 w-full rounded-full bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-300 text-white shadow-lg hover:from-emerald-600 hover:to-emerald-400 transition-all text-lg font-semibold px-6 sm:px-8"
            onClick={() => navigate('/student/announcements')}
          >
            <Megaphone className="w-7 h-7 opacity-90" /> Announcements
          </Button>
          <Button
            className="flex items-center justify-start gap-4 h-20 sm:h-24 w-full rounded-full bg-gradient-to-r from-amber-400 via-yellow-300 to-yellow-200 text-slate-900 shadow-lg hover:from-amber-500 hover:to-yellow-300 transition-all text-lg font-semibold px-6 sm:px-8"
            onClick={() => navigate('/student/votings')}
          >
            <Vote className="w-7 h-7 opacity-90" /> Class Votings
          </Button>
          <Button
            className="flex items-center justify-start gap-4 h-20 sm:h-24 w-full rounded-full bg-gradient-to-r from-indigo-500 via-indigo-400 to-indigo-300 text-white shadow-lg hover:from-indigo-600 hover:to-indigo-400 transition-all text-lg font-semibold px-6 sm:px-8"
            onClick={() => navigate('/student/results', { state: { student } })}
          >
            <FileBarChart className="w-7 h-7 opacity-90" /> Results
          </Button>
          <Button
            className="flex items-center justify-start gap-4 h-20 sm:h-24 w-full rounded-full bg-gradient-to-r from-rose-500 via-rose-400 to-rose-300 text-white shadow-lg hover:from-rose-600 hover:to-rose-400 transition-all text-lg font-semibold px-6 sm:px-8"
            onClick={() => navigate('/student/feedback')}
          >
            <MessageSquare className="w-7 h-7 opacity-90" /> Feedback
          </Button>
          <Button
            className="flex items-center justify-start gap-4 h-20 sm:h-24 w-full rounded-full bg-gradient-to-r from-slate-700 via-slate-600 to-slate-500 text-white shadow-lg hover:from-slate-800 hover:to-slate-600 transition-all text-lg font-semibold px-6 sm:px-8"
            onClick={() => navigate('/student/profile')}
          >
            <User className="w-7 h-7 opacity-90" /> Profile
          </Button>
        </div>
      </main>
      <div className="fixed bottom-0 left-0 w-full z-50">
        <StudentTabBar />
      </div>
      {/* Kabali Voice Assistant Bar */}
      <KabaliBar />
    </div>
  );
};

export default StudentDashboard;
