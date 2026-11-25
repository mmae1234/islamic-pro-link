import { useState } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Users, Briefcase, Building2 } from "lucide-react";

export type AccountType = "visitor" | "professional" | "business";

interface RoleSelectionProps {
  defaultValue?: AccountType;
  onSubmit: (value: AccountType) => void;
  onBack?: () => void;
}

// Professional first and preselected: the directory only grows from
// professional profiles.
const roleOptions: Array<{
  id: AccountType;
  title: string;
  description: string;
  Icon: React.ComponentType<{ className?: string }>;
  recommended?: boolean;
}> = [
  {
    id: "professional",
    title: "I'm a working professional",
    description:
      "Get a profile in the directory, connect with other Muslim professionals, and find or offer mentorship. Students and job seekers welcome.",
    Icon: Briefcase,
    recommended: true,
  },
  {
    id: "business",
    title: "I represent a business",
    description: "List your business so members can find your services and team.",
    Icon: Building2,
  },
  {
    id: "visitor",
    title: "I'm just looking",
    description: "Browse and message members without a profile of your own. You can add one later.",
    Icon: Users,
  },
];

export const RoleSelection = ({ defaultValue = "professional", onSubmit, onBack }: RoleSelectionProps) => {
  const [value, setValue] = useState<AccountType>(defaultValue);

  return (
    <div className="space-y-6" role="region" aria-label="Select account type">
      <RadioGroup value={value} onValueChange={(v) => setValue(v as AccountType)} className="grid gap-4">
        {roleOptions.map(({ id, title, description, Icon, recommended }) => (
          <label
            key={id}
            htmlFor={`role-${id}`}
            className="flex items-start gap-4 p-4 border border-border rounded-xl bg-card hover:bg-accent/5 focus-within:ring-2 focus-within:ring-ring cursor-pointer"
          >
            <RadioGroupItem id={`role-${id}`} value={id} className="mt-1" aria-labelledby={`label-${id}`} />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Icon className="w-5 h-5 text-primary" aria-hidden="true" />
                <span id={`label-${id}`} className="font-semibold text-foreground">
                  {title}
                </span>
                {recommended && (
                  <span className="text-xs font-medium text-primary bg-primary/10 rounded-full px-2 py-0.5">
                    Recommended
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1">{description}</p>
            </div>
          </label>
        ))}
      </RadioGroup>

      <div className="flex gap-3">
        {onBack && (
          <Button variant="outline" className="flex-1" onClick={onBack} aria-label="Go back">
            Back
          </Button>
        )}
        <Button className="flex-1" variant="hero" onClick={() => onSubmit(value)} aria-label="Continue">
          Continue
        </Button>
      </div>
    </div>
  );
};

export default RoleSelection;
