import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Loader2, User, MapPin, Briefcase } from "lucide-react";

interface RequestSender {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url?: string;
  professional_profile?: {
    occupation?: string;
    sector?: string;
    city?: string;
    state_province?: string;
    country?: string;
  };
}

interface MessageRequest {
  id: string;
  user_a: string;
  user_b: string;
  status: string;
  created_at: string;
  sender: RequestSender;
  latest_message?: {
    content: string;
    created_at: string;
  };
}

interface MessageRequestsProps {
  onAcceptRequest: (conversationId: string) => void;
}

export default function MessageRequests({ onAcceptRequest }: MessageRequestsProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<MessageRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingRequests, setProcessingRequests] = useState<Set<string>>(new Set());

  const loadRequests = async () => {
    if (!user) return;

    try {
      const { data: conversations, error } = await supabase
        .from("conversations")
        .select(`
          id,
          user_a,
          user_b,
          status,
          created_at,
          messages(content, created_at)
        `)
        .eq("status", "request")
        .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get sender profiles and professional profiles
      const requestsWithSenders = await Promise.all(
        conversations?.map(async (conv) => {
          const senderId = conv.user_a === user.id ? conv.user_b : conv.user_a;
          
          const { data: profile } = await supabase
            .from("profiles")
            .select("id, first_name, last_name, avatar_url")
            .eq("user_id", senderId)
            .single();

          const { data: professionalProfile } = await supabase
            .from("professional_profiles")
            .select("occupation, sector, city, state_province, country")
            .eq("user_id", senderId)
            .single();

          const latestMessage = conv.messages?.[0];

          return {
            id: conv.id,
            user_a: conv.user_a,
            user_b: conv.user_b,
            status: conv.status,
            created_at: conv.created_at,
            sender: {
              id: senderId,
              first_name: profile?.first_name || "",
              last_name: profile?.last_name || "",
              avatar_url: profile?.avatar_url,
              professional_profile: professionalProfile
            },
            latest_message: latestMessage
          };
        }) || []
      );

      setRequests(requestsWithSenders);
    } catch (error) {
      console.error("Error loading message requests:", error);
      toast({
        title: "Error",
        description: "Failed to load message requests",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async (conversationId: string) => {
    setProcessingRequests(prev => new Set(prev).add(conversationId));
    
    try {
      const { error } = await supabase.rpc('update_conversation_status', {
        _conversation_id: conversationId,
        _new_status: 'active',
      });

      if (error) throw error;

      toast({
        title: "Request accepted",
        description: "You can now message each other",
      });

      // Remove from requests list
      setRequests(prev => prev.filter(req => req.id !== conversationId));
      onAcceptRequest(conversationId);
    } catch (error) {
      console.error("Error accepting request:", error);
      toast({
        title: "Error",
        description: "Failed to accept message request",
        variant: "destructive",
      });
    } finally {
      setProcessingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(conversationId);
        return newSet;
      });
    }
  };

  const handleDeclineRequest = async (conversationId: string) => {
    setProcessingRequests(prev => new Set(prev).add(conversationId));
    
    try {
      const { error } = await supabase.rpc('update_conversation_status', {
        _conversation_id: conversationId,
        _new_status: 'blocked',
      });

      if (error) throw error;
      // Note: requests_declined counter is now managed server-side; users
      // can no longer self-edit their rate-limit row.

      toast({
        title: "Request declined",
        description: "This conversation has been blocked",
      });

      setRequests(prev => prev.filter(req => req.id !== conversationId));
    } catch (error) {
      console.error("Error declining request:", error);
      toast({
        title: "Error",
        description: "Failed to decline message request",
        variant: "destructive",
      });
    } finally {
      setProcessingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(conversationId);
        return newSet;
      });
    }
  };

  useEffect(() => {
    loadRequests();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No message requests</p>
        <p className="text-sm">New message requests will appear here</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[600px] w-full">
      <div className="space-y-4 p-4">
        {requests.map((request) => (
          <Card key={request.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={request.sender.avatar_url} />
                  <AvatarFallback>
                    {request.sender.first_name?.[0]}{request.sender.last_name?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <CardTitle className="text-base">
                    {request.sender.first_name} {request.sender.last_name}
                  </CardTitle>
                  {request.sender.professional_profile?.occupation && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Briefcase className="h-3 w-3" />
                      {request.sender.professional_profile.occupation}
                      {request.sender.professional_profile.sector && (
                        <span> • {request.sender.professional_profile.sector}</span>
                      )}
                    </div>
                  )}
                  {(request.sender.professional_profile?.city || request.sender.professional_profile?.country) && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {[
                        request.sender.professional_profile.city,
                        request.sender.professional_profile.state_province,
                        request.sender.professional_profile.country
                      ].filter(Boolean).join(", ")}
                    </div>
                  )}
                </div>
                <Badge variant="secondary">Request</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {request.latest_message && (
                <div className="mb-4 p-3 bg-muted rounded-lg">
                  <p className="text-sm">{request.latest_message.content}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(request.latest_message.created_at).toLocaleDateString()}
                  </p>
                </div>
              )}
              <div className="flex gap-2">
                <Button
                  onClick={() => handleAcceptRequest(request.id)}
                  disabled={processingRequests.has(request.id)}
                  className="flex-1"
                >
                  {processingRequests.has(request.id) && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  Accept
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleDeclineRequest(request.id)}
                  disabled={processingRequests.has(request.id)}
                  className="flex-1"
                >
                  {processingRequests.has(request.id) && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  Decline
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </ScrollArea>
  );
}