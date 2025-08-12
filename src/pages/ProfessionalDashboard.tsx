import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link, useNavigate } from "react-router-dom";
import { Briefcase } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const setSeo = (title: string, description?: string) => {
  document.title = title;
  if (description) {
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', description);
  }
};

const ProfessionalDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isBusiness, setIsBusiness] = useState(false);

  useEffect(() => setSeo('Professional Dashboard – Muslim Pros', 'Manage your professional profile and mentorship settings'), []);

  useEffect(() => {
    let isMounted = true;
    const check = async () => {
      if (!user) return;
      const [profRes, bizRes] = await Promise.all([
        supabase.from('profiles').select('role').eq('user_id', user.id).maybeSingle(),
        supabase.from('business_accounts').select('id').eq('owner_id', user.id).maybeSingle(),
      ]);
      const metaType = (user as any)?.user_metadata?.account_type;
      const biz = (bizRes as any).data;
      const role = (profRes as any).data?.role;
      const isBiz = role === 'business' || metaType === 'business' || !!biz;
      if (!isMounted) return;
      setIsBusiness(isBiz);
      if (isBiz) {
        navigate('/dashboard/business', { replace: true });
      }
    };
    check();
    return () => { isMounted = false; };
  }, [user, navigate]);


  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-6">Professional Dashboard</h1>
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="w-5 h-5" />
              Grow your presence
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">Complete your professional profile so others can find and contact you.</p>
            <Button asChild variant="accent">
              <Link to="/edit-profile">Edit Professional Profile</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default ProfessionalDashboard;
