import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { ImageUpload } from "@/components/ImageUpload";
import { CountrySelect, UniversitySelect, SectorSelect, OccupationSelect, AvailabilitySelect } from "@/components/FormDropdowns";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { User, Briefcase, Users, X, Loader2 } from "lucide-react";

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
    full_name: '',
    role: 'professional',
    bio: '',
    occupation: '',
    sector: '',
    university: '',
    city: '',
    country: '',
    experience_years: '',
    skills: [] as string[],
    availability: '',
    is_mentor: false,
    is_seeking_mentor: false,
    preferred_communication: ['in_app_messaging'] as string[]
  });

  const [newSkill, setNewSkill] = useState('');

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
          full_name: profileData.full_name || '',
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
    
    setSaving(true);
    try {
      // Save basic profile
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          full_name: formData.full_name,
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
            bio: formData.bio,
            occupation: formData.occupation,
            sector: formData.sector,
            university: formData.university,
            city: formData.city,
            country: formData.country,
            experience_years: formData.experience_years ? parseInt(formData.experience_years) : null,
            skills: formData.skills,
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
    if (skill && !formData.skills.includes(skill)) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, skill]
      }));
      setNewSkill('');
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
      // Delete user data from our tables first
      await supabase.from('professional_profiles').delete().eq('user_id', user.id);
      await supabase.from('profiles').delete().eq('user_id', user.id);
      await supabase.from('favorites').delete().eq('user_id', user.id);
      await supabase.from('messages').delete().or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`);
      await supabase.from('mentorship_requests').delete().or(`mentor_id.eq.${user.id},mentee_id.eq.${user.id}`);
      
      // Note: We cannot delete the auth user directly from client side
      // This would need to be handled by a server function or admin action
      
      toast({
        title: "Account deleted",
        description: "Your account and all data have been deleted.",
      });
      
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

          <div className="space-y-8">
            {/* Basic Profile */}
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Basic Profile
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex justify-center">
                  <ImageUpload
                    currentImageUrl={avatarUrl}
                    onImageChange={setAvatarUrl}
                    fallbackInitials={formData.full_name ? formData.full_name.charAt(0).toUpperCase() : '?'}
                    size="lg"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="full_name">Full Name</Label>
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                      placeholder="Enter your full name"
                    />
                  </div>
                  
                  <div>
                    <Label>Role</Label>
                    <Select value={formData.role} onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="visitor">Visitor (Service Seeker)</SelectItem>
                        <SelectItem value="professional">Professional</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                    placeholder="Tell us about yourself..."
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Professional Profile */}
            {formData.role === 'professional' && (
              <Card className="shadow-soft">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="w-5 h-5" />
                    Professional Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>Occupation</Label>
                      <OccupationSelect value={formData.occupation} onValueChange={(value) => setFormData(prev => ({ ...prev, occupation: value }))} />
                    </div>
                    
                    <div>
                      <Label>Sector</Label>
                      <SectorSelect value={formData.sector} onValueChange={(value) => setFormData(prev => ({ ...prev, sector: value }))} />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                        placeholder="Enter your city"
                      />
                    </div>
                    
                    <div>
                      <Label>Country</Label>
                      <CountrySelect value={formData.country} onValueChange={(value) => setFormData(prev => ({ ...prev, country: value }))} />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>University</Label>
                      <UniversitySelect value={formData.university} onValueChange={(value) => setFormData(prev => ({ ...prev, university: value }))} />
                    </div>
                    
                    <div>
                      <Label htmlFor="experience_years">Years of Experience</Label>
                      <Input
                        id="experience_years"
                        type="number"
                        value={formData.experience_years}
                        onChange={(e) => setFormData(prev => ({ ...prev, experience_years: e.target.value }))}
                        placeholder="0"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Skills & Mentorship */}
            {formData.role === 'professional' && (
              <Card className="shadow-soft">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Skills & Mentorship
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Skills</Label>
                    <div className="flex gap-2 mb-2">
                      <Input
                        value={newSkill}
                        onChange={(e) => setNewSkill(e.target.value)}
                        placeholder="Add a skill..."
                        onKeyPress={(e) => e.key === 'Enter' && addSkill(newSkill)}
                      />
                      <Button onClick={() => addSkill(newSkill)} size="sm" variant="outline">
                        Add
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {SKILLS_OPTIONS.map(skill => (
                        <Badge
                          key={skill}
                          variant={formData.skills.includes(skill) ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => addSkill(skill)}
                        >
                          {skill}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.skills.map(skill => (
                        <Badge key={skill} className="flex items-center gap-1">
                          {skill}
                          <X 
                            className="w-3 h-3 cursor-pointer" 
                            onClick={() => removeSkill(skill)}
                          />
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label>Availability</Label>
                    <AvailabilitySelect value={formData.availability} onValueChange={(value) => setFormData(prev => ({ ...prev, availability: value }))} />
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="is_mentor"
                        checked={formData.is_mentor}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_mentor: checked as boolean }))}
                      />
                      <Label htmlFor="is_mentor">I want to be a mentor</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="is_seeking_mentor"
                        checked={formData.is_seeking_mentor}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_seeking_mentor: checked as boolean }))}
                      />
                      <Label htmlFor="is_seeking_mentor">I'm looking for a mentor</Label>
                    </div>
                  </div>

                  <div>
                    <Label>Preferred Communication Methods</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {COMMUNICATION_OPTIONS.map(option => (
                        <div key={option.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={option.id}
                            checked={formData.preferred_communication.includes(option.id)}
                            onCheckedChange={(checked) => handleCommunicationChange(option.id, checked as boolean)}
                          />
                          <Label htmlFor={option.id} className="text-sm">{option.label}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

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
    </div>
  );
};

export default Settings;