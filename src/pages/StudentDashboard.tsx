import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogOut, User, Book, Megaphone, BarChart2, Vote, MessageSquare, UserCircle, Camera } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { useNavigate, useLocation } from "react-router-dom";
import CircularProgress from "@/components/CircularProgress";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const StudentDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const student = location.state?.student;
  const [attendance, setAttendance] = useState<number>(0);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [classInfo, setClassInfo] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'attendance' | 'result' | 'announcements' | 'voting' | 'feedback' | 'profile'>('attendance');
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [photoUrl, setPhotoUrl] = useState(student?.profile_url);
  const { toast } = useToast();
  const defaultPics = [
    "https://randomuser.me/api/portraits/men/1.jpg",
    "https://randomuser.me/api/portraits/women/1.jpg",
    "https://randomuser.me/api/portraits/men/2.jpg",
    "https://randomuser.me/api/portraits/women/2.jpg",
    "https://randomuser.me/api/portraits/lego/1.jpg"
  ];
  const [selectedDefaultPic, setSelectedDefaultPic] = useState(null);
  const [selectedDefaultPicIndex, setSelectedDefaultPicIndex] = useState(null);

  // Handler for Attendance button to redirect to new page
  const handleAttendanceClick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    navigate('/student-attendance', { state: { student } });
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        navigate("/student-login");
      }
    });
  }, [navigate]);

  // Mock student data - In real app, this would come from backend
  useEffect(() => {
    if (!student) {
      navigate('/student-login');
      return;
    }
    // Fetch class info
    const fetchClass = async () => {
      const { data } = await supabase
        .from('classes')
        .select('class_name, department')
        .eq('id', student.class_id)
        .single();
      setClassInfo(data);
    };
    fetchClass();

    // Fetch attendance records for student
    const fetchAttendance = async () => {
      const { data } = await supabase
        .from('attendance_records')
        .select('subject, status, faculty_id')
        .eq('student_id', student.id);
      if (!data) return;
      // Calculate overall attendance
      const total = data.length;
      const present = data.filter((r: any) => r.status === 'present').length;
      setAttendance(total ? Math.round((present / total) * 1000) / 10 : 0);

      // Fetch faculty names for faculty_ids present
      const facultyIds = Array.from(new Set(data.map((r: any) => r.faculty_id).filter(Boolean)));
      let facultyMap: Record<string, string> = {};
      if (facultyIds.length > 0) {
        const { data: facultyData } = await supabase
          .from('faculty')
          .select('id, full_name')
          .in('id', facultyIds);
        if (facultyData) facultyData.forEach((f: any) => { facultyMap[f.id] = f.full_name; });
      }

      // Group attendance records by subject, period, and faculty
      const grouped: Record<string, any[]> = {};
      data.forEach((r: any) => {
        const key = `${r.subject}|${r.period_number}|${r.faculty_id}`;
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(r);
      });
      // Prepare rows for table
      const rows = Object.entries(grouped).map(([key, records]) => {
        const [subject, period, facultyId] = key.split('|');
        const present = records.filter((r: any) => r.status === 'present').length;
        const absent = records.filter((r: any) => r.status === 'absent').length;
        const onduty = records.filter((r: any) => r.status === 'onduty').length;
        const total = records.length;
        return {
          facultyName: facultyMap[facultyId] || 'Unknown',
          subject,
          period,
          present,
          absent,
          onduty,
          total,
          percentage: total ? ((present / total) * 100).toFixed(2) + '%' : '0%'
        };
      });
      setSubjects(rows);
    };
    fetchAttendance();
  }, [student, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
          
      <header className="border-b bg-card shadow-soft">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 gradient-primary rounded-lg flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Student Portal</h1>
          
            </div>
          </div>
          <Button 
            variant="ghost" 
            onClick={() => navigate("/login-selection")}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6 flex flex-col items-center">
        {/* Profile Photo */}
        <div className="flex flex-col items-center mb-4">
          <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-primary shadow-lg bg-muted flex items-center justify-center animate-profile-pop">
            {/* Replace src with actual student photo if available */}
            <img
              src={photoUrl}
              alt="Profile"
              className="w-full h-full object-cover transition-transform duration-700 ease-in-out hover:scale-105"
              style={{ boxShadow: "0 0 24px 4px #2563eb55" }}
            />
          </div>
        </div>

        {/* Student Info Card (mobile friendly) */}
        <Card className="shadow-medium w-full max-w-md mb-6">
          <div className="p-6 space-y-4">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <User className="w-6 h-6 text-primary" />
              Student Information
            </h2>
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="text-lg font-semibold text-blue-700 font-sans tracking-wide drop-shadow-md animate-name-glow">
                  {student?.full_name}
                </p>
<style jsx>{`
@keyframes profilePop {
  0% { transform: scale(0.8); opacity: 0.5; }
  60% { transform: scale(1.1); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}
.animate-profile-pop {
  animation: profilePop 0.8s cubic-bezier(0.23, 1, 0.32, 1);
}
@keyframes nameGlow {
  0%, 100% { text-shadow: 0 0 8px #2563eb88, 0 0 2px #fff; }
  50% { text-shadow: 0 0 16px #2563ebcc, 0 0 4px #fff; }
}
.animate-name-glow {
  animation: nameGlow 2s infinite alternate;
}
`}</style>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Roll Number</p>
                <p className="text-lg font-semibold">{student?.roll_number}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Department</p>
                <p className="text-lg font-semibold">{classInfo?.department || '-'}</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Dashboard Buttons - 3x2 Grid, Large, Colored */}
        <div className="grid grid-cols-2 grid-rows-3 gap-6 w-full max-w-2xl justify-center">
          <Button
            className="h-32 text-xl font-bold flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-lg hover:from-blue-600 hover:to-blue-800 transition-all duration-200"
            onClick={handleAttendanceClick}
          >
            <Book className="w-10 h-10 mb-1" />
            Attendance
          </Button>
          <Button
            className="h-32 text-xl font-bold flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-green-500 to-green-700 text-white shadow-lg hover:from-green-600 hover:to-green-800 transition-all duration-200"
            onClick={() => navigate('/faculty/class-results')}
          >
            <BarChart2 className="w-10 h-10 mb-1" />
            Result
          </Button>
          <Button
            className="h-32 text-xl font-bold flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-yellow-400 to-yellow-600 text-white shadow-lg hover:from-yellow-500 hover:to-yellow-700 transition-all duration-200"
            onClick={() => setActiveTab('announcements')}
          >
            <Megaphone className="w-10 h-10 mb-1" />
            Announcements
          </Button>
          <Button
            className="h-32 text-xl font-bold flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-pink-500 to-pink-700 text-white shadow-lg hover:from-pink-600 hover:to-pink-800 transition-all duration-200"
            onClick={() => setActiveTab('voting')}
          >
            <Vote className="w-10 h-10 mb-1" />
            Voting
          </Button>
          <Button
            className="h-32 text-xl font-bold flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-purple-500 to-purple-700 text-white shadow-lg hover:from-purple-600 hover:to-purple-800 transition-all duration-200"
            onClick={() => setActiveTab('feedback')}
          >
            <MessageSquare className="w-10 h-10 mb-1" />
            Feedback
          </Button>
          <Button
            className="h-32 text-xl font-bold flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-gray-500 to-gray-700 text-white shadow-lg hover:from-gray-600 hover:to-gray-800 transition-all duration-200"
            onClick={() => { setActiveTab('profile'); setProfileDialogOpen(true); }}
          >
            <UserCircle className="w-10 h-10 mb-1" />
            Profile
          </Button>
        </div>

        {/* Tab Content (except Attendance, which now redirects) */}
        <div className="mt-8 w-full max-w-2xl">
          {activeTab === 'result' && (
            <Card className="shadow-medium p-8 text-center">
              <h2 className="text-2xl font-bold mb-2">Result</h2>
              <p className="text-muted-foreground">Result feature coming soon.</p>
            </Card>
          )}
          {activeTab === 'announcements' && (
            <Card className="shadow-medium p-8 text-center">
              <h2 className="text-2xl font-bold mb-2">Announcements</h2>
              <p className="text-muted-foreground">Announcements feature coming soon.</p>
            </Card>
          )}
          {activeTab === 'voting' && (
            <Card className="shadow-medium p-8 text-center">
              <h2 className="text-2xl font-bold mb-2">Voting</h2>
              <p className="text-muted-foreground">Voting feature coming soon.</p>
            </Card>
          )}
          {activeTab === 'feedback' && (
            <Card className="shadow-medium p-8 text-center">
              <h2 className="text-2xl font-bold mb-2">Feedback</h2>
              <p className="text-muted-foreground">Feedback feature coming soon.</p>
            </Card>
          )}
          {activeTab === 'profile' && (
            <>
              <Card className="shadow-medium p-8 text-center">
                <h2 className="text-2xl font-bold mb-2">Profile</h2>
                <p className="text-muted-foreground">Manage your profile photo.</p>
                <div className="flex flex-col items-center gap-4 mt-4">
                  <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-primary shadow-lg bg-muted flex items-center justify-center">
                    <img
                      src={photoUrl}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <Button variant="outline" onClick={() => setProfileDialogOpen(true)}>
                    <Camera className="w-5 h-5 mr-2" /> Change Photo
                  </Button>
                </div>
              </Card>
              <Dialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen}>
                <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-40">
                  <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-sm">
                    <h3 className="text-lg font-bold mb-4">Set Profile Photo</h3>
                    <div className="mb-4">
                      <label className="block font-semibold mb-2">Choose a default photo:</label>
                      <div className="flex gap-2 mb-2">
                        {defaultPics.map((url, idx) => (
                          <img
                            key={idx}
                            src={url}
                            alt={`Default ${idx}`}
                            className={`w-12 h-12 rounded-full border-2 cursor-pointer ${selectedDefaultPic === url ? 'border-primary' : 'border-muted'}`}
                            onClick={() => { setSelectedDefaultPic(url); setSelectedFile(null); }}
                          />
                        ))}
                      </div>
                      <label className="block font-semibold mb-2">Or upload your own:</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={e => { setSelectedFile(e.target.files?.[0] || null); setSelectedDefaultPic(null); }}
                      />
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button variant="ghost" onClick={() => setProfileDialogOpen(false)}>Cancel</Button>
                      <Button
                        disabled={uploading || (!selectedFile && !selectedDefaultPic)}
                        onClick={async () => {
                          if (!student) return;
                          setUploading(true);
                          try {
                            let publicUrl = photoUrl;
                            if (selectedDefaultPic) {
                              publicUrl = selectedDefaultPic;
                            } else if (selectedFile) {
                              // Upload to Supabase Storage
                              const fileExt = selectedFile.name.split('.').pop();
                              const fileName = `profile_${student.id}_${Date.now()}.${fileExt}`;
                              const { data: uploadData, error: uploadError } = await supabase.storage
                                .from('profile-photos')
                                .upload(fileName, selectedFile, {
                                  cacheControl: '3600',
                                  upsert: true,
                                });
                              if (uploadError) throw uploadError;
                              // Get public URL
                              const { data: urlData } = supabase.storage
                                .from('profile-photos')
                                .getPublicUrl(fileName);
                              publicUrl = urlData?.publicUrl;
                              if (!publicUrl) throw new Error('Could not get public URL');
                            }
                            // Update student profile_url in DB
                            const { error: updateError } = await supabase
                              .from('students')
                              .update({ profile_url: publicUrl })
                              .eq('id', student.id);
                            if (updateError) throw updateError;
                            setPhotoUrl(publicUrl);
                            toast({ title: "Profile photo updated!", description: "Your profile photo has been saved.", variant: "default" });
                          } catch (err: any) {
                            toast({ title: "Error updating photo", description: err.message || "Could not update profile photo.", variant: "destructive" });
                          }
                          setUploading(false);
                          setProfileDialogOpen(false);
                          setSelectedFile(null);
                          setSelectedDefaultPic(null);
                        }}
                      >
                        {uploading ? "Uploading..." : "Save"}
                      </Button>
                    </div>
                  </div>
                </div>
              </Dialog>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default StudentDashboard;
