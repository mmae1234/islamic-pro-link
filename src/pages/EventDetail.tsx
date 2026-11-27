import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ArrowLeft, CalendarDays } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import EventCard, { type PublicEvent } from "@/components/EventCard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const db = supabase as unknown as SupabaseClient;
const SITE = "https://muslimprosnet.com";

const setMeta = (name: string, content: string, attr: "name" | "property" = "name") => {
  let el = document.querySelector(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
};

/** Shareable page for one event, with schema.org Event data for search engines. */
const EventDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { data: event, isLoading } = useQuery({
    queryKey: ["event", id, !!user],
    enabled: !!id,
    queryFn: async (): Promise<PublicEvent | null> => {
      const { data, error } = await db.rpc("get_event", { _id: id });
      if (error) throw error;
      return ((Array.isArray(data) ? data[0] : data) as PublicEvent | undefined) ?? null;
    },
  });

  useEffect(() => {
    if (!event) return;
    const place = [event.city, event.state].filter(Boolean).join(", ");
    const description = (event.description || `${event.title} by ${event.org_name ?? "a Muslim organization"}${place ? ` in ${place}` : ""}.`).slice(0, 160);
    document.title = `${event.title} | Muslim Professionals Network`;
    setMeta("description", description);
    setMeta("og:title", event.title, "property");
    setMeta("og:description", description, "property");
    setMeta("og:url", `${SITE}/events/${event.id}`, "property");

    // schema.org Event (Google event results). No street address / RSVP link:
    // those stay members-only.
    const ld = {
      "@context": "https://schema.org",
      "@type": "Event",
      name: event.title,
      description: event.description ?? undefined,
      startDate: event.starts_at,
      endDate: event.ends_at ?? undefined,
      eventStatus: "https://schema.org/EventScheduled",
      eventAttendanceMode:
        event.mode === "online"
          ? "https://schema.org/OnlineEventAttendanceMode"
          : event.mode === "hybrid"
            ? "https://schema.org/MixedEventAttendanceMode"
            : "https://schema.org/OfflineEventAttendanceMode",
      location:
        event.mode === "online"
          ? { "@type": "VirtualLocation", url: `${SITE}/events/${event.id}` }
          : {
              "@type": "Place",
              name: event.venue_name || place || "See event page",
              address: { "@type": "PostalAddress", addressLocality: event.city ?? undefined, addressRegion: event.state ?? undefined, addressCountry: event.country ?? undefined },
            },
      organizer: { "@type": "Organization", name: event.org_name ?? undefined },
      url: `${SITE}/events/${event.id}`,
    };
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = "event-jsonld";
    script.text = JSON.stringify(ld);
    document.getElementById("event-jsonld")?.remove();
    document.head.appendChild(script);
    return () => script.remove();
  }, [event]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-2xl mx-auto space-y-4">
          <Button asChild variant="ghost" size="sm">
            <Link to="/organizations?tab=events">
              <ArrowLeft className="w-4 h-4 mr-2" /> All events
            </Link>
          </Button>
          {isLoading ? (
            <p className="text-muted-foreground">Loading event…</p>
          ) : !event ? (
            <Card className="shadow-soft">
              <CardContent className="p-10 text-center space-y-2">
                <CalendarDays className="w-12 h-12 text-muted-foreground mx-auto" />
                <h1 className="text-xl font-semibold text-foreground">Event not found</h1>
                <p className="text-muted-foreground">It may have been removed or hasn't been approved yet.</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <h1 className="sr-only">{event.title}</h1>
              <EventCard event={event} signedIn={!!user} />
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default EventDetail;
