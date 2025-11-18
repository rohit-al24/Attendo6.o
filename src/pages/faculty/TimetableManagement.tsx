import MobileHeader from "@/components/MobileHeader";
// Helper: Find continuous periods for a faculty on a given day
function getContinuousPeriods(timetable: Period[], day: string, faculty: string) {
  const periodsForDay = timetable.filter(t => t.day === day && t.faculty === faculty);
  const sortedPeriods = periodsForDay.map(t => t.period).sort((a, b) => a - b);
  const blocks: number[][] = [];
  let currentBlock: number[] = [];
  for (let i = 0; i < sortedPeriods.length; i++) {
    if (currentBlock.length === 0 || sortedPeriods[i] === currentBlock[currentBlock.length - 1] + 1) {
      currentBlock.push(sortedPeriods[i]);
    } else {
      blocks.push(currentBlock);
      currentBlock = [sortedPeriods[i]];
    }
  }
  if (currentBlock.length) blocks.push(currentBlock);
  return blocks.filter(b => b.length > 1); // Only return blocks of 2 or more
}

// Hardcoded subject lists per class (from seed data)
const SUBJECTS_BY_CLASS: Record<string, string[]> = {
  // Replace these keys with actual class IDs from your DB if possible
  '3a': [
    'Database Management Systems',
    'Software Engineering',
    'Operating Systems',
    'Computer Networks',
    'Web Technologies',
    'Database Management Systems Lab',
    'Web Technologies Lab',
    'Software Engineering Lab',
    'Operating Systems Lab',
    'Computer Networks Lab',
  ],
  '3b': [
    'Compiler Design',
    'Database Management Systems',
    'Machine Learning',
    'Software Engineering',
    'Operating Systems',
    'Machine Learning Lab',
    'Compiler Design Lab',
    'Database Management Systems Lab',
    'Software Engineering Lab',
    'Operating Systems Lab',
  ],
  '2a': [
    'Data Structures',
    'Object Oriented Programming',
    'Digital Electronics',
    'Discrete Mathematics',
    'Computer Organization',
    'Data Structures Lab',
    'OOP Lab',
    'Digital Electronics Lab',
    'Computer Organization Lab',
    'Discrete Mathematics Tutorial',
  ],
};

const DEFAULT_SUBJECTS = [
  'M I',
  'Physics',
  'Chemistry',
  'English',
  'Tamil',
  'C Programming',
  'Indian Constitution',
  'Placement',
];

import { useState, useEffect } from "react";
import { getSubjects, Subject } from "@/lib/subjects";

// Hardcoded subject lists per class (from seed data)
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Save, Edit } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Period {
  day: string;
  period: number;
  subject: string;
  faculty: string;
}

// Use 1-based index for days to match DB (1=Monday, 2=Tuesday, ...)
const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const periods = [1, 2, 3, 4, 5, 6, 7];

