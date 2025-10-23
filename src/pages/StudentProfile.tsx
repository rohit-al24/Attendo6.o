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
              <div className="flex flex-col items-center gap-2">
                <div className="w-24 h-24 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden border">
                  {previewUrl ? (
                    <img src={previewUrl} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-4xl text-muted-foreground">👤</span>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                  disabled={uploading}
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? 'Uploading...' : 'Upload/Change Photo'}
                </Button>
              </div>
              <div>
                <label className="block text-muted-foreground text-sm mb-1">Full Name</label>
                <Input value={student.full_name} readOnly />
              </div>
              <div>
                <label className="block text-muted-foreground text-sm mb-1">Roll Number</label>
                <Input value={student.roll_number} readOnly />
              </div>
              <div className="flex justify-end pt-2">
                <Button type="button" onClick={() => navigate('/student-dashboard')}>
                  Save &amp; Go to Dashboard
                </Button>
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
