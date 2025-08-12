import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone, Globe, Building2, Users, ExternalLink, ArrowRight, Heart, MessageCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface BusinessAccount {
  id: string;
  owner_id: string;
  name: string | null;
  bio: string | null;
  services: string | null;
  sector: string | null;
  occupations: string[] | null;
  country: string | null;
  state: string | null;
  city: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  logo_url: string | null;
  status: string;
  address_line1?: string | null;
  address_line2?: string | null;
  postal_code?: string | null;
  facebook_url?: string | null;
  instagram_url?: string | null;
  linkedin_url?: string | null;
  twitter_url?: string | null;
  youtube_url?: string | null;
  tiktok_url?: string | null;
  whatsapp_number?: string | null;
  telegram_url?: string | null;
}

interface TeamMemberProfile {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
}

const setSeo = (title: string, description?: string, canonicalUrl?: string) => {
  document.title = title;
  if (description) {
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'description');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', description);
  }
  if (canonicalUrl) {
    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link');
      link.setAttribute('rel', 'canonical');
      document.head.appendChild(link);
    }
    link.setAttribute('href', canonicalUrl);
  }
};

const BusinessProfile = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();

const [business, setBusiness] = useState<BusinessAccount | null>(null);
const [team, setTeam] = useState<TeamMemberProfile[]>([]);
const [loading, setLoading] = useState(true);
const [linking, setLinking] = useState(false);
const [alreadyLinked, setAlreadyLinked] = useState<boolean>(false);
const [linkBlocked, setLinkBlocked] = useState<boolean>(false);
const [favoriteBusinessIds, setFavoriteBusinessIds] = useState<string[]>([]);

  const canonical = useMemo(() => `${window.location.origin}/business/${id}`, [id]);

  useEffect(() => {
    if (id) setSeo('Business Profile – Muslim Pros', 'View business details, services, and team', canonical);
  }, [id, canonical]);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
const columns: string = user
  ? 'id, owner_id, name, bio, services, sector, country, state, city, email, phone, website, logo_url, status, address_line1, address_line2, postal_code, facebook_url, instagram_url, linkedin_url, twitter_url, youtube_url, tiktok_url, whatsapp_number, telegram_url'
  : 'id, name, bio, services, sector, country, state, city, website, logo_url, status, address_line1, address_line2, postal_code, facebook_url, instagram_url, linkedin_url, twitter_url, youtube_url, tiktok_url, whatsapp_number, telegram_url';
        const { data: biz } = await supabase
          .from('business_accounts')
          .select(columns)
          .eq('id', id)
          .maybeSingle();
        if (biz) setBusiness(biz as unknown as BusinessAccount);

        // Load approved team links
        const { data: links } = await supabase
          .from('professional_business_links')
          .select('professional_user_id')
          .eq('business_id', id)
          .eq('status', 'approved');

        const memberIds = (links ?? []).map((l: any) => l.professional_user_id);
        if (memberIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('user_id, first_name, last_name, avatar_url')
            .in('user_id', memberIds);
          setTeam((profiles ?? []) as TeamMemberProfile[]);
        } else {
          setTeam([]);
        }

// Check existing link status and rejection count
if (user) {
  const { data: existingActive } = await supabase
    .from('professional_business_links')
    .select('id, status')
    .eq('business_id', id)
    .eq('professional_user_id', user.id)
    .in('status', ['pending','approved']);
  setAlreadyLinked((existingActive?.length ?? 0) > 0);

  const { data: rejectedRows } = await supabase
    .from('professional_business_links')
    .select('id')
    .eq('business_id', id)
    .eq('professional_user_id', user.id)
    .eq('status', 'rejected');
  setLinkBlocked((rejectedRows?.length ?? 0) >= 2);
}
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, user]);

  const isFavorited = business ? favoriteBusinessIds.includes(business.id) : false;
  const toggleFavorite = () => {
    if (!business) return;
    const key = 'favorite_business_ids';
    const arr = [...favoriteBusinessIds];
    const idx = arr.indexOf(business.id);
    if (idx === -1) {
      arr.push(business.id);
      toast({ title: 'Added to favorites', description: business.name ? `${business.name} saved to your favorites.` : 'Business saved.' });
    } else {
      arr.splice(idx, 1);
      toast({ title: 'Removed from favorites', description: business.name ? `${business.name} removed from your favorites.` : 'Business removed.' });
    }
    localStorage.setItem(key, JSON.stringify(arr));
    setFavoriteBusinessIds(arr);
  };

