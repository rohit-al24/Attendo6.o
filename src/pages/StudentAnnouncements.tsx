import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import MobileHeader from "@/components/MobileHeader";
import StudentTabBar from "@/components/StudentTabBar";

const StudentAnnouncements = () => {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      setLoading(true);
      // Only fetch announcements for students or both
      const { data, error } = await (supabase as any)
        .from("announcements")
        .select("*")
        .in("target", ["students", "both"])
        .order("created_at", { ascending: false });
      setAnnouncements(data || []);
      setLoading(false);
    };
    fetchAnnouncements();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
      <MobileHeader title="Announcements" />
  <main className="container mx-auto px-4 py-8 space-y-6 pb-20">
        {loading ? (
          <div>Loading...</div>
        ) : (
          <ul className="space-y-4">
            {announcements.map(a => (
              <Card key={a.id} className="p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-lg">{a.message}</span>
                  <span className="text-xs text-muted-foreground">{a.created_at?.slice(0, 10)}</span>
                </div>
                {a.image_url && (
                  <img src={a.image_url} alt="Announcement" className="mt-2 max-h-40 rounded" />
                )}
                {a.classes && a.classes.length > 0 && (
                  <div className="text-xs text-muted-foreground mt-1">Classes: {a.classes.join(', ')}</div>
                )}
                {a.show_in_start && (
                  <div className="text-xs text-primary mt-1">This announcement will show on login</div>
                )}
              </Card>
            ))}
          </ul>
        )}
      </main>
      <div className="fixed bottom-0 left-0 w-full z-50">
        <StudentTabBar />
      </div>
    </div>
  );
};

export default StudentAnnouncements;
