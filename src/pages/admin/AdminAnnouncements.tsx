import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Trash2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import MobileHeader from "@/components/MobileHeader";

const AdminAnnouncements = () => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [target, setTarget] = useState('students');
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [showInStart, setShowInStart] = useState(false);
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
  const [previousAnnouncements, setPreviousAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch classes and announcements from DB
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      // Fetch classes
      const { data: classData } = await supabase.from('classes').select('id, class_name');
      setClasses(classData?.map((c: any) => ({ id: c.id, name: c.class_name })) || []);
      // Fetch announcements
      const { data: annData } = await supabase.from('announcements').select('*').order('created_at', { ascending: false });
      setPreviousAnnouncements(annData || []);
      setLoading(false);
    };
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
      <MobileHeader title="Announcements" />
      <main className="container mx-auto px-4 py-8 space-y-6">
        <Card className="shadow-medium p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Manage Announcements</h2>
            <Button variant="default" onClick={() => setShowModal(true)}>Announce</Button>
          </div>
          {/* Modal for new announcement */}
          {showModal && (
            <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
                <h3 className="text-lg font-semibold mb-4">New Announcement</h3>
                <div className="mb-3">
                  <label className="block mb-1 font-medium">Target</label>
                  <select value={target} onChange={e => setTarget(e.target.value)} className="w-full border rounded px-2 py-1">
                    <option value="students">Students</option>
                    <option value="faculty">Faculty</option>
                    <option value="both">Both</option>
                  </select>
                </div>
                {(target === 'students' || target === 'both') && (
                  <div className="mb-3">
                    <label className="block mb-1 font-medium">Select Classes</label>
                    <div className="grid grid-cols-2 gap-2">
                      {classes.map(cls => (
                        <label key={cls.id} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={selectedClasses.includes(cls.id)}
                            onChange={e => {
                              if (e.target.checked) setSelectedClasses([...selectedClasses, cls.id]);
                              else setSelectedClasses(selectedClasses.filter(id => id !== cls.id));
                            }}
                          />
                          {cls.name}
                        </label>
                      ))}
                    </div>
                  </div>
                )}
                <div className="mb-3">
                  <label className="block mb-1 font-medium">Message</label>
                  <textarea
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    className="w-full border rounded px-2 py-1"
                    rows={3}
                  />
                </div>
                <div className="mb-3">
                  <label className="block mb-1 font-medium">Image (optional)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => {
                      if (e.target.files && e.target.files[0]) {
                        setImageFile(e.target.files[0]);
                      } else {
                        setImageFile(null);
                      }
                    }}
                  />
                  {imageUrl && (
                    <img src={imageUrl} alt="Announcement" className="mt-2 max-h-32 rounded" />
                  )}
                </div>
                <div className="mb-3 flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={showInStart}
                    onChange={e => setShowInStart(e.target.checked)}
                  />
                  <label className="font-medium">Show in start (popup on login)</label>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
                  <Button
                    variant="default"
                    onClick={async () => {
                      setLoading(true);
                      let uploadedImageUrl = "";
                      if (imageFile) {
                        const fileExt = imageFile.name.split('.').pop();
                        const fileName = `announcement_${Date.now()}.${fileExt}`;
                        const { data, error } = await supabase.storage.from('announcements').upload(fileName, imageFile);
                        if (!error && data) {
                          uploadedImageUrl = `${supabase.storage.from('announcements').getPublicUrl(fileName).publicUrl}`;
                          setImageUrl(uploadedImageUrl);
                        }
                      }
                      await supabase.from('announcements').insert({
                        target,
                        classes: (target === 'students' || target === 'both') ? selectedClasses : [],
                        message,
                        image_url: uploadedImageUrl,
                        show_in_start: showInStart,
                        created_at: new Date().toISOString(),
                      });
                      setShowModal(false);
                      setMessage('');
                      setSelectedClasses([]);
                      setShowInStart(false);
                      setImageFile(null);
                      setImageUrl("");
                      // Refresh announcements
                      const { data: annData } = await supabase.from('announcements').select('*').order('created_at', { ascending: false });
                      setPreviousAnnouncements(annData || []);
                      setLoading(false);
                    }}
                  >
                    Submit
                  </Button>
                </div>
              </div>
            </div>
          )}
          {/* Previous announcements list */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-2">Previous Announcements</h3>
            {loading ? (
              <div>Loading...</div>
            ) : (
              <ul className="space-y-2">
                {previousAnnouncements.map(a => (
                  <li key={a.id} className="border rounded p-3 bg-muted/40 relative">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{a.message}</span>
                      <span className="text-xs text-muted-foreground">{a.created_at?.slice(0, 10)}</span>
                      <Switch
                        checked={!!a.show_in_start}
                        onCheckedChange={async (checked) => {
                          await supabase.from("announcements").update({ show_in_start: checked }).eq("id", a.id);
                          // Refresh announcements
                          const { data: annData } = await supabase.from("announcements").select("*").order("created_at", { ascending: false });
                          setPreviousAnnouncements(annData || []);
                        }}
                        className="ml-2"
                        title="Show in start"
                      />
                      <button
                        className="ml-2 text-red-500 hover:text-red-700"
                        title="Delete announcement"
                        onClick={async () => {
                          if (window.confirm("Delete this announcement?")) {
                            await supabase.from("announcements").delete().eq("id", a.id);
                            // Refresh announcements
                            const { data: annData } = await supabase.from("announcements").select("*").order("created_at", { ascending: false });
                            setPreviousAnnouncements(annData || []);
                          }
                        }}
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                    {a.image_url && (
                      <img src={a.image_url} alt="Announcement" className="mt-2 max-h-32 rounded" />
                    )}
                    <div className="text-xs text-muted-foreground mt-1">Target: {a.target}</div>
                    {a.classes && a.classes.length > 0 && (
                      <div className="text-xs text-muted-foreground mt-1">Classes: {a.classes.join(', ')}</div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>
      </main>
    </div>
  );
};

export default AdminAnnouncements;
