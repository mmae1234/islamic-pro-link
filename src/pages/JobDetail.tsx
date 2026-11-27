import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Briefcase } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import OpportunityCard from "@/components/OpportunityCard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useOpportunities } from "@/lib/opportunities";

const SITE = "https://muslimprosnet.com";
const EMPLOYMENT: Record<string, string> = { job: "FULL_TIME", internship: "INTERN", contract: "CONTRACTOR", volunteer: "VOLUNTEER" };

/** Shareable page for one opportunity, with schema.org JobPosting data. */
const JobDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { data = [], isLoading } = useOpportunities({ id }, !!user);
  const item = data[0];

  useEffect(() => {
    if (!item) return;
    document.title = `${item.title}${item.business_name ? ` at ${item.business_name}` : ""} | Muslim Professionals Network`;
    const desc = (item.description || item.title).slice(0, 160);
    document.querySelector('meta[name="description"]')?.setAttribute("content", desc);
    const ld = {
      "@context": "https://schema.org",
      "@type": "JobPosting",
      title: item.title,
      description: item.description || item.title,
      datePosted: item.created_at,
      validThrough: item.closes_on ? `${item.closes_on}T23:59:59` : undefined,
      employmentType: EMPLOYMENT[item.kind],
      hiringOrganization: { "@type": "Organization", name: item.business_name ?? undefined },
      jobLocationType: item.workplace === "remote" ? "TELECOMMUTE" : undefined,
      jobLocation:
        item.workplace === "remote"
          ? undefined
          : {
              "@type": "Place",
              address: { "@type": "PostalAddress", addressLocality: item.city ?? undefined, addressRegion: item.state ?? undefined, addressCountry: item.country ?? undefined },
            },
      url: `${SITE}/jobs/${item.id}`,
    };
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = "job-jsonld";
    script.text = JSON.stringify(ld);
    document.getElementById("job-jsonld")?.remove();
    document.head.appendChild(script);
    return () => script.remove();
  }, [item]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-2xl mx-auto space-y-4">
          <Button asChild variant="ghost" size="sm">
            <Link to="/careers"><ArrowLeft className="w-4 h-4 mr-2" /> All opportunities</Link>
          </Button>
          {isLoading ? (
            <p className="text-muted-foreground">Loading…</p>
          ) : !item ? (
            <Card className="shadow-soft">
              <CardContent className="p-10 text-center space-y-2">
                <Briefcase className="w-12 h-12 text-muted-foreground mx-auto" />
                <h1 className="text-xl font-semibold text-foreground">This post isn't available</h1>
                <p className="text-muted-foreground">It may have closed or been removed.</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <h1 className="sr-only">{item.title}</h1>
              <OpportunityCard item={item} signedIn={!!user} full />
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default JobDetail;