const TimetableManagement = () => {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [facultyList, setFacultyList] = useState<string[]>([]);
  // Subject-to-faculty assignments: { subjectId, facultyName }
  const [assignments, setAssignments] = useState<{ subjectId: string; faculty: string }[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  const [selectedFaculty, setSelectedFaculty] = useState<string>("");
  // Get all subjects from subjects.ts
  const allSubjects: Subject[] = getSubjects();
  // Assigned subjects for dropdowns
  const assignedSubjects = assignments.map(a => {
    const subj = allSubjects.find(s => s.id === a.subjectId);
    return subj ? { ...subj, faculty: a.faculty } : null;
  }).filter(Boolean) as (Subject & { faculty: string })[];
  // Handler to assign subject to faculty (replace if exists)
  const handleAssign = () => {
    if (!selectedSubjectId || !selectedFaculty) return;
    setAssignments(prev => {
      const filtered = prev.filter(a => a.subjectId !== selectedSubjectId);
      return [...filtered, { subjectId: selectedSubjectId, faculty: selectedFaculty }];
    });
    setSelectedSubjectId("");
    setSelectedFaculty("");
  };
  const location = useLocation();
  const [classId, setClassId] = useState<string>(location.state?.classId || "");
  const [className, setClassName] = useState<string>("");
  const [timetable, setTimetable] = useState<Period[]>([]);
  const [loading, setLoading] = useState(false);

  // Ensure classId provided via navigation; fetch class name
  useEffect(() => {
    (async () => {
      if (!classId) {
        toast.error("No class selected. Open Manage Timetable from Advisor tab.");
        navigate("/faculty-dashboard");
        return;
      }
      const { data, error } = await supabase
        .from("classes")
        .select("class_name")
        .eq("id", classId)
        .single();
      if (!error && data) setClassName(data.class_name);
    })();
  }, [classId, navigate]);

  // Fetch faculty list
  useEffect(() => {
    (async () => {
      const { data: faculty, error: facultyError } = await supabase
        .from("faculty")
        .select("full_name");
      if (facultyError) toast.error("Error loading faculty");
      if (faculty) setFacultyList(faculty.map((f: any) => f.full_name));
    })();
  }, []);

  // Fetch timetable for selected class
  useEffect(() => {
    if (!classId) return;
    (async () => {
      setLoading(true);
      const { data: timetableData, error: ttError } = await supabase
        .from("timetable")
        .select("day_of_week,period_number,subject,faculty_id")
        .eq("class_id", classId);
      if (ttError) toast.error("Error loading timetable");
      let facultyMap: Record<string, string> = {};
      if (timetableData && timetableData.length > 0) {
        const facultyIds = Array.from(new Set(timetableData.map((item: any) => item.faculty_id).filter(Boolean)));
        if (facultyIds.length > 0) {
          const { data: facultyData } = await supabase
            .from("faculty")
            .select("id,full_name")
            .in("id", facultyIds);
          if (facultyData) {
            facultyData.forEach((f: any) => {
              facultyMap[f.id] = f.full_name;
            });
          }
        }
      }
      // Build full grid (fill missing cells as Free Period)
      const fullGrid: Period[] = [];
      for (let dayIdx = 0; dayIdx < days.length; dayIdx++) {
        const day = days[dayIdx];
        for (const periodNum of periods) {
          const dbPeriod = timetableData?.find(
            (t: any) => t.day_of_week === dayIdx + 1 && t.period_number === periodNum
          );
          fullGrid.push({
            day,
            period: periodNum,
            subject: dbPeriod?.subject || "",
            faculty: dbPeriod?.faculty_id ? facultyMap[dbPeriod.faculty_id] || "" : ""
          });
        }
      }
      setTimetable(fullGrid);
      setLoading(false);
    })();
  }, [classId, isEditing]);

  const getPeriodData = (day: string, period: number) => {
    return timetable.find(t => t.day === day && t.period === period);
  };

  const handleSave = async () => {
    setLoading(true);
    const upserts = [];
    for (let dayIdx = 0; dayIdx < days.length; dayIdx++) {
      const day = days[dayIdx];
      for (const periodNum of periods) {
        const period = timetable.find(t => t.day === day && t.period === periodNum);
        let subject = period?.subject || "";
        let facultyName = period?.faculty || "";
        let facultyId = null;
        if (facultyName) {
          const { data: facultyData } = await supabase
            .from("faculty")
            .select("id")
            .eq("full_name", facultyName)
            .single();
          facultyId = facultyData?.id || null;
        }
        upserts.push({
          class_id: classId,
          day_of_week: dayIdx + 1,
          period_number: periodNum,
          subject,
          faculty_id: facultyId
        });
      }
    }
    const { error: upsertError } = await supabase
      .from("timetable")
      .upsert(upserts, { onConflict: "class_id,day_of_week,period_number" });
    console.log("Upsert data:", upserts);
    console.log("Upsert error:", upsertError);
    if (upsertError) toast.error("Error saving timetable");
    else toast.success("Timetable saved successfully!");
    setIsEditing(false);
    setLoading(false);
  };

  // Handler: Mark attendance for continuous periods
  function handleMarkAttendance(day: string, startPeriod: number, faculty: string, count: number) {
    // TODO: Implement attendance logic here
    // Should mark attendance for all students for 'count' periods
    // Example: send attendance for periods startPeriod to startPeriod+count-1 for the given day and faculty
    alert(`Attendance marked for ${faculty} on ${day}, periods ${startPeriod} to ${startPeriod + count - 1} (count=${count})`);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
      <MobileHeader title="Timetable" />
      
      <main className="container mx-auto px-4 py-8 space-y-6">
        {/* Subject-to-Faculty Assignment Section: Only show in edit mode */}
        {isEditing && (
          <div className="mb-6 p-4 border rounded bg-muted/30">
            <h2 className="font-semibold mb-2">Assign Subjects to Faculty</h2>
            <div className="flex gap-2 mb-2">
              <select value={selectedSubjectId} onChange={e => setSelectedSubjectId(e.target.value)} className="border rounded px-2 py-1">
                <option value="">Select Subject</option>
                {allSubjects.map(subj => (
                  <option key={subj.id} value={subj.id}>{subj.name} ({subj.courseCode})</option>
                ))}
              </select>
              <select value={selectedFaculty} onChange={e => setSelectedFaculty(e.target.value)} className="border rounded px-2 py-1">
                <option value="">Select Faculty</option>
                {facultyList.map(fac => (
                  <option key={fac} value={fac}>{fac}</option>
                ))}
              </select>
              <Button onClick={handleAssign}>Assign</Button>
            </div>
            {/* List of current assignments */}
            <div className="flex flex-wrap gap-2">
              {assignedSubjects.map(a => (
                <span key={a.id} className="px-2 py-1 bg-card rounded border text-xs">{a.name} ({a.courseCode}) → {a.faculty}</span>
              ))}
            </div>
          </div>
        )}
        {/* Class selector removed: advisor-selected class is used */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Timetable Management</h1>
            <p className="text-muted-foreground">Managing: {className}</p>
          </div>
          <div className="flex gap-2">
            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)} className="gradient-secondary">
                <Edit className="w-4 h-4 mr-2" /> Edit Timetable
              </Button>
            ) : (
              <>
                <Button onClick={handleSave} className="gradient-primary">
                  <Save className="w-4 h-4 mr-2" /> Save Changes
                </Button>
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
              </>
            )}
          </div>
        </div>
        <Card className="shadow-medium overflow-x-auto">
          <div className="p-6">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="px-2 py-1">Day</th>
                  {periods.map(periodNum => (
                    <th key={periodNum} className="px-2 py-1">Period {periodNum}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {days.map((day, dayIdx) => {
                  // Find continuous blocks for each faculty for this day
                  const facultyBlocks: Record<string, number[][]> = {};
                  facultyList.forEach(faculty => {
                    facultyBlocks[faculty] = getContinuousPeriods(timetable, day, faculty);
                  });
                  return (
                    <tr key={day} className="border-b">
                      <td className="font-semibold px-2 py-1">{day} <span className="text-xs text-muted-foreground">({dayIdx + 1})</span></td>
                      {periods.map(periodNum => {
                        const period = getPeriodData(day, periodNum);
                        // Check if this period is the start of a continuous block for its faculty
                        let blockLength = 1;
                        let showAttendanceButton = false;
                        if (period?.faculty) {
                          const blocks = facultyBlocks[period.faculty] || [];
                          for (const block of blocks) {
                            if (block[0] === periodNum) {
                              blockLength = block.length;
                              showAttendanceButton = true;
                              break;
                            }
                          }
                        }
                        // Highlight if this period is part of a continuous block for its faculty
                        let highlightClass = "";
                        if (period?.faculty) {
                          const blocks = facultyBlocks[period.faculty] || [];
                          for (const block of blocks) {
                            if (block.includes(periodNum)) {
                              highlightClass = "bg-yellow-100/60"; // Use a soft yellow highlight
                              break;
                            }
                          }
                        }
                        return (
                          <td key={periodNum} className={`px-2 py-1 ${highlightClass}`}>
                            {isEditing ? (
                              <div className="flex flex-col gap-1">
                                <select
                                  value={period?.subject || ""}
                                  onChange={e => {
                                    const subjName = e.target.value;
                                    // Find the assigned faculty for this subject
                                    const assignment = assignedSubjects.find(s => s.name === subjName);
                                    setTimetable(tt => tt.map(t =>
                                      t.day === day && t.period === periodNum
                                        ? { ...t, subject: subjName, faculty: assignment ? assignment.faculty : "" }
                                        : t
                                    ));
                                  }}
                                  className="border rounded px-1 py-0.5 mb-1"
                                >
                                  <option value="">Select Subject</option>
                                  {assignedSubjects.map(subj => (
                                    <option key={subj.id} value={subj.name}>{subj.name} ({subj.courseCode})</option>
                                  ))}
                                </select>
                              </div>
                            ) : (
                              <div>
                                <div className="font-medium">{period?.subject || <span className="text-muted-foreground">Free</span>}</div>
                                <div className="text-xs text-muted-foreground">{period?.faculty || ""}</div>
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </main>
    </div>
  );
}

export default TimetableManagement;