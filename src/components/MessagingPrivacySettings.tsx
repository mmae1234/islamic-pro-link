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
      
      setMessagingPrivacy(profile.messaging_privacy || 'closed');

      // Load blocked users
      const { data: blockedData, error: blockedError } = await supabase
        .from('blocked_users')
        .select(`
          id,
          blocked_id,
          created_at,
          profiles:blocked_id(first_name, last_name, avatar_url)
        `)
        .eq('blocker_id', user.id);

      if (blockedError) throw blockedError;

      if (blockedData) {
        // PostgREST may return the embedded `profiles` as an array or single
        // object depending on cardinality inference. Narrow to a single slice.
        type BlockedRow = {
          id: string;
          blocked_id: string;
          created_at: string;
          profiles:
            | { first_name: string | null; last_name: string | null; avatar_url: string | null }
            | { first_name: string | null; last_name: string | null; avatar_url: string | null }[]
            | null;
        };
        const rows = blockedData as unknown as BlockedRow[];
        const blocked = rows.map((item) => {
          const profile = Array.isArray(item.profiles) ? item.profiles[0] : item.profiles;
          return {
            id: item.id,
            blocked_id: item.blocked_id,
            first_name: profile?.first_name || 'Unknown',
            last_name: profile?.last_name || 'User',
            avatar_url: profile?.avatar_url ?? undefined,
            blocked_at: item.created_at,
          };
        });
        setBlockedUsers(blocked);
      }
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
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="open" id="open" />
                <Label htmlFor="open">Open - Anyone can message you</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="mentorship_only" id="mentorship_only" />
                <Label htmlFor="mentorship_only">Mentorship Only - Only mentors/mentees can message directly</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="closed" id="closed" />
                <Label htmlFor="closed">Closed - Only people you've contacted can message you</Label>
              </div>
            </div>
          </RadioGroup>
          
          <Button onClick={savePrivacySetting} disabled={saving}>
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