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
import { Globe, Mail, MapPin, Building2, ExternalLink, Search } from "lucide-react";
import { Link } from "react-router-dom";

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

  const canonical = useMemo(() => `${window.location.origin}/businesses`, []);

  useEffect(() => {
    setSeo("Find Businesses – Muslim Pros", "Search Muslim-owned and Muslim-friendly businesses by sector and location.", canonical);
  }, [canonical]);

  useEffect(() => {
    const loadSectors = async () => {
      const { data } = await supabase.from('business_accounts').select('sector');
      const unique = Array.from(new Set((data || []).map((d: any) => d.sector).filter(Boolean)));
      setSectors(unique as string[]);
    };
    loadSectors();
    handleSearch();
  }, []);

  const handleSearch = async () => {
    setLoading(true);
    try {
      let query = supabase.from('business_accounts').select('*');

      if (filters.searchTerm) {
        const t = filters.searchTerm;
        query = query.or(`name.ilike.%${t}%,bio.ilike.%${t}%,sector.ilike.%${t}%`);
      }
      if (filters.country) query = query.eq('country', filters.country);
      if (filters.state) query = query.eq('state', filters.state);
      if (filters.city) query = query.eq('city', filters.city);
      if (filters.sector) query = query.eq('sector', filters.sector);
      if (filters.verifiedOnly) query = query.eq('verified', true);

      query = query.order('verified', { ascending: false }).order('created_at', { ascending: false }).limit(50);

      const { data, error } = await query;
      if (error) throw error;
      setResults((data || []) as any);
    } catch (e) {
      console.error('Business search error', e);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const fullLocation = (b: BusinessAccount) => [b.city, b.state, b.country].filter(Boolean).join(', ');

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
                  <Input id="country" placeholder="e.g., United States" value={filters.country} onChange={(e) => setFilters({ ...filters, country: e.target.value })} />
                </div>
                <div>
                  <Label htmlFor="state">State/Province</Label>
                  <Input id="state" placeholder="e.g., California" value={filters.state} onChange={(e) => setFilters({ ...filters, state: e.target.value })} />
                </div>
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input id="city" placeholder="e.g., San Francisco" value={filters.city} onChange={(e) => setFilters({ ...filters, city: e.target.value })} />
                </div>
                <div>
                  <Label htmlFor="sector">Sector</Label>
                  <Input id="sector" list="sector-list" placeholder="Select or type a sector" value={filters.sector} onChange={(e) => setFilters({ ...filters, sector: e.target.value })} />
                  <datalist id="sector-list">
                    {sectors.map((s) => (
                      <option key={s} value={s} />
                    ))}
                  </datalist>
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
              <CardContent className="p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <Building2 className="w-5 h-5 text-primary" />
                    <Link to={`/business/${b.id}`} className="text-xl font-semibold text-foreground hover:text-primary transition-smooth">
                      {b.name || 'Unnamed Business'}
                    </Link>
                    {b.verified && <Badge variant="secondary">Verified</Badge>}
                  </div>
                  <p className="text-muted-foreground mt-1">{[b.sector, fullLocation(b)].filter(Boolean).join(' • ')}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {b.email && (
                    <Button variant="outline" asChild>
                      <a href={`mailto:${b.email}`} aria-label="Email business"><Mail className="w-4 h-4 mr-2" /> Email</a>
                    </Button>
                  )}
                  {b.website && (
                    <Button variant="accent" asChild>
                      <a href={b.website} target="_blank" rel="noopener noreferrer" aria-label="Visit website">
                        <Globe className="w-4 h-4 mr-2" /> Website <ExternalLink className="w-4 h-4 ml-1" />
                      </a>
                    </Button>
                  )}
                  <Button variant="outline" asChild>
                    <Link to={`/business/${b.id}`}>View Profile</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Businesses;
