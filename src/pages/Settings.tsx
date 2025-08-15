import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { validateBio, validateName, validateSkill } from "@/lib/security";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { ImageUpload } from "@/components/ImageUpload";
import { 
  CountrySelect, 
  StateProvinceSelect, 
  CitySelect,
  UniversitySelect, 
  SectorSelect, 
  OccupationSelect, 
  AvailabilitySelect 
} from "@/components/EnhancedFormDropdowns";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MessagingPrivacySettings from "@/components/MessagingPrivacySettings";
import { User, Briefcase, Users, X, Loader2, Shield, Bell, Settings as SettingsIcon, Mail, Phone } from "lucide-react";

const SKILLS_OPTIONS = [
  'JavaScript', 'Python', 'React', 'Node.js', 'SQL', 'Machine Learning', 'Digital Marketing',
  'Project Management', 'Data Analysis', 'UI/UX Design', 'Cloud Computing', 'Finance',
  'Healthcare', 'Education', 'Consulting', 'Sales', 'HR', 'Legal', 'Engineering'
];

const COMMUNICATION_OPTIONS = [
  { id: 'in_app_messaging', label: 'In-App Messaging' },
  { id: 'email', label: 'Email' },
  { id: 'video_call', label: 'Video Call' },
  { id: 'phone', label: 'Phone Call' }
];

