import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Shield, Users, Lock, Unlock } from "lucide-react";

interface BlockedUser {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url?: string;
  blocked_at: string;
}

export default function MessagingPrivacySettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messagingPrivacy, setMessagingPrivacy] = useState<"open" | "mentorship_only" | "closed">("closed");
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadSettings = async () => {
    if (!user) return;

    try {
      // Load current privacy setting
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("messaging_privacy")
        .eq("user_id", user.id)
        .single();

      if (profileError) throw profileError;
      
      setMessagingPrivacy(profile.messaging_privacy || "closed");

      // Load blocked users
      const { data: conversations, error: conversationsError } = await supabase
        .from("conversations")
        .select(`
          id,
          user_a,
          user_b,
          updated_at
        `)
        .eq("status", "blocked")
        .or(`user_a.eq.${user.id},user_b.eq.${user.id}`);

      if (conversationsError) throw conversationsError;

      // Get profiles for blocked users
      const blockedUserIds = conversations?.map(conv => 
        conv.user_a === user.id ? conv.user_b : conv.user_a
      ) || [];

      if (blockedUserIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, first_name, last_name, avatar_url")
          .in("user_id", blockedUserIds);

        const blockedUsersWithData = conversations?.map(conv => {
          const blockedUserId = conv.user_a === user.id ? conv.user_b : conv.user_a;
          const profile = profiles?.find(p => p.user_id === blockedUserId);
          
          return {
            id: blockedUserId,
            first_name: profile?.first_name || "",
            last_name: profile?.last_name || "",
            avatar_url: profile?.avatar_url,
            blocked_at: conv.updated_at
          };
        }) || [];

        setBlockedUsers(blockedUsersWithData);
      }
    } catch (error) {
      console.error("Error loading privacy settings:", error);
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
        .from("profiles")
        .update({ messaging_privacy: messagingPrivacy })
        .eq("user_id", user.id);

      if (error) throw error;

      toast({
        title: "Settings saved",
        description: "Your messaging privacy settings have been updated",
      });
    } catch (error) {
      console.error("Error saving privacy settings:", error);
      toast({
        title: "Error",
        description: "Failed to save privacy settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const unblockUser = async (userId: string) => {
    if (!user) return;

    try {
      // Find the conversation to update
      const { data: conversation } = await supabase
        .from("conversations")
        .select("id")
        .eq("status", "blocked")
        .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
        .or(`user_a.eq.${userId},user_b.eq.${userId}`)
        .single();

      if (conversation) {
        const { error } = await supabase
          .from("conversations")
          .delete()
          .eq("id", conversation.id);

        if (error) throw error;
      }

      setBlockedUsers(prev => prev.filter(u => u.id !== userId));
      
      toast({
        title: "User unblocked",
        description: "This user can now send you message requests again",
      });
    } catch (error) {
      console.error("Error unblocking user:", error);
      toast({
        title: "Error",
        description: "Failed to unblock user",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    loadSettings();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Messaging Privacy
          </CardTitle>
          <CardDescription>
            Control who can send you messages and message requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup value={messagingPrivacy} onValueChange={(value: "open" | "mentorship_only" | "closed") => setMessagingPrivacy(value)}>
            <div className="space-y-4">
              <div className="flex items-center space-x-2 p-3 border rounded-lg">
                <RadioGroupItem value="open" id="open" />
                <div className="flex-1">
                  <Label htmlFor="open" className="flex items-center gap-2 cursor-pointer">
                    <Unlock className="h-4 w-4" />
                    Open
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Anyone can send you message requests
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 p-3 border rounded-lg">
                <RadioGroupItem value="mentorship_only" id="mentorship_only" />
                <div className="flex-1">
                  <Label htmlFor="mentorship_only" className="flex items-center gap-2 cursor-pointer">
                    <Users className="h-4 w-4" />
                    Mentorship Only
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Only mentorship connections can message directly; others send requests
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 p-3 border rounded-lg">
                <RadioGroupItem value="closed" id="closed" />
                <div className="flex-1">
                  <Label htmlFor="closed" className="flex items-center gap-2 cursor-pointer">
                    <Lock className="h-4 w-4" />
                    Closed
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Only accept messages from users you've previously accepted or contacted
                  </p>
                </div>
              </div>
            </div>
          </RadioGroup>
          
          <Button onClick={savePrivacySetting} disabled={saving} className="mt-4">
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save Changes
          </Button>
        </CardContent>
      </Card>

      {blockedUsers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Blocked Users</CardTitle>
            <CardDescription>
              Users you've blocked from sending you messages
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {blockedUsers.map((blockedUser) => (
                <div key={blockedUser.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">
                      {blockedUser.first_name} {blockedUser.last_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Blocked {new Date(blockedUser.blocked_at).toLocaleDateString()}
                    </p>
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
          </CardContent>
        </Card>
      )}
    </div>
  );
}