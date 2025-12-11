import { useEffect, useMemo, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Building2, Search, Heart, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { CountrySelect, CitySelect as CitySelectEF, SectorSelect } from "@/components/EnhancedFormDropdowns";
import { StateProvinceSelect } from "@/components/StateProvinceSelect";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";

interface BusinessAccount {
  id: string;
  name: string | null;
  sector: string | null;
  bio: string | null;
  country: string | null;
  state: string | null;
  city: string | null;
  email: string | null;
  website: string | null;
  verified: boolean;
  logo_url: string | null;
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

const Businesses = () => {
  const [filters, setFilters] = useState({
    searchTerm: "",
    country: "",
    state: "",
    city: "",
    sector: "",
    verifiedOnly: false,
  });
  const [sectors, setSectors] = useState<string[]>([]);
  const [results, setResults] = useState<BusinessAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const [favoriteBusinessIds, setFavoriteBusinessIds] = useState<string[]>([]);
  const [messageOpen, setMessageOpen] = useState(false);
  const [messageRecipientId, setMessageRecipientId] = useState<string | null>(null);
  const [messageBusinessName, setMessageBusinessName] = useState<string>("");
  const [messageContent, setMessageContent] = useState("");
  const [sending, setSending] = useState(false);
  const canonical = useMemo(() => `${window.location.origin}/businesses`, []);

  useEffect(() => {
    setSeo("Find Businesses – Muslim Pros", "Search Muslim-owned and Muslim-friendly businesses by sector and location.", canonical);
  }, [canonical]);

  useEffect(() => {
    const loadSectors = async () => {
      if (!user) {
        setSectors([]);
        return;
      }
      try {
        // Use RPC function which only exposes safe public fields
        const { data, error } = await supabase.rpc('get_business_sectors');
        if (error) throw error;
        setSectors((data || []).map((d: any) => d.sector).filter(Boolean));
      } catch (error) {
        console.error('Failed to load sectors:', error);
        setSectors([]);
      }
    };
    
    loadSectors();
  }, [user]);

  useEffect(() => {
    if (user) {
      handleSearch();
    } else {
      setResults([]);
    }
  }, [user]);

  useEffect(() => {
    const raw = localStorage.getItem('favorite_business_ids');
    setFavoriteBusinessIds(raw ? JSON.parse(raw) : []);
  }, []);

  const handleSearch = async () => {
    if (!user) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      // Use RPC function which only exposes safe public fields (no contact info)
      const { data, error } = await supabase.rpc('search_business_directory', {
        search_term: filters.searchTerm || null,
        filter_country: filters.country || null,
        filter_state: filters.state || null,
        filter_city: filters.city || null,
        filter_sector: filters.sector || null,
        verified_only: filters.verifiedOnly,
        result_limit: 50
      });

      if (error) {
        console.error('Query error:', error);
        throw error;
      }
      setResults((data || []) as any);
    } catch (e) {
      console.error('Business search error', e);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };
  const handleFavorite = (id: string, name?: string | null) => {
    try {
      const key = 'favorite_business_ids';
      const arr = [...favoriteBusinessIds];
      const index = arr.indexOf(id);
      if (index === -1) {
        arr.push(id);
        toast({ title: 'Added to favorites', description: name ? `${name} saved to your favorites.` : 'Business saved.' });
      } else {
        arr.splice(index, 1);
        toast({ title: 'Removed from favorites', description: name ? `${name} removed from your favorites.` : 'Business removed.' });
      }
      localStorage.setItem(key, JSON.stringify(arr));
      setFavoriteBusinessIds(arr);
    } catch {
      toast({ title: 'Could not update favorite', description: 'Please try again later.', variant: 'destructive' });
    }
  };

  const fullLocation = (b: BusinessAccount) => [b.city, b.state, b.country].filter(Boolean).join(', ');

  const openMessageDialog = async (b: BusinessAccount) => {
    if (!user) {
      window.location.href = `/login?redirect=/businesses`;
      return;
    }
    setMessageOpen(true);
    setMessageBusinessName(b.name || 'Business');
    setMessageContent('');
    try {
      const { data, error } = await supabase
        .from('business_accounts')
        .select('owner_id')
        .eq('id', b.id)
        .maybeSingle();
      if (error) throw error;
      if (!data?.owner_id) {
        toast({ title: 'Contact unavailable', description: 'Unable to contact this business at the moment.' });
        setMessageOpen(false);
        return;
      }
      setMessageRecipientId(data.owner_id);
    } catch (e: any) {
      console.error('Failed to load business owner', e);
      toast({ title: 'Error', description: 'Could not open message box.', variant: 'destructive' });
      setMessageOpen(false);
    }
  };

  const sendMessageToBusiness = async () => {
    if (!user || !messageRecipientId || !messageContent.trim()) return;
    setSending(true);
    try {
      const { error } = await supabase
        .from('messages')
        .insert({ sender_id: user.id, recipient_id: messageRecipientId, content: messageContent.trim() });
      if (error) throw error;
      toast({ title: 'Message sent!', description: `Your message was sent to ${messageBusinessName}.` });
      setMessageOpen(false);
      setMessageContent('');
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'Failed to send message.', variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <header className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Find Muslim Businesses</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Discover Muslim-owned and Muslim-friendly businesses by sector and location.</p>
        </header>

        <section aria-label="Business search filters" className="mb-6">
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Search className="w-5 h-5" /> Search Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="q">Search</Label>
                  <Input id="q" placeholder="Name, sector, or keywords" value={filters.searchTerm} onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })} />
                </div>
                <div>
                  <Label htmlFor="country">Country</Label>
                  <CountrySelect
                    value={filters.country}
                    onValueChange={(value) => setFilters({ ...filters, country: value, state: "", city: "" })}
                  />
                </div>
                <div>
                  <Label htmlFor="state">State/Province</Label>
                  <StateProvinceSelect
                    value={filters.state}
                    onValueChange={(value) => setFilters({ ...filters, state: value, city: "" })}
                    country={filters.country}
                    disabled={!filters.country}
                    placeholder="All States"
                  />
                </div>
                <div>
                  <Label htmlFor="city">City</Label>
                  <CitySelectEF
                    value={filters.city}
                    onValueChange={(value) => setFilters({ ...filters, city: value })}
                    country={filters.country}
                    stateProvince={filters.state}
                    placeholder="All Cities"
                  />
                </div>
                <div>
                  <Label htmlFor="sector">Sector</Label>
                  <SectorSelect
                    value={filters.sector}
                    onValueChange={(value) => setFilters({ ...filters, sector: value })}
                    placeholder="All Sectors"
                  />
                </div>
                <div className="flex items-end gap-2">
                  <div className="flex items-center gap-2">
                    <Checkbox id="verified" checked={filters.verifiedOnly} onCheckedChange={(v) => setFilters({ ...filters, verifiedOnly: !!v })} />
                    <Label htmlFor="verified">Verified only</Label>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <Button variant="accent" onClick={handleSearch} disabled={loading}>{loading ? 'Searching…' : 'Search'}</Button>
              </div>
            </CardContent>
          </Card>
        </section>

        <section aria-label="Search results" className="space-y-4">
          {results.length === 0 && !loading && (
            <Card className="shadow-soft">
              <CardContent className="p-8 text-center text-muted-foreground">No businesses found. Try adjusting your filters.</CardContent>
            </Card>
          )}

          {results.map((b) => (
            <Card key={b.id} className="shadow-soft">
              <CardContent className="p-6">
                <div>
                  <div className="flex items-center gap-3">
                    <Building2 className="w-5 h-5 text-primary" />
                    <Link to={`/business/${b.id}`} className="text-xl font-semibold text-foreground hover:text-primary transition-smooth">
                      {b.name || 'Unnamed Business'}
                    </Link>
                    {b.verified && <Badge variant="secondary">Verified</Badge>}
                  </div>
                  <p className="text-muted-foreground mt-1">{[b.sector, fullLocation(b)].filter(Boolean).join(' • ')}</p>

                  {(() => {
                    const isFav = favoriteBusinessIds.includes(b.id);
                    return (
                      <div className="actions flex flex-wrap items-center justify-end gap-3 md:gap-4 mt-2">
                        <Button variant={isFav ? "default" : "outline"} onClick={() => handleFavorite(b.id, b.name)} aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}>
                          <Heart className={`w-4 h-4 mr-2 ${isFav ? 'fill-current' : ''}`} /> {isFav ? 'Favorited' : 'Favorite'}
                        </Button>
                        <Button variant="outline" onClick={() => openMessageDialog(b)} aria-label="Message business">
                          <MessageCircle className="w-4 h-4 mr-2" /> Message
                        </Button>
                        <Button variant="outline" asChild aria-label="View profile">
                          <Link to={`/business/${b.id}`}>View Profile</Link>
                        </Button>
                      </div>
                    );
                  })()}
                </div>
              </CardContent>
            </Card>
          ))}
        </section>

        <Dialog open={messageOpen} onOpenChange={setMessageOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Message {messageBusinessName}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="biz-message">Message</Label>
                <Textarea id="biz-message" rows={4} value={messageContent} onChange={(e) => setMessageContent(e.target.value)} placeholder="Write your message..." />
              </div>
              <div className="flex gap-2 justify-end">
                <Button onClick={sendMessageToBusiness} disabled={!messageContent.trim() || sending}>Send</Button>
                <Button variant="outline" onClick={() => setMessageOpen(false)}>Cancel</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </main>
      <Footer />
    </div>
  );
};

export default Businesses;
