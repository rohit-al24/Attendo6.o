import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import MobileHeader from "@/components/MobileHeader";
import StudentTabBar from "@/components/StudentTabBar";

type Student = {
  class_id?: string;
  created_at?: string;
  full_name?: string;
  id?: string;
  roll_number?: string;
  user_id?: string;
  profile_url?: string;
};

const StudentProfile: React.FC = () => {
  const [student, setStudent] = useState<Student | null>(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const str = sessionStorage.getItem("student");
      const stu = str ? JSON.parse(str) : null;
      setStudent(stu);
      setPreviewUrl(stu?.profile_url || null);
    } catch {
      setStudent(null);
      setPreviewUrl(null);
    }
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !student) return;
    setUploading(true);
    const fileExt = file.name.split('.').pop();
    const filePath = `avatars/${student.id}.${fileExt}`;
    const { error: uploadError } = await supabase.storage.from('student-avatars').upload(filePath, file, { upsert: true });
    if (uploadError) {
      alert('Upload failed: ' + uploadError.message);
      setUploading(false);
      return;
    }
    const { data } = supabase.storage.from('student-avatars').getPublicUrl(filePath);
    const publicUrl = (data as any)?.publicUrl as string | undefined;
    if (publicUrl) {
      const { error: updateError } = await (supabase as any)
        .from('students')
        .update({ profile_url: publicUrl })
        .eq('id', student.id);
      if (!updateError) {
        setPreviewUrl(publicUrl);
        const updated = { ...student, profile_url: publicUrl };
        setStudent(updated);
        sessionStorage.setItem('student', JSON.stringify(updated));
      } else {
        alert('Failed to update profile: ' + updateError.message);
      }
    }
    setUploading(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background to-muted/30">
      <MobileHeader title="Profile" />
      <main className="flex-1 flex items-center justify-center p-4 pb-24">
        <Card className="w-full max-w-md p-8 shadow-large space-y-6">
          <h2 className="text-2xl font-bold mb-2">Student Profile</h2>
          {student ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-2">
                <div className="flex-1">
                  <label className="block text-muted-foreground text-sm mb-1">Full Name</label>
                  <Input value={student.full_name} readOnly className="h-9 text-base" />
                </div>
                <div className="flex-1 ml-4">
                  <label className="block text-muted-foreground text-sm mb-1">Roll Number</label>
                  <Input value={student.roll_number} readOnly className="h-9 text-base" />
                </div>
                <Button type="button" size="sm" className="ml-4 h-9 px-4 py-1 text-sm font-semibold" onClick={() => navigate('/student-dashboard')}>
                  Go to Dashboard
                </Button>
              </div>
              {/* App Creators Section */}
              <div className="mt-8">
                <h3 className="text-lg font-bold mb-3 text-center">App Creators</h3>
                {/* Faculty/Staff Section */}
                <div className="grid grid-cols-3 gap-4 mb-4 max-w-2xl mx-auto">
                  {/* Staff Cards - highlighted, smaller */}
                  <div className="flex flex-col items-center bg-violet-50 rounded-xl shadow px-2 py-3 border border-violet-100 min-w-0">
                    <img src="https://randomuser.me/api/portraits/men/32.jpg" alt="Dr. Dinesh Sir" className="w-12 h-12 rounded-full object-cover border-2 border-white shadow mb-1" />
                    <span className="font-semibold text-xs truncate">Dr. Dinesh Sir</span>
                    <span className="bg-purple-100 text-purple-700 text-[10px] px-1.5 py-0.5 rounded font-medium mt-1">Lead</span>
                    <span className="text-[10px] text-muted-foreground mt-1">NBA HEAD</span>
                  </div>
                  <div className="flex flex-col items-center bg-violet-50 rounded-xl shadow px-2 py-3 border border-violet-100 min-w-0">
                    <img src="https://randomuser.me/api/portraits/men/33.jpg" alt="Dr. Rajaguru Sir" className="w-12 h-12 rounded-full object-cover border-2 border-white shadow mb-1" />
                    <span className="font-semibold text-xs truncate">Dr. Rajaguru Sir</span>
                    <span className="bg-green-100 text-green-700 text-[10px] px-1.5 py-0.5 rounded font-medium mt-1">Mentor</span>
                    <span className="text-[10px] text-muted-foreground mt-1">IQAC HEAD</span>
                  </div>
                  <div className="flex flex-col items-center bg-violet-50 rounded-xl shadow px-2 py-3 border border-violet-100 min-w-0">
                    <img src="https://randomuser.me/api/portraits/men/34.jpg" alt="Mrs. Mahalakshmi Mam" className="w-12 h-12 rounded-full object-cover border-2 border-white shadow mb-1" />
                    <span className="font-semibold text-xs truncate">Mrs. Mahalakshmi Mam</span>
                    <span className="bg-blue-100 text-blue-700 text-[10px] px-1.5 py-0.5 rounded font-medium mt-1">Coordinator</span>
                    <span className="text-[10px] text-muted-foreground mt-1">HOD Maths</span>
                  </div>
                </div>
                {/* Student/Contributor Section */}
                <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
                  {[1,2,3,4,5,6].map((n) => (
                    <div key={n} className="flex flex-col items-center bg-white rounded-xl shadow px-2 py-3 border border-slate-100 min-w-0">
                      <img src={`https://randomuser.me/api/portraits/men/${40+n}.jpg`} alt={`Student ${n}`} className="w-10 h-10 rounded-full object-cover border-2 border-white shadow mb-1" />
                      <span className="font-semibold text-xs truncate">Student {n}</span>
                      <span className="bg-yellow-100 text-yellow-700 text-[10px] px-1.5 py-0.5 rounded font-medium mt-1">Contributor</span>
                      <span className="text-[10px] text-muted-foreground mt-1">Dept. CSE</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-muted-foreground">Not logged in.</div>
          )}
        </Card>
      </main>
      <StudentTabBar />
    </div>
  );
};

export default StudentProfile;
