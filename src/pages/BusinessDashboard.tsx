import InviteCard from "@/components/InviteCard";
import { formatPhone } from "@/lib/formatPhone";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Building2, MapPin, Globe, Phone, Mail, Edit } from "lucide-react";
import BusinessLinkRequests from "@/components/BusinessLinkRequests";
import OrgEventsManager from "@/components/OrgEventsManager";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ORG_TYPES, orgTypeLabel } from "@/lib/orgTypes";

interface BusinessAccount { 
  id: string; 
  name: string | null; 
  status: string;
  logo_url?: string;
  bio?: string;
  sector?: string;
  country?: string;
  state?: string;
  city?: string;
  website?: string;
  email?: string;
  phone?: string;
  kind?: string;
  org_type?: string | null;
  verified?: boolean;
}

const setSeo = (title: string, description?: string) => {
  document.title = title;
  if (description) {
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', description);
  }
};

const BusinessDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [account, setAccount] = useState<BusinessAccount | null>(null);
  const [isBusinessUser, setIsBusinessUser] = useState(false);
  const [kind, setKind] = useState<'business' | 'organization'>(() => {
    try { return localStorage.getItem('pending_business_kind') === 'organization' ? 'organization' : 'business'; } catch { return 'business'; }
  });
  const [orgType, setOrgType] = useState<string>('');

  useEffect(() => setSeo('Business Dashboard – Muslim Professionals Network', 'Create and manage your business profile'), []);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      const [bizRes, profRes] = await Promise.all([
        supabase
          .from('business_accounts')
          .select('*')
          .eq('owner_id', user.id)
          .maybeSingle(),
        supabase
          .from('profiles')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle()
      ]);
      if (bizRes.data) setAccount(bizRes.data as BusinessAccount);
      // SECURITY: profiles.role is the only authoritative source.
      const role = profRes.data?.role;
      setIsBusinessUser(role === 'business');
      setLoading(false);
    };
    load();
  }, [user]);

  const createBusiness = async () => {
    if (!user) return;
    setCreating(true);
    
    // Get pending business details from signup flow
    const pendingName = localStorage.getItem('pending_business_name');
    const pendingPhone = localStorage.getItem('pending_business_phone');
    const pendingWebsite = localStorage.getItem('pending_business_website');
    
    const { data, error } = await supabase
      .from('business_accounts')
      .insert({ 
        owner_id: user.id, 
        name: name || pendingName || null, 
        phone: pendingPhone || null,
        website: pendingWebsite || null,
        status: 'active',
        kind,
        org_type: kind === 'organization' ? orgType || 'other' : null,
      } as never)
      .select('*')
      .maybeSingle();
    setCreating(false);
    
    // Clear pending values after use
    localStorage.removeItem('pending_business_name');
    localStorage.removeItem('pending_business_phone');
    localStorage.removeItem('pending_business_website');
    localStorage.removeItem('pending_business_kind');
    
    if (!error && data) setAccount(data as BusinessAccount);
  };

  const isOrg = account ? account.kind === 'organization' : kind === 'organization';

  const getLocationString = () => {
    const parts = [account?.city, account?.state, account?.country].filter(Boolean);
    return parts.join(', ');
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-6">{isOrg ? 'Organization Dashboard' : 'Business Dashboard'}</h1>

        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              {account ? (isOrg ? 'Your Organization' : 'Your Business Profile') : 'Create Your Listing'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : account ? (
              <div className="space-y-6">
                {/* Business Overview */}
                <div className="flex items-start gap-4">
                  <Avatar className="w-20 h-20">
                    <AvatarImage src={account.logo_url} alt={account.name || 'Business'} />
                    <AvatarFallback className="text-xl">
                      {account.name ? account.name.substring(0, 2).toUpperCase() : 'BZ'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold">{account.name || 'Unnamed Business'}</h2>
                    {isOrg ? (
                      <Badge variant="secondary" className="mt-1">{orgTypeLabel(account.org_type)}</Badge>
                    ) : account.sector && (
                      <Badge variant="secondary" className="mt-1">{account.sector}</Badge>
                    )}
                    {account.bio && (
                      <p className="text-muted-foreground mt-2 line-clamp-2">{account.bio}</p>
                    )}
                  </div>
                </div>

                {/* Quick Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                  {getLocationString() && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span>{getLocationString()}</span>
                    </div>
                  )}
                  {account.website && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Globe className="w-4 h-4" />
                      <a href={account.website} target="_blank" rel="noopener noreferrer" className="hover:text-primary truncate">
                        {account.website}
                      </a>
                    </div>
                  )}
                  {account.email && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="w-4 h-4" />
                      <span>{account.email}</span>
                    </div>
                  )}
                  {account.phone && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="w-4 h-4" />
                      <span>{formatPhone(account.phone)}</span>
                    </div>
                  )}
                </div>

                {/* Status */}
                {isOrg ? (
                  <div className="pt-4 border-t space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Listing:</span>
                      <Badge variant={account.verified ? 'default' : 'secondary'}>
                        {account.verified ? 'Approved: listed in Organizations' : 'Waiting for approval'}
                      </Badge>
                    </div>
                    {!account.verified && (
                      <p className="text-sm text-muted-foreground">
                        We check every organization before it's listed, usually within a few days. Meanwhile, finish
                        your profile (logo, description, location) so it's ready.
                      </p>
                    )}
                  </div>
                ) : (
                <div className="flex items-center gap-2 pt-4 border-t">
                  <span className="text-sm text-muted-foreground">Listing:</span>
                  <Badge variant={account.status === 'published' ? 'default' : 'secondary'}>
                    {account.status === 'published' ? 'Live in the directory' : account.status === 'draft' ? 'Draft (not listed yet)' : account.status}
                  </Badge>
                </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3 pt-4 border-t">
                  <Button asChild variant="accent">
                    <Link to="/edit-business-profile">
                      <Edit className="w-4 h-4 mr-2" />
                      {isOrg ? 'Edit Organization Profile' : 'Edit Business Profile'}
                    </Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link to={`/business/${account.id}`}>View Public Profile</Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link to="/messages">Messages</Link>
                  </Button>
                </div>
              </div>
            ) : isBusinessUser ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Listing type">
                  {(['business', 'organization'] as const).map((k) => (
                    <Button
                      key={k}
                      type="button"
                      variant={kind === k ? 'default' : 'outline'}
                      onClick={() => setKind(k)}
                      role="radio"
                      aria-checked={kind === k}
                    >
                      {k === 'business' ? 'Business' : 'Organization'}
                    </Button>
                  ))}
                </div>
                <p className="text-muted-foreground">
                  {kind === 'organization'
                    ? 'Mosques, student associations, professional associations, charities and schools. Organizations are listed after a quick check, then can post events.'
                    : 'Create your business profile to get listed in the Muslim Business Directory.'}
                </p>
                <div>
                  <Label htmlFor="business-name">{kind === 'organization' ? 'Organization name' : 'Business name'}</Label>
                  <Input
                    id="business-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={kind === 'organization' ? 'e.g., Islamic Center of Portland' : 'e.g., Crescent Consulting'}
                    maxLength={120}
                  />
                </div>
                {kind === 'organization' && (
                  <div>
                    <Label htmlFor="org-type">Type</Label>
                    <Select value={orgType} onValueChange={setOrgType}>
                      <SelectTrigger id="org-type"><SelectValue placeholder="Choose a type" /></SelectTrigger>
                      <SelectContent>
                        {ORG_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <Button onClick={createBusiness} disabled={creating || (kind === 'organization' && !orgType)} variant="accent" className="w-full">
                  {creating ? 'Creating...' : kind === 'organization' ? 'Create Organization' : 'Create Business Profile'}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-muted-foreground">Only business accounts can create a business profile.</p>
                <Button asChild variant="outline">
                  <Link to="/dashboard/professional">Go to Professional Dashboard</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {user && account && (
          <div className="mt-8">
            <InviteCard userId={user.id} />
          </div>
        )}

        {account && isOrg && (
          <div className="mt-8">
            <OrgEventsManager orgId={account.id} approved={!!account.verified} />
          </div>
        )}

        {account && (
          <div className="mt-8">
            <BusinessLinkRequests businessId={account.id} isOrganization={isOrg} />
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default BusinessDashboard;
