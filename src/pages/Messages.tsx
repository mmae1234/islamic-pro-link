import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
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
  MessageCircle,
  Send,
  Inbox,
  SendIcon,
  Archive,
  User,
  Search,
  Plus,
  Shield,
  Trash2
} from "lucide-react";

interface Message {
  id: string;
  content: string;
  created_at: string;
  sender_id: string;
  recipient_id: string;
  read_at: string | null;
  sender_profile?: {
    first_name: string;
    last_name: string;
  };
  recipient_profile?: {
    first_name: string;
    last_name: string;
  };
}

interface Conversation {
  partner_id: string;
  partner_name: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
}

const Messages = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [sentMessages, setSentMessages] = useState<Message[]>([]);
  const [inboxMessages, setInboxMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [selectedRecipient, setSelectedRecipient] = useState<any>(null);
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<{partnerId: string, partnerName: string} | null>(null);
  const [archivedMessages, setArchivedMessages] = useState<Message[]>([]);
  const [requestCount, setRequestCount] = useState(0);

  useEffect(() => {
    if (user) {
      loadMessages();
      loadProfessionals();
      return setupRealtimeSubscription();
    }
  }, [user?.id]);

  const loadMessages = async () => {
    if (!user) return;

    try {
      // Load sent messages - get latest message per recipient
      const { data: sentData, error: sentError } = await supabase
        .from('messages')
        .select(`
          *,
          recipient_profile:profiles!messages_recipient_id_fkey(first_name, last_name)
        `)
        .eq('sender_id', user.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (sentError) throw sentError;

      // Load inbox messages
      const { data: inboxData, error: inboxError } = await supabase
        .from('messages')
        .select(`
          *,
          sender_profile:profiles!messages_sender_id_fkey(first_name, last_name)
        `)
        .eq('recipient_id', user.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (inboxError) throw inboxError;

      setSentMessages(sentData || []);
      setInboxMessages(inboxData || []);

      // Build conversations from the conversations table.
      // Avoid cross-column .or() filters (iOS Safari stack overflows) — split into two parallel queries.
      const conversationSelect = `
          id,
          user_a,
          user_b,
          status,
          updated_at,
          profiles_a:profiles!conversations_user_a_fkey(first_name, last_name),
          profiles_b:profiles!conversations_user_b_fkey(first_name, last_name)
        `;
      const [{ data: convAData, error: convAError }, { data: convBData, error: convBError }] = await Promise.all([
        supabase
          .from('conversations')
          .select(conversationSelect)
          .eq('user_a', user.id)
          .neq('status', 'blocked')
          .order('updated_at', { ascending: false }),
        supabase
          .from('conversations')
          .select(conversationSelect)
          .eq('user_b', user.id)
          .neq('status', 'blocked')
          .order('updated_at', { ascending: false }),
      ]);

      if (convAError) throw convAError;
      if (convBError) throw convBError;

      const conversationsData = [...(convAData || []), ...(convBData || [])]
        .sort((a, b) => +new Date(b.updated_at) - +new Date(a.updated_at));

      const conversationsList = (conversationsData || []).map(conv => {
        const isUserA = conv.user_a === user.id;
        const partnerId = isUserA ? conv.user_b : conv.user_a;
        const partnerProfile = isUserA ? conv.profiles_b : conv.profiles_a;
        // Handle case where profile might be an array (shouldn't happen but TypeScript thinks it might)
        const profile = Array.isArray(partnerProfile) ? partnerProfile[0] : partnerProfile;
        
        return {
          partner_id: partnerId,
          partner_name: `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || 'Unknown',
          last_message: '', // We'll get this from the last message
          last_message_time: conv.updated_at,
          unread_count: 0 // We'll calculate this separately
        };
      });

      // Batch load all messages for conversations to avoid N+1 queries
      // NOTE: Avoid large `.or(...)` filters (can cause stack overflows on iOS Safari for users with many conversations).
      if (conversationsList.length > 0) {
        const partnerIds = conversationsList.map((c) => c.partner_id);

        const [outRes, inRes] = await Promise.all([
          supabase
            .from('messages')
            .select('content, created_at, sender_id, recipient_id, read_at')
            .eq('sender_id', user.id)
            .in('recipient_id', partnerIds)
            .is('deleted_at', null)
            .order('created_at', { ascending: false })
            .limit(500),
          supabase
            .from('messages')
            .select('content, created_at, sender_id, recipient_id, read_at')
            .eq('recipient_id', user.id)
            .in('sender_id', partnerIds)
            .is('deleted_at', null)
            .order('created_at', { ascending: false })
            .limit(500),
        ]);

        const allMessages = [...(outRes.data || []), ...(inRes.data || [])].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        // Process messages for each conversation
        for (const conv of conversationsList) {
          const convMessages = (allMessages || []).filter(
            (msg) =>
              (msg.sender_id === user.id && msg.recipient_id === conv.partner_id) ||
              (msg.sender_id === conv.partner_id && msg.recipient_id === user.id)
          );

          if (convMessages.length > 0) {
            conv.last_message = convMessages[0].content;
            conv.last_message_time = convMessages[0].created_at;
          }

          // Count unread messages from partner
          conv.unread_count = convMessages.filter(
            (msg) =>
              msg.sender_id === conv.partner_id && msg.recipient_id === user.id && !msg.read_at
          ).length;
        }
      }

      setConversations(conversationsList);

      // Load archived messages — split cross-column .or() into two parallel queries (iOS-safe).
      const archivedSelect = `
          *,
          sender_profile:profiles!messages_sender_id_fkey(first_name, last_name),
          recipient_profile:profiles!messages_recipient_id_fkey(first_name, last_name)
        `;
      const [{ data: archSent }, { data: archReceived, error: archivedError }] = await Promise.all([
        supabase
          .from('messages')
          .select(archivedSelect)
          .eq('sender_id', user.id)
          .not('deleted_at', 'is', null)
          .order('created_at', { ascending: false }),
        supabase
          .from('messages')
          .select(archivedSelect)
          .eq('recipient_id', user.id)
          .not('deleted_at', 'is', null)
          .order('created_at', { ascending: false }),
      ]);

      if (!archivedError) {
        const archivedData = [...(archSent || []), ...(archReceived || [])]
          .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
        setArchivedMessages(archivedData);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  // Note: buildConversations has been replaced by loadMessages conversation logic

  const loadProfessionals = async () => {
    try {
      const { data, error } = await supabase
        .from('professional_profiles')
        .select(`
          user_id,
          occupation,
          sector,
          profiles!professional_profiles_user_id_fkey(first_name, last_name)
        `)
        .neq('user_id', user?.id)
      .limit(100);

      if (error) throw error;
      setProfessionals(data || []);
    } catch (error) {
      console.error('Error loading professionals:', error);
    }
  };

  const setupRealtimeSubscription = () => {
    if (!user) return;

    const channel = supabase
      .channel(`messages-page-${user.id}-${Date.now()}-${Math.random().toString(36).slice(2)}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `recipient_id=eq.${user.id}`,
        },
        () => {
          loadMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const sendMessage = async () => {
    if (!selectedRecipient || !newMessage.trim()) return;

    try {
      const { error } = await supabase.rpc('send_message', {
        _recipient_id: selectedRecipient.user_id,
        _content: newMessage.trim(),
      });

      if (error) throw error;

      toast({
        title: "Message sent!",
        description: "Your message has been sent successfully.",
      });

      setNewMessage("");
      setSelectedRecipient(null);
      loadMessages();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send message.",
        variant: "destructive",
      });
    }
  };

  const markAsRead = async (messageId: string) => {
    if (!user) return;
    try {
      // Scope by recipient_id to avoid no-op writes that RLS would reject for non-recipients.
      await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('id', messageId)
        .eq('recipient_id', user.id);

      loadMessages();
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  const deleteMessage = async (messageId: string) => {
    try {
      await supabase
        .from('messages')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', messageId);
      
      toast({
        title: "Message deleted",
        description: "The message has been moved to archived.",
      });
      
      loadMessages();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete message.",
        variant: "destructive",
      });
    }
  };

  const deleteConversation = async (partnerId: string) => {
    if (!user) return;
    try {
      console.log('Deleting conversation with partner:', partnerId);

      // Conversations are stored with user_a < user_b (enforced by send_message/get_or_create_conversation),
      // so the pair lookup collapses to a single ordered .eq().eq() — no .or() needed.
      const [orderedA, orderedB] = [user.id, partnerId].sort();
      const { error: conversationError } = await supabase
        .from('conversations')
        .delete()
        .eq('user_a', orderedA)
        .eq('user_b', orderedB);

      if (conversationError) {
        console.error('Error deleting conversation:', conversationError);
        throw conversationError;
      }

      // Messages between two users — split into two parallel writes (iOS-safe, disjoint by construction).
      const nowIso = new Date().toISOString();
      const [outRes, inRes] = await Promise.all([
        supabase
          .from('messages')
          .update({ deleted_at: nowIso })
          .eq('sender_id', user.id)
          .eq('recipient_id', partnerId),
        supabase
          .from('messages')
          .update({ deleted_at: nowIso })
          .eq('sender_id', partnerId)
          .eq('recipient_id', user.id),
      ]);

      const messageError = outRes.error || inRes.error;
      if (messageError) {
        console.error('Error deleting messages:', messageError);
        throw messageError;
      }
      
      toast({
        title: "Conversation deleted",
        description: "The entire conversation has been deleted.",
      });
      
      // Remove the conversation from the local state immediately for better UX
      setConversations(prev => prev.filter(conv => conv.partner_id !== partnerId));
      
      // Then refresh all messages to ensure consistency
      await loadMessages();
    } catch (error: any) {
      console.error('Delete conversation error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete conversation.",
        variant: "destructive",
      });
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString();
    }
  };

  const filteredProfessionals = professionals.filter(prof => {
    const fullName = `${prof.profiles?.first_name || ''} ${prof.profiles?.last_name || ''}`.trim();
    const occupation = prof.occupation || '';
    const sector = prof.sector || '';
    return fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      occupation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sector.toLowerCase().includes(searchTerm.toLowerCase());
  });

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

          <Tabs defaultValue="inbox" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="inbox" className="flex items-center gap-2">
                <Inbox className="w-4 h-4" />
                Inbox
              </TabsTrigger>
              <TabsTrigger value="requests" className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Requests
                {requestCount > 0 && (
                  <Badge variant="destructive" className="h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs ml-1">
                    {requestCount > 9 ? '9+' : requestCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="sent" className="flex items-center gap-2">
                <SendIcon className="w-4 h-4" />
                Sent
              </TabsTrigger>
              <TabsTrigger value="archived" className="flex items-center gap-2">
                <Archive className="w-4 h-4" />
                Archived
              </TabsTrigger>
              <TabsTrigger value="compose" className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
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
                              <div className="flex items-start gap-3 flex-1 cursor-pointer" onClick={() => {
                                setSelectedConversation({
                                  partnerId: conversation.partner_id, 
                                  partnerName: conversation.partner_name
                                });
                              }}>
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
                      loadMessages();
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
                                   partnerName: `${message.recipient_profile?.first_name || ''} ${message.recipient_profile?.last_name || ''}`.trim() || 'Unknown'
                                 })}
                               >
                                 <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center">
                                   <span className="text-primary-foreground font-semibold text-sm">
                                     {`${message.recipient_profile?.first_name || ''} ${message.recipient_profile?.last_name || ''}`.trim().split(' ').map(n => n[0]).join('') || 'U'}
                                   </span>
                                 </div>
                                 <div className="flex-1">
                                   <h3 className="font-medium text-foreground mb-1">
                                     To: {`${message.recipient_profile?.first_name || ''} ${message.recipient_profile?.last_name || ''}`.trim() || 'Unknown'}
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
                        Deleted, declined, and archived messages will appear here.
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
                                      ? `${message.recipient_profile?.first_name || ''} ${message.recipient_profile?.last_name || ''}`.trim().split(' ').map(n => n[0]).join('') || 'U'
                                      : `${message.sender_profile?.first_name || ''} ${message.sender_profile?.last_name || ''}`.trim().split(' ').map(n => n[0]).join('') || 'U'
                                    }
                                  </span>
                                </div>
                                <div className="flex-1">
                                  <h3 className="font-medium text-foreground mb-1">
                                    {message.sender_id === user?.id 
                                      ? `To: ${message.recipient_profile?.first_name || ''} ${message.recipient_profile?.last_name || ''}`.trim() || 'Unknown'
                                      : `From: ${message.sender_profile?.first_name || ''} ${message.sender_profile?.last_name || ''}`.trim() || 'Unknown'
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
                                  {`${prof.profiles?.first_name || ''} ${prof.profiles?.last_name || ''}`.trim().split(' ').map(n => n[0]).join('') || 'U'}
                                </span>
                              </div>
                              <div>
                                <p className="font-medium text-sm">{`${prof.profiles?.first_name || ''} ${prof.profiles?.last_name || ''}`.trim() || 'Unknown'}</p>
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
                          Sending to: {`${selectedRecipient.profiles?.first_name || ''} ${selectedRecipient.profiles?.last_name || ''}`.trim() || 'Unknown'}
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
                          disabled={!newMessage.trim()}
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