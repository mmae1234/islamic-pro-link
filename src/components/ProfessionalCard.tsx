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
import { MapPin, Mail, MessageCircle, Calendar, Star, Users } from 'lucide-react';

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
}

const ProfessionalCard = ({ professional, onRequestSent }: ProfessionalCardProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false);
  const [requestMessage, setRequestMessage] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [loading, setLoading] = useState(false);

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

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const isOwnProfile = user?.id === professional.user_id;

  return (
    <Card className="shadow-soft hover:shadow-elegant transition-smooth">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Avatar and Basic Info */}
          <div className="flex items-start gap-3">
            <Avatar className="w-16 h-16 flex-shrink-0">
              <AvatarImage 
                src={professional.avatar_url || professional.profiles?.avatar_url || undefined} 
                alt={professional.profiles?.full_name || 'User avatar'} 
              />
              <AvatarFallback className="text-lg font-semibold">
                {getInitials(professional.profiles?.full_name || 'U')}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-lg font-semibold text-foreground truncate">
                  {professional.profiles?.full_name || 'Anonymous User'}
                </h3>
                <div className="flex gap-1">
                  {professional.is_mentor && (
                    <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                      <Users className="w-3 h-3 mr-1" />
                      Mentor
                    </Badge>
                  )}
                  {professional.is_seeking_mentor && (
                    <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                      <Star className="w-3 h-3 mr-1" />
                      Seeking Mentor
                    </Badge>
                  )}
                </div>
              </div>
              
              <p className="text-muted-foreground mb-2">{professional.occupation}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground mb-3">
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {professional.city && professional.country 
                    ? `${professional.city}, ${professional.country}` 
                    : 'Location not specified'
                  }
                </div>
                <div>
                  <strong>Sector:</strong> {professional.sector}
                </div>
                <div>
                  <strong>Experience:</strong> {professional.experience_years} years
                </div>
                <div>
                  <strong>Availability:</strong> {professional.availability || 'Not specified'}
                </div>
              </div>

              {professional.bio && (
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {professional.bio}
                </p>
              )}

              {/* Skills */}
              {professional.skills && professional.skills.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-4">
                  {professional.skills.slice(0, 5).map(skill => (
                    <Badge key={skill} variant="outline" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                  {professional.skills.length > 5 && (
                    <Badge variant="outline" className="text-xs">
                      +{professional.skills.length - 5} more
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          {!isOwnProfile && (
            <div className="flex flex-col gap-2 min-w-fit">
              <Dialog open={isMessageDialogOpen} onOpenChange={setIsMessageDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4" />
                    Message
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

              {professional.is_mentor && (
                <Dialog open={isRequestDialogOpen} onOpenChange={setIsRequestDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="flex items-center gap-2">
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