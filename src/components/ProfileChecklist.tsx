import { Link } from "react-router-dom";
import { CheckCircle2, Circle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

export type ChecklistItem = { label: string; done: boolean; hint?: string };

type ProfileFields = {
  first_name?: string | null;
  last_name?: string | null;
  avatar_url?: string | null;
};
type ProfessionalFields = {
  avatar_url?: string | null;
  occupation?: string | null;
  sector?: string | null;
  city?: string | null;
  country?: string | null;
  bio?: string | null;
  skills?: string[] | null;
  experience_years?: number | null;
};

const filled = (v: unknown) => typeof v === "string" ? v.trim().length > 0 : v !== null && v !== undefined;

/** The things that make a profile findable and worth contacting, in priority order. */
export function buildProfileChecklist(
  profile: ProfileFields | null,
  pro: ProfessionalFields | null,
): ChecklistItem[] {
  return [
    {
      label: "Add your full name",
      done: filled(profile?.first_name) && filled(profile?.last_name),
      hint: "Profiles without a name are hidden from the directory.",
    },
    { label: "Add your job title", done: filled(pro?.occupation), hint: "It's the first thing people search for." },
    { label: "Add a profile photo", done: filled(profile?.avatar_url) || filled(pro?.avatar_url), hint: "Members are far more likely to reply to a face." },
    { label: "Add your city and country", done: filled(pro?.city) && filled(pro?.country) },
    { label: "Pick your field", done: filled(pro?.sector) },
    { label: "Write a short bio", done: filled(pro?.bio), hint: "Two or three sentences about what you do." },
    { label: "List a few skills", done: (pro?.skills?.length ?? 0) > 0 },
    { label: "Add years of experience", done: pro?.experience_years !== null && pro?.experience_years !== undefined },
  ];
}

/**
 * Concrete "what's missing" list instead of a bare percentage. Shows the first
 * few open items with a link to fix them; hides itself when everything's done.
 */
const ProfileChecklist = ({ items, maxOpen = 4 }: { items: ChecklistItem[]; maxOpen?: number }) => {
  const doneCount = items.filter((i) => i.done).length;
  if (doneCount === items.length) return null;
  const percent = Math.round((doneCount / items.length) * 100);
  const open = items.filter((i) => !i.done).slice(0, maxOpen);
  const hidden = items.length - doneCount - open.length;

  return (
    <Card className="shadow-soft border-primary/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Finish your profile</CardTitle>
        <p className="text-sm text-muted-foreground">
          Complete profiles show up in more searches and get more replies.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              {doneCount} of {items.length} done
            </span>
            <span className="font-medium">{percent}%</span>
          </div>
          <Progress value={percent} className="h-2" aria-label={`Profile ${percent}% complete`} />
        </div>
        <ul className="space-y-3">
          {open.map((item) => (
            <li key={item.label} className="flex gap-3">
              <Circle className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <p className="text-sm font-medium text-foreground">{item.label}</p>
                {item.hint && <p className="text-xs text-muted-foreground">{item.hint}</p>}
              </div>
            </li>
          ))}
          {items
            .filter((i) => i.done)
            .slice(0, 2)
            .map((item) => (
              <li key={item.label} className="flex gap-3 text-muted-foreground">
                <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" aria-hidden="true" />
                <p className="text-sm line-through">{item.label}</p>
              </li>
            ))}
        </ul>
        {hidden > 0 && <p className="text-xs text-muted-foreground">+{hidden} more</p>}
        <Button asChild size="sm" variant="hero">
          <Link to="/edit-profile">Complete my profile</Link>
        </Button>
      </CardContent>
    </Card>
  );
};

export default ProfileChecklist;
