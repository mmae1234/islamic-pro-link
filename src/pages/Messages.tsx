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
  User,
  Search,
  Plus,
  Shield
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

  useEffect(() => {
    if (user) {
      loadMessages();
      loadProfessionals();
      setupRealtimeSubscription();
    }
  }, [user]);

  const loadMessages = async () => {
    if (!user) return;

    try {
      // Load sent messages
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

      // Build conversations from the conversations table
      const { data: conversationsData, error: conversationsError } = await supabase
        .from('conversations')
        .select(`
          id,
          user_a,
          user_b,
          status,
          updated_at,
          profiles_a:profiles!conversations_user_a_fkey(first_name, last_name),
          profiles_b:profiles!conversations_user_b_fkey(first_name, last_name)
        `)
        .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
        .neq('status', 'blocked')
        .order('updated_at', { ascending: false });

      if (conversationsError) throw conversationsError;

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

      // Get last messages and unread counts for each conversation
      for (const conv of conversationsList) {
        // Get last message
        const { data: lastMessageData } = await supabase
          .from('messages')
          .select('content, created_at')
          .or(`and(sender_id.eq.${user.id},recipient_id.eq.${conv.partner_id}),and(sender_id.eq.${conv.partner_id},recipient_id.eq.${user.id})`)
          .is('deleted_at', null)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (lastMessageData) {
          conv.last_message = lastMessageData.content;
          conv.last_message_time = lastMessageData.created_at;
        }

        // Get unread count
        const { count } = await supabase
          .from('messages')
          .select('*', { count: 'exact' })
          .eq('sender_id', conv.partner_id)
          .eq('recipient_id', user.id)
          .is('read_at', null)
          .is('deleted_at', null);

        conv.unread_count = count || 0;
      }

      setConversations(conversationsList);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const buildConversations = (sent: Message[], inbox: Message[]) => {
    // This method is now replaced by the above conversation loading
    // but kept for compatibility
  };

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
        .neq('user_id', user?.id);

      if (error) throw error;
      setProfessionals(data || []);
    } catch (error) {
      console.error('Error loading professionals:', error);
    }
  };

  const setupRealtimeSubscription = () => {
    if (!user) return;

    const channel = supabase
      .channel('user-messages')
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
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: user?.id,
          recipient_id: selectedRecipient.user_id,
          content: newMessage.trim()
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
    try {
      await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('id', messageId);
      
      loadMessages();
    } catch (error) {
      console.error('Error marking message as read:', error);
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
    return fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prof.occupation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prof.sector.toLowerCase().includes(searchTerm.toLowerCase());
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
              </TabsTrigger>
              <TabsTrigger value="sent" className="flex items-center gap-2">
                <SendIcon className="w-4 h-4" />
                Sent
              </TabsTrigger>
              <TabsTrigger value="archived" className="flex items-center gap-2">
                <SendIcon className="w-4 h-4" />
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
                          className={`shadow-soft cursor-pointer ${conversation.unread_count > 0 ? 'border-primary/50' : ''}`}
                          onClick={() => {
                            setSelectedConversation({
                              partnerId: conversation.partner_id, 
                              partnerName: conversation.partner_name
                            });
                          }}
                        >
                          <CardContent className="pt-6">
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-3">
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
                              <p className="text-xs text-muted-foreground">
                                {formatTime(conversation.last_message_time)}
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

            <TabsContent value="requests" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Message Requests
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <MessageRequests onAcceptRequest={() => {
                    // Reload messages when a request is accepted
                    loadMessages();
                  }} />
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
                          className="shadow-soft cursor-pointer"
                          onClick={() => setSelectedConversation({
                            partnerId: message.recipient_id, 
                            partnerName: `${message.recipient_profile?.first_name || ''} ${message.recipient_profile?.last_name || ''}`.trim() || 'Unknown'
                          })}
                        >
                          <CardContent className="pt-6">
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-3">
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

            <TabsContent value="archived" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Archived Messages</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <SendIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">No archived messages</h3>
                    <p className="text-muted-foreground">
                      Deleted, declined, and archived messages will appear here.
                    </p>
                  </div>
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