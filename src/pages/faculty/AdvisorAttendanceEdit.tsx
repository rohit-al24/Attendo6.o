
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import MobileHeader from "@/components/MobileHeader";

interface AttendanceRecord {
  id: string;
  student_id: string;
  subject: string;
  status: string;
  faculty_id: string;
  date: string;
}

export default function AdvisorAttendanceEdit() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const classId = searchParams.get("classId") || "";

  const [facultyList, setFacultyList] = useState<any[]>([]);
  const [selectedFaculty, setSelectedFaculty] = useState<string>("");
  const [date, setDate] = useState<string>("");
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [studentMap, setStudentMap] = useState<Record<string, { full_name: string; roll_number: string }>>({});
  const [loading, setLoading] = useState(false);
  const [editStatuses, setEditStatuses] = useState<Record<string, string>>({});
  const [history, setHistory] = useState<any[]>([]);
  const [editingHistory, setEditingHistory] = useState<{ faculty: string; date: string; period_number: number; subject: string } | null>(null);

  useEffect(() => {
    // Fetch all faculty from DB (for dropdown)
    supabase
      .from("faculty")
      .select("id, full_name")
      .then(({ data }) => {
        // Also fetch faculty from attendance records for this class
        supabase
          .from("attendance_records")
          .select("faculty_id")
          .eq("class_id", classId)
          .then(({ data: attendanceData }) => {
            const attendanceFacultyIds = Array.from(new Set((attendanceData || []).map((rec: any) => rec.faculty_id).filter(Boolean)));
            const allFaculty = [...(data || [])];
            attendanceFacultyIds.forEach(fid => {
              if (!allFaculty.find(f => f.id === fid)) {
                allFaculty.push({ id: fid, full_name: fid }); // fallback to id if name not found
              }
            });
            setFacultyList(allFaculty);
          });
      });
    // Fetch students for this class
    supabase
      .from("students")
      .select("id, full_name, roll_number")
      .eq("class_id", classId)
      .then(({ data }) => {
        if (data) {
          const map: Record<string, { full_name: string; roll_number: string }> = {};
          data.forEach((s: any) => {
            map[s.id] = { full_name: s.full_name, roll_number: s.roll_number };
          });
          setStudentMap(map);
        }
      });
    // Fetch attendance history summary (latest first)
    supabase
      .from("attendance_records")
      .select("id, faculty_id, subject, date, period, time")
      .eq("class_id", classId)
      .order("date", { ascending: false })
      .then(({ data }) => {
        // Group by faculty, date, period, subject
        const grouped: Record<string, any> = {};
        (data || []).forEach((rec: any) => {
          const key = `${rec.faculty_id}|${rec.date}|${rec.period}|${rec.subject}`;
          if (!grouped[key]) {
            grouped[key] = {
              faculty: rec.faculty_id,
              date: rec.date,
              period: rec.period,
              subject: rec.subject,
              time: rec.time,
              ids: []
            };
          }
          grouped[key].ids.push(rec.id);
        });
        setHistory(Object.values(grouped));
      });
      // Fetch attendance history summary (latest first)
      supabase
        .from("attendance_records")
        .select("id, faculty_id, subject, date, period_number")
        .eq("class_id", classId)
        .order("date", { ascending: false })
        .then(({ data }) => {
          // Group by faculty, date, period_number, subject
          const grouped: Record<string, any> = {};
          (data || []).forEach((rec: any) => {
            const key = `${rec.faculty_id}|${rec.date}|${rec.period_number}|${rec.subject}`;
            if (!grouped[key]) {
              grouped[key] = {
                faculty: rec.faculty_id,
                date: rec.date,
                period_number: rec.period_number,
                subject: rec.subject,
                ids: []
              };
            }
            grouped[key].ids.push(rec.id);
          });
          setHistory(Object.values(grouped));
        });
    // Fetch attendance history summary (latest first)
    supabase
      .from("attendance_records")
      .select("id, faculty_id, subject, date")
      .eq("class_id", classId)
      .order("date", { ascending: false })
      .then(({ data }) => {
        // Group by faculty, date, subject
        const grouped: Record<string, any> = {};
        (data || []).forEach((rec: any) => {
          const key = `${rec.faculty_id}|${rec.date}|${rec.subject}`;
          if (!grouped[key]) {
            grouped[key] = {
              faculty: rec.faculty_id,
              date: rec.date,
              subject: rec.subject,
              ids: []
            };
          }
          grouped[key].ids.push(rec.id);
        });
        setHistory(Object.values(grouped));
      });
  }, [classId]);

    const fetchAttendance = async (filter?: { faculty?: string; date?: string; period_number?: number; subject?: string }) => {
      setLoading(true);
      let query = supabase
        .from("attendance_records")
        .select("id, student_id, subject, status, faculty_id, date, period_number")
        .eq("class_id", classId);
      if (filter?.faculty) query = query.eq("faculty_id", filter.faculty);
      if (filter?.date) query = query.eq("date", filter.date);
      if (filter?.period_number !== undefined) query = query.eq("period_number", filter.period_number);
      if (filter?.subject) query = query.eq("subject", filter.subject);
      const { data } = await query;
      setAttendanceRecords(data || []);
      setLoading(false);
    };

  const handleStatusChange = (id: string, value: string) => {
    setEditStatuses(prev => ({ ...prev, [id]: value }));
  };

  const saveAllEdits = async () => {
    const session = await supabase.auth.getSession();
    const userId = session?.data?.session?.user?.id || null;
    const updates = Object.entries(editStatuses).map(async ([id, status]) => {
      // fetch previous value
      const { data: prev } = await supabase.from("attendance_records").select("status, faculty_id").eq("id", id).single();
      await supabase.from("attendance_records").update({ status }).eq("id", id);
      // log activity
        // attendance_activity table may not be in the generated Supabase types; cast to any for now
        await (supabase as any).from("attendance_activity").insert({
        attendance_id: id,
        changed_by: userId,
        changed_by_faculty_id: null,
        previous_status: prev?.status || null,
        new_status: status,
        change_reason: 'Edited by advisor'
      });
    });
    await Promise.all(updates);
    setEditStatuses({});
    fetchAttendance();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
      <MobileHeader title="Edit Attendance" />
      <Card className="p-6 max-w-3xl mx-auto mt-8">
      <h2 className="text-2xl font-bold mb-4">Edit Previous Attendance</h2>
      {/* Attendance history summary - latest first */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Attendance History (Latest First)</h3>
        <div className="flex flex-col gap-3">
          {history.length === 0 && (
            <div className="text-muted-foreground">No attendance history found.</div>
          )}
          {history.map((h, idx) => (
            <div key={idx} className="border rounded-lg p-4 bg-gray-50 flex flex-col md:flex-row md:items-center md:justify-between gap-2 shadow-sm">
              <div className="flex flex-wrap gap-4">
                <div><span className="font-semibold">Faculty:</span> {facultyList.find(f => f.id === h.faculty)?.full_name || h.faculty}</div>
                <div><span className="font-semibold">Subject:</span> {h.subject}</div>
                <div><span className="font-semibold">Date:</span> {h.date}</div>
                  <div><span className="font-semibold">Period:</span> {h.period_number}</div>
              </div>
                <Button size="sm" className="self-end md:self-auto" onClick={() => {
                  setEditingHistory({ faculty: h.faculty, date: h.date, period_number: h.period_number, subject: h.subject });
                  fetchAttendance({ faculty: h.faculty, date: h.date, period_number: h.period_number, subject: h.subject });
                }}>Edit</Button>
            </div>
          ))}
        </div>
      </div>
      {/* Filter UI for manual search (optional) */}
      <div className="flex gap-4 mb-4 flex-wrap">
        <select value={selectedFaculty} onChange={e => setSelectedFaculty(e.target.value)} className="border rounded px-2 py-1">
          <option value="">Select Faculty</option>
          {facultyList.map(f => (
            <option key={f.id} value={f.id}>{f.full_name}</option>
          ))}
        </select>
        <input type="date" value={date} onChange={e => setDate(e.target.value)} className="border rounded px-2 py-1" />
        <Button onClick={() => fetchAttendance({ faculty: selectedFaculty, date })} disabled={loading}>Fetch</Button>
      </div>
      {/* Editable attendance table for selected history or filter */}
      {loading ? <div>Loading...</div> : (
        <form onSubmit={e => { e.preventDefault(); saveAllEdits(); }}>
          <table className="w-full border mb-4">
            <thead>
              <tr className="bg-gray-100">
                <th>Student Name</th>
                <th>Roll Number</th>
                <th>Subject</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {attendanceRecords.map(rec => (
                <tr key={rec.id}>
                  <td>{studentMap[rec.student_id]?.full_name || rec.student_id}</td>
                  <td>{studentMap[rec.student_id]?.roll_number || ""}</td>
                  <td>{rec.subject}</td>
                  <td>
                    <select
                      value={editStatuses[rec.id] ?? rec.status}
                      onChange={e => handleStatusChange(rec.id, e.target.value)}
                      className="border rounded px-2 py-1"
                    >
                      <option value="present">Present</option>
                      <option value="absent">Absent</option>
                      <option value="leave">Leave</option>
                      <option value="onduty">On Duty</option>
                    </select>
                  </td>
                  <td>{rec.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {attendanceRecords.length > 0 && (
            <Button type="submit" className="mt-4">Save All Changes</Button>
          )}
        </form>
      )}
      </Card>
    </div>
  );
}
