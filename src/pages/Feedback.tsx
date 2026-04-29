import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Lightbulb } from "lucide-react";

const setSeo = (title: string, description?: string) => {
  document.title = title;
  if (description) {
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', description);
    }
  }
};

const Feedback = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useState(() => {
    setSeo('Feedback – Muslim Pros', 'Share your ideas and suggestions to help us improve the Muslim Pros platform');
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !email || !subject || !message) {
      toast({
        title: "Missing information",
        description: "Please fill in all fields before submitting.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const { error } = await supabase.functions.invoke('send-contact-email', {
        body: {
          name,
          email,
          subject,
          message,
          type: 'feedback'
        }
      });

      if (error) throw error;

      toast({
        title: "Feedback sent!",
        description: "Thank you for your feedback. We appreciate your input and will review it carefully.",
      });

      // Reset form
      setName("");
      setEmail("");
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
            <h1 className="text-4xl font-bold mb-4">Share Your Ideas</h1>
            <p className="text-muted-foreground">
              We value your feedback and ideas. Help us improve the Muslim Pros platform 
              by sharing your thoughts, suggestions, and feature requests.
            </p>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Submit Feedback</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input 
                    id="name" 
                    placeholder="Your full name" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="your.email@example.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input 
                    id="subject" 
                    placeholder="Brief description of your feedback" 
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Your Feedback</Label>
                  <Textarea 
                    id="message" 
                    placeholder="Share your ideas, suggestions, or feature requests..." 
                    rows={8}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                  />
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
              Your feedback helps us build a better platform for the Muslim professional community. 
              Thank you for taking the time to share your thoughts with us.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Feedback;