import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2 } from "lucide-react";

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
  const [name, setName] = useState("");
  const [account, setAccount] = useState<BusinessAccount | null>(null);

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
              <div className="space-y-2">
                <p className="text-foreground"><span className="font-medium">Name:</span> {account.name || 'Not set'}</p>
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
