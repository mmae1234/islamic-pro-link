import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  User,
  Star,
  Users,
  Briefcase,
  Calendar,
  GraduationCap,
  MapPin,
  Heart,
  MessageCircle,
  MoreVertical,
  Flag,
  Linkedin,
  Globe,
  Phone,
  Send,
  Lock,
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import ReportDialog from "@/components/ReportDialog";
import BlockUserButton from "@/components/BlockUserButton";
import { useState } from "react";
import { useCanonicalUrl } from "@/hooks/useCanonicalUrl";
import {
  useProfile,
  useFavoriteStatus,
  useToggleProfessionalFavorite,
} from "@/hooks/queries";

const Profile = () => {
  const { userId } = useParams();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [showReportDialog, setShowReportDialog] = useState(false);

  useCanonicalUrl(userId ? `/profile/${userId}` : "/");

  // Signed-out visitors get a short preview card (public_profile_preview:
  // first name, last initial, job, city; honours the member's opt-out).
  const previewQuery = useQuery({
    queryKey: ["public-profile-preview", userId],
    enabled: !authLoading && !user && !!userId,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("public_profile_preview" as never, { _user_id: userId } as never);
      if (error) throw error;
      const rows = (data ?? []) as Array<{
        first_name: string; last_initial: string | null; occupation: string | null; sector: string | null;
        city: string | null; state_province: string | null; country: string | null; is_mentor: boolean;
      }>;
      return rows[0] ?? null;
    },
  });

  // Whether the viewer can message this person: allowed | request | closed | blocked.
  const messageStatusQuery = useQuery({
    queryKey: ["can-send-message", user?.id, userId],
    enabled: !!user && !!userId && user.id !== userId,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("can_send_message", {
        sender_id_param: user!.id,
        recipient_id_param: userId!,
      });
      if (error) throw error;
      return String(data ?? "closed");
    },
  });
  const messageStatus = messageStatusQuery.data;

  const profileQuery = useProfile(userId, user?.id);
  const profile = profileQuery.data?.profile ?? null;
  const professionalProfile = profileQuery.data?.professionalProfile ?? null;
  const loading = authLoading || profileQuery.isLoading;

  const isOwnProfile = user?.id === userId;

  const favoriteStatus = useFavoriteStatus(user?.id, userId, {
    enabled: !!user && !!userId && !isOwnProfile,
  });
  const toggleFavorite = useToggleProfessionalFavorite(user?.id);

  // Track profile view on mount (replaces card-click tracking).
  useEffect(() => {
    if (!user || !userId || user.id === userId) return;
    (async () => {
      try {
        await supabase.from("profile_views").insert({
          viewer_id: user.id,
          viewed_profile_id: userId,
        });
      } catch (err) {
        console.error("Failed to track profile view:", err);
      }
    })();
  }, [user, userId]);

  // Surface load error.
  useEffect(() => {
    if (profileQuery.error) {
      toast({
        title: "Error",
        description: "Failed to load profile.",
        variant: "destructive",
      });
    }
  }, [profileQuery.error, toast]);

  const isFavorite = favoriteStatus.data ?? false;

  const handleToggleFavorite = () => {
    if (!user || !userId) return;
    toggleFavorite.mutate(
      { professionalUserId: userId, currentlyFavorited: isFavorite },
      {
        onSuccess: () =>
          toast({
            title: isFavorite ? "Removed from favorites" : "Added to favorites",
            description: isFavorite
              ? "This professional has been removed from your favorites."
              : "This professional has been added to your favorites.",
          }),
        onError: (err: Error) =>
          toast({
            title: "Error",
            description: err?.message || "Failed to update favorites.",
            variant: "destructive",
          }),
      },
    );
  };

  if (!authLoading && !user) {
    const pv = previewQuery.data;
    const redirect = encodeURIComponent(`/profile/${userId}`);
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-16">
          <Card className="max-w-md mx-auto shadow-soft">
            <CardContent className="p-8 text-center space-y-4">
              {previewQuery.isLoading ? (
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto" />
              ) : pv ? (
                <>
                  <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 text-primary flex items-center justify-center text-xl font-semibold" aria-hidden="true">
                    {pv.first_name.charAt(0).toUpperCase()}{pv.last_initial ?? ""}
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-foreground">
                      {pv.last_initial ? `${pv.first_name} ${pv.last_initial}.` : pv.first_name}
                    </h1>
                    {pv.occupation && <p className="text-primary font-medium">{pv.occupation}</p>}
                    {(pv.city || pv.country) && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {[pv.city, pv.state_province || pv.country].filter(Boolean).join(", ")}
                      </p>
                    )}
                    {pv.is_mentor && <Badge variant="secondary" className="mt-2">Available as Mentor</Badge>}
                  </div>
                  <p className="text-muted-foreground">
                    Join Muslim Pros Network free to see the full profile and send a message.
                  </p>
                </>
              ) : (
                <>
                  <h1 className="text-2xl font-bold text-foreground">Member profile</h1>
                  <p className="text-muted-foreground">Sign in or join free to view this member's profile.</p>
                </>
              )}
              <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
                <Button asChild variant="hero"><Link to={`/signup?redirect=${redirect}`}>Join free</Link></Button>
                <Button asChild variant="outline"><Link to={`/login?redirect=${redirect}`}>Sign in</Link></Button>
              </div>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Profile Not Found</h1>
          <p className="text-muted-foreground">The requested profile could not be found.</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Profile Header */}
          <Card className="shadow-soft mb-8">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row items-start gap-6">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={(professionalProfile?.avatar_url ?? profile?.avatar_url) || undefined} />
                  <AvatarFallback className="text-2xl">
                    {`${(profile?.first_name || '').charAt(0)}${(profile?.last_name || '').charAt(0)}`.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-4">
                        <h1 className="text-3xl font-bold text-foreground mb-2">
                          {`${profile?.first_name || ''} ${profile?.last_name || ''}`.trim()}
                        </h1>
                        {isOwnProfile && (
                          <Button variant="outline" size="sm" asChild>
                            <Link to="/edit-profile">Edit Profile</Link>
                          </Button>
                        )}
                      </div>
                      {professionalProfile?.occupation && professionalProfile?.sector && (
                        <p className="text-lg text-muted-foreground mb-2">
                          {professionalProfile.occupation} • {professionalProfile.sector}
                        </p>
                      )}
                      {professionalProfile && (
                        <div className="space-y-2">
                          {(professionalProfile.city || professionalProfile.country) && (
                            <div className="flex items-center text-muted-foreground">
                              <MapPin className="w-4 h-4 mr-2" />
                              {[professionalProfile.city, professionalProfile.state_province, professionalProfile.country].filter(Boolean).join(', ')}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {!isOwnProfile && user && (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleToggleFavorite}
                          disabled={toggleFavorite.isPending}
                        >
                          <Heart className={`w-4 h-4 mr-2 ${isFavorite ? 'fill-current text-favorite' : ''}`} />
                          {isFavorite ? 'Unfavorite' : 'Favorite'}
                        </Button>
                        {messageStatus === "closed" ? (
                          <Button variant="secondary" size="sm" disabled title="This member isn't accepting new messages">
                            <Lock className="w-4 h-4 mr-2" />
                            Not accepting messages
                          </Button>
                        ) : messageStatus !== "blocked" && (
                          <Button
                            variant="secondary"
                            size="sm"
                            disabled={messageStatusQuery.isLoading}
                            onClick={() => {
                              const partnerName = `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || 'Conversation';
                              navigate(`/messages?recipient=${userId}&name=${encodeURIComponent(partnerName)}`);
                            }}
                          >
                            <MessageCircle className="w-4 h-4 mr-2" />
                            {messageStatus === "request" ? "Send message request" : "Message"}
                          </Button>
                        )}
                        {professionalProfile?.is_mentor && (
                          <Button asChild variant="hero" size="sm">
                            <Link to={`/mentorship?mentor=${userId}`}>
                              <Users className="w-4 h-4 mr-2" />
                              Request mentorship
                            </Link>
                          </Button>
                        )}
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
                                  targetUserId={userId!}
                                  targetUserName={`${profile?.first_name || ''} ${profile?.last_name || ''}`.trim()}
                                  variant="ghost"
                                  size="sm"
                                  className="w-full justify-start p-0 h-auto text-destructive hover:text-destructive"
                                />
                              </div>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Bio */}
              {professionalProfile?.bio && (
                <Card className="shadow-soft">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="w-5 h-5" />
                      About
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-foreground leading-relaxed">
                      {professionalProfile.bio}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Skills */}
              {professionalProfile?.skills && professionalProfile.skills.length > 0 && (
                <Card className="shadow-soft">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Star className="w-5 h-5" />
                      Skills
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {professionalProfile.skills.map((skill: string, index: number) => (
                        <Badge key={index} variant="secondary">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Mentorship */}
              {(professionalProfile?.is_mentor || professionalProfile?.is_seeking_mentor) && (
                <Card className="shadow-soft">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      Mentorship
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {professionalProfile.is_mentor && (
                        <Badge variant="secondary" className="mr-2">
                          Available as Mentor
                        </Badge>
                      )}
                      {professionalProfile.is_seeking_mentor && (
                        <Badge variant="outline" className="mr-2">
                          Seeking Mentor
                        </Badge>
                      )}
                    </div>
                    {professionalProfile.availability && (
                      <div className="mt-4">
                        <p className="text-sm text-muted-foreground mb-1">Availability:</p>
                        <Badge variant="outline">{professionalProfile.availability}</Badge>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Contact & links */}
              {professionalProfile && (() => {
                const pp = professionalProfile as typeof professionalProfile & {
                  linkedin_url?: string | null; website?: string | null;
                  whatsapp_number?: string | null; telegram_url?: string | null;
                };
                const safeUrl = (u?: string | null) => {
                  if (!u) return null;
                  const v = u.trim();
                  const withProto = /^https?:\/\//i.test(v) ? v : `https://${v}`;
                  try { const url = new URL(withProto); return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null; } catch { return null; }
                };
                const linkedin = safeUrl(pp.linkedin_url);
                const website = safeUrl(pp.website);
                const telegram = safeUrl(pp.telegram_url);
                const whatsapp = pp.whatsapp_number?.trim() || null;
                const connected = isOwnProfile || messageStatus === "allowed";
                if (!linkedin && !website && !telegram && !whatsapp && connected) return null;
                return (
                  <Card className="shadow-soft">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Send className="w-5 h-5" />
                        Contact & Links
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      {linkedin && (
                        <a href={linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary hover:underline">
                          <Linkedin className="w-4 h-4" /> LinkedIn
                        </a>
                      )}
                      {website && (
                        <a href={website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary hover:underline break-all">
                          <Globe className="w-4 h-4 shrink-0" /> {new URL(website).hostname}
                        </a>
                      )}
                      {whatsapp && (
                        <p className="flex items-center gap-2"><Phone className="w-4 h-4" /> WhatsApp: {whatsapp}</p>
                      )}
                      {telegram && (
                        <a href={telegram} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary hover:underline">
                          <Send className="w-4 h-4" /> Telegram
                        </a>
                      )}
                      {!connected && (
                        <p className="text-xs text-muted-foreground">
                          Phone and Telegram details, if the member added them, are shared once they accept your message.
                        </p>
                      )}
                    </CardContent>
                  </Card>
                );
              })()}
              {/* Personal Information */}
              <Card className="shadow-soft">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Personal Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {professionalProfile?.languages && professionalProfile.languages.length > 0 && (
                    <div>
                      <p className="text-muted-foreground mb-2">Languages:</p>
                      <div className="flex flex-wrap gap-1">
                        {professionalProfile.languages.map((language: string, index: number) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {language}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {professionalProfile?.preferred_communication && (
                    <div>
                      <p className="text-muted-foreground mb-2">Preferred Communication:</p>
                      <div className="flex flex-wrap gap-1">
                        {professionalProfile.preferred_communication.map((method: string, index: number) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {method.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Professional Details */}
              <Card className="shadow-soft">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="w-5 h-5" />
                    Professional Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {professionalProfile && professionalProfile.experience_years != null && (
                    <div>
                      <div className="flex items-center text-muted-foreground mb-1">
                        <Calendar className="w-4 h-4 mr-2" />
                        Experience
                      </div>
                      <p className="font-medium">
                        {professionalProfile.experience_years} years
                      </p>
                    </div>
                  )}

                  {professionalProfile?.university && (
                    <div>
                      <div className="flex items-center text-muted-foreground mb-1">
                        <GraduationCap className="w-4 h-4 mr-2" />
                        Education
                      </div>
                      <p className="font-medium">
                        {professionalProfile.university}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <ReportDialog
        open={showReportDialog}
        onOpenChange={setShowReportDialog}
        accusedId={userId!}
        accusedName={`${profile?.first_name || ''} ${profile?.last_name || ''}`.trim()}
        reportType="profile"
      />

      <Footer />
    </div>
  );
};

export default Profile;
