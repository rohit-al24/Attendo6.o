import { useState, useEffect } from "react";
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
  
  // Get classId and subject from router state (or set default)
  const location = useLocation();
  const [classId, setClassId] = useState<string>(location.state?.classId || '');
  const subject = location.state?.subject || '';
  const period = location.state?.period || 1;
  const time = location.state?.time || '';

  const [classInfo, setClassInfo] = useState<any>(null);
  const [classList, setClassList] = useState<any[]>([]);
  const [students, setStudents] = useState<Student[]>([]);

  // Fetch all classes for selector
  useEffect(() => {
    const fetchClasses = async () => {
      const { data } = await supabase
        .from('classes')
        .select('id, class_name, department, section, year');
      setClassList(data || []);
    };
    fetchClasses();
  }, []);

  // Fetch class info and students for selected class
  useEffect(() => {
    if (!classId) {
      setClassInfo(null);
      setStudents([]);
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
    setStudents(students.map(s => 
      s.id === id ? { ...s, status } : s
    ));
  };

  const handleSaveAttendance = async () => {
    // Save attendance to DB
    const today = new Date().toISOString().slice(0, 10);
    const now = new Date().toISOString();
    // TODO: Replace with actual faculty_id from context/auth if available
    const facultyId = null;
    const markedBy = null;
    const records = students.map(s => ({
      student_id: s.id,
      status: s.status,
      class_id: classId,
      faculty_id: facultyId,
      date: today,
      period_number: period,
      subject: subject,
      marked_by: markedBy,
      marked_at: now,
    }));
    const { error } = await supabase
      .from('attendance_records')
      .upsert(records, { onConflict: 'student_id,date,period_number' });
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
      <header className="border-b bg-card shadow-soft">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate("/faculty-dashboard")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6">
        {/* Class Selector & Info */}
        <Card className="shadow-medium">
          <div className="p-6">
            <div className="mb-4">
              <label className="font-semibold mr-2">Select Class:</label>
              <select value={classId} onChange={e => setClassId(e.target.value)} className="border rounded px-2 py-1">
                <option value="">-- Select Class --</option>
                {classList.map(cls => (
                  <option key={cls.id} value={cls.id}>{cls.class_name}</option>
                ))}
              </select>
            </div>
            <div className="grid md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Period</p>
                <p className="text-lg font-semibold">Period {period}</p>
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
                      <RadioGroup
                        value={student.status}
                        onValueChange={(value: "present" | "absent" | "leave" | "onduty") => 
                          updateStudentStatus(student.id, value)
                        }
                        className="flex gap-6"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="present" id={`${student.id}-present`} />
                          <Label htmlFor={`${student.id}-present`} className="text-secondary font-medium cursor-pointer">
                            Present
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="absent" id={`${student.id}-absent`} />
                          <Label htmlFor={`${student.id}-absent`} className="text-destructive font-medium cursor-pointer">
                            Absent
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="leave" id={`${student.id}-leave`} />
                          <Label htmlFor={`${student.id}-leave`} className="text-accent font-medium cursor-pointer">
                            Leave
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="onduty" id={`${student.id}-onduty`} />
                          <Label htmlFor={`${student.id}-onduty`} className="text-primary font-medium cursor-pointer">
                            On Duty
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>
                  </div>
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
