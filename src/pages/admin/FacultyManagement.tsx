import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Edit, Trash2, Calendar, FileText } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MobileHeader from "@/components/MobileHeader";

interface Faculty {
  id: string;
  name: string;
  email: string;
  department: string;
  isAdvisor: boolean;
  advisorClass?: string;
}

const FacultyManagement = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newFaculty, setNewFaculty] = useState({ name: "", email: "", department: "", password: "" });
  // Faculty data from DB
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  // New state for advisor assignment
  const [classList, setClassList] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [selectedFacultyId, setSelectedFacultyId] = useState<string>("");

  // Fetch all classes for dropdown
  useEffect(() => {
    const fetchClasses = async () => {
      const { data } = await supabase
        .from('classes')
        .select('id, class_name, department, section, year');
      setClassList(data || []);
    };
    fetchClasses();
  }, []);

  // Assign advisor handler
  const handleAssignAdvisor = async () => {
    if (!selectedClassId || !selectedFacultyId) return;
    // 1. Unset previous advisor for this class
    const { error: unsetError } = await supabase
      .from('faculty')
      .update({ advisor_class_id: null, is_class_advisor: false })
      .eq('advisor_class_id', selectedClassId)
      .eq('is_class_advisor', true);
    if (unsetError) {
      toast.error('Error unassigning previous advisor: ' + unsetError.message);
      return;
    }
    // 2. Set new advisor
    const { error } = await supabase
      .from('faculty')
      .update({ advisor_class_id: selectedClassId, is_class_advisor: true })
      .eq('id', selectedFacultyId);
    if (error) {
      toast.error('Error assigning advisor: ' + error.message);
      return;
    }
    toast.success('Advisor assigned successfully!');
    setSelectedClassId("");
    setSelectedFacultyId("");
  };

  useEffect(() => {
    const fetchFaculties = async () => {
      // Fetch faculty and join with classes for advisor info
      const { data, error } = await supabase
        .from('faculty')
        .select(`id, full_name, email, department, is_class_advisor, advisor_class_id, classes(class_name, year, section, department)`) // join classes for advisor info
      ;
      if (error) {
        console.error('Error fetching faculty:', error);
        return;
      }
      // Map DB fields to UI
      const mapped = (data || []).map((f: any) => ({
        id: f.id,
        name: f.full_name,
        email: f.email,
        department: f.department || '',
        isAdvisor: !!f.is_class_advisor,
        // include advisorClassId so we can query activities for that class later
        advisorClassId: f.advisor_class_id,
        advisorClass: f.is_class_advisor && f.classes ? `${f.classes.year} Year ${f.classes.department} ${f.classes.section}` : undefined,
      }));
      setFaculties(mapped);
    };
    fetchFaculties();
  }, []);

  // Activities dialog state
  const [activitiesOpen, setActivitiesOpen] = useState(false);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [activities, setActivities] = useState<Array<any>>([]);
  const [filterFrom, setFilterFrom] = useState<string | null>(null);
  const [filterTo, setFilterTo] = useState<string | null>(null);
  const [filterChangedBy, setFilterChangedBy] = useState<string | null>(null);
  const [facultySelectorList, setFacultySelectorList] = useState<Array<any>>([]);
  const [currentActivitiesFaculty, setCurrentActivitiesFaculty] = useState<any>(null);

  const openActivities = async (faculty: any, options?: { from?: string | null; to?: string | null; changedBy?: string | null }) => {
    // faculty.advisorClassId should contain the class id this faculty advises
    const classId = faculty?.advisorClassId;
    if (!classId) {
      toast.error('No advisor class found for this faculty');
      return;
    }
    setActivitiesOpen(true);
    setActivitiesLoading(true);
    try {
      // load faculty list for changed-by selector (once)
      if (facultySelectorList.length === 0) {
        const { data: allFac } = await supabase.from('faculty').select('id, full_name');
        setFacultySelectorList(allFac || []);
      }
      // build query for attendance_activity with optional filters
      let query: any = (supabase as any).from('attendance_activity').select('*').order('created_at', { ascending: false }).limit(500);
      const from = options?.from ?? filterFrom;
      const to = options?.to ?? filterTo;
      const changedBy = options?.changedBy ?? filterChangedBy;
      if (from) query = query.gte('created_at', from);
      if (to) query = query.lte('created_at', to);
      if (changedBy) query = query.eq('changed_by_faculty_id', changedBy);

      const { data: rawActivities } = await query;
      const activitiesArr = rawActivities || [];
      const attendanceIds = Array.from(new Set(activitiesArr.map((a: any) => a.attendance_id).filter(Boolean)));

      if (attendanceIds.length === 0) {
        setActivities([]);
        setActivitiesLoading(false);
        return;
      }

      // fetch attendance records for those ids
      const { data: attendanceRecords } = await supabase
        .from('attendance_records')
        .select('id, student_id, class_id')
        .in('id', attendanceIds as string[]);

      const attendanceById = Object.fromEntries((attendanceRecords || []).map((ar: any) => [ar.id, ar]));

      // filter activities to only those that affect this advisor's class
      const filtered = activitiesArr.filter((a: any) => attendanceById[a.attendance_id] && attendanceById[a.attendance_id].class_id === classId);

      // fetch student details
      const studentIds = Array.from(new Set(filtered.map((a: any) => attendanceById[a.attendance_id]?.student_id).filter(Boolean)));
  const { data: students } = await supabase.from('students').select('id, full_name, roll_number').in('id', studentIds as string[]);
      const studentById = Object.fromEntries((students || []).map((s: any) => [s.id, s]));

      // fetch faculty names for changed_by_faculty_id
      const changedByIds = Array.from(new Set(filtered.map((a: any) => a.changed_by_faculty_id).filter(Boolean)));
  const { data: facultiesInfo } = await supabase.from('faculty').select('id, full_name').in('id', changedByIds as string[]);
      const facultyById = Object.fromEntries((facultiesInfo || []).map((f: any) => [f.id, f]));

      // assemble enriched activities
      const enriched = filtered.map((a: any) => {
        const attendance = attendanceById[a.attendance_id] || {};
        const student = studentById[attendance.student_id] || {};
        const changedBy = facultyById[a.changed_by_faculty_id] || {};
        return {
          id: a.id,
          attendance_id: a.attendance_id,
          studentName: student.full_name || 'Unknown',
          studentRoll: student.roll_number || '',
          previous_status: a.previous_status,
          new_status: a.new_status,
          changedBy: changedBy.full_name || 'System',
          reason: a.change_reason || '',
          created_at: a.created_at,
        };
      });

      setActivities(enriched);
    } catch (err) {
      console.error('Error loading activities', err);
      toast.error('Failed to load activities');
    }

    setActivitiesLoading(false);
  };

