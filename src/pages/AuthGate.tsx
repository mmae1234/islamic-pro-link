import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, Search, MessageCircle, Heart, ArrowLeft } from "lucide-react";
import AuthForm from "@/components/AuthForm";
import { RoleSelection, type AccountType } from "@/components/RoleSelection";

const AuthGate = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState("signup");
  const [signupStep, setSignupStep] = useState<"auth" | "role">("auth");
  const [selectedRole, setSelectedRole] = useState<AccountType>("visitor");
  
  const redirect = searchParams.get('redirect') || '/dashboard';

  // Redirect authenticated users to their intended destination
  useEffect(() => {
    if (!loading && user) {
      navigate(redirect, { replace: true });
    }
  }, [user, loading, navigate, redirect]);

  const toggleMode = () => {
    setActiveTab(activeTab === "signup" ? "login" : "signup");
    setSignupStep("auth"); // Reset signup step when switching tabs
  };

  const handleRoleSubmit = (role: AccountType) => {
    setSelectedRole(role);
    setSignupStep("role");
  };

  const handleBackToAuth = () => {
    setSignupStep("auth");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      {/* Back Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate(-1)}
        className="absolute top-4 left-4 flex items-center gap-2"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </Button>
      
      <div className="w-full max-w-4xl grid lg:grid-cols-2 gap-8 items-center">
        
        {/* Left side - Benefits */}
        <div className="space-y-8 text-center lg:text-left">
          <div className="space-y-4">
            <h1 className="text-4xl lg:text-5xl font-bold text-foreground">
              Create a free account to search professionals
            </h1>
            <p className="text-xl text-muted-foreground">
              Join Muslim Pros to connect with professionals in your field and grow your network.
            </p>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <Search className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Search & Discover</h3>
                <p className="text-muted-foreground">Find professionals by location, industry, skills, and more</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <MessageCircle className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Connect & Message</h3>
                <p className="text-muted-foreground">Send messages and build meaningful professional relationships</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <Heart className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Save Favorites</h3>
                <p className="text-muted-foreground">Keep track of professionals you want to connect with later</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Auth Forms */}
        <div className="w-full">
          <Card className="shadow-elegant">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-primary-foreground font-bold text-2xl">MP</span>
              </div>
              <CardTitle className="text-2xl font-bold">
                Get Started
              </CardTitle>
              <CardDescription>
                Join thousands of Muslim professionals
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="signup">Sign Up</TabsTrigger>
                  <TabsTrigger value="login">Log In</TabsTrigger>
                </TabsList>
                
                <TabsContent value="signup" className="mt-6">
                  {signupStep === "auth" ? (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-center">First, choose your account type</h3>
                      <RoleSelection 
                        defaultValue={selectedRole}
                        onSubmit={handleRoleSubmit}
                      />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <AuthForm 
                        mode="signup" 
                        selectedRole={selectedRole}
                        onToggleMode={toggleMode}
                      />
                      <Button 
                        variant="outline" 
                        onClick={handleBackToAuth}
                        className="w-full"
                      >
                        ← Back to account type
                      </Button>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="login" className="mt-6">
                  <AuthForm mode="login" onToggleMode={toggleMode} />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AuthGate;