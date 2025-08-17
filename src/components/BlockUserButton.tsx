import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Ban } from 'lucide-react';

interface BlockUserButtonProps {
  targetUserId: string;
  targetUserName?: string;
  variant?: 'destructive' | 'outline' | 'ghost';
  size?: 'sm' | 'default';
  className?: string;
}

const BlockUserButton = ({ 
  targetUserId, 
  targetUserName = 'this user',
  variant = 'outline',
  size = 'sm',
  className = ''
}: BlockUserButtonProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleBlock = async () => {
    if (!user || user.id === targetUserId) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('blocked_users')
        .insert({
          blocker_id: user.id,
          blocked_id: targetUserId
        });

      if (error) throw error;

      toast({
        title: "User blocked",
        description: `${targetUserName} has been blocked successfully.`,
      });
    } catch (error: any) {
      if (error.code === '23505') {
        toast({
          title: "Already blocked",
          description: "This user is already blocked.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error blocking user",
          description: error.message,
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.id === targetUserId) {
    return null;
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button 
          variant={variant} 
          size={size} 
          className={className}
          disabled={loading}
        >
          <Ban className="w-4 h-4 mr-2" />
          Block User
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Block {targetUserName}?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to block {targetUserName}? They will no longer be able to message you, and you won't see their content.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleBlock}
            disabled={loading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading ? 'Blocking...' : 'Block User'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default BlockUserButton;