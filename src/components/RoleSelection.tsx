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

const roleOptions: Array<{
  id: AccountType;
  title: string;
  description: string;
  Icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    id: "visitor",
    title: "Visitor",
    description: "Discover professionals and services. Message and bookmark favorites.",
    Icon: Users,
  },
  {
    id: "professional",
    title: "Professional",
    description: "Create a professional profile, get discovered, and opt into mentorship.",
    Icon: Briefcase,
  },
  {
    id: "business",
    title: "Business",
    description: "Create and manage a business profile to showcase services and team.",
    Icon: Building2,
  },
];

export const RoleSelection = ({ defaultValue = "visitor", onSubmit, onBack }: RoleSelectionProps) => {
  const [value, setValue] = useState<AccountType>(defaultValue);

  return (
    <div className="space-y-6" role="region" aria-label="Select account type">
      <RadioGroup value={value} onValueChange={(v) => setValue(v as AccountType)} className="grid gap-4">
        {roleOptions.map(({ id, title, description, Icon }) => (
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
