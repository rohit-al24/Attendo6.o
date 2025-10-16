import { useState, useEffect } from "react";
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

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const periods = [1, 2, 3, 4, 5, 6, 7];

const TimetableManagement = () => {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [facultyList, setFacultyList] = useState<string[]>([]);
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
      for (const day of days) {
        for (const periodNum of periods) {
          const dbPeriod = timetableData?.find(
            (t: any) => days[t.day_of_week] === day && t.period_number === periodNum
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
    for (const day of days) {
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
          day_of_week: days.indexOf(day) + 1,
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
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
      <header className="border-b bg-card shadow-soft">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate("/faculty-dashboard")}> <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard </Button>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8 space-y-6">
        <div className="mb-6">
          <label className="font-semibold mr-2">Select Class:</label>
          <select value={classId} onChange={e => setClassId(e.target.value)} className="border rounded px-2 py-1">
            {classList.map(cls => (
              <option key={cls.id} value={cls.id}>{cls.name}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Timetable Management</h1>
            <p className="text-muted-foreground">Managing: {classList.find(c => c.id === classId)?.name || ""}</p>
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
                {days.map(day => (
                  <tr key={day} className="border-b">
                    <td className="font-semibold px-2 py-1">{day}</td>
                    {periods.map(periodNum => {
                      const period = getPeriodData(day, periodNum);
                      return (
                        <td key={periodNum} className="px-2 py-1">
                          {isEditing ? (
                            <div className="flex flex-col gap-1">
                              <input
                                type="text"
                                value={period?.subject || ""}
                                onChange={e => {
                                  setTimetable(tt => tt.map(t =>
                                    t.day === day && t.period === periodNum ? { ...t, subject: e.target.value } : t
                                  ));
                                }}
                                placeholder="Subject"
                                className="border rounded px-1 py-0.5 mb-1"
                              />
                              <select
                                value={period?.faculty || ""}
                                onChange={e => {
                                  setTimetable(tt => tt.map(t =>
                                    t.day === day && t.period === periodNum ? { ...t, faculty: e.target.value } : t
                                  ));
                                }}
                                className="border rounded px-1 py-0.5"
                              >
                                <option value="">Select Faculty</option>
                                {facultyList.map(fac => (
                                  <option key={fac} value={fac}>{fac}</option>
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
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </main>
    </div>
  );
}

export default TimetableManagement;