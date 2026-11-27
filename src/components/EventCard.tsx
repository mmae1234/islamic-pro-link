import { useState } from "react";
import { Link } from "react-router-dom";
import ReportDialog from "@/components/ReportDialog";
import { CalendarDays, MapPin, Video, ExternalLink, Lock, Flag, Share2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SAFE_HTTPS_URL, urlHost } from "@/lib/orgTypes";

export type EventMode = "in_person" | "online" | "hybrid";

export type PublicEvent = {
  id: string;
  org_id: string;
  org_name: string | null;
  org_logo_url: string | null;
  title: string;
  description: string | null;
  starts_at: string;
  ends_at: string | null;
  timezone: string;
  mode: EventMode;
  venue_name: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  /** null for signed-out visitors */
  address: string | null;
  /** null for signed-out visitors */
  rsvp_url: string | null;
};

/** "Sat, Dec 6 · 6:00 – 8:00 PM PST" in the viewer's own time zone. */
export function formatEventWhen(startsAt: string, endsAt: string | null): string {
  const start = new Date(startsAt);
  const day = start.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  const time = (d: Date, withZone: boolean) =>
    d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit", ...(withZone ? { timeZoneName: "short" } : {}) });
  if (!endsAt) return `${day} · ${time(start, true)}`;
  const end = new Date(endsAt);
  const sameDay = end.toDateString() === start.toDateString();
  return sameDay
    ? `${day} · ${time(start, false)} – ${time(end, true)}`
    : `${day} · ${time(start, false)} – ${end.toLocaleDateString(undefined, { month: "short", day: "numeric" })} ${time(end, true)}`;
}

const modeLabel: Record<EventMode, string> = { in_person: "In person", online: "Online", hybrid: "In person + online" };

/** One event. Links open in a new tab with no referrer/opener, and only https links render. */
const EventCard = ({ event, signedIn, showOrg = true }: { event: PublicEvent; signedIn: boolean; showOrg?: boolean }) => {
  const [reportOpen, setReportOpen] = useState(false);
  const place = [event.venue_name, event.city, event.state].filter(Boolean).join(", ");
  const safeRsvp = event.rsvp_url && SAFE_HTTPS_URL.test(event.rsvp_url) ? event.rsvp_url : null;
  return (
    <Card className="shadow-soft">
      <CardContent className="pt-6 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{modeLabel[event.mode] ?? "Event"}</Badge>
          {showOrg && event.org_name && (
            <Link to={`/business/${event.org_id}`} className="text-sm text-primary hover:underline">
              {event.org_name}
            </Link>
          )}
        </div>
        <h3 className="text-lg font-semibold text-foreground">
          <Link to={`/events/${event.id}`} className="hover:underline">{event.title}</Link>
        </h3>
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarDays className="w-4 h-4 shrink-0" /> {formatEventWhen(event.starts_at, event.ends_at)}
        </p>
        {event.mode !== "online" && (place || event.address) && (
          <p className="flex items-start gap-2 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              {place}
              {event.address && <><br />{event.address}</>}
            </span>
          </p>
        )}
        {event.mode !== "in_person" && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Video className="w-4 h-4 shrink-0" /> Online
          </p>
        )}
        {event.description && (
          <p className="text-sm text-foreground whitespace-pre-wrap break-words line-clamp-6">{event.description}</p>
        )}
        <div className="pt-2 flex flex-wrap items-center gap-2">
          {signedIn ? (
            safeRsvp && (
              <Button asChild size="sm" variant="accent">
                <a href={safeRsvp} target="_blank" rel="noopener noreferrer nofollow ugc" referrerPolicy="no-referrer">
                  RSVP on {urlHost(safeRsvp)} <ExternalLink className="w-4 h-4 ml-1" />
                </a>
              </Button>
            )
          ) : (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Lock className="w-4 h-4" />
              <Link to={`/auth-gate?redirect=/events/${event.id}`} className="text-primary hover:underline">Sign in</Link>
              to see the address and RSVP link.
            </p>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="text-muted-foreground"
            onClick={async () => {
              const url = `https://muslimprosnet.com/events/${event.id}`;
              try {
                if (navigator.share) await navigator.share({ title: event.title, url });
                else await navigator.clipboard.writeText(url);
              } catch {
                /* cancelled */
              }
            }}
          >
            <Share2 className="w-4 h-4 mr-1" /> Share
          </Button>
          {signedIn && (
            <Button size="sm" variant="ghost" className="text-muted-foreground" onClick={() => setReportOpen(true)}>
              <Flag className="w-4 h-4 mr-1" /> Report
            </Button>
          )}
        </div>
        {signedIn && (
          <ReportDialog
            open={reportOpen}
            onOpenChange={setReportOpen}
            accusedId={event.org_id}
            accusedName={event.title}
            eventId={event.id}
            reportType="event"
          />
        )}
      </CardContent>
    </Card>
  );
};

export default EventCard;
