import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";

export default function FacultyActivities() {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    (async () => {
      const { data } = await (supabase as any)
        .from("attendance_activity")
        .select("id, attendance_id, previous_status, new_status, change_reason, created_at, changed_by, changed_by_faculty_id")
        .order("created_at", { ascending: false })
        .limit(200);
      setActivities(data || []);
      setLoading(false);
    })();
  }, []);

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-4">Faculty Activities</h2>
      {loading ? <div>Loading...</div> : (
        <table className="w-full border">
          <thead>
            <tr className="bg-gray-100">
              <th>Time</th>
              <th>Attendance ID</th>
              <th>Previous</th>
              <th>New</th>
              <th>By (user)</th>
              <th>Reason</th>
            </tr>
          </thead>
          <tbody>
            {activities.map(a => (
              <tr key={a.id}>
                <td>{new Date(a.created_at).toLocaleString()}</td>
                <td>{a.attendance_id}</td>
                <td>{a.previous_status}</td>
                <td>{a.new_status}</td>
                <td>{a.changed_by}</td>
                <td>{a.change_reason}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  );
}
