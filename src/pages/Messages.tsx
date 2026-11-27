import { personName, personInitials } from "@/lib/displayName";
import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ConversationView from "@/components/ConversationView";
import MessageRequests from "@/components/MessageRequests";
import {
  Send,
  Inbox,
  SendIcon,
  Archive,
  Plus,
  Shield,
  Trash2,
} from "lucide-react";
import {
  qk,
  useConversations,
  useInboxMessages,
  useSentMessages,
  useArchivedMessages,
  useComposePickerProfessionals,
  useSendMessage,
  useDeleteMessage,
  useDeleteConversation,
  type ComposePickerRow,
} from "@/hooks/queries";

const Messages = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  // ?tab=requests etc. (request emails link straight to the Requests tab)
  const tabParam = searchParams.get("tab");
  const activeTab =
    tabParam && ["inbox", "requests", "sent", "archived", "compose"].includes(tabParam) ? tabParam : "inbox";
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [selectedRecipient, setSelectedRecipient] = useState<ComposePickerRow | null>(null);
  const [selectedConversation, setSelectedConversation] = useState<{ partnerId: string; partnerName: string } | null>(null);
  const [requestCount, setRequestCount] = useState(0);

  // Data
  const conversationsQuery = useConversations(user?.id);
  const inboxQuery = useInboxMessages(user?.id);
  const sentQuery = useSentMessages(user?.id);
  const archivedQuery = useArchivedMessages(user?.id);
  const professionalsQuery = useComposePickerProfessionals(user?.id);

  // Mutations
  const sendMessageMutation = useSendMessage(user?.id);
  const deleteMessageMutation = useDeleteMessage(user?.id);
  const deleteConversationMutation = useDeleteConversation(user?.id);

  const conversations = conversationsQuery.data ?? [];
  const sentMessages = sentQuery.data ?? [];
  const archivedMessages = archivedQuery.data ?? [];
  const professionals = professionalsQuery.data ?? [];

  // Realtime: when a new inbound message arrives, invalidate every messages cache
  // for this user so all tabs (inbox, conversations, archived) refetch.
  // We keep the iOS-safe channel-name suffix to prevent duplicate-channel errors.
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`messages-page-${user.id}-${Date.now()}-${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `recipient_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: qk.messages.all(user.id) });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  // Open a conversation directly when arriving via ?recipient=… or ?userId=… deep link
  useEffect(() => {
    if (!user) return;
    const partnerId = searchParams.get("recipient") || searchParams.get("userId");
    const partnerName = searchParams.get("name") || "Conversation";
    if (partnerId && partnerId !== user.id) {
      setSelectedConversation({ partnerId, partnerName: decodeURIComponent(partnerName) });
      const next = new URLSearchParams(searchParams);
      next.delete("recipient");
      next.delete("userId");
      next.delete("name");
      setSearchParams(next, { replace: true });
    }
  }, [user, searchParams, setSearchParams]);

  const filteredProfessionals = useMemo(() => {
    if (!searchTerm) return professionals;
    const q = searchTerm.toLowerCase();
    return professionals.filter((prof) => {
      const fullName = personName(prof.profiles);
      return (
        fullName.toLowerCase().includes(q) ||
        (prof.occupation || "").toLowerCase().includes(q) ||
        (prof.sector || "").toLowerCase().includes(q)
      );
    });
  }, [professionals, searchTerm]);

  const sendMessage = () => {
    if (!selectedRecipient || !newMessage.trim()) return;
    sendMessageMutation.mutate(
      { recipientId: selectedRecipient.user_id, content: newMessage.trim() },
      {
        onSuccess: () => {
          toast({
            title: "Message sent",
            description: "If this is your first message to them, it arrives as a request they can accept.",
          });
          setNewMessage("");
          setSelectedRecipient(null);
        },
        onError: (err: Error) =>
          toast({
            title: "Error",
            description: err?.message || "Failed to send message.",
            variant: "destructive",
          }),
      },
    );
  };

  const deleteMessage = (messageId: string) =>
    deleteMessageMutation.mutate(messageId, {
      onSuccess: () =>
        toast({
          title: "Message deleted",
          description: "Deleted for you and moved to Archived. The other person still has their copy.",
        }),
      onError: (err: Error) =>
        toast({
          title: "Error",
          description: err?.message || "Failed to delete message.",
          variant: "destructive",
        }),
    });

  const deleteConversation = (partnerId: string) =>
    deleteConversationMutation.mutate(partnerId, {
      onSuccess: () =>
        toast({
          title: "Conversation deleted",
          description: "Deleted for you. The other person still has their copy.",
        }),
      onError: (err: Error) =>
        toast({
          title: "Error",
          description: err?.message || "Failed to delete conversation.",
          variant: "destructive",
        }),
    });

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    return date.toLocaleDateString();
  };

  const loading =
    conversationsQuery.isLoading ||
    inboxQuery.isLoading ||
    sentQuery.isLoading ||
    archivedQuery.isLoading;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (selectedConversation) {
    return (
      <div className="min-h-screen bg-background">
        <Header />

        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-4xl mx-auto">
            <ConversationView
              partnerId={selectedConversation.partnerId}
              partnerName={selectedConversation.partnerName}
              onBack={() => setSelectedConversation(null)}
            />
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Messages
            </h1>
            <p className="text-lg text-muted-foreground">
              Connect and communicate with other Muslim professionals.
            </p>
          </div>

          <Tabs
            value={activeTab}
            onValueChange={(v) => {
              const next = new URLSearchParams(searchParams);
              if (v === "inbox") next.delete("tab");
              else next.set("tab", v);
              setSearchParams(next, { replace: true });
            }}
            className="space-y-6"
          >
            <TabsList className="grid w-full h-auto grid-cols-3 sm:grid-cols-5 gap-1">
              <TabsTrigger value="inbox" className="flex items-center gap-1.5 px-2">
                <Inbox className="hidden sm:block w-4 h-4" />
                Inbox
              </TabsTrigger>
              <TabsTrigger value="requests" className="flex items-center gap-1.5 px-2">
                <Shield className="hidden sm:block w-4 h-4" />
                Requests
                {requestCount > 0 && (
                  <Badge variant="destructive" className="h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs ml-1">
                    {requestCount > 9 ? '9+' : requestCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="sent" className="flex items-center gap-1.5 px-2">
                <SendIcon className="hidden sm:block w-4 h-4" />
                Sent
              </TabsTrigger>
              <TabsTrigger value="archived" className="flex items-center gap-1.5 px-2">
                <Archive className="hidden sm:block w-4 h-4" />
                Archived
              </TabsTrigger>
              <TabsTrigger value="compose" className="flex items-center gap-1.5 px-2">
                <Plus className="hidden sm:block w-4 h-4" />
                Compose
              </TabsTrigger>
            </TabsList>


            <TabsContent value="inbox" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Conversations</CardTitle>
                </CardHeader>
                <CardContent>
                  {conversations.length === 0 ? (
                    <div className="text-center py-12">
                      <Inbox className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-foreground mb-2">No conversations</h3>
                      <p className="text-muted-foreground">
                        You haven't started any conversations yet.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {conversations.map((conversation) => (
                        <Card
                          key={conversation.partner_id}
                          className={`shadow-soft ${conversation.unread_count > 0 ? 'border-primary/50' : ''}`}
                        >
                          <CardContent className="pt-6">
                            <div className="flex items-start justify-between">
                              <div
                                className="flex items-start gap-3 flex-1 cursor-pointer"
                                onClick={() => {
                                  setSelectedConversation({
                                    partnerId: conversation.partner_id,
                                    partnerName: conversation.partner_name,
                                  });
                                }}
                              >
                                <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center">
                                  <span className="text-primary-foreground font-semibold text-sm">
                                    {conversation.partner_name.split(' ').map(n => n[0]).join('') || 'U'}
                                  </span>
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-medium text-foreground">
                                      {conversation.partner_name}
                                    </h3>
                                    {conversation.unread_count > 0 && (
                                      <Badge variant="destructive" className="text-xs">{conversation.unread_count}</Badge>
                                    )}
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    {conversation.last_message || 'No messages yet'}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <p className="text-xs text-muted-foreground">
                                  {formatTime(conversation.last_message_time)}
                                </p>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteConversation(conversation.partner_id);
                                  }}
                                  disabled={deleteConversationMutation.isPending}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="requests" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Message Requests
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <MessageRequests
                    onAcceptRequest={() => {
                      // Bring all messaging caches in sync after a request is accepted.
                      queryClient.invalidateQueries({ queryKey: qk.messages.all(user?.id) });
                    }}
                    onRequestCountChange={setRequestCount}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="sent" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Sent Messages</CardTitle>
                </CardHeader>
                <CardContent>
                  {sentMessages.length === 0 ? (
                    <div className="text-center py-12">
                      <SendIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-foreground mb-2">No sent messages</h3>
                      <p className="text-muted-foreground">
                        You haven't sent any messages yet.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {sentMessages.map((message) => (
                        <Card
                          key={message.id}
                          className="shadow-soft"
                        >
                          <CardContent className="pt-6">
                            <div className="flex items-start justify-between">
                              <div
                                className="flex items-start gap-3 flex-1 cursor-pointer"
                                onClick={() => setSelectedConversation({
                                  partnerId: message.recipient_id,
                                  partnerName: personName(message.recipient_profile) || 'Unknown'
                                })}
                              >
                                <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center">
                                  <span className="text-primary-foreground font-semibold text-sm">
                                    {personInitials(message.recipient_profile) || 'U'}
                                  </span>
                                </div>
                                <div className="flex-1">
                                  <h3 className="font-medium text-foreground mb-1">
                                    To: {personName(message.recipient_profile) || 'Unknown'}
                                  </h3>
                                  <p className="text-sm text-muted-foreground">
                                    {message.content}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <p className="text-xs text-muted-foreground">
                                  {formatTime(message.created_at)}
                                </p>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteMessage(message.id);
                                  }}
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="archived" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Archived Messages</CardTitle>
                </CardHeader>
                <CardContent>
                  {archivedMessages.length === 0 ? (
                    <div className="text-center py-12">
                      <SendIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-foreground mb-2">No archived messages</h3>
                      <p className="text-muted-foreground">
                        Messages you delete appear here. Deleting only removes them from your view.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {archivedMessages.map((message) => (
                        <Card key={message.id} className="shadow-soft opacity-75">
                          <CardContent className="pt-6">
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-3">
                                <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center">
                                  <span className="text-primary-foreground font-semibold text-sm">
                                    {message.sender_id === user?.id
                                      ? personInitials(message.recipient_profile) || 'U'
                                      : personInitials(message.sender_profile) || 'U'
                                    }
                                  </span>
                                </div>
                                <div className="flex-1">
                                  <h3 className="font-medium text-foreground mb-1">
                                    {message.sender_id === user?.id
                                      ? `To: ${personName(message.recipient_profile, 'Unknown')}`
                                      : `From: ${personName(message.sender_profile, 'Unknown')}`
                                    }
                                  </h3>
                                  <p className="text-sm text-muted-foreground">
                                    {message.content}
                                  </p>
                                </div>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {formatTime(message.created_at)}
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="compose" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Compose New Message</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Search Recipients</label>
                    <Input
                      placeholder="Search by name, occupation, or sector..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  {searchTerm && (
                    <div className="border rounded-lg p-4 max-h-60 overflow-y-auto">
                      <h4 className="font-medium mb-2">Select Recipient:</h4>
                      <div className="space-y-2">
                        {filteredProfessionals.map((prof) => (
                          <div
                            key={prof.user_id}
                            className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                              selectedRecipient?.user_id === prof.user_id
                                ? 'bg-primary/10 border-primary'
                                : 'hover:bg-muted'
                            }`}
                            onClick={() => setSelectedRecipient(prof)}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center">
                                <span className="text-primary-foreground font-semibold text-xs">
                                  {personInitials(prof.profiles) || 'U'}
                                </span>
                              </div>
                              <div>
                                <p className="font-medium text-sm">{personName(prof.profiles) || 'Unknown'}</p>
                                <p className="text-xs text-muted-foreground">{prof.occupation} • {prof.sector}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedRecipient && (
                    <div className="space-y-4">
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-sm font-medium">
                          Sending to: {personName(selectedRecipient.profiles) || 'Unknown'}
                        </p>
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-2 block">Message</label>
                        <textarea
                          className="w-full p-3 border rounded-lg resize-none"
                          rows={6}
                          placeholder="Type your message here..."
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                        />
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={sendMessage}
                          disabled={!newMessage.trim() || sendMessageMutation.isPending}
                          className="flex-1"
                        >
                          <Send className="w-4 h-4 mr-2" />
                          Send Message
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setSelectedRecipient(null);
                            setNewMessage("");
                            setSearchTerm("");
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Messages;
