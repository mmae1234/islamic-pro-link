import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Bell, MessageCircle, Users, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';

interface Notification {
  id: string;
  type: 'message' | 'mentorship_request' | 'mentorship_accepted' | 'session_scheduled';
  title: string;
  description: string;
  read: boolean;
  created_at: string;
  data?: any;
}

const NotificationCenter = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });

  useEffect(() => {
    if (showNotifications && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right
      });
    }
  }, [showNotifications]);

  useEffect(() => {
    if (user) {
      loadNotifications();
      setupRealtimeSubscriptions();
    }
  }, [user]);

  const loadNotifications = async () => {
    if (!user) return;

    try {
      // Load unread messages
      const { data: messages } = await supabase
        .from('messages')
        .select(`
          id,
          content,
          created_at,
          sender_id,
          profiles!messages_sender_id_fkey(first_name, last_name)
        `)
        .eq('recipient_id', user.id)
        .is('read_at', null)
        .order('created_at', { ascending: false })
        .limit(5);

      // Load mentorship requests
      const { data: requests } = await supabase
        .from('mentorship_requests')
        .select(`
          id,
          message,
          status,
          created_at,
          mentee_id,
          profiles!mentorship_requests_mentee_id_fkey(first_name, last_name)
        `)
        .eq('mentor_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(5);

      const notificationsList: Notification[] = [];

      // Add message notifications
      messages?.forEach(msg => {
        // Handle profiles data - it might be an array or object
        const profileData = Array.isArray(msg.profiles) ? msg.profiles[0] : msg.profiles;
        const senderName = profileData 
          ? `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim() 
          : 'Someone';
          
        notificationsList.push({
          id: `msg-${msg.id}`,
          type: 'message',
          title: 'New Message',
          description: `${senderName || 'Someone'} sent you a message`,
          read: false,
          created_at: msg.created_at,
          data: { messageId: msg.id, senderId: msg.sender_id }
        });
      });

      // Add mentorship request notifications
      requests?.forEach(req => {
        // Handle profiles data - it might be an array or object
        const profileData = Array.isArray(req.profiles) ? req.profiles[0] : req.profiles;
        const requesterName = profileData 
          ? `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim() 
          : 'Someone';
          
        notificationsList.push({
          id: `req-${req.id}`,
          type: 'mentorship_request',
          title: 'New Mentorship Request',
          description: `${requesterName || 'Someone'} wants you as a mentor`,
          read: false,
          created_at: req.created_at,
          data: { requestId: req.id }
        });
      });

      // Sort by creation date
      notificationsList.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setNotifications(notificationsList);
      setUnreadCount(notificationsList.length);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const setupRealtimeSubscriptions = () => {
    if (!user) return;

    // Subscribe to new messages
    const messagesChannel = supabase
      .channel('user-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `recipient_id=eq.${user.id}`,
        },
        (payload) => {
          // Show toast notification
          toast({
            title: "New Message",
            description: "You have received a new message",
          });
          
          // Reload notifications
          loadNotifications();
        }
      )
      .subscribe();

    // Subscribe to mentorship requests
    const requestsChannel = supabase
      .channel('user-requests')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'mentorship_requests',
          filter: `mentor_id=eq.${user.id}`,
        },
        (payload) => {
          // Show toast notification
          toast({
            title: "New Mentorship Request",
            description: "Someone wants you as their mentor",
          });
          
          // Reload notifications
          loadNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(requestsChannel);
    };
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'message':
        return <MessageCircle className="w-4 h-4" />;
      case 'mentorship_request':
        return <Users className="w-4 h-4" />;
      case 'session_scheduled':
        return <Calendar className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  return (
    <div className="relative">
      <Button
        ref={buttonRef}
        variant="ghost"
        size="sm"
        className="relative"
        onClick={() => setShowNotifications(!showNotifications)}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </Button>

      {showNotifications && createPortal(
        <div className="fixed inset-0 z-[9998]" onClick={() => setShowNotifications(false)} />,
        document.body
      )}
      
      {showNotifications && createPortal(
        <Card 
          className="fixed w-80 z-[9999] shadow-xl border-border bg-background"
          style={{
            top: `${dropdownPosition.top}px`,
            right: `${dropdownPosition.right}px`
          }}
        >
          <CardContent className="p-0">
            <div className="p-4 border-b">
              <h3 className="font-semibold">Notifications</h3>
              {unreadCount > 0 && (
                <p className="text-sm text-muted-foreground">
                  {unreadCount} unread
                </p>
              )}
            </div>
            
            <ScrollArea className="max-h-96">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No notifications</p>
                </div>
              ) : (
                <div className="space-y-0">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className="p-4 border-b last:border-b-0 hover:bg-muted/50 cursor-pointer"
                      onClick={() => {
                        if (notification.type === 'message') {
                          window.location.href = '/messages';
                        } else if (notification.type === 'mentorship_request') {
                          window.location.href = '/mentorship';
                        }
                        setShowNotifications(false);
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{notification.title}</p>
                          <p className="text-sm text-muted-foreground truncate">
                            {notification.description}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatTimeAgo(notification.created_at)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            {notifications.length > 0 && (
              <div className="p-4 border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-sm"
                  onClick={async () => {
                    if (!user) return;
                    
                    try {
                      // Mark all messages as read
                      await supabase
                        .from('messages')
                        .update({ read_at: new Date().toISOString() })
                        .eq('recipient_id', user.id)
                        .is('read_at', null);
                      
                      // Clear notifications from state
                      setNotifications([]);
                      setUnreadCount(0);
                      setShowNotifications(false);
                      
                      toast({
                        title: "Marked as read",
                        description: "All notifications have been marked as read.",
                      });
                    } catch (error) {
                      console.error('Error marking notifications as read:', error);
                      toast({
                        title: "Error",
                        description: "Failed to mark notifications as read.",
                        variant: "destructive",
                      });
                    }
                  }}
                >
                  Mark all as read
                </Button>
              </div>
            )}
          </CardContent>
        </Card>,
        document.body
      )}
    </div>
  );
};

export default NotificationCenter;