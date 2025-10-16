import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GraduationCap, Users, Shield } from "lucide-react";
import attendoLogo from "@/assets/attendo-logo.png";

const LoginSelection = () => {
  const navigate = useNavigate();

  const loginOptions = [
    {
      title: "Student Login",
      description: "View your attendance and academic progress",
      icon: GraduationCap,
      path: "/student-login",
      gradient: "gradient-primary"
    },
    {
      title: "Faculty Login",
      description: "Manage attendance and class schedules",
      icon: Users,
      path: "/faculty-login",
      gradient: "gradient-secondary"
    },
    {
      title: "Admin Login",
      description: "Full system administration and management",
      icon: Shield,
      path: "/admin-login",
      gradient: "gradient-accent"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl space-y-8 animate-in fade-in slide-in-from-bottom duration-700">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center mb-4">
            <img src={attendoLogo} alt="Attendo" className="w-20 h-20" />
          </div>
          <h1 className="text-4xl font-bold text-foreground">Welcome to Attendo</h1>
          <p className="text-lg text-muted-foreground">Choose your login portal to continue</p>
        </div>

        {/* Login Options */}
        <div className="grid md:grid-cols-3 gap-6">
          {loginOptions.map((option, index) => (
            <Card 
              key={option.title}
              className="group relative overflow-hidden border-2 hover:border-primary transition-smooth cursor-pointer shadow-soft hover:shadow-medium"
              style={{ animationDelay: `${index * 100}ms` }}
              onClick={() => navigate(option.path)}
            >
              <div className={`absolute inset-0 ${option.gradient} opacity-0 group-hover:opacity-10 transition-smooth`}></div>
              
              <div className="relative p-8 space-y-6">
                <div className={`w-16 h-16 ${option.gradient} rounded-2xl flex items-center justify-center shadow-medium transition-bounce group-hover:scale-110`}>
                  <option.icon className="w-8 h-8 text-white" />
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-foreground group-hover:text-primary transition-smooth">
                    {option.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {option.description}
                  </p>
                </div>

                <Button 
                  className="w-full group-hover:scale-105 transition-bounce"
                  size="lg"
                >
                  Login
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground">
          <p>© 2025 Attendo. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default LoginSelection;
