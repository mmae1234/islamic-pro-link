/**
 * Centralized type aliases derived from the generated Supabase types.
 *
 * Importing from one place means every hook/page uses the same canonical
 * shape, and a Lovable-driven regen of `types.ts` propagates everywhere.
 *
 * Convention:
 *   - `Tbl<'name'>`  for full row types
 *   - `Ins<'name'>`  for insert payloads
 *   - `Upd<'name'>`  for update payloads
 *   - `Fn<'name'>`   for RPC return rows
 */
import type { Database, Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

// Re-exported shorthands.
export type Tbl<T extends keyof Database["public"]["Tables"]> = Tables<T>;
export type Ins<T extends keyof Database["public"]["Tables"]> = TablesInsert<T>;
export type Upd<T extends keyof Database["public"]["Tables"]> = TablesUpdate<T>;

/**
 * RPC return-row helper. The Returns field is `T[]` for set-returning
 * functions and `T` (or never) for scalar returns; this picks the row.
 */
export type FnReturn<T extends keyof Database["public"]["Functions"]> =
  Database["public"]["Functions"][T]["Returns"];

export type FnRow<T extends keyof Database["public"]["Functions"]> =
  FnReturn<T> extends Array<infer R> ? R : FnReturn<T>;

// Common row aliases used across hooks.
export type ProfileRow = Tbl<"profiles">;
export type ProfessionalProfileRow = Tbl<"professional_profiles">;
export type BusinessAccountRow = Tbl<"business_accounts">;
export type FavoriteRow = Tbl<"favorites">;
export type MessageRowDb = Tbl<"messages">;
export type ConversationRow = Tbl<"conversations">;
export type MentorshipRequestRow = Tbl<"mentorship_requests">;
export type AbuseReportRow = Tbl<"abuse_reports">;

// Just the {first_name, last_name} shape used for joined name lookups.
export type ProfileNameSlice = Pick<ProfileRow, "first_name" | "last_name">;
