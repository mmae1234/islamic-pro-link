import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Calendar, CalendarIcon, Clock, User, MessageSquare, Check, X, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

interface MentorshipRequest {
  id: string;
  status: string;
  message: string;
  skills_requested: string[];
  created_at: string;
  mentor_id: string;
  mentee_id: string;
  mentor_profile?: {
    full_name: string;
    role: string;
  };
  mentee_profile?: {
    full_name: string;
    role: string;
  };
}

const MentorshipRequests = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<MentorshipRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<MentorshipRequest | null>(null);
  const [schedulingData, setSchedulingData] = useState({
    date: undefined as Date | undefined,
    time: '',
    duration: '60',
    meetingLink: '',
    notes: ''
  });

  useEffect(() => {
    if (user) {
      loadRequests();
    }
  }, [user]);

  const loadRequests = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('mentorship_requests')
        .select(`
          *,
          mentor_profile:profiles!mentorship_requests_mentor_id_fkey(full_name, role),
          mentee_profile:profiles!mentorship_requests_mentee_id_fkey(full_name, role)
        `)
        .or(`mentor_id.eq.${user.id},mentee_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setRequests(data || []);
    } catch (error: any) {
      console.error('Error loading requests:', error);
      toast({
        title: "Error loading requests",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateRequestStatus = async (requestId: string, status: string) => {
    setActionLoading(requestId);
    try {
      const { error } = await supabase
        .from('mentorship_requests')
        .update({ status })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: status === 'accepted' ? 'Request accepted!' : 'Request declined',
        description: status === 'accepted' 
          ? 'You can now schedule a mentorship session.' 
          : 'The request has been declined.',
      });

      loadRequests();
    } catch (error: any) {
      toast({
        title: "Error updating request",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const scheduleSession = async () => {
    if (!selectedRequest || !schedulingData.date || !schedulingData.time) return;

    setActionLoading('scheduling');
    try {
      const scheduledAt = new Date(`${format(schedulingData.date, 'yyyy-MM-dd')}T${schedulingData.time}`);
      
      const { error } = await supabase
        .from('mentorship_sessions')
        .insert({
          request_id: selectedRequest.id,
          scheduled_at: scheduledAt.toISOString(),
          duration_minutes: parseInt(schedulingData.duration),
          meeting_link: schedulingData.meetingLink,
          notes: schedulingData.notes
        });

      if (error) throw error;

      toast({
        title: "Session scheduled!",
        description: "The mentorship session has been scheduled successfully.",
      });

      setIsScheduleDialogOpen(false);
      setSelectedRequest(null);
      setSchedulingData({
        date: undefined,
        time: '',
        duration: '60',
        meetingLink: '',
        notes: ''
      });
      loadRequests();
    } catch (error: any) {
      toast({
        title: "Error scheduling session",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'accepted':
        return 'bg-green-100 text-green-700';
      case 'declined':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const isCurrentUserMentor = (request: MentorshipRequest) => {
    return request.mentor_id === user?.id;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin" />
        <span className="ml-2">Loading requests...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <MessageSquare className="w-5 h-5" />
        <h2 className="text-xl font-semibold">Mentorship Requests</h2>
      </div>

      {requests.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No mentorship requests yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {requests.map((request) => (
            <Card key={request.id} className="shadow-soft">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-primary-foreground" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">
                            {isCurrentUserMentor(request) ? (
                              <>Request from {request.mentee_profile?.full_name || 'Unknown'}</>
                            ) : (
                              <>Request to {request.mentor_profile?.full_name || 'Unknown'}</>
                            )}
                          </h3>
                          <Badge className={getStatusColor(request.status)}>
                            {request.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {isCurrentUserMentor(request) 
                            ? request.mentee_profile?.role 
                            : request.mentor_profile?.role
                          }
                        </p>
                        <p className="text-sm text-muted-foreground mb-3">
                          Requested on {format(new Date(request.created_at), 'PPP')}
                        </p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-sm text-foreground">{request.message}</p>
                    </div>

                    {request.skills_requested && request.skills_requested.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        <span className="text-sm text-muted-foreground mr-2">Skills:</span>
                        {request.skills_requested.map(skill => (
                          <Badge key={skill} variant="outline" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 min-w-fit">
                    {isCurrentUserMentor(request) && request.status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => updateRequestStatus(request.id, 'accepted')}
                          disabled={actionLoading === request.id}
                        >
                          <Check className="w-4 h-4 mr-2" />
                          Accept
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateRequestStatus(request.id, 'declined')}
                          disabled={actionLoading === request.id}
                        >
                          <X className="w-4 h-4 mr-2" />
                          Decline
                        </Button>
                      </>
                    )}

                    {request.status === 'accepted' && (
                      <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            onClick={() => setSelectedRequest(request)}
                          >
                            <Calendar className="w-4 h-4 mr-2" />
                            Schedule Session
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                          <DialogHeader>
                            <DialogTitle>Schedule Mentorship Session</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label>Date</Label>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="outline"
                                    className={cn(
                                      "w-full justify-start text-left font-normal",
                                      !schedulingData.date && "text-muted-foreground"
                                    )}
                                  >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {schedulingData.date ? format(schedulingData.date, "PPP") : "Pick a date"}
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <CalendarComponent
                                    mode="single"
                                    selected={schedulingData.date}
                                    onSelect={(date) => setSchedulingData(prev => ({ ...prev, date }))}
                                    disabled={(date) => date < new Date()}
                                    initialFocus
                                    className="pointer-events-auto"
                                  />
                                </PopoverContent>
                              </Popover>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <Label htmlFor="time">Time</Label>
                                <Input
                                  id="time"
                                  type="time"
                                  value={schedulingData.time}
                                  onChange={(e) => setSchedulingData(prev => ({ ...prev, time: e.target.value }))}
                                />
                              </div>
                              <div>
                                <Label htmlFor="duration">Duration (min)</Label>
                                <Input
                                  id="duration"
                                  type="number"
                                  value={schedulingData.duration}
                                  onChange={(e) => setSchedulingData(prev => ({ ...prev, duration: e.target.value }))}
                                />
                              </div>
                            </div>

                            <div>
                              <Label htmlFor="meetingLink">Meeting Link (optional)</Label>
                              <Input
                                id="meetingLink"
                                value={schedulingData.meetingLink}
                                onChange={(e) => setSchedulingData(prev => ({ ...prev, meetingLink: e.target.value }))}
                                placeholder="Zoom, Google Meet, etc."
                              />
                            </div>

                            <div>
                              <Label htmlFor="notes">Notes (optional)</Label>
                              <Textarea
                                id="notes"
                                value={schedulingData.notes}
                                onChange={(e) => setSchedulingData(prev => ({ ...prev, notes: e.target.value }))}
                                placeholder="Additional notes for the session..."
                                rows={3}
                              />
                            </div>

                            <div className="flex gap-2">
                              <Button
                                onClick={scheduleSession}
                                disabled={!schedulingData.date || !schedulingData.time || actionLoading === 'scheduling'}
                                className="flex-1"
                              >
                                {actionLoading === 'scheduling' ? (
                                  <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Scheduling...
                                  </>
                                ) : (
                                  'Schedule Session'
                                )}
                              </Button>
                              <Button variant="outline" onClick={() => setIsScheduleDialogOpen(false)}>
                                Cancel
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default MentorshipRequests;