import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
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
import { SearchableMultiSelect } from "@/components/SearchableMultiSelect";
import { validateHttpUrl, validatePhoneNumber } from "@/lib/url-validation";

const LANGUAGES = [
  'Arabic', 'English', 'French', 'Spanish', 'German', 'Italian', 'Portuguese', 'Russian',
  'Chinese (Mandarin)', 'Japanese', 'Korean', 'Hindi', 'Urdu', 'Bengali', 'Turkish',
  'Persian/Farsi', 'Malay', 'Indonesian', 'Dutch', 'Swedish', 'Norwegian', 'Other'
];

const SKILLS_OPTIONS = [
  'Leadership', 'Project Management', 'Data Analysis', 'Machine Learning', 'Software Development',
  'Marketing', 'Sales', 'Customer Service', 'Financial Planning', 'Strategic Planning',
  'Public Speaking', 'Teaching', 'Research', 'Writing', 'Translation', 'Design',
  'Photography', 'Video Editing', 'Social Media', 'SEO/SEM', 'Consulting',
  'Business Development', 'Operations Management', 'Supply Chain', 'Quality Assurance',
  'Risk Management', 'Compliance', 'Legal Research', 'Contract Negotiation',
  'Event Planning', 'Team Management', 'Change Management', 'Process Improvement'
];

const COMMUNICATION_OPTIONS = [
  'in_app_messaging', 'email', 'phone', 'video_call', 'in_person'
];

