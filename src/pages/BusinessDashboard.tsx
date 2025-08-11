import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2 } from "lucide-react";
import { SectorSelect, CountrySelect, StateProvinceSelect as StateProvinceSelectEF, CitySelect as CitySelectEF } from "@/components/EnhancedFormDropdowns";
interface BusinessAccount { id: string; name: string | null; status: string; }

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
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [account, setAccount] = useState<BusinessAccount | null>(null);
  const [form, setForm] = useState({
    name: "",
    bio: "",
    services: "",
    sector: "",
    email: "",
    phone: "",
    website: "",
    country: "",
    state: "",
    city: ""
  });

  useEffect(() => {
    if (account) {
      setForm({
        name: account.name || "",
        bio: (account as any).bio || "",
        services: (account as any).services || "",
        sector: (account as any).sector || "",
        email: (account as any).email || "",
        phone: (account as any).phone || "",
        website: (account as any).website || "",
        country: (account as any).country || "",
        state: (account as any).state || "",
        city: (account as any).city || ""
      });
    }
  }, [account]);
  useEffect(() => setSeo('Business Dashboard – Muslim Pros', 'Create and manage your business profile'), []);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('business_accounts')
        .select('*')
        .eq('owner_id', user.id)
        .maybeSingle();
      if (data) setAccount(data as any);
      setLoading(false);
    };
    load();
  }, [user]);

  const createBusiness = async () => {
    if (!user) return;
    setCreating(true);
    const { data, error } = await supabase
      .from('business_accounts')
      .insert({ owner_id: user.id, name: name || null, status: 'active' })
      .select('*')
      .maybeSingle();
    setCreating(false);
    if (!error && data) setAccount(data as any);
  };
const updateBusiness = async () => {
  if (!account) return;
  setSaving(true);
  const { data, error } = await supabase
    .from('business_accounts')
    .update({
      name: form.name || null,
      bio: form.bio || null,
      services: form.services || null,
      sector: form.sector || null,
      email: form.email || null,
      phone: form.phone || null,
      website: form.website || null,
      country: form.country || null,
      state: form.state || null,
      city: form.city || null,
    })
    .eq('id', account.id)
    .select('*')
    .maybeSingle();
  setSaving(false);
  if (!error && data) setAccount(data as any);
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
              {account ? 'Manage Business Profile' : 'Create Business Profile'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground">Loading...</p>
            ) : account ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="biz-name">Business Name</Label>
                    <Input id="biz-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                  </div>
                  <div>
                    <Label htmlFor="biz-sector">Sector</Label>
                    <SectorSelect
                      value={form.sector}
                      onValueChange={(value) => setForm({ ...form, sector: value })}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="biz-bio">About</Label>
                    <Textarea id="biz-bio" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="Describe your business" />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="biz-services">Services</Label>
                    <Textarea id="biz-services" value={form.services} onChange={(e) => setForm({ ...form, services: e.target.value })} placeholder="List the services you provide" />
                  </div>
                  <div>
                    <Label htmlFor="biz-email">Email</Label>
                    <Input id="biz-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                  </div>
                  <div>
                    <Label htmlFor="biz-phone">Phone</Label>
                    <Input id="biz-phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="biz-website">Website</Label>
                    <Input id="biz-website" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="https://..." />
                  </div>
                  <div>
                    <Label htmlFor="biz-country">Country</Label>
                    <CountrySelect
                      value={form.country}
                      onValueChange={(value) => setForm({ ...form, country: value, state: "", city: "" })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="biz-state">State/Province</Label>
                    <StateProvinceSelectEF
                      country={form.country}
                      value={form.state}
                      onValueChange={(value) => setForm({ ...form, state: value, city: "" })}
                      placeholder="Select state/province"
                    />
                  </div>
                  <div>
                    <Label htmlFor="biz-city">City</Label>
                    <CitySelectEF
                      country={form.country}
                      stateProvince={form.state}
                      value={form.city}
                      onValueChange={(value) => setForm({ ...form, city: value })}
                      placeholder="Select city"
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button onClick={updateBusiness} disabled={saving} variant="accent">
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button asChild variant="outline">
                    <Link to={`/business/${account.id}`}>View Public Profile</Link>
                  </Button>
                </div>
                <p className="text-muted-foreground">Status: {account.status}</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="business-name">Business Name</Label>
                  <Input id="business-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Crescent Consulting" />
                </div>
                <Button onClick={createBusiness} disabled={creating} variant="accent" className="w-full">
                  {creating ? 'Creating...' : 'Create Business Profile'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default BusinessDashboard;
