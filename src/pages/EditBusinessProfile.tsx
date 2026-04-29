import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
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
  SectorSelect 
} from "@/components/EnhancedFormDropdowns";
import { SearchableMultiSelect } from "@/components/SearchableMultiSelect";
import { Building2 } from "lucide-react";
import { validateHttpUrl, validatePhoneNumber } from "@/lib/url-validation";

const LANGUAGES = [
  'Arabic', 'English', 'French', 'Spanish', 'German', 'Italian', 'Portuguese', 'Russian',
  'Chinese (Mandarin)', 'Japanese', 'Korean', 'Hindi', 'Urdu', 'Bengali', 'Turkish',
  'Persian/Farsi', 'Malay', 'Indonesian', 'Dutch', 'Swedish', 'Norwegian', 'Other'
];

const EditBusinessProfile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [accountId, setAccountId] = useState<string | null>(null);
  
  // Business profile data
  const [name, setName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [bio, setBio] = useState('');
  const [services, setServices] = useState('');
  const [sector, setSector] = useState('');
  const [country, setCountry] = useState('');
  const [state, setState] = useState('');
  const [city, setCity] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [bookingUrl, setBookingUrl] = useState('');
  const [languages, setLanguages] = useState<string[]>([]);
  
  // Social links
  const [facebookUrl, setFacebookUrl] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [twitterUrl, setTwitterUrl] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [tiktokUrl, setTiktokUrl] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [telegramUrl, setTelegramUrl] = useState('');

  useEffect(() => {
    document.title = 'Edit Business Profile – Muslim Professionals Network';
  }, []);

  useEffect(() => {
    if (user) {
      loadBusinessProfile();
    }
  }, [user]);

  const loadBusinessProfile = async () => {
    try {
      // Check if user has a business account
      const { data: businessData, error: businessError } = await supabase
        .from('business_accounts')
        .select('*')
        .eq('owner_id', user?.id)
        .maybeSingle();

      if (businessError && businessError.code !== 'PGRST116') {
        throw businessError;
      }

      if (!businessData) {
        // No business account - redirect to business dashboard to create one
        toast({
          title: "No business profile found",
          description: "Please create a business profile first.",
          variant: "destructive",
        });
        navigate('/dashboard/business');
        return;
      }

      // Load business data
      setAccountId(businessData.id);
      setName(businessData.name || '');
      setLogoUrl(businessData.logo_url || '');
      setBio(businessData.bio || '');
      setServices(businessData.services || '');
      setSector(businessData.sector || '');
      setCountry(businessData.country || '');
      setState(businessData.state || '');
      setCity(businessData.city || '');
      setEmail(businessData.email || '');
      setPhone(businessData.phone || '');
      setWebsite(businessData.website || '');
      setBookingUrl(businessData.booking_url || '');
      setLanguages(businessData.languages || []);
      setFacebookUrl(businessData.facebook_url || '');
      setInstagramUrl(businessData.instagram_url || '');
      setLinkedinUrl(businessData.linkedin_url || '');
      setTwitterUrl(businessData.twitter_url || '');
      setYoutubeUrl(businessData.youtube_url || '');
      setTiktokUrl(businessData.tiktok_url || '');
      setWhatsappNumber(businessData.whatsapp_number || '');
      setTelegramUrl(businessData.telegram_url || '');
    } catch (error) {
      console.error('Error loading business profile:', error);
      toast({
        title: "Error",
        description: "Failed to load business profile data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user || !accountId) return;

    setSaving(true);
    try {
      const urlFields: Array<[string, string, (v: string) => void]> = [
        ['Website', website, setWebsite],
        ['Booking URL', bookingUrl, setBookingUrl],
        ['Facebook', facebookUrl, setFacebookUrl],
        ['Instagram', instagramUrl, setInstagramUrl],
        ['LinkedIn', linkedinUrl, setLinkedinUrl],
        ['X (Twitter)', twitterUrl, setTwitterUrl],
        ['YouTube', youtubeUrl, setYoutubeUrl],
        ['TikTok', tiktokUrl, setTiktokUrl],
        ['Telegram', telegramUrl, setTelegramUrl],
      ];
      const sanitized: Record<string, string> = {};
      for (const [label, value, setter] of urlFields) {
        const r = validateHttpUrl(value);
        if (!r.isValid) {
          toast({ title: `${label} URL invalid`, description: r.error, variant: 'destructive' });
          setSaving(false);
          return;
        }
        sanitized[label] = r.sanitized;
        if (r.sanitized !== value) setter(r.sanitized);
      }
      const phoneRes = validatePhoneNumber(phone);
      if (!phoneRes.isValid) {
        toast({ title: 'Phone number invalid', description: phoneRes.error, variant: 'destructive' });
        setSaving(false);
        return;
      }
      const waRes = validatePhoneNumber(whatsappNumber);
      if (!waRes.isValid) {
        toast({ title: 'WhatsApp number invalid', description: waRes.error, variant: 'destructive' });
        setSaving(false);
        return;
      }

      const { error } = await supabase
        .from('business_accounts')
        .update({
          name: name || null,
          logo_url: logoUrl || null,
          bio: bio || null,
          services: services || null,
          sector: sector || null,
          country: country || null,
          state: state || null,
          city: city || null,
          email: email || null,
          phone: phoneRes.sanitized || null,
          website: sanitized['Website'] || null,
          booking_url: sanitized['Booking URL'] || null,
          languages: languages.length > 0 ? languages : null,
          facebook_url: sanitized['Facebook'] || null,
          instagram_url: sanitized['Instagram'] || null,
          linkedin_url: sanitized['LinkedIn'] || null,
          twitter_url: sanitized['X (Twitter)'] || null,
          youtube_url: sanitized['YouTube'] || null,
          tiktok_url: sanitized['TikTok'] || null,
          whatsapp_number: waRes.sanitized || null,
          telegram_url: sanitized['Telegram'] || null,
          status: 'published', // Auto-publish when saving
        })
        .eq('id', accountId);

      if (error) throw error;

      toast({
        title: "Profile updated",
        description: "Your business profile has been updated successfully.",
      });

      navigate(`/business/${accountId}`);
    } catch (error) {
      console.error('Error saving business profile:', error);
      toast({
        title: "Error",
        description: "Failed to save business profile changes.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCountryChange = (newCountry: string) => {
    setCountry(newCountry);
    setState('');
    setCity('');
  };

  const handleStateChange = (newState: string) => {
    setState(newState);
    setCity('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading business profile...</p>
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
            <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
              <Building2 className="w-8 h-8" />
              Edit Business Profile
            </h1>
            <p className="text-muted-foreground">
              Update your business information to help others find you.
            </p>
          </div>

          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Business Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Business Logo */}
              <div>
                <Label className="text-base font-medium">Business Logo</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Upload your business logo to help people recognize your brand.
                </p>
                <div className="mt-2">
                  <ImageUpload
                    currentImageUrl={logoUrl}
                    onImageChange={setLogoUrl}
                    fallbackInitials={name ? name.substring(0, 2).toUpperCase() : 'BZ'}
                    size="lg"
                  />
                </div>
              </div>

              {/* Business Name */}
              <div>
                <Label htmlFor="businessName">Business Name *</Label>
                <Input
                  id="businessName"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your business name"
                />
              </div>

              {/* About/Bio */}
              <div>
                <Label htmlFor="bio">About Your Business</Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell people about your business, mission, and what makes you unique..."
                  rows={4}
                />
              </div>

              {/* Sector */}
              <div>
                <Label>Industry/Sector</Label>
                <SectorSelect
                  value={sector}
                  onValueChange={setSector}
                  placeholder="Select your industry"
                />
              </div>

              {/* Services */}
              <div>
                <Label htmlFor="services">Services Offered</Label>
                <Textarea
                  id="services"
                  value={services}
                  onChange={(e) => setServices(e.target.value)}
                  placeholder="List the services your business provides..."
                  rows={3}
                />
              </div>

              {/* Languages */}
              <div>
                <Label>Languages Spoken</Label>
                <SearchableMultiSelect
                  options={LANGUAGES}
                  value={languages}
                  onValueChange={setLanguages}
                  placeholder="Select languages your business operates in"
                />
              </div>

              {/* Location */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-t pt-4">Location</h3>
                <div>
                  <Label>Country</Label>
                  <CountrySelect
                    value={country}
                    onValueChange={handleCountryChange}
                    placeholder="Select country"
                  />
                </div>
                <div>
                  <Label>State/Province</Label>
                  <StateProvinceSelect
                    value={state}
                    onValueChange={handleStateChange}
                    country={country}
                    placeholder="Select state/province"
                  />
                </div>
                <div>
                  <Label>City</Label>
                  <CitySelect
                    value={city}
                    onValueChange={setCity}
                    country={country}
                    stateProvince={state}
                    placeholder="Select city"
                  />
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-t pt-4">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Business Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="contact@yourbusiness.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://www.yourbusiness.com"
                  />
                </div>
                <div>
                  <Label htmlFor="bookingUrl">Booking/Appointment URL</Label>
                  <Input
                    id="bookingUrl"
                    value={bookingUrl}
                    onChange={(e) => setBookingUrl(e.target.value)}
                    placeholder="https://calendly.com/yourbusiness"
                  />
                </div>
              </div>

              {/* Social Links */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-t pt-4">Social Links</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="facebook">Facebook</Label>
                    <Input
                      id="facebook"
                      value={facebookUrl}
                      onChange={(e) => setFacebookUrl(e.target.value)}
                      placeholder="https://facebook.com/yourbusiness"
                    />
                  </div>
                  <div>
                    <Label htmlFor="instagram">Instagram</Label>
                    <Input
                      id="instagram"
                      value={instagramUrl}
                      onChange={(e) => setInstagramUrl(e.target.value)}
                      placeholder="https://instagram.com/yourbusiness"
                    />
                  </div>
                  <div>
                    <Label htmlFor="linkedin">LinkedIn</Label>
                    <Input
                      id="linkedin"
                      value={linkedinUrl}
                      onChange={(e) => setLinkedinUrl(e.target.value)}
                      placeholder="https://linkedin.com/company/yourbusiness"
                    />
                  </div>
                  <div>
                    <Label htmlFor="twitter">X (Twitter)</Label>
                    <Input
                      id="twitter"
                      value={twitterUrl}
                      onChange={(e) => setTwitterUrl(e.target.value)}
                      placeholder="https://x.com/yourbusiness"
                    />
                  </div>
                  <div>
                    <Label htmlFor="youtube">YouTube</Label>
                    <Input
                      id="youtube"
                      value={youtubeUrl}
                      onChange={(e) => setYoutubeUrl(e.target.value)}
                      placeholder="https://youtube.com/@yourbusiness"
                    />
                  </div>
                  <div>
                    <Label htmlFor="tiktok">TikTok</Label>
                    <Input
                      id="tiktok"
                      value={tiktokUrl}
                      onChange={(e) => setTiktokUrl(e.target.value)}
                      placeholder="https://tiktok.com/@yourbusiness"
                    />
                  </div>
                  <div>
                    <Label htmlFor="whatsapp">WhatsApp</Label>
                    <Input
                      id="whatsapp"
                      value={whatsappNumber}
                      onChange={(e) => setWhatsappNumber(e.target.value)}
                      placeholder="+1 555 123 4567"
                    />
                  </div>
                  <div>
                    <Label htmlFor="telegram">Telegram</Label>
                    <Input
                      id="telegram"
                      value={telegramUrl}
                      onChange={(e) => setTelegramUrl(e.target.value)}
                      placeholder="https://t.me/yourbusiness"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t">
                <Button
                  onClick={handleSave}
                  disabled={saving || !name}
                  className="flex-1"
                  variant="accent"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
                {accountId && (
                  <Button asChild variant="outline" className="flex-1">
                    <Link to={`/business/${accountId}`}>View Public Profile</Link>
                  </Button>
                )}
                <Button asChild variant="ghost" className="flex-1">
                  <Link to="/dashboard/business">Cancel</Link>
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

export default EditBusinessProfile;
