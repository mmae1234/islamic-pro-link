import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { 
  CountrySelect, 
  StateSelect, 
  CitySelect,
  UniversitySelect, 
  SectorSelect, 
  OccupationSelect, 
  AvailabilitySelect 
} from "@/components/EnhancedFormDropdowns";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Loader2, Save, User, Briefcase, Users, X } from "lucide-react";

const Dashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [professionalProfile, setProfessionalProfile] = useState<any>(null);

  // Form states
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("professional");
  const [gender, setGender] = useState("");
  const [country, setCountry] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [stateProvince, setStateProvince] = useState("");
  const [stateCode, setStateCode] = useState("");
  const [city, setCity] = useState("");

  // Reset dependent fields when parent selections change
  useEffect(() => {
    if (stateProvince) {
      setCity(""); // Reset city when state/province changes
    }
  }, [stateProvince]);

  useEffect(() => {
    if (country) {
      setStateProvince(""); // Reset state/province when country changes
      setCity(""); // Reset city when country changes
    }
  }, [country]);

  const [sector, setSector] = useState("");
  
  // Reset occupation when sector changes
  useEffect(() => {
    if (sector) {
      setOccupation(""); // Reset occupation when sector changes
    }
  }, [sector]);
  const [occupation, setOccupation] = useState("");
  const [university, setUniversity] = useState("");
  const [bio, setBio] = useState("");
  const [experienceYears, setExperienceYears] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [availability, setAvailability] = useState("");
  const [isMentor, setIsMentor] = useState(false);
  const [isSeekingMentor, setIsSeekingMentor] = useState(false);
  const [preferredCommunication, setPreferredCommunication] = useState<string[]>(["in_app_messaging"]);

  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  const loadUserData = async () => {
    try {
      // Load profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error loading profile:', profileError);
      } else if (profileData) {
        setProfile(profileData);
        setFullName(`${profileData.first_name || ''} ${profileData.last_name || ''}`.trim());
        setRole(profileData.role || 'professional');
      }

      // Load professional profile
      const { data: professionalData, error: professionalError } = await supabase
        .from('professional_profiles')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (professionalError && professionalError.code !== 'PGRST116') {
        console.error('Error loading professional profile:', professionalError);
      } else if (professionalData) {
        setProfessionalProfile(professionalData);
        setGender(professionalData.gender || '');
        setCountry(professionalData.country || '');
        setStateProvince(professionalData.state_province || '');
        setCity(professionalData.city || '');
        setSector(professionalData.sector || '');
        setOccupation(professionalData.occupation || '');
        setUniversity(professionalData.university || '');
        setBio(professionalData.bio || '');
        setExperienceYears(professionalData.experience_years?.toString() || '');
        setSkills(professionalData.skills || []);
        setAvailability(professionalData.availability || '');
        setIsMentor(professionalData.is_mentor || false);
        setIsSeekingMentor(professionalData.is_seeking_mentor || false);
        setPreferredCommunication(professionalData.preferred_communication || ["in_app_messaging"]);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      // Split full name into first and last names
      const names = fullName.trim().split(' ');
      const firstName = names[0] || '';
      const lastName = names.slice(1).join(' ') || '';

      // Save basic profile
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          first_name: firstName,
          last_name: lastName,
          role: role as any,
        }, {
          onConflict: 'user_id'
        });

      if (profileError) throw profileError;

      // Save professional profile if fields are filled
      if (country && city && sector && occupation) {
        const { error: professionalError } = await supabase
          .from('professional_profiles')
          .upsert({
            user_id: user.id,
            first_name: firstName,
            last_name: lastName,
            gender: gender || null,
            country,
            state_province: stateProvince,
            city,
            sector,
            occupation,
            university,
            bio,
            experience_years: experienceYears ? parseInt(experienceYears) : null,
            skills,
            availability,
            is_mentor: isMentor,
            is_seeking_mentor: isSeekingMentor,
            preferred_communication: preferredCommunication,
          }, {
            onConflict: 'user_id'
          });

        if (professionalError) throw professionalError;
      }

      toast({
        title: "Profile saved!",
        description: "Your profile has been updated successfully.",
      });

      await loadUserData();
      
      // Redirect to profile page
      if (professionalProfile || (country && city && sector && occupation)) {
        navigate(`/profile/${user.id}`);
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: "Error",
        description: "Failed to save profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
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
              Dashboard
            </h1>
            <p className="text-lg text-muted-foreground">
              Welcome back! Manage your profile and connect with other professionals.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Profile Forms */}
            <div className="lg:col-span-2 space-y-8">
              {/* Basic Profile */}
              <Card className="shadow-soft">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Basic Profile
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Enter your full name"
                    />
                  </div>
                  
                  <div>
                    <Label>Role</Label>
                    <Select value={role} onValueChange={setRole}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="visitor">Visitor (Service Seeker)</SelectItem>
                        <SelectItem value="professional">Professional</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Professional Profile */}
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
                      <Label>Gender</Label>
                      <Select value={gender} onValueChange={setGender}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label>Country</Label>
                      <CountrySelect 
                        value={country} 
                        onValueChange={(countryName, code) => {
                          setCountry(countryName);
                          setCountryCode(code);
                          // Reset dependent fields
                          setStateProvince("");
                          setStateCode("");
                          setCity("");
                        }} 
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>State/Province</Label>
                      <StateSelect 
                        countryCode={countryCode}
                        value={stateProvince} 
                        onValueChange={(value, code) => {
                          setStateProvince(value);
                          setStateCode(code);
                          // Reset city when state changes
                          setCity("");
                        }}
                      />
                    </div>
                    
                    <div>
                      <Label>City</Label>
                      <CitySelect 
                        countryCode={countryCode}
                        stateCode={stateCode}
                        value={city} 
                        onValueChange={setCity}
                      />
                    </div>
                  </div>

                  <div>
                    <Label>University</Label>
                    <UniversitySelect value={university} onValueChange={setUniversity} />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>Sector</Label>
                      <SectorSelect value={sector} onValueChange={setSector} />
                    </div>
                    
                    <div>
                      <Label>Occupation</Label>
                      <OccupationSelect 
                        value={occupation} 
                        onValueChange={setOccupation}
                        sector={sector}
                        disabled={!sector}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="experienceYears">Years of Experience</Label>
                    <Input
                      id="experienceYears"
                      type="number"
                      min="0"
                      value={experienceYears}
                      onChange={(e) => setExperienceYears(e.target.value)}
                      placeholder="Enter years of experience"
                    />
                  </div>

                  <div>
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Tell us about yourself and your professional background..."
                      rows={4}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Mentorship Preferences - Only show for professionals */}
              {role === 'professional' && (
                <Card className="shadow-soft">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      Mentorship & Skills
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                  {/* Skills */}
                  <div>
                    <Label htmlFor="skills">Skills (Press Enter to add)</Label>
                    <div className="space-y-2">
                      <Input
                        id="skills"
                        placeholder="e.g., JavaScript, Leadership, Marketing"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const value = e.currentTarget.value.trim();
                            if (value && !skills.includes(value)) {
                              setSkills([...skills, value]);
                              e.currentTarget.value = '';
                            }
                          }
                        }}
                      />
                      {skills.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {skills.map((skill, index) => (
                            <Badge key={index} variant="secondary" className="flex items-center gap-1">
                              {skill}
                              <X 
                                className="w-3 h-3 cursor-pointer" 
                                onClick={() => setSkills(skills.filter((_, i) => i !== index))}
                              />
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Availability */}
                  <div>
                    <Label>Availability</Label>
                    <AvailabilitySelect value={availability} onValueChange={setAvailability} />
                  </div>

                  {/* Mentorship Preferences */}
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="is_mentor"
                        checked={isMentor}
                        onCheckedChange={(checked) => setIsMentor(checked === true)}
                      />
                      <Label htmlFor="is_mentor">I'm available as a mentor</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="is_seeking_mentor"
                        checked={isSeekingMentor}
                        onCheckedChange={(checked) => setIsSeekingMentor(checked === true)}
                      />
                      <Label htmlFor="is_seeking_mentor">I'm seeking a mentor</Label>
                    </div>
                  </div>

                  {/* Preferred Communication */}
                  <div>
                    <Label>Preferred Communication Methods</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {[
                        { value: "in_app_messaging", label: "In-app Messaging" },
                        { value: "video_calls", label: "Video Calls" },
                        { value: "phone_calls", label: "Phone Calls" },
                        { value: "in_person", label: "In Person" }
                      ].map((method) => (
                        <div key={method.value} className="flex items-center space-x-2">
                          <Checkbox
                            id={method.value}
                            checked={preferredCommunication.includes(method.value)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setPreferredCommunication([...preferredCommunication, method.value]);
                              } else {
                                setPreferredCommunication(
                                  preferredCommunication.filter(m => m !== method.value)
                                );
                              }
                            }}
                          />
                          <Label htmlFor={method.value} className="text-sm">{method.label}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  </CardContent>
                </Card>
              )}

              <Button onClick={saveProfile} disabled={saving} variant="hero" size="lg">
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Profile
                  </>
                )}
              </Button>
            </div>

            {/* Profile Summary */}
            <div className="space-y-6">
              <Card className="shadow-soft">
                <CardHeader>
                  <CardTitle>Profile Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center">
                        <span className="text-primary-foreground font-semibold">
                          {fullName.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{fullName || 'Your Name'}</p>
                        <p className="text-sm text-muted-foreground">{user?.email}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Badge variant="secondary">{role}</Badge>
                      {sector && <Badge variant="outline">{sector}</Badge>}
                      {country && <Badge variant="outline">{country}</Badge>}
                    </div>

                    {bio && (
                      <div>
                        <Label className="text-sm font-medium">Bio</Label>
                        <p className="text-sm text-muted-foreground mt-1">{bio}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-soft">
                <CardHeader>
                  <CardTitle>Profile Completion</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Profile Completion</span>
                      <span>
                        {Math.round(
                          ((fullName ? 1 : 0) +
                          (country ? 1 : 0) +
                          (city ? 1 : 0) +
                          (sector ? 1 : 0) +
                          (occupation ? 1 : 0) +
                          (bio ? 1 : 0)) / 6 * 100
                        )}%
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-gradient-primary h-2 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${Math.round(
                            ((fullName ? 1 : 0) +
                            (country ? 1 : 0) +
                            (city ? 1 : 0) +
                            (sector ? 1 : 0) +
                            (occupation ? 1 : 0) +
                            (bio ? 1 : 0)) / 6 * 100
                          )}%` 
                        }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Dashboard;