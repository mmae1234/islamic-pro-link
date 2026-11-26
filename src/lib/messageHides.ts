import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

// conversation_hides / message_hides aren't in the generated types yet.
const db = supabase as unknown as SupabaseClient;

export type MyHides = {
  messageIds: Set<string>;
  /** partnerId → ms timestamp; messages with that partner at/before it are hidden. */
  threadBefore: Map<string, number>;
};

/** What the current user has deleted for themselves (other people's copies are untouched). */
export async function fetchMyHides(userId: string): Promise<MyHides> {
  const [threads, msgs] = await Promise.all([
    db.from("conversation_hides").select("partner_id, hidden_before").eq("user_id", userId),
    db.from("message_hides").select("message_id").eq("user_id", userId),
  ]);
  // Before the migration is applied these tables don't exist; show everything.
  const threadRows = (threads.error ? [] : threads.data ?? []) as Array<{ partner_id: string; hidden_before: string }>;
  const msgRows = (msgs.error ? [] : msgs.data ?? []) as Array<{ message_id: string }>;
  return {
    messageIds: new Set(msgRows.map((r) => r.message_id)),
    threadBefore: new Map(threadRows.map((r) => [r.partner_id, new Date(r.hidden_before).getTime()])),
  };
}

export function isHiddenForMe(
  msg: { id: string; sender_id: string; recipient_id: string; created_at: string },
  userId: string,
  hides: MyHides,
): boolean {
  if (hides.messageIds.has(msg.id)) return true;
  const partner = msg.sender_id === userId ? msg.recipient_id : msg.sender_id;
  const before = hides.threadBefore.get(partner);
  return before !== undefined && new Date(msg.created_at).getTime() <= before;
}

export async function hideMessageForMe(userId: string, messageId: string) {
  const { error } = await db
    .from("message_hides")
    .upsert({ user_id: userId, message_id: messageId }, { onConflict: "user_id,message_id" });
  if (error) throw error;
}

export async function unhideMessageForMe(userId: string, messageId: string) {
  const { error } = await db.from("message_hides").delete().eq("user_id", userId).eq("message_id", messageId);
  if (error) throw error;
}

export async function hideThreadForMe(userId: string, partnerId: string) {
  const { error } = await db
    .from("conversation_hides")
    .upsert(
      { user_id: userId, partner_id: partnerId, hidden_before: new Date().toISOString() },
      { onConflict: "user_id,partner_id" },
    );
  if (error) throw error;
}
