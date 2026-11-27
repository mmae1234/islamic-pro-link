import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Landmark, MapPin, CalendarDays, Search as SearchIcon, BadgeCheck } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import EventCard from "@/components/EventCard";
import { useAuth } from "@/contexts/AuthContext";
import { useCanonicalUrl } from "@/hooks/useCanonicalUrl";
import { useOrganizations, useEvents } from "@/hooks/queries/useOrganizations";
import { ORG_TYPES, orgTypeLabel } from "@/lib/orgTypes";

const Organizations = () => {
  useCanonicalUrl("/organizations");
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get("tab") === "events" ? "events" : "organizations";
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [orgType, setOrgType] = useState("all");

  useEffect(() => {
    document.title = "Organizations & Events | Muslim Professionals Network";
  }, []);

  const orgs = useOrganizations({ search, orgType });
  const events = useEvents(undefined, !!user);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">Organizations &amp; Events</h1>
            <p className="text-lg text-muted-foreground">
              Mosques, student associations, professional associations, charities and schools, and what they have coming up.
            </p>
          </div>

          <Tabs
            value={tab}
            onValueChange={(v) => setSearchParams(v === "events" ? { tab: "events" } : {}, { replace: true })}
            className="space-y-6"
          >
            <TabsList className="grid w-full grid-cols-2 h-auto">
              <TabsTrigger value="organizations">Organizations</TabsTrigger>
              <TabsTrigger value="events">Upcoming events</TabsTrigger>
            </TabsList>

            <TabsContent value="organizations" className="space-y-6">
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
                    placeholder="Search by name or city"
                    className="pl-9"
                    aria-label="Search organizations"
                  />
                </div>
                <Select value={orgType} onValueChange={setOrgType}>
                  <SelectTrigger className="sm:w-64" aria-label="Type of organization">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All types</SelectItem>
                    {ORG_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button type="submit" variant="accent">Search</Button>
              </form>

              {orgs.isLoading ? (
                <p className="text-muted-foreground">Loading organizations…</p>
              ) : (orgs.data ?? []).length === 0 ? (
                <Card className="shadow-soft">
                  <CardContent className="p-10 text-center space-y-3">
                    <Landmark className="w-12 h-12 text-muted-foreground mx-auto" />
                    <h2 className="text-xl font-semibold text-foreground">
                      {search || orgType !== "all" ? "No organizations match" : "The first organizations are joining now"}
                    </h2>
                    <p className="text-muted-foreground">
                      Run a mosque, MSA, professional association, charity or school? List it for free and post your events.
                    </p>
                    <Button asChild variant="hero">
                      <Link to={user ? "/dashboard/business" : "/signup?type=organization"}>List your organization</Link>
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {(orgs.data ?? []).map((o) => {
                    const place = [o.city, o.state, o.country].filter(Boolean).join(", ");
                    const card = (
                      <Card className="shadow-soft h-full hover-lift">
                        <CardContent className="pt-6 space-y-3">
                          <div className="flex items-start gap-3">
                            <Avatar className="w-12 h-12">
                              <AvatarImage src={o.logo_url ?? undefined} alt="" />
                              <AvatarFallback>{(o.name ?? "O").slice(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <h2 className="font-semibold text-foreground flex items-center gap-1">
                                <span className="truncate">{o.name}</span>
                                <BadgeCheck className="w-4 h-4 text-primary shrink-0" aria-label="Verified" />
                              </h2>
                              <Badge variant="secondary" className="mt-1">{orgTypeLabel(o.org_type)}</Badge>
                            </div>
                          </div>
                          {place && (
                            <p className="flex items-center gap-2 text-sm text-muted-foreground">
                              <MapPin className="w-4 h-4" /> {place}
                            </p>
                          )}
                          {o.bio && <p className="text-sm text-foreground line-clamp-3">{o.bio}</p>}
                          {o.upcoming_events > 0 && (
                            <p className="flex items-center gap-2 text-sm text-primary">
                              <CalendarDays className="w-4 h-4" /> {o.upcoming_events} upcoming event{o.upcoming_events === 1 ? "" : "s"}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    );
                    return user ? (
                      <Link key={o.id} to={`/business/${o.id}`} className="block">{card}</Link>
                    ) : (
                      <div key={o.id}>{card}</div>
                    );
                  })}
                </div>
              )}

              {!user && (orgs.data ?? []).length > 0 && (
                <p className="text-sm text-muted-foreground text-center">
                  <Link to="/auth-gate?redirect=/organizations" className="text-primary hover:underline">Sign in</Link> to open an organization's page and contact them.
                </p>
              )}
            </TabsContent>

            <TabsContent value="events" className="space-y-4">
              {events.isLoading ? (
                <p className="text-muted-foreground">Loading events…</p>
              ) : (events.data ?? []).length === 0 ? (
                <Card className="shadow-soft">
                  <CardContent className="p-10 text-center space-y-2">
                    <CalendarDays className="w-12 h-12 text-muted-foreground mx-auto" />
                    <h2 className="text-xl font-semibold text-foreground">No upcoming events yet</h2>
                    <p className="text-muted-foreground">Events from verified organizations will appear here.</p>
                  </CardContent>
                </Card>
              ) : (
                (events.data ?? []).map((e) => <EventCard key={e.id} event={e} signedIn={!!user} />)
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Organizations;