const handleRequestLink = async () => {
  if (!user || !id) {
    toast({ title: 'Please sign in', description: 'You must be logged in to request linking.', variant: 'destructive' });
    return;
  }
  if (linkBlocked) {
    toast({ title: 'Linking disabled', description: 'This business has declined twice. Please contact an admin for manual approval.', variant: 'destructive' });
    return;
  }
  try {
    setLinking(true);
    const { error } = await supabase
      .from('professional_business_links')
      .insert({ business_id: id, professional_user_id: user.id, status: 'pending' });
    if (error) throw error;
    toast({ title: 'Request sent', description: 'Your link request is pending approval.' });
    setAlreadyLinked(true);
  } catch (e: any) {
    toast({ title: 'Could not send request', description: e.message || 'Try again later.', variant: 'destructive' });
  } finally {
    setLinking(false);
  }
};

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <p className="text-muted-foreground">Loading business profile...</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (!business) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <Card className="shadow-soft">
            <CardContent className="py-10 text-center">
              <Building2 className="w-10 h-10 mx-auto text-muted-foreground" />
              <h1 className="mt-4 text-2xl font-bold text-foreground">Business Not Found</h1>
              <p className="text-muted-foreground mt-2">This business profile may have been removed or is not available.</p>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  const fullLocation = [business.city, business.state, business.country].filter(Boolean).join(', ');

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <article className="space-y-8">
          <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-center gap-4">
              {/* Business Logo */}
              <Avatar className="h-20 w-20 md:h-24 md:w-24">
                <AvatarImage src={business.logo_url || undefined} alt={`${business.name || 'Business'} logo`} />
                <AvatarFallback>{(business.name?.[0] || '?').toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-foreground">{business.name || 'Unnamed Business'}</h1>
                {fullLocation && (
                  <p className="text-muted-foreground mt-1">{fullLocation}</p>
                )}
              </div>
            </div>
<div className="flex flex-wrap gap-2">
  {user && (
    <Button variant="accent" asChild>
      <Link to="/messages" aria-label="Message this business">
        <MessageCircle className="w-4 h-4 mr-2" /> Message
      </Link>
    </Button>
  )}
  {business.website && (
    <Button variant="accent" asChild>
      <a href={business.website} target="_blank" rel="noopener noreferrer" aria-label="Visit website">
        <Globe className="w-4 h-4 mr-2" /> Website <ExternalLink className="w-4 h-4 ml-1" />
      </a>
    </Button>
  )}
  <Button variant={isFavorited ? "default" : "outline"} onClick={toggleFavorite}>
    <Heart className={`w-4 h-4 mr-2 ${isFavorited ? 'fill-current' : ''}`} /> {isFavorited ? 'Favorited' : 'Favorite'}
  </Button>
  {user && user.id === business.owner_id && (
    <Button variant="accent" asChild>
      <Link to="/dashboard/business">Edit Business Profile</Link>
    </Button>
  )}
  {!user && (
    <p className="text-sm text-muted-foreground ml-1">Sign in to message this business.</p>
  )}
</div>
          </header>

          {/* About / Description */}
          {business.bio && (
            <section>
              <Card className="shadow-soft">
                <CardHeader>
                  <CardTitle>About Us</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground whitespace-pre-wrap">{business.bio}</p>
                </CardContent>
              </Card>
            </section>
          )}

          {/* Services / Sector */}
          <section>
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle>Services & Expertise</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {business.sector && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Sector & Industry</p>
                    <Badge variant="secondary">{business.sector}</Badge>
                  </div>
                )}
                {business.services && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Services Offered</p>
                    <p className="text-foreground whitespace-pre-wrap">{business.services}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </section>

          {/* Contact Information */}
          {(business.email || business.phone || business.website || business.address_line1 || business.facebook_url || business.instagram_url || business.linkedin_url || business.twitter_url || business.youtube_url || business.tiktok_url || business.whatsapp_number || business.telegram_url) && (
            <section>
              <Card className="shadow-soft">
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {business.address_line1 && (
                    <p className="text-foreground">{business.address_line1}{business.address_line2 ? `, ${business.address_line2}` : ''}{business.postal_code ? `, ${business.postal_code}` : ''}</p>
                  )}
                  {business.email && (
                    <p>
                      <a href={`mailto:${business.email}`} className="text-primary hover:underline inline-flex items-center gap-2"><Mail className="w-4 h-4" /> {business.email}</a>
                    </p>
                  )}
                  {business.phone && (
                    <p>
                      <a href={`tel:${business.phone}`} className="text-primary hover:underline inline-flex items-center gap-2"><Phone className="w-4 h-4" /> {business.phone}</a>
                    </p>
                  )}
                  {business.website && (
                    <p>
                      <a href={business.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-2"><Globe className="w-4 h-4" /> {business.website}</a>
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    {business.facebook_url && (
                      <a href={business.facebook_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Facebook</a>
                    )}
                    {business.instagram_url && (
                      <a href={business.instagram_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Instagram</a>
                    )}
                    {business.linkedin_url && (
                      <a href={business.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">LinkedIn</a>
                    )}
                    {business.twitter_url && (
                      <a href={business.twitter_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Twitter/X</a>
                    )}
                    {business.youtube_url && (
                      <a href={business.youtube_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">YouTube</a>
                    )}
                    {business.tiktok_url && (
                      <a href={business.tiktok_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">TikTok</a>
                    )}
                    {business.telegram_url && (
                      <a href={business.telegram_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Telegram</a>
                    )}
                    {business.whatsapp_number && (
                      <a href={`https://wa.me/${business.whatsapp_number}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">WhatsApp</a>
                    )}
                  </div>
                </CardContent>
              </Card>
            </section>
          )}

          {/* Team Members */}
          <section>
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Users className="w-5 h-5" /> Team Members</CardTitle>
              </CardHeader>
              <CardContent>
                {team.length === 0 ? (
                  <p className="text-muted-foreground">No team members listed yet.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {team.map((m) => (
                      <Link key={m.user_id} to={`/profile/${m.user_id}`} className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-smooth">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={m.avatar_url || undefined} alt={`${m.first_name || ''} ${m.last_name || ''} avatar`} />
                          <AvatarFallback>
                            {`${(m.first_name?.[0] || '?')}${(m.last_name?.[0] || '')}`.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-foreground">{[m.first_name, m.last_name].filter(Boolean).join(' ') || 'Member'}</p>
                          <p className="text-xs text-primary inline-flex items-center gap-1">View profile <ArrowRight className="w-3 h-3" /></p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </section>

          {/* Link Request - bottom */}
          {user && business && user.id !== business.owner_id && (
            <section>
              <Card className="shadow-soft">
                <CardContent className="pt-6 flex justify-end">
<Button variant="hero" onClick={handleRequestLink} disabled={linking || alreadyLinked || linkBlocked}>
  {alreadyLinked ? 'Request Sent' : linkBlocked ? 'Linking disabled' : 'Request to link profile'}
</Button>
                </CardContent>
              </Card>
            </section>
          )}
        </article>
      </main>
      <Footer />
    </div>
  );
};

export default BusinessProfile;
