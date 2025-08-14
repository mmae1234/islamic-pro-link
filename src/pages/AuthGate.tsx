import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, Search, MessageCircle, Heart } from "lucide-react";
import AuthForm from "@/components/AuthForm";

const AuthGate = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState("signup");
  
  const redirect = searchParams.get('redirect') || '/dashboard';

  // Redirect authenticated users to their intended destination
  useEffect(() => {
    if (!loading && user) {
      navigate(redirect, { replace: true });
    }
  }, [user, loading, navigate, redirect]);

  const toggleMode = () => {
    setActiveTab(activeTab === "signup" ? "login" : "signup");
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
                  <AuthForm mode="signup" onToggleMode={toggleMode} />
                </TabsContent>
                
                <TabsContent value="login" className="mt-6">
                  <AuthForm mode="login" onToggleMode={toggleMode} />
                </TabsContent>
              </Tabs>
              
              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground">
                  {activeTab === "signup" 
                    ? "Already have an account? " 
                    : "Don't have an account? "}
                  <Button 
                    variant="link" 
                    className="p-0 text-primary h-auto"
                    onClick={toggleMode}
                  >
                    {activeTab === "signup" ? "Log in" : "Sign up"}
                  </Button>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AuthGate;