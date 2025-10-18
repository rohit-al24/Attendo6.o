
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

// Hardcoded subject lists per class (from seed data)
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Save, Edit } from "lucide-react";
import { useNavigate } from "react-router-dom";
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
  const [subjectFacultyMap, setSubjectFacultyMap] = useState<Record<string, string>>({});
  const [classList, setClassList] = useState<{ id: string; name: string }[]>([]);
  const [classId, setClassId] = useState<string>("");
  const [timetable, setTimetable] = useState<Period[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch all classes and set default class
  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: classes, error: classError } = await supabase
        .from("classes")
        .select("id,class_name");
      if (classError) toast.error("Error loading classes");
      if (classes && classes.length > 0) {
        setClassList(classes.map((c: any) => ({ id: c.id, name: c.class_name })));
        setClassId(classes[0].id);
      }
      setLoading(false);
    })();
  }, []);

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
      const subjectFaculty: Record<string, string> = {};
      for (let dayIdx = 0; dayIdx < days.length; dayIdx++) {
        const day = days[dayIdx];
        for (const periodNum of periods) {
          const dbPeriod = timetableData?.find(
            (t: any) => t.day_of_week === dayIdx + 1 && t.period_number === periodNum
          );
          const subject = dbPeriod?.subject || "";
          const faculty = dbPeriod?.faculty_id ? facultyMap[dbPeriod.faculty_id] || "" : "";
          fullGrid.push({ day, period: periodNum, subject, faculty });
          if (subject && faculty && !subjectFaculty[subject]) {
            subjectFaculty[subject] = faculty;
          }
        }
      }
      setTimetable(fullGrid);
      setSubjectFacultyMap(subjectFaculty);
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

  return (
  <div className="min-h-screen bg-gradient-to-br from-blue-100 via-indigo-100 to-pink-100">
      <header className="border-b bg-card shadow-soft">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate("/faculty-dashboard")}> <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard </Button>
        </div>
      </header>
  <main className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 space-y-4 sm:space-y-6">
        <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
          <label className="font-semibold text-lg text-indigo-700">Select Class:</label>
          <select value={classId} onChange={e => setClassId(e.target.value)} className="border-2 border-indigo-300 rounded px-3 py-2 focus:ring-2 focus:ring-indigo-400">
            {classList.map(cls => (
              <option key={cls.id} value={cls.id}>{cls.name}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4 mb-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-indigo-800 mb-1">Timetable Management</h1>
            <p className="text-sm text-indigo-500">Managing: {classList.find(c => c.id === classId)?.name || ""}</p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)} className="bg-gradient-to-r from-pink-500 via-indigo-500 to-blue-500 text-white font-semibold w-full sm:w-auto">
                <Edit className="w-4 h-4 mr-2" /> Edit Timetable
              </Button>
            ) : (
              <>
                <Button onClick={handleSave} className="bg-gradient-to-r from-green-400 via-blue-500 to-indigo-500 text-white font-semibold w-full sm:w-auto">
                  <Save className="w-4 h-4 mr-2" /> Save Changes
                </Button>
                <Button variant="outline" onClick={() => setIsEditing(false)} className="w-full sm:w-auto">
                  Cancel
                </Button>
              </>
            )}
          </div>
        </div>
        {/* Assign Subject Faculty section */}
        {isEditing && (
          <Card className="shadow-lg mb-6 bg-gradient-to-r from-indigo-50 to-pink-50">
            <div className="p-4">
              <h2 className="font-bold mb-2 text-indigo-700">Assign Subject Faculty</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(classId && SUBJECTS_BY_CLASS[classId] ? SUBJECTS_BY_CLASS[classId] : DEFAULT_SUBJECTS).map(subj => (
                  <div key={subj} className="flex items-center gap-2">
                    <span className="font-medium w-2/5">{subj}</span>
                    <select
                      value={subjectFacultyMap[subj] || ""}
                      onChange={e => {
                        const selectedFaculty = e.target.value;
                        setSubjectFacultyMap(prev => ({ ...prev, [subj]: selectedFaculty }));
                        setTimetable(tt => tt.map(t => t.subject === subj ? { ...t, faculty: selectedFaculty } : t));
                      }}
                      className="border rounded px-2 py-1 w-3/5"
                    >
                      <option value="">Select Faculty</option>
                      {facultyList.map(fac => (
                        <option key={fac} value={fac}>{fac}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}
        <Card className="shadow-lg overflow-x-auto bg-white/80">
          <div className="p-2 sm:p-6">
            <div className="w-full overflow-x-auto">
              <table className="min-w-[600px] w-full border-collapse text-sm">
                <thead className="sticky top-0 z-10 bg-gradient-to-r from-indigo-200 to-pink-200">
                  <tr className="border-b border-indigo-300">
                    <th className="px-2 py-2 text-indigo-800 font-bold">Day</th>
                    {periods.map(periodNum => (
                      <th key={periodNum} className="px-2 py-2 text-indigo-700 font-semibold">Period {periodNum}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {days.map((day, dayIdx) => (
                    <tr key={day} className="border-b border-indigo-100">
                      <td className="font-semibold px-2 py-2 text-indigo-700 bg-indigo-50">{day} <span className="text-xs text-indigo-400">({dayIdx + 1})</span></td>
                      {periods.map(periodNum => {
                        const period = getPeriodData(day, periodNum);
                        return (
                          <td key={periodNum} className="px-2 py-2">
                            {isEditing ? (
                              <div className="flex flex-col gap-1">
                                <select
                                  value={period?.subject || ""}
                                  onChange={e => {
                                    setTimetable(tt => tt.map(t =>
                                      t.day === day && t.period === periodNum ? { ...t, subject: e.target.value } : t
                                    ));
                                  }}
                                  className="border-2 border-indigo-200 rounded px-1 py-0.5 focus:ring-2 focus:ring-indigo-400 text-xs"
                                  style={{ maxWidth: 80, width: 80, minWidth: 0, maxHeight: 32 }}
                                >
                                  <option value="">Select</option>
                                  {(classId && SUBJECTS_BY_CLASS[classId] ? SUBJECTS_BY_CLASS[classId] : DEFAULT_SUBJECTS).map(subj => (
                                    <option key={subj} value={subj} className="truncate text-xs">{subj}</option>
                                  ))}
                                </select>
                              </div>
                            ) : (
                              <div>
                                <div className="font-medium text-indigo-900">{period?.subject || <span className="text-indigo-300">Free</span>}</div>
                                <div className="text-xs text-pink-500">{period?.faculty || ""}</div>
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
}

export default TimetableManagement;