import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { qk } from "./keys";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type MessageRow = {
  id: string;
  content: string;
  created_at: string;
  sender_id: string;
  recipient_id: string;
  read_at: string | null;
  deleted_at?: string | null;
  sender_profile?: { first_name: string | null; last_name: string | null } | null;
  recipient_profile?: { first_name: string | null; last_name: string | null } | null;
};

export type ConversationSummary = {
  partner_id: string;
  partner_name: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
};

// ─────────────────────────────────────────────────────────────────────────────
// Reads
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Builds the user's conversation list (one entry per partner) by reading
 * `conversations` plus enough recent messages to populate previews and unread
 * counts. Avoids `.or()` filters because they crash iOS Safari for users with
 * many conversations.
 */
export function useConversations(userId: string | undefined) {
  return useQuery({
    queryKey: qk.messages.conversations(userId),
    enabled: !!userId,
    queryFn: async (): Promise<ConversationSummary[]> => {
      const conversationSelect = `
        id, user_a, user_b, status, updated_at,
        profiles_a:profiles!conversations_user_a_fkey(first_name, last_name),
        profiles_b:profiles!conversations_user_b_fkey(first_name, last_name)
      `;
      const [{ data: convAData, error: convAError }, { data: convBData, error: convBError }] =
        await Promise.all([
          supabase
            .from("conversations")
            .select(conversationSelect)
            .eq("user_a", userId!)
            .neq("status", "blocked")
            .order("updated_at", { ascending: false }),
          supabase
            .from("conversations")
            .select(conversationSelect)
            .eq("user_b", userId!)
            .neq("status", "blocked")
            .order("updated_at", { ascending: false }),
        ]);

      if (convAError) throw convAError;
      if (convBError) throw convBError;

      const conversationsData = [...(convAData ?? []), ...(convBData ?? [])].sort(
        (a, b) => +new Date(b.updated_at) - +new Date(a.updated_at),
      );

      const conversationsList: ConversationSummary[] = conversationsData.map((conv: any) => {
        const isUserA = conv.user_a === userId;
        const partnerId: string = isUserA ? conv.user_b : conv.user_a;
        const rawProfile = isUserA ? conv.profiles_b : conv.profiles_a;
        const profile = Array.isArray(rawProfile) ? rawProfile[0] : rawProfile;
        return {
          partner_id: partnerId,
          partner_name:
            `${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`.trim() ||
            "Unknown",
          last_message: "",
          last_message_time: conv.updated_at,
          unread_count: 0,
        };
      });

      // Fold in last message + unread count per conversation, batched.
      if (conversationsList.length > 0) {
        const partnerIds = conversationsList.map((c) => c.partner_id);
        const [outRes, inRes] = await Promise.all([
          supabase
            .from("messages")
            .select("content, created_at, sender_id, recipient_id, read_at")
            .eq("sender_id", userId!)
            .in("recipient_id", partnerIds)
            .is("deleted_at", null)
            .order("created_at", { ascending: false })
            .limit(500),
          supabase
            .from("messages")
            .select("content, created_at, sender_id, recipient_id, read_at")
            .eq("recipient_id", userId!)
            .in("sender_id", partnerIds)
            .is("deleted_at", null)
            .order("created_at", { ascending: false })
            .limit(500),
        ]);

        const allMessages = [
          ...((outRes.data ?? []) as any[]),
          ...((inRes.data ?? []) as any[]),
        ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        for (const conv of conversationsList) {
          const convMessages = allMessages.filter(
            (msg) =>
              (msg.sender_id === userId && msg.recipient_id === conv.partner_id) ||
              (msg.sender_id === conv.partner_id && msg.recipient_id === userId),
          );
          if (convMessages.length > 0) {
            conv.last_message = convMessages[0].content;
            conv.last_message_time = convMessages[0].created_at;
          }
          conv.unread_count = convMessages.filter(
            (msg) =>
              msg.sender_id === conv.partner_id &&
              msg.recipient_id === userId &&
              !msg.read_at,
          ).length;
        }
      }

      return conversationsList;
    },
  });
}

export function useInboxMessages(userId: string | undefined) {
  return useQuery({
    queryKey: qk.messages.inbox(userId),
    enabled: !!userId,
    queryFn: async (): Promise<MessageRow[]> => {
      const { data, error } = await supabase
        .from("messages")
        .select(
          `*, sender_profile:profiles!messages_sender_id_fkey(first_name, last_name)`,
        )
        .eq("recipient_id", userId!)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as MessageRow[];
    },
  });
}

export function useSentMessages(userId: string | undefined) {
  return useQuery({
    queryKey: qk.messages.sent(userId),
    enabled: !!userId,
    queryFn: async (): Promise<MessageRow[]> => {
      const { data, error } = await supabase
        .from("messages")
        .select(
          `*, recipient_profile:profiles!messages_recipient_id_fkey(first_name, last_name)`,
        )
        .eq("sender_id", userId!)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as MessageRow[];
    },
  });
}

export function useArchivedMessages(userId: string | undefined) {
  return useQuery({
    queryKey: qk.messages.archived(userId),
    enabled: !!userId,
    queryFn: async (): Promise<MessageRow[]> => {
      const archivedSelect = `
        *,
        sender_profile:profiles!messages_sender_id_fkey(first_name, last_name),
        recipient_profile:profiles!messages_recipient_id_fkey(first_name, last_name)
      `;
      const [{ data: archSent, error: errSent }, { data: archReceived, error: errReceived }] =
        await Promise.all([
          supabase
            .from("messages")
            .select(archivedSelect)
            .eq("sender_id", userId!)
            .not("deleted_at", "is", null)
            .order("created_at", { ascending: false }),
          supabase
            .from("messages")
            .select(archivedSelect)
            .eq("recipient_id", userId!)
            .not("deleted_at", "is", null)
            .order("created_at", { ascending: false }),
        ]);

      if (errSent) throw errSent;
      if (errReceived) throw errReceived;

      return [...((archSent ?? []) as any[]), ...((archReceived ?? []) as any[])]
        .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at)) as MessageRow[];
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Mutations
// ─────────────────────────────────────────────────────────────────────────────

export function useSendMessage(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      recipientId,
      content,
    }: {
      recipientId: string;
      content: string;
    }) => {
      const { error } = await supabase.rpc("send_message", {
        _recipient_id: recipientId,
        _content: content,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      // After sending, the conversations + sent caches should reflect the new row.
      queryClient.invalidateQueries({ queryKey: qk.messages.all(userId) });
    },
  });
}

export function useMarkMessageRead(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (messageId: string) => {
      // Scope by recipient_id to avoid no-op writes that RLS rejects for non-recipients.
      if (!userId) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("messages")
        .update({ read_at: new Date().toISOString() })
        .eq("id", messageId)
        .eq("recipient_id", userId);
      if (error) throw error;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: qk.messages.inbox(userId) });
      queryClient.invalidateQueries({ queryKey: qk.messages.conversations(userId) });
    },
  });
}

