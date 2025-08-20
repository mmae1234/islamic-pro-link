import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

interface ReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accusedId: string;
  accusedName: string;
  conversationId?: string;
  messageId?: string;
  reportType: 'profile' | 'message' | 'conversation';
}

const reportReasons = {
  profile: [
    'Fake profile',
    'Inappropriate profile content',
    'Spam or promotional content',
    'Harassment or bullying',
    'Impersonation',
    'Other'
  ],
  message: [
    'Inappropriate content',
    'Harassment or bullying',
    'Spam',
    'Threats or violence',
    'Hate speech',
    'Other'
  ],
  conversation: [
    'Harassment or bullying',
    'Inappropriate behavior',
    'Spam',
    'Threats or violence',
    'Unwanted contact',
    'Other'
  ]
};

const ReportDialog = ({ 
  open, 
  onOpenChange, 
  accusedId, 
  accusedName,
  conversationId,
  messageId,
  reportType 
}: ReportDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedReason, setSelectedReason] = useState('');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedReason || !user) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('abuse_reports')
        .insert({
          reporter_id: user.id,
          accused_id: accusedId,
          reason: selectedReason,
          details: details.trim() || null,
          conversation_id: conversationId || null
        });

      if (error) throw error;

      // Send admin notification email
      try {
        await supabase.functions.invoke('send-report-notification', {
          body: {
            reporterName: user.user_metadata?.first_name || user.email || 'Anonymous',
            accusedName: accusedName,
            reason: selectedReason,
            details: details.trim() || undefined,
            reportType: reportType
          }
        });
      } catch (emailError) {
        console.error('Failed to send admin notification:', emailError);
        // Don't fail the whole operation if email fails
      }

      toast({
        title: "Report submitted",
        description: "Thank you for your report. Our team will review it shortly.",
      });

      // Reset form and close dialog
      setSelectedReason('');
      setDetails('');
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit report.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const reasons = reportReasons[reportType];
  const titleMap = {
    profile: `Report ${accusedName}'s Profile`,
    message: `Report Message from ${accusedName}`,
    conversation: `Report Conversation with ${accusedName}`
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{titleMap[reportType]}</DialogTitle>
          <DialogDescription>
            Help us keep our community safe by reporting inappropriate behavior.
            All reports are reviewed by our moderation team.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Reason for reporting</Label>
            <RadioGroup 
              value={selectedReason} 
              onValueChange={setSelectedReason}
              className="mt-2"
            >
              {reasons.map((reason) => (
                <div key={reason} className="flex items-center space-x-2">
                  <RadioGroupItem value={reason} id={reason} />
                  <Label htmlFor={reason} className="text-sm cursor-pointer">
                    {reason}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div>
            <Label htmlFor="details" className="text-sm font-medium">
              Additional details (optional)
            </Label>
            <Textarea
              id="details"
              placeholder="Please provide any additional context that might help our review..."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              maxLength={1000}
              className="mt-2"
              rows={3}
            />
            <div className="text-xs text-muted-foreground mt-1">
              {details.length}/1000 characters
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={!selectedReason || submitting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {submitting ? "Submitting..." : "Submit Report"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReportDialog;