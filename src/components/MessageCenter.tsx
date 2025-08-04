import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { MessageCircle, Send, Clock } from "lucide-react";

interface Message {
  id: string;
  content: string;
  sender_id: string;
  recipient_id: string;
  created_at: string;
  read_at: string | null;
}

interface Conversation {
  user_id: string;
  first_name: string;
  last_name: string;
  last_message?: Message;
  unread_count: number;
}

interface MessageCenterProps {
  requestId?: string;
  recipientId?: string;
  recipientName?: string;
}

const MessageCenter = ({ requestId, recipientId, recipientName }: MessageCenterProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      loadConversations();
      
      // Set up real-time subscription for new messages
      const channel = supabase
        .channel('messages')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `recipient_id=eq.${user.id}`,
          },
          (payload) => {
            console.log('New message received:', payload);
            // Refresh conversations and messages
            loadConversations();
            if (selectedConversation && payload.new.sender_id === selectedConversation) {
              loadMessages(selectedConversation);
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'messages',
            filter: `sender_id=eq.${user.id}`,
          },
          (payload) => {
            console.log('Message updated:', payload);
            // Refresh conversations when read status changes
            loadConversations();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, selectedConversation]);

  useEffect(() => {
    if (recipientId) {
      setSelectedConversation(recipientId);
      loadMessages(recipientId);
    }
  }, [recipientId]);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation);
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const loadConversations = async () => {
    try {
      // Get all messages where user is sender or recipient
      const { data: allMessages, error } = await supabase
        .from('messages')
        .select(`
          id,
          sender_id,
          recipient_id,
          content,
          created_at,
          read_at
        `)
        .or(`sender_id.eq.${user?.id},recipient_id.eq.${user?.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group by conversation partner
      const conversationMap = new Map<string, Conversation>();
      
      for (const message of allMessages || []) {
        const partnerId = message.sender_id === user?.id ? message.recipient_id : message.sender_id;
        
        if (!conversationMap.has(partnerId)) {
          conversationMap.set(partnerId, {
            user_id: partnerId,
            first_name: 'Loading...',
            last_name: '',
            unread_count: 0
          });
        }

        const conversation = conversationMap.get(partnerId)!;
        
        // Set last message if this is the first (most recent) for this conversation
        if (!conversation.last_message || new Date(message.created_at) > new Date(conversation.last_message.created_at)) {
          conversation.last_message = message;
        }

        // Count unread messages (messages sent to current user that haven't been read)
        if (message.recipient_id === user?.id && !message.read_at) {
          conversation.unread_count++;
        }
      }

      // Get user names for all conversation partners
      const partnerIds = Array.from(conversationMap.keys());
      if (partnerIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, first_name, last_name')
          .in('user_id', partnerIds);

        profiles?.forEach(profile => {
          const conversation = conversationMap.get(profile.user_id);
          if (conversation) {
            conversation.first_name = profile.first_name || '';
            conversation.last_name = profile.last_name || '';
          }
        });
      }

      // Sort conversations by last message timestamp (most recent first)
      const sortedConversations = Array.from(conversationMap.values())
        .sort((a, b) => {
          if (!a.last_message) return 1;
          if (!b.last_message) return -1;
          return new Date(b.last_message.created_at).getTime() - new Date(a.last_message.created_at).getTime();
        });

      setConversations(sortedConversations);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (partnerId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${user?.id},recipient_id.eq.${partnerId}),and(sender_id.eq.${partnerId},recipient_id.eq.${user?.id})`)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setMessages(data || []);

      // Mark received messages as read
      const unreadMessages = data?.filter(m => 
        m.recipient_id === user?.id && !m.read_at
      ) || [];

      if (unreadMessages.length > 0) {
        await supabase
          .from('messages')
          .update({ read_at: new Date().toISOString() })
          .in('id', unreadMessages.map(m => m.id));

        // Refresh conversations to update unread counts
        loadConversations();
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: user?.id,
          recipient_id: selectedConversation,
          content: newMessage.trim(),
          request_id: requestId
        });

      if (error) throw error;

      setNewMessage("");
      await loadMessages(selectedConversation);
      await loadConversations();
      
      // Auto-scroll to the latest message
      setTimeout(() => {
        scrollToBottom();
      }, 200);

      toast({
        title: "Message sent",
        description: "Your message has been sent successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send message.",
        variant: "destructive",
      });
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 24 * 7) {
      return date.toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  if (loading) {
    return (
      <Card className="h-96">
        <CardContent className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid lg:grid-cols-3 gap-6 h-96">
      {/* Conversations List */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Messages
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-80">
            {conversations.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                No conversations yet
              </div>
            ) : (
              <div className="space-y-1">
                {conversations.map((conversation) => (
                  <div
                    key={conversation.user_id}
                    className={`p-3 cursor-pointer hover:bg-muted/50 transition-colors ${
                      selectedConversation === conversation.user_id ? 'bg-muted' : ''
                    }`}
                    onClick={() => setSelectedConversation(conversation.user_id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center">
                          <span className="text-xs text-primary-foreground font-medium">
                            {`${conversation.first_name || ''} ${conversation.last_name || ''}`.trim().split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                         <div className="flex-1 min-w-0">
                           <p className="font-medium text-sm truncate">{`${conversation.first_name || ''} ${conversation.last_name || ''}`.trim() || 'Unknown'}</p>
                           {conversation.last_message && (
                             <p className="text-xs text-muted-foreground truncate">
                               {conversation.last_message.sender_id === user?.id ? 'You: ' : ''}{conversation.last_message.content}
                             </p>
                           )}
                         </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {conversation.last_message && (
                          <p className="text-xs text-muted-foreground">
                            {formatTime(conversation.last_message.created_at)}
                          </p>
                        )}
                        {conversation.unread_count > 0 && (
                          <Badge variant="default" className="text-xs px-1.5 py-0.5">
                            {conversation.unread_count}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Messages */}
      <Card className="lg:col-span-2">
        {selectedConversation ? (
          <>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">
                {(() => {
                  const conv = conversations.find(c => c.user_id === selectedConversation);
                  return conv ? `${conv.first_name || ''} ${conv.last_name || ''}`.trim() || 'Unknown' : recipientName;
                })()}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ScrollArea className="h-64">
                <div className="space-y-3 pr-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          message.sender_id === user?.id
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                         <p className="text-sm">{message.content}</p>
                         <div className="flex items-center justify-end gap-1 mt-1">
                           <Clock className="w-3 h-3 opacity-60" />
                           <span className="text-xs opacity-60">
                             {formatTime(message.created_at)}
                           </span>
                           {message.sender_id === user?.id && (
                             <span className="text-xs opacity-60">
                               {message.read_at ? '✓✓' : '✓'}
                             </span>
                           )}
                         </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              <div className="flex gap-2">
                <Input
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                />
                <Button onClick={sendMessage} disabled={!newMessage.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </>
        ) : (
          <CardContent className="flex items-center justify-center h-full">
            <div className="text-center text-muted-foreground">
              <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Select a conversation to start messaging</p>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
};

export default MessageCenter;