const Settings = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deleting, setDeleting] = useState(false);

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    role: 'professional',
    bio: '',
    occupation: '',
    sector: '',
    university: '',
    city: '',
    country: '',
    state_province: '',
    experience_years: '',
    skills: [] as string[],
    availability: '',
    is_mentor: false,
    is_seeking_mentor: false,
    preferred_communication: ['in_app_messaging'] as string[]
  });

  const [newSkill, setNewSkill] = useState('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user) {
      loadUserProfile();
    }
  }, [user]);

  const loadUserProfile = async () => {
    if (!user) return;

    try {
      // Load basic profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      // Load professional profile
      const { data: professionalData } = await supabase
        .from('professional_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileData) {
        setFormData(prev => ({
          ...prev,
          first_name: profileData.first_name || '',
          last_name: profileData.last_name || '',
          role: profileData.role || 'professional'
        }));
        setAvatarUrl(profileData.avatar_url);
      }

      if (professionalData) {
        setFormData(prev => ({
          ...prev,
          bio: professionalData.bio || '',
          occupation: professionalData.occupation || '',
          sector: professionalData.sector || '',
          university: professionalData.university || '',
          city: professionalData.city || '',
          country: professionalData.country || '',
          state_province: professionalData.state_province || '',
          experience_years: professionalData.experience_years?.toString() || '',
          skills: professionalData.skills || [],
          availability: professionalData.availability || '',
          is_mentor: professionalData.is_mentor || false,
          is_seeking_mentor: professionalData.is_seeking_mentor || false,
          preferred_communication: professionalData.preferred_communication || ['in_app_messaging']
        }));
        setAvatarUrl(professionalData.avatar_url || avatarUrl);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    if (!user) return;
    
    // Validate all inputs before saving
    const firstNameValidation = validateName(formData.first_name);
    const lastNameValidation = validateName(formData.last_name);
    const bioValidation = validateBio(formData.bio);
    
    const errors: Record<string, string> = {};
    if (!firstNameValidation.isValid) errors.first_name = firstNameValidation.error!;
    if (!lastNameValidation.isValid) errors.last_name = lastNameValidation.error!;
    if (!bioValidation.isValid) errors.bio = bioValidation.error!;
    
    // Validate all skills
    for (const skill of formData.skills) {
      const skillValidation = validateSkill(skill);
      if (!skillValidation.isValid) {
        errors.skills = `Invalid skill: ${skill} - ${skillValidation.error}`;
        break;
      }
    }
    
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      toast({
        title: "Validation Error",
        description: "Please fix the errors in your profile before saving.",
        variant: "destructive",
      });
      return;
    }
    
    setValidationErrors({});
    setSaving(true);
    try {
      // Save basic profile with sanitized data
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          first_name: firstNameValidation.sanitized,
          last_name: lastNameValidation.sanitized,
          role: formData.role,
          avatar_url: avatarUrl
        }, {
          onConflict: 'user_id'
        });

      if (profileError) throw profileError;

      // Save professional profile if user is professional
      if (formData.role === 'professional') {
        const { error: professionalError } = await supabase
          .from('professional_profiles')
          .upsert({
            user_id: user.id,
            bio: bioValidation.sanitized,
            occupation: formData.occupation,
            sector: formData.sector,
            university: formData.university,
            city: formData.city,
            country: formData.country,
            state_province: formData.state_province,
            experience_years: formData.experience_years ? parseInt(formData.experience_years) : null,
            skills: formData.skills.map(skill => validateSkill(skill).sanitized),
            availability: formData.availability,
            is_mentor: formData.is_mentor,
            is_seeking_mentor: formData.is_seeking_mentor,
            preferred_communication: formData.preferred_communication,
            avatar_url: avatarUrl
          }, {
            onConflict: 'user_id'
          });

        if (professionalError) throw professionalError;
      }

      toast({
        title: "Profile updated!",
        description: "Your profile has been updated successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save profile.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const addSkill = (skill: string) => {
    if (!skill) return;
    
    const skillValidation = validateSkill(skill);
    if (!skillValidation.isValid) {
      setValidationErrors(prev => ({
        ...prev,
        newSkill: skillValidation.error!
      }));
      return;
    }
    
    if (!formData.skills.includes(skillValidation.sanitized)) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, skillValidation.sanitized]
      }));
      setNewSkill('');
      setValidationErrors(prev => {
        const { newSkill, ...rest } = prev;
        return rest;
      });
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }));
  };

  const handleCommunicationChange = (commId: string, checked: boolean) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        preferred_communication: [...prev.preferred_communication, commId]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        preferred_communication: prev.preferred_communication.filter(id => id !== commId)
      }));
    }
  };

  const handleDeleteAccount = async () => {
    if (!user || deleteConfirmation !== 'delete') return;
    
    setDeleting(true);
    try {
      // Get the current session to pass the JWT token
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('No valid session found');
      }

      // Call the Edge Function to properly delete the user account
      const response = await fetch(`https://zhtfygjxnyxqsmeoipst.supabase.co/functions/v1/delete-user-account`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete account');
      }
      
      toast({
        title: "Account deleted",
        description: "Your account and all data have been permanently deleted.",
      });
      
      // Sign out after successful deletion
      signOut();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete account.",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
      setDeleteConfirmation('');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Settings
            </h1>
            <p className="text-lg text-muted-foreground">
              Manage your profile and account preferences.
            </p>
          </div>

            <Tabs defaultValue="privacy" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="privacy">Privacy</TabsTrigger>
              <TabsTrigger value="account">Account</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
            </TabsList>

            <TabsContent value="account" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <SettingsIcon className="w-5 h-5" />
                    Account Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4">
                    <div>
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={user?.email || ''}
                        disabled
                        className="bg-muted"
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        Contact support to change your email address
                      </p>
                    </div>
                    
                    <div>
                      <Label htmlFor="account_type">Account Type</Label>
                      <Select value={formData.role} onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="professional">Professional</SelectItem>
                          <SelectItem value="business">Business</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <Button onClick={saveProfile} disabled={saving}>
                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Update Account
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-destructive">Danger Zone</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium">Delete Account</h4>
                      <p className="text-sm text-muted-foreground">
                        Permanently delete your account and all associated data. This action cannot be undone.
                      </p>
                    </div>
                    <Button
                      variant="destructive"
                      onClick={() => setShowDeleteDialog(true)}
                    >
                      Delete Account
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="w-5 h-5" />
                    Email Notifications
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="email-messages">Message Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive email notifications for new messages
                        </p>
                      </div>
                      <Switch id="email-messages" />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="email-mentorship">Mentorship Updates</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive email notifications for mentorship requests and updates
                        </p>
                      </div>
                      <Switch id="email-mentorship" />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="email-profile">Profile Views</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive email notifications when someone views your profile
                        </p>
                      </div>
                      <Switch id="email-profile" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Phone className="w-5 h-5" />
                    Communication Preferences
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="sms-notifications">SMS Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive SMS notifications for urgent messages
                        </p>
                      </div>
                      <Switch id="sms-notifications" />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="marketing-emails">Marketing Emails</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive updates about new features and platform news
                        </p>
                      </div>
                      <Switch id="marketing-emails" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="privacy">
              <div className="space-y-6">
                <MessagingPrivacySettings />
                
                <Card>
                  <CardHeader>
                    <CardTitle>Profile Privacy</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">Additional privacy settings coming soon...</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />

      {/* Delete Account Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Account</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your account and remove all your data from our servers.
              <br /><br />
              Type "delete" in the box below to confirm.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="my-4">
            <Input
              placeholder="Type 'delete' to confirm"
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={deleteConfirmation !== 'delete' || deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? 'Deleting...' : 'Delete Account'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Settings;