const handleCreateFaculty = async () => {
  if (!newFaculty.name || !newFaculty.email || !newFaculty.department || !newFaculty.password) {
    toast.error("Please fill all fields");
    return;
  }
  try {
    const res = await fetch("https://gczoakupibhzaeplstzh.supabase.co/functions/v1/create-faculty-account", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newFaculty.name,
        email: newFaculty.email,
        department: newFaculty.department,
        password: newFaculty.password,
      }),
    });
    const result = await res.json();
    if (result.error) {
      toast.error("Error: " + result.error);
      return;
    }
    toast.success("Faculty account created successfully!");
    setIsCreateDialogOpen(false);
    setNewFaculty({ name: "", email: "", department: "", password: "" });
    // Optionally refresh faculty list
  } catch (err) {
    toast.error("Unexpected error: " + (err as any).message);
  }
};

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
      <MobileHeader title="Faculty Management" />

      <main className="container mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Faculty Management</h1>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-secondary">
                <UserPlus className="w-4 h-4 mr-2" />
                Create Faculty Account
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Faculty Account</DialogTitle>
                <DialogDescription>Enter faculty details to create a new account</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={newFaculty.name}
                    onChange={(e) => setNewFaculty({ ...newFaculty, name: e.target.value })}
                    placeholder="Dr. John Doe"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newFaculty.email}
                    onChange={(e) => setNewFaculty({ ...newFaculty, email: e.target.value })}
                    placeholder="john.doe@college.edu"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Select onValueChange={(value) => setNewFaculty({ ...newFaculty, department: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CSE">Computer Science</SelectItem>
                      <SelectItem value="ECE">Electronics</SelectItem>
                      <SelectItem value="MECH">Mechanical</SelectItem>
                      <SelectItem value="CIVIL">Civil</SelectItem>
                      <SelectItem value="EEE">Electrical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Initial Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={newFaculty.password}
                    onChange={(e) => setNewFaculty({ ...newFaculty, password: e.target.value })}
                    placeholder="Set initial password"
                  />
                </div>
                <Button onClick={handleCreateFaculty} className="w-full">
                  Create Account
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Assign Class Advisor Section */}
        <Card className="shadow-medium mb-8">
          <div className="p-6 space-y-4">
            <h2 className="text-xl font-bold">Assign Class Advisor</h2>
            <div className="grid grid-cols-2 gap-4 max-w-xl">
              <div className="space-y-2">
                <Label>Select Class</Label>
                <Select onValueChange={setSelectedClassId} value={selectedClassId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classList.map(cls => (
                      <SelectItem key={cls.id} value={cls.id}>{cls.class_name} - {cls.year} Year {cls.department} {cls.section}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Select Faculty</Label>
                <Select onValueChange={setSelectedFacultyId} value={selectedFacultyId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose faculty" />
                  </SelectTrigger>
                  <SelectContent>
                    {faculties.map(f => (
                      <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={handleAssignAdvisor} disabled={!selectedClassId || !selectedFacultyId} className="mt-4">Assign Advisor</Button>
          </div>
        </Card>

        <Tabs defaultValue="all-faculty" className="space-y-4">
          <TabsList className="grid w-full max-w-2xl grid-cols-3">
            <TabsTrigger value="all-faculty">All Faculty</TabsTrigger>
            <TabsTrigger value="advisors">Class Advisors</TabsTrigger>
            <TabsTrigger value="substitute">Set Substitute</TabsTrigger>
          </TabsList>

          <TabsContent value="all-faculty" className="space-y-4">
            <Card className="shadow-medium">
              <div className="p-6 space-y-4">
                <h2 className="text-xl font-bold">Faculty List</h2>
                <div className="space-y-3">
                  {faculties.map((faculty) => (
                    <Card key={faculty.id} className="border-2 hover:border-primary transition-smooth">
                      <div className="p-4 flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="font-semibold text-lg">{faculty.name}</p>
                          <p className="text-sm text-muted-foreground">{faculty.email}</p>
                          <p className="text-sm">
                            <span className="font-medium">Department:</span> {faculty.department}
                          </p>
                          {faculty.isAdvisor && (
                            <p className="text-sm text-secondary">
                              <span className="font-medium">Class Advisor:</span> {faculty.advisorClass}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <Calendar className="w-4 h-4 mr-2" />
                            View Schedule
                          </Button>
                          <Button variant="outline" size="sm">
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </Button>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <FileText className="w-4 h-4 mr-2" />
                                Reset Password
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Send Password Reset Link</DialogTitle>
                                <DialogDescription>Send a password reset email to {faculty.email}?</DialogDescription>
                              </DialogHeader>
                              <Button className="w-full" onClick={async () => {
                                try {
                                  const { error } = await supabase.auth.resetPasswordForEmail(faculty.email);
                                  if (error) toast.error("Error sending reset link: " + error.message);
                                  else toast.success("Password reset link sent to " + faculty.email);
                                } catch (err) {
                                  toast.error("Unexpected error: " + (err as any).message);
                                }
                              }}>
                                Send Reset Link
                              </Button>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="advisors" className="space-y-4">
            <Card className="shadow-medium">
              <div className="p-6 space-y-4">
                <h2 className="text-xl font-bold">Class Advisors</h2>
                <div className="space-y-3">
                  {faculties.filter(f => f.isAdvisor).map((faculty) => (
                    <Card key={faculty.id} className="border-2 hover:border-primary transition-smooth">
                      <div className="p-4 flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="font-semibold text-lg">{faculty.name}</p>
                          <p className="text-sm">Managing: <span className="font-medium text-primary">{faculty.advisorClass}</span></p>
                        </div>
                        <Button variant="outline" onClick={() => { setCurrentActivitiesFaculty(faculty); openActivities(faculty); }}>
                          <FileText className="w-4 h-4 mr-2" />
                          View Activities
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </Card>
            {/* Activities dialog rendered at the same level as the advisors content */}
            <Dialog open={activitiesOpen} onOpenChange={setActivitiesOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Advisor Activities</DialogTitle>
                  <DialogDescription>Recent attendance edits affecting this advisor's class</DialogDescription>
                </DialogHeader>
                <div className="space-y-3 pt-4">
                  <div className="mb-4">
                    <Label>Date</Label>
                    <Input type="date" value={filterFrom || ''} onChange={(e) => setFilterFrom(e.target.value || null)} />
                  </div>
                  <div className="flex gap-2 items-center mb-4">
                    <Button onClick={() => { if (!currentActivitiesFaculty) { toast.error('No advisor selected'); return; } openActivities(currentActivitiesFaculty, { from: filterFrom, to: filterFrom, changedBy: filterChangedBy }); }} size="sm">Search</Button>
                    <Button variant="outline" size="sm" onClick={() => { setFilterFrom(null); setFilterChangedBy(null); }}>Clear</Button>
                  </div>
                  {activitiesLoading ? (
                    <div className="p-6 text-center">Loading...</div>
                  ) : activities.length === 0 ? (
                    <div className="p-6 text-center">No activities found for this class.</div>
                  ) : (
                    <div className="overflow-y-auto max-h-96">
                      {/* Group activities by subject and faculty */}
                      {(() => {
                        const grouped: Record<string, any[]> = {};
                        activities.forEach(act => {
                          const key = `${act.subject || 'Unknown'}__${act.changedBy}`;
                          if (!grouped[key]) grouped[key] = [];
                          grouped[key].push(act);
                        });
                        return Object.entries(grouped).map(([groupKey, acts]) => {
                          const [subject, faculty] = groupKey.split('__');
                          const [expanded, setExpanded] = useState(false);
                          return (
                            <div key={groupKey} className="mb-4 border rounded-lg">
                              <div className="flex items-center justify-between bg-gray-100 px-4 py-2 cursor-pointer" onClick={() => setExpanded(!expanded)}>
                                <span className="font-semibold">{subject}</span>
                                <span className="text-sm text-muted-foreground">by {faculty}</span>
                                <span className="ml-auto text-xs">{acts.length} changes</span>
                              </div>
                              {expanded && (
                                <div className="divide-y">
                                  {acts.map(act => (
                                    <div key={act.id} className="flex items-center px-4 py-2 text-sm" style={{ background: act.previous_status !== act.new_status ? '#fffbe6' : undefined }}>
                                      <div className="w-1/4 font-medium">{act.studentName} <span className="text-xs text-gray-500">({act.studentRoll})</span></div>
                                      <div className="w-1/6">{act.previous_status}</div>
                                      <div className="w-1/6 font-bold text-green-700">{act.new_status}</div>
                                      <div className="w-1/6">{new Date(act.created_at).toLocaleString()}</div>
                                      <div className="w-1/6 text-xs text-gray-500">{act.reason}</div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        });
                      })()}
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </TabsContent>

          <TabsContent value="substitute" className="space-y-4">
            <Card className="shadow-medium">
              <div className="p-6 space-y-4">
                <h2 className="text-xl font-bold">Set Class Advisor Substitute</h2>
                <div className="space-y-4 max-w-2xl">
                  <div className="space-y-2">
                    <Label>Select Year and Class</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose class" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1cse-a">1st Year - CSE A</SelectItem>
                        <SelectItem value="2cse-a">2nd Year - CSE A</SelectItem>
                        <SelectItem value="3cse-a">3rd Year - CSE A</SelectItem>
                        <SelectItem value="2ece-b">2nd Year - ECE B</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Current Advisor</p>
                    <p className="font-semibold">Dr. Sarah Johnson</p>
                  </div>

                  <div className="space-y-2">
                    <Label>Select Substitute Teacher</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose substitute" />
                      </SelectTrigger>
                      <SelectContent>
                        {faculties.map(f => (
                          <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>From Date</Label>
                      <Input type="date" />
                    </div>
                    <div className="space-y-2">
                      <Label>To Date</Label>
                      <Input type="date" />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button className="flex-1">Save Substitution</Button>
                    <Button variant="outline" className="flex-1">Discard</Button>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default FacultyManagement;
