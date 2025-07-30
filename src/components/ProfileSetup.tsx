import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ImageUpload } from '@/components/ImageUpload';
import { CheckCircle, Plus, X, User, Briefcase, MessageSquare, Calendar } from 'lucide-react';

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

interface ProfileSetupProps {
  onComplete: () => void;
}

const ProfileSetup = ({ onComplete }: ProfileSetupProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Profile data state
  const [profileData, setProfileData] = useState({
    full_name: '',
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

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const [newSkill, setNewSkill] = useState('');

  const addSkill = (skill: string) => {
    if (skill && !profileData.skills.includes(skill)) {
      setProfileData(prev => ({
        ...prev,
        skills: [...prev.skills, skill]
      }));
      setNewSkill('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setProfileData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }));
  };

  const handleCommunicationChange = (commId: string, checked: boolean) => {
    if (checked) {
      setProfileData(prev => ({
        ...prev,
        preferred_communication: [...prev.preferred_communication, commId]
      }));
    } else {
      setProfileData(prev => ({
        ...prev,
        preferred_communication: prev.preferred_communication.filter(id => id !== commId)
      }));
    }
  };

  const saveProfile = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Save to profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          full_name: profileData.full_name,
          role: profileData.occupation,
          avatar_url: avatarUrl
        });

      if (profileError) throw profileError;

      // Save to professional_profiles table
      const { error: professionalError } = await supabase
        .from('professional_profiles')
        .upsert({
          user_id: user.id,
          bio: profileData.bio,
          occupation: profileData.occupation,
          sector: profileData.sector,
          university: profileData.university,
          city: profileData.city,
          country: profileData.country,
          experience_years: profileData.experience_years ? parseInt(profileData.experience_years) : null,
          skills: profileData.skills,
          availability: profileData.availability,
          is_mentor: profileData.is_mentor,
          is_seeking_mentor: profileData.is_seeking_mentor,
          preferred_communication: profileData.preferred_communication,
          avatar_url: avatarUrl
        });

      if (professionalError) throw professionalError;

      toast({
        title: "Profile created successfully!",
        description: "Your professional profile is now complete.",
      });

      onComplete();
    } catch (error: any) {
      toast({
        title: "Error saving profile",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(prev => prev + 1);
    } else {
      saveProfile();
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const isStepComplete = () => {
    switch (currentStep) {
      case 1:
        return profileData.full_name && profileData.bio;
      case 2:
        return profileData.occupation && profileData.sector;
      case 3:
        return profileData.skills.length > 0;
      case 4:
        return profileData.preferred_communication.length > 0;
      default:
        return false;
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <User className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold">Personal Information</h3>
              <p className="text-muted-foreground">Tell us about yourself</p>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-center mb-6">
                <ImageUpload
                  currentImageUrl={avatarUrl}
                  onImageChange={setAvatarUrl}
                  fallbackInitials={profileData.full_name ? profileData.full_name.charAt(0).toUpperCase() : '?'}
                  size="lg"
                />
              </div>

              <div>
                <Label htmlFor="full_name">Full Name *</Label>
                <Input
                  id="full_name"
                  value={profileData.full_name}
                  onChange={(e) => setProfileData(prev => ({ ...prev, full_name: e.target.value }))}
                  placeholder="Enter your full name"
                />
              </div>
              
              <div>
                <Label htmlFor="bio">Bio *</Label>
                <Textarea
                  id="bio"
                  value={profileData.bio}
                  onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="Tell us about yourself, your goals, and what you're looking for..."
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={profileData.city}
                    onChange={(e) => setProfileData(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="City"
                  />
                </div>
                <div>
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={profileData.country}
                    onChange={(e) => setProfileData(prev => ({ ...prev, country: e.target.value }))}
                    placeholder="Country"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <Briefcase className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold">Professional Details</h3>
              <p className="text-muted-foreground">Your career information</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="occupation">Current Role *</Label>
                <Input
                  id="occupation"
                  value={profileData.occupation}
                  onChange={(e) => setProfileData(prev => ({ ...prev, occupation: e.target.value }))}
                  placeholder="e.g., Software Engineer, Marketing Manager"
                />
              </div>
              
              <div>
                <Label htmlFor="sector">Industry Sector *</Label>
                <Select value={profileData.sector} onValueChange={(value) => setProfileData(prev => ({ ...prev, sector: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your industry" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Technology">Technology</SelectItem>
                    <SelectItem value="Finance">Finance</SelectItem>
                    <SelectItem value="Healthcare">Healthcare</SelectItem>
                    <SelectItem value="Education">Education</SelectItem>
                    <SelectItem value="Marketing">Marketing</SelectItem>
                    <SelectItem value="Engineering">Engineering</SelectItem>
                    <SelectItem value="Consulting">Consulting</SelectItem>
                    <SelectItem value="Legal">Legal</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="university">University/Education</Label>
                  <Input
                    id="university"
                    value={profileData.university}
                    onChange={(e) => setProfileData(prev => ({ ...prev, university: e.target.value }))}
                    placeholder="Your university or education"
                  />
                </div>
                <div>
                  <Label htmlFor="experience_years">Years of Experience</Label>
                  <Input
                    id="experience_years"
                    type="number"
                    value={profileData.experience_years}
                    onChange={(e) => setProfileData(prev => ({ ...prev, experience_years: e.target.value }))}
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <CheckCircle className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold">Skills & Mentorship</h3>
              <p className="text-muted-foreground">Your expertise and goals</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label>Skills *</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    placeholder="Add a skill..."
                    onKeyPress={(e) => e.key === 'Enter' && addSkill(newSkill)}
                  />
                  <Button onClick={() => addSkill(newSkill)} size="sm">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  {SKILLS_OPTIONS.map(skill => (
                    <Badge
                      key={skill}
                      variant={profileData.skills.includes(skill) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => addSkill(skill)}
                    >
                      {skill}
                    </Badge>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  {profileData.skills.map(skill => (
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

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_mentor"
                    checked={profileData.is_mentor}
                    onCheckedChange={(checked) => setProfileData(prev => ({ ...prev, is_mentor: checked as boolean }))}
                  />
                  <Label htmlFor="is_mentor">I want to be a mentor</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_seeking_mentor"
                    checked={profileData.is_seeking_mentor}
                    onCheckedChange={(checked) => setProfileData(prev => ({ ...prev, is_seeking_mentor: checked as boolean }))}
                  />
                  <Label htmlFor="is_seeking_mentor">I'm looking for a mentor</Label>
                </div>
              </div>

              <div>
                <Label htmlFor="availability">Availability</Label>
                <Select value={profileData.availability} onValueChange={(value) => setProfileData(prev => ({ ...prev, availability: value }))}>
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
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <MessageSquare className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold">Communication Preferences</h3>
              <p className="text-muted-foreground">How would you like to connect?</p>
            </div>
            
            <div className="space-y-4">
              <Label>Preferred Communication Methods *</Label>
              {COMMUNICATION_OPTIONS.map(option => (
                <div key={option.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={option.id}
                    checked={profileData.preferred_communication.includes(option.id)}
                    onCheckedChange={(checked) => handleCommunicationChange(option.id, checked as boolean)}
                  />
                  <Label htmlFor={option.id}>{option.label}</Label>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-center">Complete Your Profile</CardTitle>
          <div className="flex justify-center space-x-2 mt-4">
            {[1, 2, 3, 4].map(step => (
              <div
                key={step}
                className={`w-3 h-3 rounded-full ${
                  step <= currentStep ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>
          <p className="text-center text-sm text-muted-foreground">
            Step {currentStep} of 4
          </p>
        </CardHeader>
        
        <CardContent>
          {renderStep()}
          
          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
            >
              Previous
            </Button>
            
            <Button
              onClick={nextStep}
              disabled={!isStepComplete() || loading}
            >
              {loading ? 'Saving...' : (currentStep === 4 ? 'Complete Profile' : 'Next')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileSetup;