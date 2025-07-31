import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ImageUpload } from "@/components/ImageUpload";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { 
  User, 
  Lock, 
  Briefcase, 
  Users, 
  Bell, 
  Shield, 
  ExternalLink,
  Trash2,
  Save
} from "lucide-react";

const COUNTRIES = [
  'Afghanistan', 'Albania', 'Algeria', 'Argentina', 'Australia', 'Austria', 'Bahrain', 'Bangladesh',
  'Belgium', 'Bosnia and Herzegovina', 'Brazil', 'Brunei', 'Bulgaria', 'Canada', 'China',
  'Croatia', 'Denmark', 'Egypt', 'France', 'Germany', 'India', 'Indonesia', 'Iran', 'Iraq',
  'Ireland', 'Italy', 'Jordan', 'Kazakhstan', 'Kuwait', 'Lebanon', 'Libya', 'Malaysia',
  'Maldives', 'Morocco', 'Netherlands', 'Nigeria', 'Norway', 'Oman', 'Pakistan', 'Palestine',
  'Qatar', 'Russia', 'Saudi Arabia', 'Senegal', 'Somalia', 'South Africa', 'Spain', 'Sweden',
  'Switzerland', 'Syria', 'Tunisia', 'Turkey', 'UAE', 'United Kingdom', 'United States', 'Yemen'
];

const SECTORS = [
  'Technology', 'Finance & Banking', 'Healthcare & Medicine', 'Education', 'Engineering',
  'Marketing & Advertising', 'Consulting', 'Legal', 'Real Estate', 'Manufacturing',
  'Retail & E-commerce', 'Media & Entertainment', 'Non-profit', 'Government', 'Construction',
  'Transportation', 'Energy & Utilities', 'Agriculture', 'Hospitality & Tourism', 'Other'
];

const OCCUPATIONS = [
  'Software Engineer', 'Data Scientist', 'Product Manager', 'Marketing Manager', 'Financial Analyst',
  'Consultant', 'Doctor', 'Nurse', 'Teacher', 'Professor', 'Lawyer', 'Engineer',
  'Designer', 'Sales Manager', 'HR Manager', 'Business Analyst', 'Project Manager',
  'Entrepreneur', 'Researcher', 'Student', 'Other'
];

