import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, UserPlus, Edit, Trash2, Calendar, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
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

interface Faculty {
  id: string;
  name: string;
  email: string;
  department: string;
  isAdvisor: boolean;
  advisorClass?: string;
}

const FacultyManagement = () => {
  const navigate = useNavigate();
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
    // Update faculty table: set advisor_class_id and is_class_advisor
    const { error } = await supabase
      .from('faculty')
      .update({ advisor_class_id: selectedClassId, is_class_advisor: true })
      .eq('id', selectedFacultyId);
    if (error) {
      toast.error('Error assigning advisor: ' + error.message);
      return;
    }
    toast.success('Advisor assigned successfully!');
    // Optionally refresh faculty list
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
        advisorClass: f.is_class_advisor && f.classes ? `${f.classes.year} Year ${f.classes.department} ${f.classes.section}` : undefined,
      }));
      setFaculties(mapped);
    };
    fetchFaculties();
  }, []);

  const handleCreateFaculty = () => {
    if (!newFaculty.name || !newFaculty.email || !newFaculty.department || !newFaculty.password) {
      toast.error("Please fill all fields");
      return;
    }
    
    toast.success("Faculty account created successfully!");
    setIsCreateDialogOpen(false);
    setNewFaculty({ name: "", email: "", department: "", password: "" });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
      <header className="border-b bg-card shadow-soft">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate("/admin-dashboard")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </header>

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
                        <Button variant="outline">
                          <FileText className="w-4 h-4 mr-2" />
                          View Activities
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </Card>
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
