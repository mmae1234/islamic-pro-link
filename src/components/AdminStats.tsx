import { useQuery } from "@tanstack/react-query";
import type { SupabaseClient } from "@supabase/supabase-js";
import { BarChart3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const db = supabase as unknown as SupabaseClient;

type Week = {
  week: string;
  signups: number;
  messages: number;
  new_conversations: number;
  replied: number;
  active_members: number;
};
type Totals = Record<string, number>;

const TOTAL_LABELS: Array<[string, string]> = [
  ["members", "Members"],
  ["professional_profiles", "In the directory"],
  ["with_photo", "With a photo"],
  ["mentors", "Mentors"],
  ["active_mentorships", "Active mentorships"],
  ["businesses", "Businesses"],
  ["organizations_approved", "Organizations"],
  ["organizations_waiting", "Orgs waiting"],
  ["upcoming_events", "Upcoming events"],
  ["joined_by_invite", "Joined by invite"],
  ["open_reports", "Open reports"],
];

const shortWeek = (iso: string) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" });

/** One small bar chart: 12 weeks, latest on the right, value labels on hover and for screen readers. */
function MiniBars({ title, weeks, value, format = (n: number) => String(n), note }: {
  title: string;
  weeks: Week[];
  value: (w: Week) => number | null;
  format?: (n: number) => string;
  note?: string;
}) {
  const values = weeks.map(value);
  const max = Math.max(1, ...values.map((v) => v ?? 0));
  const last = values[values.length - 1];
  const prev = values[values.length - 2];
  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-medium text-foreground">{title}</h3>
        <span className="text-sm text-muted-foreground">
          This week: <strong className="text-foreground">{last === null ? "–" : format(last)}</strong>
          {prev !== null && last !== null && <> · last week {format(prev)}</>}
        </span>
      </div>
      <div className="mt-3 flex items-end gap-1 h-24" role="img" aria-label={`${title} by week`}>
        {weeks.map((w, i) => {
          const v = values[i];
          const h = v === null ? 0 : Math.max(2, Math.round((v / max) * 96));
          return (
            <div key={w.week} className="flex-1 flex flex-col justify-end h-full" title={`${shortWeek(w.week)}: ${v === null ? "no data" : format(v)}`}>
              <div
                className={`rounded-sm ${i === weeks.length - 1 ? "bg-primary" : "bg-primary/40"}`}
                style={{ height: `${h}px` }}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-1 flex justify-between text-[11px] text-muted-foreground">
        <span>{weeks[0] && shortWeek(weeks[0].week)}</span>
        <span>{weeks.length > 0 && shortWeek(weeks[weeks.length - 1].week)}</span>
      </div>
      {note && <p className="mt-2 text-xs text-muted-foreground">{note}</p>}
    </div>
  );
}

/** Admin: weekly growth and engagement. */
const AdminStats = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const { data, error } = await db.rpc("admin_stats");
      if (error) throw error;
      return data as { weeks: Week[]; totals: Totals };
    },
  });

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          Site stats
        </CardTitle>
        <p className="text-sm text-muted-foreground">Last 12 weeks, Monday to Sunday (Pacific).</p>
      </CardHeader>
      <CardContent className="space-y-6">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : error || !data ? (
          <p className="text-sm text-muted-foreground">Couldn't load stats.</p>
        ) : (
          <>
            <dl className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {TOTAL_LABELS.map(([key, label]) => (
                <div key={key} className="rounded-lg bg-muted p-3">
                  <dt className="text-xs text-muted-foreground">{label}</dt>
                  <dd className="text-2xl font-semibold text-foreground">{data.totals[key] ?? 0}</dd>
                </div>
              ))}
            </dl>
            <div className="grid gap-4 md:grid-cols-2">
              <MiniBars title="New members" weeks={data.weeks} value={(w) => w.signups} />
              <MiniBars
                title="Active members"
                weeks={data.weeks}
                value={(w) => w.active_members}
                note="Sent a message or mentorship request, or posted an event."
              />
              <MiniBars title="Messages sent" weeks={data.weeks} value={(w) => w.messages} />
              <MiniBars
                title="Reply rate"
                weeks={data.weeks}
                value={(w) => (w.new_conversations > 0 ? Math.round((w.replied / w.new_conversations) * 100) : null)}
                format={(n) => `${n}%`}
                note="Share of new conversations where the other person wrote back."
              />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminStats;