const EditProfile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Profile data
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [bio, setBio] = useState('');
  const [gender, setGender] = useState('');
  const [country, setCountry] = useState('');
  const [stateProvince, setStateProvince] = useState('');
  const [city, setCity] = useState('');
  const [sector, setSector] = useState('');
  const [occupation, setOccupation] = useState('');
  const [university, setUniversity] = useState('');
  const [experienceYears, setExperienceYears] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);
  const [availability, setAvailability] = useState('');
  const [isMentor, setIsMentor] = useState(false);
  const [isSeekingMentor, setIsSeekingMentor] = useState(false);
  const [preferredCommunication, setPreferredCommunication] = useState<string[]>(['in_app_messaging']);
  const [website, setWebsite] = useState('');
  const [facebookUrl, setFacebookUrl] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [twitterUrl, setTwitterUrl] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [tiktokUrl, setTiktokUrl] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [telegramUrl, setTelegramUrl] = useState('');

  useEffect(() => {
    if (user) {
      checkUserTypeAndLoad();
    }
  }, [user]);

  const checkUserTypeAndLoad = async () => {
    // Check if user is a business account - if so, redirect to business dashboard
    const { data: profileData } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user?.id)
      .maybeSingle();

    if (profileData?.role === 'business') {
      navigate('/edit-business-profile');
      return;
    }

    loadProfile();
  };

  const loadProfile = async () => {
    try {
      // Load basic profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError;
      }

      if (profileData) {
        setFirstName(profileData.first_name || '');
        setLastName(profileData.last_name || '');
        setAvatarUrl(profileData.avatar_url || '');
      }

      // Load professional profile
      const { data: professionalData, error: professionalError } = await supabase
        .from('professional_profiles')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (professionalError && professionalError.code !== 'PGRST116') {
        throw professionalError;
      }

      if (professionalData) {
        setBio(professionalData.bio || '');
        setGender(professionalData.gender || '');
        setCountry(professionalData.country || '');
        setStateProvince(professionalData.state_province || '');
        setCity(professionalData.city || '');
        setSector(professionalData.sector || '');
        setOccupation(professionalData.occupation || '');
        setUniversity(professionalData.university || '');
        setExperienceYears(professionalData.experience_years?.toString() || '');
        setSkills(professionalData.skills || []);
        setLanguages(professionalData.languages || []);
        setAvailability(professionalData.availability || '');
        setIsMentor(professionalData.is_mentor || false);
        setIsSeekingMentor(professionalData.is_seeking_mentor || false);
        setPreferredCommunication(professionalData.preferred_communication || ['in_app_messaging']);
        setWebsite(professionalData.website || '');
        setFacebookUrl(professionalData.facebook_url || '');
        setInstagramUrl(professionalData.instagram_url || '');
        setLinkedinUrl(professionalData.linkedin_url || '');
        setTwitterUrl(professionalData.twitter_url || '');
        setYoutubeUrl(professionalData.youtube_url || '');
        setTiktokUrl(professionalData.tiktok_url || '');
        setWhatsappNumber(professionalData.whatsapp_number || '');
        setTelegramUrl(professionalData.telegram_url || '');
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      toast({
        title: "Error",
        description: "Failed to load profile data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      // Update basic profile
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert(
          {
            user_id: user.id,
            first_name: firstName,
            last_name: lastName,
            avatar_url: avatarUrl,
            first_login: false,
          },
          { onConflict: 'user_id' }
        );

      if (profileError) throw profileError;

      // Update professional profile
      const { error: professionalError } = await supabase
        .from('professional_profiles')
        .upsert(
          {
            user_id: user.id,
            bio,
            gender,
            country,
            state_province: stateProvince,
            city,
            sector,
            occupation,
            university,
            experience_years: experienceYears ? parseInt(experienceYears) : null,
            skills,
            languages,
            availability,
            is_mentor: isMentor,
            is_seeking_mentor: isSeekingMentor,
            preferred_communication: preferredCommunication,
            website,
            facebook_url: facebookUrl || null,
            instagram_url: instagramUrl || null,
            linkedin_url: linkedinUrl || null,
            twitter_url: twitterUrl || null,
            youtube_url: youtubeUrl || null,
            tiktok_url: tiktokUrl || null,
            whatsapp_number: whatsappNumber || null,
            telegram_url: telegramUrl || null,
          },
          { onConflict: 'user_id' }
        );

      if (professionalError) throw professionalError;

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });

      navigate(`/profile/${user.id}`);
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: "Error",
        description: "Failed to save profile changes.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSectorChange = (newSector: string) => {
    setSector(newSector);
    // Reset occupation when sector changes
    if (occupation) {
      setOccupation('');
    }
  };

  const handleCountryChange = (newCountry: string) => {
    setCountry(newCountry);
    // Reset state and city when country changes
    setStateProvince('');
    setCity('');
  };

  const handleStateProvinceChange = (newState: string) => {
    setStateProvince(newState);
    // Reset city when state changes
    setCity('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Edit Profile</h1>
            <p className="text-muted-foreground">
              Update your professional information and preferences.
            </p>
          </div>

          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Profile Picture */}
              <div>
                <Label className="text-base font-medium">Profile Picture</Label>
                <div className="mt-2">
                  <ImageUpload
                    currentImageUrl={avatarUrl}
                    onImageChange={setAvatarUrl}
                    fallbackInitials={`${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()}
                    size="lg"
                  />
                </div>
              </div>

              {/* Personal Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Enter your first name"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Enter your last name"
                  />
                </div>
              </div>

              {/* Bio */}
              <div>
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us about yourself..."
                  rows={4}
                />
              </div>

              {/* Gender */}
              <div>
                <Label htmlFor="gender">Gender</Label>
                <select
                  id="gender"
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full p-2 border border-input rounded-md"
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>

              {/* Location */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Location</h3>
                <div>
                  <Label>Country</Label>
                  <CountrySelect
                    value={country}
                    onValueChange={handleCountryChange}
                    placeholder="Select your country"
                  />
                </div>
                <div>
                  <Label>State/Province</Label>
                  <StateProvinceSelect
                    value={stateProvince}
                    onValueChange={handleStateProvinceChange}
                    country={country}
                    placeholder="Select your state/province"
                  />
                </div>
                <div>
                  <Label>City</Label>
                  <CitySelect
                    value={city}
                    onValueChange={setCity}
                    country={country}
                    stateProvince={stateProvince}
                    placeholder="Select your city"
                  />
                </div>
              </div>

              {/* Professional Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Professional Information</h3>
                <div>
                  <Label>Sector</Label>
                  <SectorSelect
                    value={sector}
                    onValueChange={handleSectorChange}
                    placeholder="Select your sector"
                  />
                </div>
                <div>
                  <Label>Occupation</Label>
                  <OccupationSelect
                    value={occupation}
                    onValueChange={setOccupation}
                    sector={sector}
                    placeholder="Select your occupation"
                  />
                </div>
                <div>
                  <Label>University/School</Label>
                  <UniversitySelect
                    value={university}
                    onValueChange={setUniversity}
                    placeholder="Select your university"
                  />
                </div>
                <div>
                  <Label htmlFor="experienceYears">Years of Experience</Label>
                  <Input
                    id="experienceYears"
                    type="number"
                    value={experienceYears}
                    onChange={(e) => setExperienceYears(e.target.value)}
                    placeholder="e.g., 5"
                    min="0"
                  />
                </div>
              </div>

              {/* Skills */}
              <div>
                <Label>Skills</Label>
                <SearchableMultiSelect
                  options={SKILLS_OPTIONS}
                  value={skills}
                  onValueChange={setSkills}
                  placeholder="Select your skills"
                />
              </div>

              {/* Languages */}
              <div>
                <Label>Languages</Label>
                <SearchableMultiSelect
                  options={LANGUAGES}
                  value={languages}
                  onValueChange={setLanguages}
                  placeholder="Select languages you speak"
                />
              </div>
              {/* Social Links */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Social Links</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="website">Website</Label>
                    <Input id="website" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://..." />
                  </div>
                  <div>
                    <Label htmlFor="facebook">Facebook URL</Label>
                    <Input id="facebook" value={facebookUrl} onChange={(e) => setFacebookUrl(e.target.value)} placeholder="https://facebook.com/yourpage" />
                  </div>
                  <div>
                    <Label htmlFor="instagram">Instagram URL</Label>
                    <Input id="instagram" value={instagramUrl} onChange={(e) => setInstagramUrl(e.target.value)} placeholder="https://instagram.com/yourhandle" />
                  </div>
                  <div>
                    <Label htmlFor="linkedin">LinkedIn URL</Label>
                    <Input id="linkedin" value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} placeholder="https://linkedin.com/in/yourprofile" />
                  </div>
                  <div>
                    <Label htmlFor="twitter">X (Twitter) URL</Label>
                    <Input id="twitter" value={twitterUrl} onChange={(e) => setTwitterUrl(e.target.value)} placeholder="https://x.com/yourhandle" />
                  </div>
                  <div>
                    <Label htmlFor="youtube">YouTube URL</Label>
                    <Input id="youtube" value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)} placeholder="https://youtube.com/@yourchannel" />
                  </div>
                  <div>
                    <Label htmlFor="tiktok">TikTok URL</Label>
                    <Input id="tiktok" value={tiktokUrl} onChange={(e) => setTiktokUrl(e.target.value)} placeholder="https://tiktok.com/@yourhandle" />
                  </div>
                  <div>
                    <Label htmlFor="whatsapp">WhatsApp Number</Label>
                    <Input id="whatsapp" value={whatsappNumber} onChange={(e) => setWhatsappNumber(e.target.value)} placeholder="+1 555 555 5555" />
                  </div>
                  <div>
                    <Label htmlFor="telegram">Telegram URL</Label>
                    <Input id="telegram" value={telegramUrl} onChange={(e) => setTelegramUrl(e.target.value)} placeholder="https://t.me/yourhandle" />
                  </div>
                </div>
              </div>

              {/* Mentorship */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Mentorship</h3>
                <div className="flex flex-col space-y-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={isMentor}
                      onChange={(e) => setIsMentor(e.target.checked)}
                      className="rounded"
                    />
                    <span>I want to be a mentor</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={isSeekingMentor}
                      onChange={(e) => setIsSeekingMentor(e.target.checked)}
                      className="rounded"
                    />
                    <span>I am seeking a mentor</span>
                  </label>
                </div>
                {(isMentor || isSeekingMentor) && (
                  <div>
                    <Label>Availability</Label>
                    <AvailabilitySelect
                      value={availability}
                      onValueChange={setAvailability}
                      placeholder="Select your availability"
                    />
                  </div>
                )}
              </div>

              {/* Communication Preferences */}
              <div>
                <Label>Preferred Communication Methods</Label>
                <div className="mt-2 space-y-2">
                  {COMMUNICATION_OPTIONS.map((method) => (
                    <label key={method} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={preferredCommunication.includes(method)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setPreferredCommunication([...preferredCommunication, method]);
                          } else {
                            setPreferredCommunication(preferredCommunication.filter(m => m !== method));
                          }
                        }}
                        className="rounded"
                      />
                      <span className="capitalize">
                        {method.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end space-x-4 pt-6">
                <Button 
                  variant="outline" 
                  onClick={() => navigate(`/profile/${user?.id}`)}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default EditProfile;