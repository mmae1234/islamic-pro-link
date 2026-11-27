import { personName, personInitials } from "@/lib/displayName";
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, UserX } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { getErrorMessage } from "@/lib/errors";

interface BlockedUser {
  id: string;
  blocked_id: string;
  first_name: string;
  last_name: string;
  avatar_url?: string;
  blocked_at: string;
}

const MessagingPrivacySettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messagingPrivacy, setMessagingPrivacy] = useState<'open' | 'mentorship_only' | 'closed'>('closed');
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      loadSettings();
    }
  }, [user]);

  const loadSettings = async () => {
    if (!user) return;

    try {
      // Load current privacy setting
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('messaging_privacy')
        .eq('user_id', user.id)
        .single();

      if (profileError) throw profileError;
      
      setMessagingPrivacy(profile.messaging_privacy || 'open');

      // Load blocked users (RPC: profiles RLS hides people you've blocked)
      const { data: blockedData, error: blockedError } = await supabase.rpc(
        "get_my_blocked_users" as never,
      );

      if (blockedError) throw blockedError;

      const rows = (blockedData ?? []) as unknown as Array<{
        id: string;
        blocked_id: string;
        created_at: string;
        first_name: string | null;
        last_name: string | null;
        avatar_url: string | null;
        display_name: string | null;
      }>;
      setBlockedUsers(
        rows.map((item) => ({
          id: item.id,
          blocked_id: item.blocked_id,
          first_name: personName(item, 'Unknown'),
          last_name: '',
          avatar_url: item.avatar_url ?? undefined,
          blocked_at: item.created_at,
        })),
      );
    } catch (error) {
      console.error('Error loading privacy settings:', error);
      toast({
        title: "Error",
        description: "Failed to load privacy settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const savePrivacySetting = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ messaging_privacy: messagingPrivacy })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Settings saved",
        description: "Your messaging privacy settings have been updated",
      });
    } catch (error) {
      console.error('Error saving privacy settings:', error);
      toast({
        title: "Error",
        description: "Failed to save privacy settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const unblockUser = async (blockId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('blocked_users')
        .delete()
        .eq('id', blockId);

      if (error) throw error;

      // Update local state
      setBlockedUsers(prev => prev.filter(blockedUser => blockedUser.id !== blockId));

      toast({
        title: "User unblocked",
        description: "The user has been unblocked successfully.",
      });
    } catch (error: unknown) {
      toast({
        title: "Error unblocking user",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Messaging Privacy</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup 
            value={messagingPrivacy} 
            onValueChange={(value: 'open' | 'mentorship_only' | 'closed') => setMessagingPrivacy(value)}
          >
            <div className="space-y-3">
              <Label
                htmlFor="open"
                className="flex items-start gap-3 rounded-lg border p-3 cursor-pointer font-normal has-[:checked]:border-primary has-[[data-state=checked]]:border-primary"
              >
                <RadioGroupItem value="open" id="open" className="mt-0.5" />
                <span>
                  <span className="block font-medium text-foreground">Open (recommended)</span>
                  <span className="block text-sm text-muted-foreground">Anyone can send you a message request. You choose whether to accept.</span>
                </span>
              </Label>
              <Label
                htmlFor="mentorship_only"
                className="flex items-start gap-3 rounded-lg border p-3 cursor-pointer font-normal has-[:checked]:border-primary has-[[data-state=checked]]:border-primary"
              >
                <RadioGroupItem value="mentorship_only" id="mentorship_only" className="mt-0.5" />
                <span>
                  <span className="block font-medium text-foreground">Mentorship only</span>
                  <span className="block text-sm text-muted-foreground">Only your mentors and mentees can message you.</span>
                </span>
              </Label>
              <Label
                htmlFor="closed"
                className="flex items-start gap-3 rounded-lg border p-3 cursor-pointer font-normal has-[:checked]:border-primary has-[[data-state=checked]]:border-primary"
              >
                <RadioGroupItem value="closed" id="closed" className="mt-0.5" />
                <span>
                  <span className="block font-medium text-foreground">Closed</span>
                  <span className="block text-sm text-muted-foreground">Only people you already have a conversation with can message you.</span>
                </span>
              </Label>
            </div>
          </RadioGroup>
          
          <Button onClick={savePrivacySetting} disabled={saving} className="mt-4">
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Save Changes
          </Button>
        </CardContent>
      </Card>

      {/* Blocked Users */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserX className="w-5 h-5" />
            Blocked Users
          </CardTitle>
        </CardHeader>
        <CardContent>
          {blockedUsers.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No blocked users. When you block someone, they'll appear here.
            </p>
          ) : (
            <div className="space-y-4">
              {blockedUsers.map((blockedUser) => (
                <div key={blockedUser.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={blockedUser.avatar_url} />
                      <AvatarFallback>
                        {`${blockedUser.first_name[0] || ''}${blockedUser.last_name[0] || ''}`}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {blockedUser.first_name} {blockedUser.last_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Blocked on {new Date(blockedUser.blocked_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => unblockUser(blockedUser.id)}
                  >
                    Unblock
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MessagingPrivacySettings;