import { useState, useEffect } from "react";
import MobileHeader from "@/components/MobileHeader";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Save } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

export interface Student {
  id: string;
  roll_number: string;
  full_name: string;
  status: "present" | "absent" | "leave" | "onduty";
}

const AttendanceMarking = () => {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  
  // Get classId and subject from router state (or set default)
  const location = useLocation();
  const [classId, setClassId] = useState<string>(location.state?.classId || '');
  const subject = location.state?.subject || '';
  const period = location.state?.period || 1;
  const time = location.state?.time || '';

  const [classInfo, setClassInfo] = useState<any>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [popupStudentId, setPopupStudentId] = useState<string | null>(null);

  // Support continuous periods passed via query param `periods=1,2,3`
  const searchParams = new URLSearchParams(location.search || "");
  const periodsParam = searchParams.get('periods');
  const selectedPeriods: number[] = periodsParam
    ? periodsParam.split(',').map(p => parseInt(p, 10)).filter(n => !Number.isNaN(n))
    : [period];

  // No class selector: class is provided by Faculty Dashboard via router state

  // Fetch class info and students for selected class
  useEffect(() => {
    if (!classId) {
      setClassInfo(null);
      setStudents([]);
      // If no classId provided, redirect back with a message
      toast.error('No class selected. Please pick a class from your dashboard.');
      navigate('/faculty-dashboard');
      return;
    }
    const fetchClass = async () => {
      const { data } = await supabase
        .from('classes')
        .select('class_name, department, section, year')
        .eq('id', classId)
        .single();
      setClassInfo(data);
    };
    fetchClass();
    const fetchStudents = async () => {
      const { data } = await supabase
        .from('students')
        .select('id, roll_number, full_name')
        .eq('class_id', classId);
      setStudents((data || []).map((s: any) => ({ ...s, status: 'present' })));
    };
    fetchStudents();
  }, [classId]);

  const updateStudentStatus = (id: string, status: "present" | "absent" | "leave" | "onduty") => {
    setStudents(students.map(s => s.id === id ? { ...s, status } : s));
    setPopupStudentId(null); // Close modal after selection
  };

  const handleSaveAttendance = async () => {
    // Save attendance to DB
    const today = new Date().toISOString().slice(0, 10);
    const now = new Date().toISOString();
    // Use faculty_id from userProfile if available
    const facultyId = userProfile?.id || null;
  const markedBy = userProfile?.id || null;
    console.log('userProfile:', userProfile);
    console.log('facultyId (faculty.id):', facultyId);
  console.log('markedBy (faculty.id):', markedBy);
    if (!facultyId || !markedBy) {
      console.error('Faculty ID or user_id missing in userProfile:', userProfile);
      toast.error('Faculty ID or user_id not found. Please re-login.');
      return;
    }
    // If multiple continuous periods are selected, create one record per period
    const periodsToSave = selectedPeriods.length ? selectedPeriods : [period];
    const records = students.flatMap(s => (
      periodsToSave.map(pn => ({
        student_id: s.id,
        status: s.status,
        class_id: classId,
        faculty_id: facultyId,
        date: today,
        period_number: pn,
        subject: subject,
        marked_by: markedBy,
        marked_at: now,
      }))
    ));
    const { error } = await supabase
      .from('attendance_records')
      .insert(records);
    if (error) {
      console.error('Attendance save error:', error);
      toast.error('Error saving attendance: ' + JSON.stringify(error));
      return;
    }
    toast.success('Attendance saved!');
    navigate('/faculty-dashboard');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "present": return "text-secondary";
      case "absent": return "text-destructive";
      case "leave": return "text-accent";
      case "onduty": return "text-primary";
      default: return "";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
      <MobileHeader title="Attendance Marking" />
      <header className="border-b bg-card shadow-soft">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate("/faculty-dashboard")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6">
        {/* Class Info */}
        <Card className="shadow-medium">
          <div className="p-6">
            <div className="grid md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Period(s)</p>
                <p className="text-lg font-semibold">{selectedPeriods.join(', ')}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Time</p>
                <p className="text-lg font-semibold">{time}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Class</p>
                <p className="text-lg font-semibold">{classInfo ? `${classInfo.year} Year ${classInfo.department} ${classInfo.section}` : '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Subject</p>
                <p className="text-lg font-semibold">{subject}</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Attendance Summary */}
        <Card className="shadow-medium">
          <div className="p-6">
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-secondary">{students.filter(s => s.status === "present").length}</p>
                <p className="text-sm text-muted-foreground">Present</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-destructive">{students.filter(s => s.status === "absent").length}</p>
                <p className="text-sm text-muted-foreground">Absent</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-accent">{students.filter(s => s.status === "leave").length}</p>
                <p className="text-sm text-muted-foreground">Leave</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{students.filter(s => s.status === "onduty").length}</p>
                <p className="text-sm text-muted-foreground">On Duty</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Student List */}
        <Card className="shadow-medium">
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Mark Attendance</h2>
              <Button onClick={handleSaveAttendance} className="gradient-primary">
                <Save className="w-4 h-4 mr-2" />
                Save Attendance
              </Button>
            </div>

            <div className="space-y-3">
              {students.map((student) => (
                <Card key={student.id} className="border-2">
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="font-semibold">{student.full_name}</p>
                        <p className="text-sm text-muted-foreground">{student.roll_number}</p>
                      </div>
                      <div>
                        <Button
                          className={`font-bold px-4 py-2 rounded shadow ${student.status === 'present' ? 'bg-green-500 text-white' : student.status === 'absent' ? 'bg-red-500 text-white' : student.status === 'leave' ? 'bg-yellow-500 text-white' : student.status === 'onduty' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
                          onClick={() => setPopupStudentId(student.id)}
                        >
                          {student.status.charAt(0).toUpperCase() + student.status.slice(1)}
                        </Button>
                      </div>
                    </div>
                  </div>
                  {/* Mobile-friendly bottom sheet modal for status selection */}
                  {popupStudentId === student.id && (
                    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black bg-opacity-60">
                      <div className="w-full max-w-md mx-auto bg-white rounded-t-2xl shadow-lg p-6 animate-slide-up" style={{ minHeight: '50vh' }}>
                        <h3 className="text-xl font-bold mb-6 text-center">Select Attendance Status</h3>
                        <div className="grid grid-cols-1 gap-4 mb-6">
                          <Button className="bg-green-500 hover:bg-green-600 text-white text-lg py-4 rounded-lg" onClick={() => updateStudentStatus(student.id, "present")}>Present</Button>
                          <Button className="bg-red-500 hover:bg-red-600 text-white text-lg py-4 rounded-lg" onClick={() => updateStudentStatus(student.id, "absent")}>Absent</Button>
                          <Button className="bg-yellow-500 hover:bg-yellow-600 text-white text-lg py-4 rounded-lg" onClick={() => updateStudentStatus(student.id, "leave")}>Leave</Button>
                          <Button className="bg-blue-500 hover:bg-blue-600 text-white text-lg py-4 rounded-lg" onClick={() => updateStudentStatus(student.id, "onduty")}>On Duty</Button>
                        </div>
                        <Button variant="outline" className="w-full py-3 rounded-lg text-lg" onClick={() => setPopupStudentId(null)}>Cancel</Button>
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
};

export default AttendanceMarking;
