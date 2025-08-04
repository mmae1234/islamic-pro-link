import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { validateMessage } from '@/lib/security';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Send, ArrowLeft, Trash2, Archive, Flag } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface Message {
  id: string;
  content: string;
  created_at: string;
  sender_id: string;
  recipient_id: string;
  read_at: string | null;
  sender_profile?: { first_name: string; last_name: string };
  recipient_profile?: { first_name: string; last_name: string };
}

interface ConversationViewProps {
  partnerId: string;
  partnerName: string;
  onBack: () => void;
}

const ConversationView = ({ partnerId, partnerName, onBack }: ConversationViewProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<string | null>(null);
  const [messageError, setMessageError] = useState<string>('');

  useEffect(() => {
    if (user && partnerId) {
      loadConversation();
      markAllAsRead();
    }
  }, [user, partnerId]);

  const loadConversation = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender_profile:profiles!messages_sender_id_fkey(first_name, last_name),
          recipient_profile:profiles!messages_recipient_id_fkey(first_name, last_name)
        `)
        .or(`and(sender_id.eq.${user.id},recipient_id.eq.${partnerId}),and(sender_id.eq.${partnerId},recipient_id.eq.${user.id})`)
        .is('deleted_at', null)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error loading conversation:', error);
      toast({
        title: "Error",
        description: "Failed to load conversation.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    try {
      await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('recipient_id', user.id)
        .eq('sender_id', partnerId)
        .is('read_at', null);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const deleteMessage = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', messageId);

      if (error) throw error;
      
      loadConversation();
      toast({
        title: "Message deleted",
        description: "The message has been deleted.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete message.",
        variant: "destructive",
      });
    } finally {
      setShowDeleteDialog(false);
      setMessageToDelete(null);
    }
  };

  const archiveMessage = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ archived_at: new Date().toISOString() })
        .eq('id', messageId);

      if (error) throw error;
      
      loadConversation();
      toast({
        title: "Message archived",
        description: "The message has been archived.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to archive message.",
        variant: "destructive",
      });
    }
  };

  const reportMessage = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ 
          reported_at: new Date().toISOString(),
          report_reason: 'Inappropriate content'
        })
        .eq('id', messageId);

      if (error) throw error;
      
      toast({
        title: "Message reported",
        description: "The message has been reported to moderators.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to report message.",
        variant: "destructive",
      });
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !user) return;

    // Validate message content
    const messageValidation = validateMessage(newMessage);
    if (!messageValidation.isValid) {
      setMessageError(messageValidation.error!);
      return;
    }

    setMessageError('');
    setSending(true);
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          recipient_id: partnerId,
          content: messageValidation.sanitized
        });

      if (error) throw error;

      setNewMessage('');
      loadConversation();
      
      toast({
        title: "Message sent!",
        description: "Your message has been sent successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send message.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
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

  const deleteThread = async () => {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ deleted_at: new Date().toISOString() })
        .or(`and(sender_id.eq.${user?.id},recipient_id.eq.${partnerId}),and(sender_id.eq.${partnerId},recipient_id.eq.${user?.id})`);

      if (error) throw error;

      toast({
        title: "Thread deleted",
        description: "The conversation has been deleted.",
      });
      onBack();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const reportThread = async () => {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ 
          reported_at: new Date().toISOString(),
          report_reason: "Inappropriate content"
        })
        .or(`sender_id.eq.${partnerId},recipient_id.eq.${partnerId}`)
        .eq('recipient_id', user?.id);

      if (error) throw error;

      toast({
        title: "Thread reported",
        description: "The conversation has been reported to moderators.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="border-b">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <CardTitle className="text-lg">{partnerName}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {messages.length} messages
            </p>
          </div>
        </div>
      </CardHeader>

      {/* Thread Actions */}
      <div className="px-4 py-2 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Conversation with {partnerName}
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <span className="text-xs">⋯</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={deleteThread} className="text-destructive">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Thread
                </DropdownMenuItem>
                <DropdownMenuItem onClick={reportThread} className="text-destructive">
                  <Flag className="w-4 h-4 mr-2" />
                  Report Thread
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No messages yet. Start the conversation!</p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.sender_id === user?.id
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <div className="flex items-center justify-between mt-1 gap-2">
                      <p className="text-xs opacity-70">
                        {formatTime(message.created_at)}
                      </p>
                      <div className="flex items-center gap-2">
                        {message.sender_id === user?.id && !message.read_at && (
                          <Badge variant="secondary" className="text-xs">
                            Sent
                          </Badge>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-50 hover:opacity-100">
                              <span className="text-xs">⋯</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => archiveMessage(message.id)}>
                              <Archive className="w-4 h-4 mr-2" />
                              Archive
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => {
                                setMessageToDelete(message.id);
                                setShowDeleteDialog(true);
                              }}
                              className="text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                            {message.sender_id !== user?.id && (
                              <DropdownMenuItem 
                                onClick={() => reportMessage(message.id)}
                                className="text-destructive"
                              >
                                <Flag className="w-4 h-4 mr-2" />
                                Report
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        <div className="border-t p-4">
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                placeholder="Type your message... (max 2000 characters)"
                value={newMessage}
                onChange={(e) => {
                  setNewMessage(e.target.value);
                  setMessageError('');
                }}
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                disabled={sending}
                maxLength={2000}
                className={messageError ? 'border-destructive' : ''}
              />
              <Button onClick={sendMessage} disabled={sending || !newMessage.trim()}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                {newMessage.length}/2000 characters
              </span>
              {messageError && (
                <p className="text-sm text-destructive">{messageError}</p>
              )}
            </div>
          </div>
        </div>
      </CardContent>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Message</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this message? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => messageToDelete && deleteMessage(messageToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default ConversationView;