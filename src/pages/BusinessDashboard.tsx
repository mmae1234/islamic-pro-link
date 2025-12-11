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
      if ((bizRes as any).data) setAccount((bizRes as any).data as BusinessAccount);
      const metaType = (user as any)?.user_metadata?.account_type;
      const role = (profRes as any).data?.role;
      setIsBusinessUser(role === 'business' || metaType === 'business');
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
        status: 'active' 
      })
      .select('*')
      .maybeSingle();
    setCreating(false);
    
    // Clear pending values after use
    localStorage.removeItem('pending_business_name');
    localStorage.removeItem('pending_business_phone');
    localStorage.removeItem('pending_business_website');
    
    if (!error && data) setAccount(data as BusinessAccount);
  };

  const getLocationString = () => {
    const parts = [account?.city, account?.state, account?.country].filter(Boolean);
    return parts.join(', ');
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-6">Business Dashboard</h1>

        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              {account ? 'Your Business Profile' : 'Create Business Profile'}
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
                    {account.sector && (
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
                      <span>{account.phone}</span>
                    </div>
                  )}
                </div>

                {/* Status */}
                <div className="flex items-center gap-2 pt-4 border-t">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  <Badge variant={account.status === 'published' ? 'default' : 'secondary'}>
                    {account.status}
                  </Badge>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3 pt-4 border-t">
                  <Button asChild variant="accent">
                    <Link to="/edit-business-profile">
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Business Profile
                    </Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link to={`/business/${account.id}`}>View Public Profile</Link>
                  </Button>
                </div>
              </div>
            ) : isBusinessUser ? (
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  Create your business profile to get listed in the Muslim Business Directory.
                </p>
                <div>
                  <Label htmlFor="business-name">Business Name</Label>
                  <Input 
                    id="business-name" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    placeholder="e.g., Crescent Consulting" 
                  />
                </div>
                <Button onClick={createBusiness} disabled={creating} variant="accent" className="w-full">
                  {creating ? 'Creating...' : 'Create Business Profile'}
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

        {account && (
          <div className="mt-8">
            <BusinessLinkRequests businessId={account.id} />
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default BusinessDashboard;