/** Soft-delete a single message (moves it to Archived). */
export function useDeleteMessage(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (messageId: string) => {
      const { error } = await supabase
        .from("messages")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", messageId);
      if (error) throw error;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: qk.messages.all(userId) });
    },
  });
}

/**
 * Delete an entire conversation: removes the conversations row and soft-deletes
 * all messages between the two users. Conversations are stored with
 * `user_a < user_b` so the pair lookup is a single ordered eq().eq() — no `.or()`.
 */
export function useDeleteConversation(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (partnerId: string) => {
      if (!userId) throw new Error("Not authenticated");
      const [orderedA, orderedB] = [userId, partnerId].sort();

      const { error: convErr } = await supabase
        .from("conversations")
        .delete()
        .eq("user_a", orderedA)
        .eq("user_b", orderedB);
      if (convErr) throw convErr;

      const nowIso = new Date().toISOString();
      const [outRes, inRes] = await Promise.all([
        supabase
          .from("messages")
          .update({ deleted_at: nowIso })
          .eq("sender_id", userId)
          .eq("recipient_id", partnerId),
        supabase
          .from("messages")
          .update({ deleted_at: nowIso })
          .eq("sender_id", partnerId)
          .eq("recipient_id", userId),
      ]);
      if (outRes.error) throw outRes.error;
      if (inRes.error) throw inRes.error;
    },
    onMutate: async (partnerId) => {
      const key = qk.messages.conversations(userId);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<ConversationSummary[]>(key);
      if (previous) {
        queryClient.setQueryData<ConversationSummary[]>(
          key,
          previous.filter((c) => c.partner_id !== partnerId),
        );
      }
      return { previous };
    },
    onError: (_err, _partnerId, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(qk.messages.conversations(userId), ctx.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: qk.messages.all(userId) });
    },
  });
}
