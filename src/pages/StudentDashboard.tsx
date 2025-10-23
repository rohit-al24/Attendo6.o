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
import { LogOut, User, Megaphone, Vote, FileBarChart, MessageSquare, IdCard } from "lucide-react";
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
      <MobileHeader title="Student Portal" />
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
      {/* Header */}
      <header className="border-b bg-card shadow-soft">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 gradient-primary rounded-lg flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Student Portal</h1>
              <p className="text-sm text-muted-foreground">Welcome back, {student?.full_name}</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            onClick={() => { try { sessionStorage.removeItem('student'); } catch {}; navigate("/login-selection"); }}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

  <main className="container mx-auto px-4 py-6 space-y-4 pb-20">
        {/* Top: Info left, profile right */}
        <Card className="shadow-medium p-4 sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Hello,</p>
              <F1NameLightning name={student?.full_name} />
              <div className="mt-2 grid grid-cols-2 gap-2 text-sm sm:text-base">
                <div>
                  <p className="text-muted-foreground">Roll No</p>
                  <p className="font-semibold">{student?.roll_number}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Department</p>
                  <p className="font-semibold">{classInfo?.department || '-'}</p>
                </div>
              </div>
            </div>
            <ProfilePhotoSpin profileUrl={student?.profile_url} fullName={student?.full_name} />

          </div>
        </Card>

        {/* 3x2 grid buttons */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <Button className="h-24 sm:h-28 rounded-xl bg-primary text-primary-foreground hover:opacity-90 shadow-md" onClick={() => navigate('/student/attendance', { state: { student } })}>
            Attendance
          </Button>
          <Button className="h-24 sm:h-28 rounded-xl bg-emerald-600 text-white hover:opacity-90 shadow-md" onClick={() => navigate('/student/announcements')}>
            Announcements
          </Button>
          <Button className="h-24 sm:h-28 rounded-xl bg-amber-500 text-black hover:opacity-90 shadow-md" onClick={() => navigate('/student/votings')}>
            Class Votings
          </Button>
          <Button className="h-24 sm:h-28 rounded-xl bg-indigo-600 text-white hover:opacity-90 shadow-md" onClick={() => navigate('/student/results', { state: { student } })}>
            Results
          </Button>
          <Button className="h-24 sm:h-28 rounded-xl bg-rose-500 text-white hover:opacity-90 shadow-md" onClick={() => navigate('/student/feedback')}>
            Feedback
          </Button>
          <Button className="h-24 sm:h-28 rounded-xl bg-slate-700 text-white hover:opacity-90 shadow-md" onClick={() => navigate('/student/profile')}>
            Profile
          </Button>
        </div>
      </main>
      <StudentTabBar />
    </div>
  );
};

export default StudentDashboard;
