import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Briefcase, Search as SearchIcon } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import OpportunityCard from "@/components/OpportunityCard";
import { useAuth } from "@/contexts/AuthContext";
import { useCanonicalUrl } from "@/hooks/useCanonicalUrl";
import { OPPORTUNITY_KINDS, useOpportunities } from "@/lib/opportunities";

/** Jobs & opportunities posted by businesses and approved organizations. */
const Careers = () => {
  useCanonicalUrl("/careers");
  const { user } = useAuth();
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [kind, setKind] = useState("all");
  const { data: items = [], isLoading } = useOpportunities({ kind, search }, !!user);

  useEffect(() => {
    document.title = "Jobs & Opportunities | Muslim Professionals Network";
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">Jobs &amp; Opportunities</h1>
            <p className="text-lg text-muted-foreground">
              Jobs, internships, contract work and volunteer roles from Muslim-owned businesses and organizations.
            </p>
          </div>

          <form
            className="flex flex-col sm:flex-row gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              setSearch(searchInput);
            }}
          >
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search title, company or city"
                className="pl-9"
                aria-label="Search opportunities"
              />
            </div>
            <Select value={kind} onValueChange={setKind}>
              <SelectTrigger className="sm:w-56" aria-label="Type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                {OPPORTUNITY_KINDS.map((k) => (
                  <SelectItem key={k.value} value={k.value}>{k.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button type="submit" variant="accent">Search</Button>
          </form>

          {isLoading ? (
            <p className="text-muted-foreground">Loading…</p>
          ) : items.length === 0 ? (
            <Card className="shadow-soft">
              <CardContent className="p-10 text-center space-y-3">
                <Briefcase className="w-12 h-12 text-muted-foreground mx-auto" />
                <h2 className="text-xl font-semibold text-foreground">
                  {search || kind !== "all" ? "Nothing matches yet" : "Be the first to post an opportunity"}
                </h2>
                <p className="text-muted-foreground">
                  Hiring, or need volunteers? Post it from your business or organization dashboard. It's free.
                </p>
                <Button asChild variant="hero">
                  <Link to={user ? "/dashboard/business" : "/signup?type=business"}>Post an opportunity</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {items.map((o) => (
                <OpportunityCard key={o.id} item={o} signedIn={!!user} />
              ))}
            </div>
          )}

          <p className="text-xs text-muted-foreground text-center">
            Never pay to apply for a job or share bank details with an employer you haven't verified. Report suspicious posts.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Careers;
