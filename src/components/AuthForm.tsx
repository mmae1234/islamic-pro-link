import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { validateEmail, validateName } from "@/lib/security";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, Mail, Lock, User, CheckCircle, Building2, Phone, Globe } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getErrorMessage } from "@/lib/errors";
 
 interface AuthFormProps {
   mode: 'login' | 'signup';
   onToggleMode: () => void;
   selectedRole?: import("@/components/RoleSelection").AccountType;
   values?: Partial<{
     email: string;
     password: string;
     firstName: string;
     lastName: string;
     businessName: string;
     phone: string;
     website: string;
   }>;
   onValuesChange?: (values: Partial<{ email: string; password: string; firstName: string; lastName: string; businessName: string; phone: string; website: string }>) => void;
 }

const AuthForm = ({ mode, onToggleMode, selectedRole, values, onValuesChange }: AuthFormProps) => {
  const [email, setEmail] = useState(values?.email ?? "");
  const [password, setPassword] = useState(values?.password ?? "");
  const [firstName, setFirstName] = useState(values?.firstName ?? "");
  const [lastName, setLastName] = useState(values?.lastName ?? "");
  const [businessName, setBusinessName] = useState(values?.businessName ?? "");
  const [phone, setPhone] = useState(values?.phone ?? "");
  const [website, setWebsite] = useState(values?.website ?? "");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Sync values from parent when provided
useEffect(() => {
  if (values) {
    if (values.email !== undefined) setEmail(values.email);
    if (values.password !== undefined) setPassword(values.password);
    if (values.firstName !== undefined) setFirstName(values.firstName);
    if (values.lastName !== undefined) setLastName(values.lastName);
    if (values.businessName !== undefined) setBusinessName(values.businessName);
    if (values.phone !== undefined) setPhone(values.phone);
    if (values.website !== undefined) setWebsite(values.website);
  }
}, [values]);

  const update = (field: keyof NonNullable<AuthFormProps['values']>, value: string) => {
    switch (field) {
      case 'email': setEmail(value); break;
      case 'password': setPassword(value); break;
      case 'firstName': setFirstName(value); break;
      case 'lastName': setLastName(value); break;
      case 'businessName': setBusinessName(value); break;
      case 'phone': setPhone(value); break;
      case 'website': setWebsite(value); break;
    }
    onValuesChange?.({ [field]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    // Validate inputs
    const emailValidation = validateEmail(email);
    const errors: Record<string, string> = {};
    
    if (!emailValidation.isValid) {
      errors.email = emailValidation.error!;
    }
    
    if (mode === 'signup') {
      if (selectedRole === 'business') {
        if (!businessName.trim()) {
          errors.businessName = 'Business name is required';
        }
      } else {
        const firstNameValidation = validateName(firstName);
        if (!firstNameValidation.isValid) {
          errors.firstName = firstNameValidation.error!;
        }
        const lastNameValidation = validateName(lastName);
        if (!lastNameValidation.isValid) {
          errors.lastName = lastNameValidation.error!;
        }
      }
      if (password.length < 8) {
        errors.password = 'Password must be at least 8 characters long';
      }
    }
    
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }
    
    setValidationErrors({});
    setLoading(true);
    try {
      if (mode === 'signup') {
        if (selectedRole === 'business') {
          await signUp(emailValidation.sanitized, password, "", "", selectedRole);
        } else {
          const firstNameValidation = validateName(firstName);
          const lastNameValidation = validateName(lastName);
          await signUp(emailValidation.sanitized, password, firstNameValidation.sanitized, lastNameValidation.sanitized, selectedRole);
        }
        setSignupSuccess(true);
      } else {
        await signIn(emailValidation.sanitized, password);
        try {
          const { data: userData } = await supabase.auth.getUser();
          const uid = userData.user?.id;
          if (uid) {
            const { data: profileRes } = await supabase
              .from('profiles')
              .select('first_login')
              .eq('user_id', uid)
              .maybeSingle();

            const isFirstLogin = profileRes?.first_login ?? true;
            if (isFirstLogin) {
              navigate('/edit-profile', { replace: true });
            } else {
              navigate('/dashboard', { replace: true });
            }
          } else {
            navigate('/dashboard', { replace: true });
          }
        } catch {
          navigate('/dashboard', { replace: true });
        }
      }
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
      <Card className="w-full max-w-md shadow-elegant">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-primary-foreground font-bold text-2xl">MP</span>
          </div>
          <CardTitle className="text-2xl font-bold">
            {mode === 'login' ? 'Welcome Back' : 'Join Muslim Pros'}
          </CardTitle>
          <CardDescription>
            {mode === 'login' 
              ? 'Sign in to your account to continue' 
              : 'Create your account to start networking'}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {mode === 'signup' && signupSuccess ? (
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-success/15 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-success" />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-foreground">Check Your Email</h3>
                <p className="text-muted-foreground">
                  A confirmation email has been sent to <strong>{email}</strong>. 
                  Please check your inbox to complete your registration.
                </p>
              </div>
              <div className="pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSignupSuccess(false);
                    onToggleMode();
                  }}
                  className="w-full"
                >
                  Back to Sign In
                </Button>
              </div>
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === 'signup' && (
                  <>
                    {selectedRole === 'business' ? (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="businessName">Business Name</Label>
                          <div className="relative">
                            <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="businessName"
                              type="text"
                              placeholder="Enter your business name"
                              value={businessName}
                              onChange={(e) => update('businessName', e.target.value)}
                              className={`pl-9 ${validationErrors.businessName ? 'border-destructive' : ''}`}
                              maxLength={100}
                              required
                            />
                          </div>
                          {validationErrors.businessName && (
                            <p className="text-sm text-destructive">{validationErrors.businessName}</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone (optional)</Label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="phone"
                              type="tel"
                              placeholder="Business phone"
                              value={phone}
                              onChange={(e) => update('phone', e.target.value)}
                              className="pl-9"
                              maxLength={30}
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="website">Website (optional)</Label>
                          <div className="relative">
                            <Globe className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="website"
                              type="text"
                              placeholder="https://example.com"
                              value={website}
                              onChange={(e) => update('website', e.target.value)}
                              className="pl-9"
                              maxLength={100}
                            />
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="firstName">First Name</Label>
                          <div className="relative">
                            <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="firstName"
                              type="text"
                              placeholder="Enter your first name"
                              value={firstName}
                              onChange={(e) => update('firstName', e.target.value)}
                              className={`pl-9 ${validationErrors.firstName ? 'border-destructive' : ''}`}
                              maxLength={50}
                              required
                            />
                          </div>
                          {validationErrors.firstName && (
                            <p className="text-sm text-destructive">{validationErrors.firstName}</p>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="lastName">Last Name</Label>
                          <div className="relative">
                            <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="lastName"
                              type="text"
                              placeholder="Enter your last name"
                              value={lastName}
                              onChange={(e) => update('lastName', e.target.value)}
                              className={`pl-9 ${validationErrors.lastName ? 'border-destructive' : ''}`}
                              maxLength={50}
                              required
                            />
                          </div>
                          {validationErrors.lastName && (
                            <p className="text-sm text-destructive">{validationErrors.lastName}</p>
                          )}
                        </div>
                      </>
                    )}
                  </>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => update('email', e.target.value)}
                      className={`pl-9 ${validationErrors.email ? 'border-destructive' : ''}`}
                      required
                    />
                  </div>
                  {validationErrors.email && (
                    <p className="text-sm text-destructive">{validationErrors.email}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder={mode === 'signup' ? "Enter your password (min 8 characters)" : "Enter your password"}
                      value={password}
                      onChange={(e) => update('password', e.target.value)}
                      className={`pl-9 pr-9 ${validationErrors.password ? 'border-destructive' : ''}`}
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1 h-8 w-8 p-0"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  {validationErrors.password && (
                    <p className="text-sm text-destructive">{validationErrors.password}</p>
                  )}
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  variant="hero"
                  disabled={loading}
                >
                  {loading ? 'Processing...' : mode === 'login' ? 'Sign In' : 'Create Account'}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground">
                  {mode === 'login' 
                    ? "Don't have an account? " 
                    : "Already have an account? "}
                  <Button 
                    variant="link" 
                    className="p-0 text-primary"
                    onClick={onToggleMode}
                  >
                    {mode === 'login' ? 'Sign up' : 'Sign in'}
                  </Button>
                </p>
              </div>

              {mode === 'login' && (
                <div className="mt-4 text-center">
                  <Link to="/forgot-password">
                    <Button variant="link" className="p-0 text-sm text-muted-foreground">
                      Forgot your password?
                    </Button>
                  </Link>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
  );
};

export default AuthForm;