const Settings = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [professionalProfile, setProfessionalProfile] = useState<any>(null);
  
  // Form states
  const [profileData, setProfileData] = useState({
    full_name: '',
    email: '',
    phone: '',
    avatar_url: ''
  });

  const [professionalData, setProfessionalData] = useState({
    occupation: '',
    sector: '',
    university: '',
    city: '',
    country: '',
    bio: '',
    is_mentor: false,
    is_seeking_mentor: false,
    availability: ''
  });

  const [notificationSettings, setNotificationSettings] = useState({
    email_notifications: true,
    mentorship_notifications: true,
    message_notifications: true
  });

  const [privacySettings, setPrivacySettings] = useState({
    profile_visibility: 'public',
    allow_messages: 'all'
  });

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  const loadUserData = async () => {
    if (!user) return;

    try {
      // Load profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') throw profileError;

      // Load professional profile
      const { data: professionalData, error: professionalError } = await supabase
        .from('professional_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (professionalError && professionalError.code !== 'PGRST116') throw professionalError;

      setProfile(profileData);
      setProfessionalProfile(professionalData);

      if (profileData) {
        setProfileData({
          full_name: profileData.full_name || '',
          email: user.email || '',
          phone: '', // Add phone to profiles table if needed
          avatar_url: profileData.avatar_url || ''
        });
      }

      if (professionalData) {
        setProfessionalData({
          occupation: professionalData.occupation || '',
          sector: professionalData.sector || '',
          university: professionalData.university || '',
          city: professionalData.city || '',
          country: professionalData.country || '',
          bio: professionalData.bio || '',
          is_mentor: professionalData.is_mentor || false,
          is_seeking_mentor: professionalData.is_seeking_mentor || false,
          availability: professionalData.availability || ''
        });
      }
    } catch (error: any) {
      console.error('Error loading user data:', error);
      toast({
        title: "Error",
        description: "Failed to load your profile data.",
        variant: "destructive",
      });
    }
  };

  const updateProfile = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          full_name: profileData.full_name,
          avatar_url: profileData.avatar_url
        });

      if (error) throw error;

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateProfessionalProfile = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('professional_profiles')
        .upsert({
          user_id: user.id,
          ...professionalData
        });

      if (error) throw error;

      toast({
        title: "Professional profile updated",
        description: "Your professional profile has been updated successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast({
        title: "Password updated",
        description: "Your password has been changed successfully.",
      });
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteAccount = async () => {
    if (window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      setLoading(true);
      try {
        // Delete user data first
        await supabase.from('professional_profiles').delete().eq('user_id', user?.id);
        await supabase.from('profiles').delete().eq('user_id', user?.id);
        
        toast({
          title: "Account deletion requested",
          description: "Please contact support to complete account deletion.",
        });
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }
  };

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
              Manage your account, profile, and preferences.
            </p>
          </div>

          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="account" className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Account
              </TabsTrigger>
              <TabsTrigger value="professional" className="flex items-center gap-2">
                <Briefcase className="w-4 h-4" />
                Professional
              </TabsTrigger>
              <TabsTrigger value="mentorship" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Mentorship
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex items-center gap-2">
                <Bell className="w-4 h-4" />
                Notifications
              </TabsTrigger>
              <TabsTrigger value="privacy" className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Privacy
              </TabsTrigger>
            </TabsList>

            {/* Profile Settings */}
            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex justify-center">
                    <ImageUpload
                      currentImageUrl={profileData.avatar_url}
                      onImageChange={(url) => setProfileData(prev => ({ ...prev, avatar_url: url }))}
                      fallbackInitials={profileData.full_name ? profileData.full_name.charAt(0).toUpperCase() : '?'}
                      size="lg"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="full_name">Full Name</Label>
                      <Input
                        id="full_name"
                        value={profileData.full_name}
                        onChange={(e) => setProfileData(prev => ({ ...prev, full_name: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        value={profileData.email}
                        disabled
                        className="bg-muted"
                      />
                    </div>
                  </div>

                  <Button onClick={updateProfile} disabled={loading}>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Account Settings */}
            <TabsContent value="account">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Change Password</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="new_password">New Password</Label>
                      <Input
                        id="new_password"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="confirm_password">Confirm Password</Label>
                      <Input
                        id="confirm_password"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                    </div>
                    <Button onClick={changePassword} disabled={loading}>
                      Update Password
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Delete Account</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">
                      Once you delete your account, there is no going back. Please be certain.
                    </p>
                    <Button variant="destructive" onClick={deleteAccount} disabled={loading}>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Account
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Professional Settings */}
            <TabsContent value="professional">
              <Card>
                <CardHeader>
                  <CardTitle>Professional Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={professionalData.bio}
                      onChange={(e) => setProfessionalData(prev => ({ ...prev, bio: e.target.value }))}
                      rows={4}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Occupation</Label>
                      <Select 
                        value={professionalData.occupation} 
                        onValueChange={(value) => setProfessionalData(prev => ({ ...prev, occupation: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select occupation" />
                        </SelectTrigger>
                        <SelectContent>
                          {OCCUPATIONS.map(occupation => (
                            <SelectItem key={occupation} value={occupation}>{occupation}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Sector</Label>
                      <Select 
                        value={professionalData.sector} 
                        onValueChange={(value) => setProfessionalData(prev => ({ ...prev, sector: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select sector" />
                        </SelectTrigger>
                        <SelectContent>
                          {SECTORS.map(sector => (
                            <SelectItem key={sector} value={sector}>{sector}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={professionalData.city}
                        onChange={(e) => setProfessionalData(prev => ({ ...prev, city: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>Country</Label>
                      <Select 
                        value={professionalData.country} 
                        onValueChange={(value) => setProfessionalData(prev => ({ ...prev, country: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select country" />
                        </SelectTrigger>
                        <SelectContent>
                          {COUNTRIES.map(country => (
                            <SelectItem key={country} value={country}>{country}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button onClick={updateProfessionalProfile} disabled={loading}>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Mentorship Settings */}
            <TabsContent value="mentorship">
              <Card>
                <CardHeader>
                  <CardTitle>Mentorship Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="is_mentor">Available as Mentor</Label>
                      <p className="text-sm text-muted-foreground">Allow others to request mentorship from you</p>
                    </div>
                    <Switch
                      id="is_mentor"
                      checked={professionalData.is_mentor}
                      onCheckedChange={(checked) => setProfessionalData(prev => ({ ...prev, is_mentor: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="is_seeking_mentor">Looking for Mentor</Label>
                      <p className="text-sm text-muted-foreground">Show that you're seeking mentorship</p>
                    </div>
                    <Switch
                      id="is_seeking_mentor"
                      checked={professionalData.is_seeking_mentor}
                      onCheckedChange={(checked) => setProfessionalData(prev => ({ ...prev, is_seeking_mentor: checked }))}
                    />
                  </div>

                  {professionalData.is_mentor && (
                    <div>
                      <Label>Availability</Label>
                      <Select 
                        value={professionalData.availability} 
                        onValueChange={(value) => setProfessionalData(prev => ({ ...prev, availability: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select your availability" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="weekdays">Weekdays</SelectItem>
                          <SelectItem value="weekends">Weekends</SelectItem>
                          <SelectItem value="evenings">Evenings</SelectItem>
                          <SelectItem value="flexible">Flexible</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <Button onClick={updateProfessionalProfile} disabled={loading}>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Notification Settings */}
            <TabsContent value="notifications">
              <Card>
                <CardHeader>
                  <CardTitle>Notification Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="email_notifications">Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">Receive updates via email</p>
                    </div>
                    <Switch
                      id="email_notifications"
                      checked={notificationSettings.email_notifications}
                      onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, email_notifications: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="mentorship_notifications">Mentorship Notifications</Label>
                      <p className="text-sm text-muted-foreground">Get notified about mentorship requests and updates</p>
                    </div>
                    <Switch
                      id="mentorship_notifications"
                      checked={notificationSettings.mentorship_notifications}
                      onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, mentorship_notifications: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="message_notifications">Message Notifications</Label>
                      <p className="text-sm text-muted-foreground">Get notified about new messages</p>
                    </div>
                    <Switch
                      id="message_notifications"
                      checked={notificationSettings.message_notifications}
                      onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, message_notifications: checked }))}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Privacy Settings */}
            <TabsContent value="privacy">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Privacy Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <Label>Profile Visibility</Label>
                      <Select 
                        value={privacySettings.profile_visibility} 
                        onValueChange={(value) => setPrivacySettings(prev => ({ ...prev, profile_visibility: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="public">Public</SelectItem>
                          <SelectItem value="members_only">Members Only</SelectItem>
                          <SelectItem value="private">Private</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Who can message you</Label>
                      <Select 
                        value={privacySettings.allow_messages} 
                        onValueChange={(value) => setPrivacySettings(prev => ({ ...prev, allow_messages: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Everyone</SelectItem>
                          <SelectItem value="professionals_only">Professionals Only</SelectItem>
                          <SelectItem value="connections_only">Connections Only</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Legal & Support</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>Terms & Conditions</span>
                      <Button variant="outline" size="sm">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Privacy Policy</span>
                      <Button variant="outline" size="sm">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Contact Support</span>
                      <Button variant="outline" size="sm">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Contact
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Settings;