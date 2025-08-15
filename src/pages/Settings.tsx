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

  const [accountSettings, setAccountSettings] = useState({
    email: user?.email || '',
    phone: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    mentorshipUpdates: true,
    messageNotifications: true,
    newsAndUpdates: false
  });

  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: 'public' // public, members_only, private
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

          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="account">Account</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="privacy">Privacy</TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-8">
            {!user && (
              <Card className="shadow-soft">
                <CardHeader>
                  <CardTitle>Get Started</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Create a professional account to build your profile and get discovered.
                  </p>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <Button
                      variant="accent"
                      onClick={() => window.location.assign('/signup?role=professional')}
                    >
                      Upgrade to Professional
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Basic Profile */}
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Basic Profile
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="first_name">First Name</Label>
                    <Input
                      id="first_name"
                      value={formData.first_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                      placeholder="Enter your first name"
                      className={validationErrors.first_name ? 'border-destructive' : ''}
                    />
                    {validationErrors.first_name && (
                      <p className="text-sm text-destructive mt-1">{validationErrors.first_name}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="last_name">Last Name</Label>
                    <Input
                      id="last_name"
                      value={formData.last_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                      placeholder="Enter your last name"
                      className={validationErrors.last_name ? 'border-destructive' : ''}
                    />
                    {validationErrors.last_name && (
                      <p className="text-sm text-destructive mt-1">{validationErrors.last_name}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Account Settings */}
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <SettingsIcon className="w-5 h-5" />
                  Account Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={accountSettings.email}
                      onChange={(e) => setAccountSettings(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="your@email.com"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={accountSettings.phone}
                      onChange={(e) => setAccountSettings(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={accountSettings.newPassword}
                      onChange={(e) => setAccountSettings(prev => ({ ...prev, newPassword: e.target.value }))}
                      placeholder="Enter new password"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={accountSettings.confirmPassword}
                      onChange={(e) => setAccountSettings(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      placeholder="Confirm new password"
                    />
                  </div>
                </div>

                <Button variant="outline" size="sm">
                  Update Account Settings
                </Button>
              </CardContent>
            </Card>

            {/* Notification Settings */}
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Notification Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4 h-4" />
                      <Label htmlFor="emailNotifications">Email Notifications</Label>
                    </div>
                    <Checkbox
                      id="emailNotifications"
                      checked={notificationSettings.emailNotifications}
                      onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, emailNotifications: checked as boolean }))}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4" />
                      <Label htmlFor="mentorshipUpdates">Mentorship Updates</Label>
                    </div>
                    <Checkbox
                      id="mentorshipUpdates"
                      checked={notificationSettings.mentorshipUpdates}
                      onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, mentorshipUpdates: checked as boolean }))}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4 h-4" />
                      <Label htmlFor="messageNotifications">Message Notifications</Label>
                    </div>
                    <Checkbox
                      id="messageNotifications"
                      checked={notificationSettings.messageNotifications}
                      onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, messageNotifications: checked as boolean }))}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Bell className="w-4 h-4" />
                      <Label htmlFor="newsAndUpdates">News & Updates</Label>
                    </div>
                    <Checkbox
                      id="newsAndUpdates"
                      checked={notificationSettings.newsAndUpdates}
                      onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, newsAndUpdates: checked as boolean }))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Privacy Settings */}
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Privacy Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Profile Visibility</Label>
                  <Select 
                    value={privacySettings.profileVisibility} 
                    onValueChange={(value) => setPrivacySettings(prev => ({ ...prev, profileVisibility: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Public - Anyone can view</SelectItem>
                      <SelectItem value="members_only">Members Only - Only registered users</SelectItem>
                      <SelectItem value="private">Private - Only visible to you</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card className="shadow-soft">
              <CardContent className="pt-6">
                <div className="flex gap-4">
                  <Button onClick={saveProfile} disabled={saving}>
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={() => setShowDeleteDialog(true)}
                  >
                    Delete Account
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

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

      <Footer />
            </TabsContent>

            <TabsContent value="account">
              <Card>
                <CardHeader>
                  <CardTitle>Account Settings</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Account settings coming soon...</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications">
              <Card>
                <CardHeader>
                  <CardTitle>Notification Settings</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Notification settings coming soon...</p>
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
  );
};

export default Settings;