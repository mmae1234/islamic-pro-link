import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { MapPin, GraduationCap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type PreviewRow = {
  first_name: string;
  last_initial: string | null;
  occupation: string | null;
  sector: string | null;
  city: string | null;
  state_province: string | null;
  country: string | null;
  is_mentor: boolean;
};

/**
 * Limited directory preview for signed-out visitors (public_directory_preview
 * RPC): first name + last initial, job, field, city. No photos, no profile
 * links, no contact details. Members can opt out in Settings > Privacy.
 */
const PublicDirectoryPreview = () => {
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["public-directory-preview"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("public_directory_preview", { _limit: 12 });
      if (error) throw error;
      return (data ?? []) as PreviewRow[];
    },
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading || rows.length === 0) return null;

  return (
    <section className="mt-8" aria-labelledby="preview-heading">
      <div className="flex items-end justify-between gap-4 mb-4">
        <h2 id="preview-heading" className="text-xl font-semibold text-foreground">
          Some of our members
        </h2>
        <p className="text-sm text-muted-foreground hidden sm:block">
          Sign in to see full profiles and send messages
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((r, i) => {
          const name = r.last_initial ? `${r.first_name} ${r.last_initial}.` : r.first_name;
          const place = [r.city, r.state_province || r.country].filter(Boolean).join(", ");
          return (
            <Card key={`${name}-${i}`} className="shadow-soft">
              <CardContent className="p-5 flex gap-4 items-start">
                <div
                  aria-hidden="true"
                  className="w-12 h-12 shrink-0 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold"
                >
                  {r.first_name.charAt(0).toUpperCase()}
                  {r.last_initial ?? ""}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-foreground truncate">{name}</p>
                  {r.occupation && (
                    <p className="text-sm text-muted-foreground truncate">{r.occupation}</p>
                  )}
                  {place && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                      <MapPin className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                      <span className="truncate">{place}</span>
                    </p>
                  )}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {r.sector && <Badge variant="secondary">{r.sector}</Badge>}
                    {r.is_mentor && (
                      <Badge variant="outline" className="gap-1">
                        <GraduationCap className="w-3 h-3" aria-hidden="true" />
                        Mentor
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      <div className="text-center mt-6">
        <Button asChild variant="hero">
          <Link to="/signup?redirect=/search">Join free to connect</Link>
        </Button>
      </div>
    </section>
  );
};

export default PublicDirectoryPreview;
