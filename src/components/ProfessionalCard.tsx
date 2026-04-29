import { useState, useEffect } from 'react';
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
import { MapPin, MessageCircle, Calendar, Star, Users, Heart, Flag, MoreVertical } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Link } from 'react-router-dom';
import ReportDialog from '@/components/ReportDialog';
import BlockUserButton from '@/components/BlockUserButton';
import { getErrorMessage } from "@/lib/errors";

// Loose superset matching what `list_professional_directory` returns plus the
// synthesized `profiles` slice the card expects. Most fields are nullable in
// the DB; we accept that here so callers don't have to assert non-null.
interface Professional {
  id?: string;
  user_id: string;
  first_name?: string | null;
  last_name?: string | null;
  bio?: string | null;
  occupation?: string | null;
  sector?: string | null;
  city?: string | null;
  country?: string | null;
  university?: string | null;
  experience_years?: number | null;
  skills?: string[] | null;
  is_mentor?: boolean | null;
  is_seeking_mentor?: boolean | null;
  availability?: string | null;
  avatar_url?: string | null;
  profiles?: {
    first_name?: string | null;
    last_name?: string | null;
    avatar_url?: string | null;
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
  const [showReportDialog, setShowReportDialog] = useState(false);

  // Check if professional is favorited on mount
  useEffect(() => {
    if (user && showFavoriteButton) {
      checkFavoriteStatus();
    }
  }, [user, professional.user_id, showFavoriteButton]);

  const checkFavoriteStatus = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('professional_id', professional.user_id)
        .maybeSingle();

      if (error) throw error;
      setIsFavorited(!!data);
    } catch (error) {
      console.error('Error checking favorite status:', error);
    }
  };

  const sendMentorshipRequest = async () => {
    if (!user || !requestMessage.trim()) return;
    if (requestMessage.trim().length < 30) {
      toast({
        title: "Message too short",
        description: "Please write at least 30 characters introducing yourself.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.rpc('request_mentorship', {
        _mentor_id: professional.user_id,
        _message: requestMessage.trim(),
        _skills_requested: (professional.skills || []).slice(0, 3),
      });

      if (error) throw error;

      toast({
        title: "Mentorship request sent!",
        description: "Your request has been sent to the mentor.",
      });

      setIsRequestDialogOpen(false);
      setRequestMessage('');
      onRequestSent?.();
    } catch (error: unknown) {
      toast({
        title: "Could not send request",
        description: getErrorMessage(error) || "Please try again later.",
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
      const { error } = await supabase.rpc('send_message', {
        _recipient_id: professional.user_id,
        _content: messageContent,
      });

      if (error) throw error;

      toast({
        title: "Message sent!",
        description: "Your message has been sent.",
      });

      setIsMessageDialogOpen(false);
      setMessageContent('');
    } catch (error: unknown) {
      toast({
        title: "Error sending message",
        description: getErrorMessage(error),
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
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    const initials = `${firstName?.[0] || ''}${lastName?.[0] || ''}`;
    return initials || 'U';
  };

  const getFullName = () => {
    const firstName = professional.first_name || professional.profiles?.first_name || '';
    const lastName = professional.last_name || professional.profiles?.last_name || '';
    return `${firstName} ${lastName}`.trim() || 'Anonymous User';
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
                alt={getFullName()} 
              />
              <AvatarFallback className="text-lg font-semibold bg-gradient-primary text-primary-foreground">
                {getInitials(
                  professional.first_name || professional.profiles?.first_name || '', 
                  professional.last_name || professional.profiles?.last_name || ''
                )}
              </AvatarFallback>
            </Avatar>
            
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <Link to={`/profile/${professional.user_id}`} className="text-lg font-semibold text-foreground truncate hover:text-primary transition-colors">
                    {getFullName()}
                  </Link>
                  <div className="flex flex-wrap gap-2">
                    {professional.is_mentor && (
                      <Badge variant="success" className="text-xs">
                        <Users className="w-3 h-3 mr-1" />
                        Mentor Available
                      </Badge>
                    )}
                    {professional.is_seeking_mentor && (
                      <Badge variant="info" className="text-xs">
                        <Star className="w-3 h-3 mr-1" />
                        Seeking Mentor
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Inline actions under the name */}
                {!isOwnProfile && (
                  <div className="actions flex flex-wrap items-center justify-start gap-3 mt-2">
                    {showFavoriteButton && (
                      <Button 
                        variant={isFavorited ? "default" : "outline"} 
                        size="sm" 
                        onClick={toggleFavorite}
                        disabled={loading}
                        className="flex items-center gap-2"
                        aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
                      >
                        <Heart className={`w-4 h-4 ${isFavorited ? 'fill-current' : ''}`} />
                        {isFavorited ? 'Favorited' : 'Favorite'}
                      </Button>
                    )}

                    <Dialog open={isMessageDialogOpen} onOpenChange={setIsMessageDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="flex items-center gap-2" aria-label="Send message">
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

                    <Button variant="outline" size="sm" asChild aria-label="View profile">
                      <Link to={`/profile/${professional.user_id}`}>View Profile</Link>
                    </Button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          onClick={() => setShowReportDialog(true)}
                          className="text-destructive"
                        >
                          <Flag className="w-4 h-4 mr-2" />
                          Report Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <div className="w-full">
                            <BlockUserButton 
                              targetUserId={professional.user_id}
                              targetUserName={getFullName()}
                              variant="ghost"
                              size="sm"
                              className="w-full justify-start p-0 h-auto text-destructive hover:text-destructive"
                            />
                          </div>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    {showMentorshipButton && professional.is_mentor && (
                      <Dialog open={isRequestDialogOpen} onOpenChange={setIsRequestDialogOpen}>
                        <DialogTrigger asChild>
                          <Button variant="accent" size="sm" className="flex items-center gap-2 hover:shadow-glow" aria-label="Request mentorship">
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
                                placeholder="Explain why you're interested in this mentorship and what you hope to achieve (at least 30 characters)..."
                                rows={4}
                              />
                              <p className="text-xs text-muted-foreground mt-1">
                                {requestMessage.trim().length}/30 characters minimum
                              </p>
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
                        style={{ animationDelay: `${Math.min(index * 0.05, 0.3)}s` }}
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

          {/* Legacy action column removed (was wrapped in `{false && ...}`) */}
        </div>
      </CardContent>

      {/* Report Dialog */}
      <ReportDialog
        open={showReportDialog}
        onOpenChange={setShowReportDialog}
        accusedId={professional.user_id}
        accusedName={`${professional.first_name} ${professional.last_name}`}
        reportType="profile"
      />
    </Card>
  );
};

export default ProfessionalCard;