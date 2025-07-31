import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { MapPin, MessageCircle, Calendar, Star, Users, Heart } from 'lucide-react';

interface Professional {
  id: string;
  user_id: string;
  bio: string;
  occupation: string;
  sector: string;
  city: string;
  country: string;
  university: string;
  experience_years: number;
  skills: string[];
  is_mentor: boolean;
  is_seeking_mentor: boolean;
  availability: string;
  avatar_url: string | null;
  profiles?: {
    full_name: string;
    avatar_url: string | null;
  };
}

interface ProfessionalCardProps {
  professional: Professional;
  onRequestSent?: () => void;
  showMentorshipButton?: boolean; // New prop to control mentorship button visibility
  showFavoriteButton?: boolean; // New prop to control favorite button visibility
}

const ProfessionalCard = ({ 
  professional, 
  onRequestSent, 
  showMentorshipButton = true, 
  showFavoriteButton = true 
}: ProfessionalCardProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false);
  const [requestMessage, setRequestMessage] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);

  const sendMentorshipRequest = async () => {
    if (!user || !requestMessage.trim()) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('mentorship_requests')
        .insert({
          mentor_id: professional.user_id,
          mentee_id: user.id,
          message: requestMessage,
          skills_requested: professional.skills.slice(0, 3) // Include some relevant skills
        });

      if (error) throw error;

      toast({
        title: "Mentorship request sent!",
        description: "Your request has been sent to the mentor.",
      });

      setIsRequestDialogOpen(false);
      setRequestMessage('');
      onRequestSent?.();
    } catch (error: any) {
      toast({
        title: "Error sending request",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!user || !messageContent.trim()) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          recipient_id: professional.user_id,
          content: messageContent
        });

      if (error) throw error;

      toast({
        title: "Message sent!",
        description: "Your message has been sent.",
      });

      setIsMessageDialogOpen(false);
      setMessageContent('');
    } catch (error: any) {
      toast({
        title: "Error sending message",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async () => {
    if (!user) return;

    setLoading(true);
    try {
      if (isFavorited) {
        // Remove from favorites
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('professional_id', professional.user_id);

        if (error) throw error;

        toast({
          title: "Removed from favorites",
          description: "Professional removed from your favorites.",
        });
        setIsFavorited(false);
      } else {
        // Add to favorites
        const { error } = await supabase
          .from('favorites')
          .insert({
            user_id: user.id,
            professional_id: professional.user_id
          });

        if (error) throw error;

        toast({
          title: "Added to favorites",
          description: "Professional added to your favorites.",
        });
        setIsFavorited(true);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const isOwnProfile = user?.id === professional.user_id;

  return (
    <Card className="shadow-soft hover:shadow-elegant transition-smooth hover-lift bg-gradient-card border border-border/50 backdrop-blur-sm">
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Avatar and Basic Info */}
          <div className="flex items-start gap-4 flex-1">
            <Avatar className="w-20 h-20 flex-shrink-0 border-2 border-primary/20 shadow-soft">
              <AvatarImage 
                src={professional.avatar_url || professional.profiles?.avatar_url || undefined} 
                alt={professional.profiles?.full_name || 'User avatar'} 
              />
              <AvatarFallback className="text-lg font-semibold bg-gradient-primary text-primary-foreground">
                {getInitials(professional.profiles?.full_name || 'U')}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-lg font-semibold text-foreground truncate">
                  {professional.profiles?.full_name || 'Anonymous User'}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {professional.is_mentor && (
                    <Badge className="text-xs bg-gradient-to-r from-green-500/20 to-green-600/20 text-green-700 border-green-500/30 hover:shadow-glow">
                      <Users className="w-3 h-3 mr-1" />
                      Mentor Available
                    </Badge>
                  )}
                  {professional.is_seeking_mentor && (
                    <Badge className="text-xs bg-gradient-to-r from-blue-500/20 to-blue-600/20 text-blue-700 border-blue-500/30 hover:shadow-glow">
                      <Star className="w-3 h-3 mr-1" />
                      Seeking Mentor
                    </Badge>
                  )}
                </div>
              </div>
              
              <p className="text-primary font-medium text-lg mb-1">{professional.occupation}</p>
              <p className="text-muted-foreground text-sm mb-3">{professional.sector}</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm mb-4">
                <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span>{professional.city && professional.country 
                    ? `${professional.city}, ${professional.country}` 
                    : 'Location not specified'
                  }</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span>{professional.experience_years} years experience</span>
                </div>
              </div>

              {professional.bio && (
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {professional.bio}
                </p>
              )}

              {/* Skills */}
              {professional.skills && professional.skills.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">Skills & Expertise</p>
                  <div className="flex flex-wrap gap-2">
                    {professional.skills.slice(0, 6).map((skill, index) => (
                      <Badge 
                        key={skill} 
                        variant="outline" 
                        className="text-xs hover:bg-primary/10 hover:border-primary/30 transition-colors"
                        style={{ animationDelay: `${index * 0.1}s` }}
                      >
                        {skill}
                      </Badge>
                    ))}
                    {professional.skills.length > 6 && (
                      <Badge variant="outline" className="text-xs bg-accent/10 text-accent-foreground">
                        +{professional.skills.length - 6} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          {!isOwnProfile && (
            <div className="flex flex-col sm:flex-row lg:flex-col gap-3 lg:min-w-fit lg:w-40">
              <Dialog open={isMessageDialogOpen} onOpenChange={setIsMessageDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="flex items-center gap-2 hover:shadow-soft lg:w-full">
                    <MessageCircle className="w-4 h-4" />
                    Send Message
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Send Message</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="message">Message</Label>
                      <Textarea
                        id="message"
                        value={messageContent}
                        onChange={(e) => setMessageContent(e.target.value)}
                        placeholder="Write your message..."
                        rows={4}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        onClick={sendMessage} 
                        disabled={!messageContent.trim() || loading}
                        className="flex-1"
                      >
                        {loading ? 'Sending...' : 'Send Message'}
                      </Button>
                      <Button variant="outline" onClick={() => setIsMessageDialogOpen(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              {showFavoriteButton && (
                <Button 
                  variant={isFavorited ? "default" : "outline"} 
                  size="sm" 
                  onClick={toggleFavorite}
                  disabled={loading}
                  className="flex items-center gap-2 lg:w-full"
                >
                  <Heart className={`w-4 h-4 ${isFavorited ? 'fill-current' : ''}`} />
                  {isFavorited ? 'Favorited' : 'Add to Favorites'}
                </Button>
              )}

              {showMentorshipButton && professional.is_mentor && (
                <Dialog open={isRequestDialogOpen} onOpenChange={setIsRequestDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="accent" size="sm" className="flex items-center gap-2 hover:shadow-glow lg:w-full">
                      <Calendar className="w-4 h-4" />
                      Request Mentorship
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Request Mentorship</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="request-message">Why would you like this person as a mentor?</Label>
                        <Textarea
                          id="request-message"
                          value={requestMessage}
                          onChange={(e) => setRequestMessage(e.target.value)}
                          placeholder="Explain why you're interested in this mentorship and what you hope to achieve..."
                          rows={4}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          onClick={sendMentorshipRequest} 
                          disabled={!requestMessage.trim() || loading}
                          className="flex-1"
                        >
                          {loading ? 'Sending...' : 'Send Request'}
                        </Button>
                        <Button variant="outline" onClick={() => setIsRequestDialogOpen(false)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfessionalCard;