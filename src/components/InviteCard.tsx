import { useQuery } from "@tanstack/react-query";
import type { SupabaseClient } from "@supabase/supabase-js";
import { UserPlus, Copy, Mail, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

const db = supabase as unknown as SupabaseClient;
const SITE = "https://muslimprosnet.com";

/** "Invite a colleague": personal link, share buttons, and how many joined through it. */
const InviteCard = ({ userId }: { userId: string }) => {
  const { toast } = useToast();
  const { data } = useQuery({
    queryKey: ["my-invite", userId],
    queryFn: async () => {
      const { data, error } = await db.rpc("get_my_invite");
      if (error) throw error;
      const row = (Array.isArray(data) ? data[0] : data) as { code: string; joined: number } | undefined;
      return row ?? null;
    },
  });
  if (!data?.code) return null;

  const link = `${SITE}/join/${data.code}`;
  const message = `Assalamu alaikum! I'm on Muslim Pros Network, a free network for Muslim professionals: find mentors, businesses and each other. Join me: ${link}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      toast({ title: "Link copied" });
    } catch {
      toast({ title: "Copy this link", description: link });
    }
  };

  return (
    <Card className="shadow-soft border-primary/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-primary" />
          Invite a colleague
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          The network grows one invite at a time. Know someone who should be here?
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Input value={link} readOnly aria-label="Your invite link" onFocus={(e) => e.currentTarget.select()} />
          <Button type="button" variant="outline" onClick={copy} aria-label="Copy invite link">
            <Copy className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm" variant="accent">
            <a href={`https://wa.me/?text=${encodeURIComponent(message)}`} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="w-4 h-4 mr-2" /> WhatsApp
            </a>
          </Button>
          <Button asChild size="sm" variant="outline">
            <a href={`mailto:?subject=${encodeURIComponent("Join me on Muslim Pros Network")}&body=${encodeURIComponent(message)}`}>
              <Mail className="w-4 h-4 mr-2" /> Email
            </a>
          </Button>
          <Button asChild size="sm" variant="outline">
            <a
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(link)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              LinkedIn
            </a>
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          {data.joined > 0
            ? `${data.joined} ${data.joined === 1 ? "person has" : "people have"} joined through your link. Jazak Allahu khayran!`
            : "No one has joined through your link yet."}
        </p>
      </CardContent>
    </Card>
  );
};

export default InviteCard;
