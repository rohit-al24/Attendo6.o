
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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

  useEffect(() => {
    // Fetch faculty for this class
    supabase
      .from("faculty")
      .select("id, full_name")
      .eq("advisor_class_id", classId)
      .then(({ data }) => setFacultyList(data || []));
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
  }, [classId]);

  const fetchAttendance = async () => {
    setLoading(true);
    let query = supabase
      .from("attendance_records")
      .select("id, student_id, subject, status, faculty_id, date")
      .eq("class_id", classId);
    if (selectedFaculty) query = query.eq("faculty_id", selectedFaculty);
    if (date) query = query.eq("date", date);
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
    <Card className="p-6 max-w-3xl mx-auto mt-8">
      <h2 className="text-2xl font-bold mb-4">Edit Previous Attendance</h2>
      <div className="flex gap-4 mb-4 flex-wrap">
        <select value={selectedFaculty} onChange={e => setSelectedFaculty(e.target.value)} className="border rounded px-2 py-1">
          <option value="">Select Faculty</option>
          {facultyList.map(f => (
            <option key={f.id} value={f.id}>{f.full_name}</option>
          ))}
        </select>
        <input type="date" value={date} onChange={e => setDate(e.target.value)} className="border rounded px-2 py-1" />
        <Button onClick={fetchAttendance} disabled={loading}>Fetch</Button>
      </div>
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
  );
}
