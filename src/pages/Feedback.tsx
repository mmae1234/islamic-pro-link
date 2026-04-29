import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Lightbulb, Star } from "lucide-react";
import { cn } from "@/lib/utils";

const setSeo = (title: string, description?: string) => {
  document.title = title;
  if (description) {
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', description);
    }
  }
};

type FeedbackCategory = "bug" | "idea" | "general" | "ux" | "praise";

const CATEGORY_LABELS: Record<FeedbackCategory, string> = {
  bug: "🐞 Bug / Something broken",
  idea: "💡 Feature idea / Suggestion",
  ux: "🎨 Design or usability",
  praise: "⭐ Praise / What you love",
  general: "💬 General feedback",
};

const Feedback = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState<FeedbackCategory | "">("");
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setSeo(
      'Feedback – Muslim Professionals Network',
      'Share your ideas, report bugs, and help shape the Muslim Professionals Network platform during our beta.'
    );
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !email || !category || !subject || !message) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields before submitting.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const categoryLabel = CATEGORY_LABELS[category as FeedbackCategory];
      const ratingLine =
        rating > 0 ? `Overall rating: ${rating}/5 ⭐` : "Overall rating: (not provided)";
      const composedSubject = `[${categoryLabel}] ${subject}`.slice(0, 200);
      const composedMessage = `Category: ${categoryLabel}\n${ratingLine}\n\n---\n\n${message}`;

      const { error } = await supabase.functions.invoke('send-contact-email', {
        body: {
          name,
          email,
          subject: composedSubject,
          message: composedMessage,
          type: 'feedback',
        },
      });

      if (error) throw error;

      toast({
        title: "Feedback sent!",
        description: "Thank you — your input genuinely shapes what we build next.",
      });

      setName("");
      setEmail("");
      setCategory("");
      setRating(0);
      setSubject("");
      setMessage("");
    } catch (error: unknown) {
      console.error('Error sending feedback:', error);
      toast({
        title: "Error",
        description: "Failed to send feedback. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <Lightbulb className="h-12 w-12 text-primary" />
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-accent mb-3">
              Beta
            </div>
            <h1 className="text-4xl font-bold mb-4">Help Us Build a Better Platform</h1>
            <p className="text-muted-foreground">
              We're in early beta and your feedback genuinely shapes what we build next.
              Report a bug, suggest a feature, or just tell us what you think.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Share Your Feedback</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      placeholder="Your full name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      maxLength={100}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your.email@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      maxLength={254}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={category}
                    onValueChange={(v) => setCategory(v as FeedbackCategory)}
                  >
                    <SelectTrigger id="category">
                      <SelectValue placeholder="What's this feedback about?" />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(CATEGORY_LABELS) as FeedbackCategory[]).map((key) => (
                        <SelectItem key={key} value={key}>
                          {CATEGORY_LABELS[key]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Overall experience (optional)</Label>
                  <div
                    className="flex items-center gap-1"
                    onMouseLeave={() => setHoverRating(0)}
                    role="radiogroup"
                    aria-label="Rate your overall experience"
                  >
                    {[1, 2, 3, 4, 5].map((n) => {
                      const active = (hoverRating || rating) >= n;
                      return (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setRating(n === rating ? 0 : n)}
                          onMouseEnter={() => setHoverRating(n)}
                          className="p-1 rounded-md hover:bg-accent/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          aria-label={`${n} star${n > 1 ? "s" : ""}`}
                          aria-pressed={rating === n}
                        >
                          <Star
                            className={cn(
                              "h-7 w-7 transition-colors",
                              active
                                ? "fill-accent text-accent"
                                : "text-muted-foreground"
                            )}
                          />
                        </button>
                      );
                    })}
                    {rating > 0 && (
                      <span className="ml-2 text-sm text-muted-foreground">
                        {rating}/5
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">Subject *</Label>
                  <Input
                    id="subject"
                    placeholder="One-line summary"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    maxLength={150}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Your Feedback *</Label>
                  <Textarea
                    id="message"
                    placeholder="Tell us what happened, what you'd like to see, or what you love. The more detail, the better!"
                    rows={8}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    maxLength={5000}
                    required
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {message.length}/5000
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Sending..." : "Send Feedback"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="mt-8 text-center text-sm text-muted-foreground">
            <p>
              Found a security issue instead?{" "}
              <a href="/contact" className="underline hover:text-accent">
                Contact us privately
              </a>
              .
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Feedback;
