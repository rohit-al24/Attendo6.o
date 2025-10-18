import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogOut, User, Book, Megaphone, BarChart2, Vote, MessageSquare, UserCircle } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import CircularProgress from "@/components/CircularProgress";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const StudentDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const student = location.state?.student;
  const [attendance, setAttendance] = useState<number>(0);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [classInfo, setClassInfo] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'attendance' | 'result' | 'announcements' | 'voting' | 'feedback' | 'profile'>('attendance');

  // Handler for Attendance button to redirect to new page
  const handleAttendanceClick = () => {
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
          <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-primary shadow-lg bg-muted flex items-center justify-center">
            {/* Replace src with actual student photo if available */}
            <img
              src={student?.profile_url || "https://ui-avatars.com/api/?name=" + encodeURIComponent(student?.full_name || "Student") + "&background=0D8ABC&color=fff"}
              alt="Profile"
              className="w-full h-full object-cover"
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
                <p className="text-lg font-semibold">{student?.full_name}</p>
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
            onClick={() => setActiveTab('result')}
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
            onClick={() => setActiveTab('profile')}
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
            <Card className="shadow-medium p-8 text-center">
              <h2 className="text-2xl font-bold mb-2">Profile</h2>
              <p className="text-muted-foreground">Profile feature coming soon.</p>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default StudentDashboard;
