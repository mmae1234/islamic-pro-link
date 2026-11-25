import { afterEach, expect, mock, test } from "bun:test";

const profile = { user_id: "professional-1", first_name: "Test", last_name: "Member" };
const professional = { user_id: "professional-1", occupation: "Engineer" };
const calls = [];
let response = { data: [{ profile, professional }], error: null };
const client = {
  async rpc(name, args) {
    // The real Supabase implementation also needs its client receiver.
    if (this !== client) throw new TypeError("Supabase client receiver was lost");
    calls.push({ name, args });
    return response;
  },
};

mock.module("@/integrations/supabase/client", () => ({ supabase: client }));
const { fetchMemberProfiles } = await import("../hooks/queries/useProfile.ts");

afterEach(() => {
  calls.length = 0;
  response = { data: [{ profile, professional }], error: null };
});

test("loads a professional without losing the Supabase client receiver", async () => {
  expect(await fetchMemberProfiles(["professional-1", "professional-1", ""])).toEqual([
    { profile, professionalProfile: professional },
  ]);
  expect(calls).toEqual([
    { name: "get_member_profiles", args: { _user_ids: ["professional-1"] } },
  ]);
});

test("returns no profiles when the lookup returns no visible members", async () => {
  response = { data: [], error: null };
  expect(await fetchMemberProfiles(["missing-member"])).toEqual([]);
});

test("propagates lookup errors instead of treating them as missing profiles", async () => {
  response = { data: null, error: new Error("Lookup unavailable") };
  await expect(fetchMemberProfiles(["professional-1"])).rejects.toThrow("Lookup unavailable");
});