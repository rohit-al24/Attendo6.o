import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, GraduationCap } from "lucide-react";
import MobileHeader from "@/components/MobileHeader";
import { toast } from "sonner";
import attendoLogo from "@/assets/attendo-logo.png";

const StudentLogin = () => {
  const navigate = useNavigate();
  const [rollNumber, setRollNumber] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!rollNumber || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);
    
    // Custom login using students table
    const { data, error } = await (supabase as any)
      .from('students')
      .select('id, full_name, email, class_id, roll_number')
      .eq('roll_number', rollNumber)
      .eq('password', password)
      .single();
    if (error || !data) {
      toast.error('Invalid credentials');
      setLoading(false);
      return;
    }
    // Successful login: persist session and route to dashboard
    try {
      sessionStorage.setItem('student', JSON.stringify(data));
    } catch {}
    navigate('/student-dashboard', { state: { student: data } });
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 flex flex-col p-0">
      <MobileHeader title="Student Login" />
      <div className="flex-1 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-large animate-in fade-in slide-in-from-bottom duration-500">
        <div className="p-8 space-y-6">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="w-20 h-20 gradient-primary rounded-2xl flex items-center justify-center shadow-medium">
                <GraduationCap className="w-10 h-10 text-white" />
              </div>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-foreground">Student Login</h2>
              <p className="text-muted-foreground mt-2">Enter your credentials to continue</p>
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rollNumber">Roll Number</Label>
              <Input
                id="rollNumber"
                type="text"
                placeholder="Enter your roll number"
                value={rollNumber}
                onChange={(e) => setRollNumber(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Student@123"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              size="lg"
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login"}
            </Button>
          </form>

          {/* Back Button */}
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => navigate("/login-selection")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Login Selection
          </Button>
        </div>
      </Card>
      </div>
    </div>
  );
};

export default StudentLogin;
