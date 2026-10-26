// Beyond Belief: Supabase helpers. Use with <script type="module">.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

// Paste these from Supabase > Project Settings > API.
const SUPABASE_URL = "https://cpferldvbhxcxbcaqbdy.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_yulwb7G4I-s4PODXV7Q4Zw_on1N0jtI";

export const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const me = async () => (await sb.auth.getUser()).data.user?.id;

// ---- Accounts ----
export const signUp = (email, password) => sb.auth.signUp({ email, password });
export const signIn = (email, password) => sb.auth.signInWithPassword({ email, password });
export const signOut = () => sb.auth.signOut();

export async function saveProfile({ username, display_name, age, city, worldview, interests, bio }) {
  if (age < 18) throw new Error("Adults 18+ only");
  return sb.from("profiles").upsert({ id: await me(), username, display_name, age, city, worldview, interests, bio });
}

// ---- Search by username ----
export function searchUsers(q) {
  const clean = q.trim().replace(/^@/, "").toLowerCase().replace(/[%_\\]/g, "\\$&");
  return sb.from("profiles")
    .select("id,username,display_name,age,city,worldview")
    .ilike("username", clean + "%")
    .limit(20);
}

// ---- Sparks and matches ----
export async function sendSpark(toId) {
  return sb.from("sparks").insert({ from_id: await me(), to_id: toId });
}

export async function getMatches() {
  const id = await me();
  const [{ data: sent }, { data: got }] = await Promise.all([
    sb.from("sparks").select("to_id").eq("from_id", id),
    sb.from("sparks").select("from_id").eq("to_id", id),
  ]);
  const gotSet = new Set((got || []).map(r => r.from_id));
  const ids = (sent || []).map(r => r.to_id).filter(x => gotSet.has(x));
  if (!ids.length) return { data: [] };
  return sb.from("profiles").select("id,username,display_name,age,city,worldview").in("id", ids);
}

// ---- Private chat ----
export async function loadChat(otherId) {
  const id = await me();
  return sb.from("messages").select("*")
    .or(`and(sender_id.eq.${id},recipient_id.eq.${otherId}),and(sender_id.eq.${otherId},recipient_id.eq.${id})`)
    .order("created_at", { ascending: true });
}

export async function sendText(toId, body) {
  return sb.from("messages").insert({ sender_id: await me(), recipient_id: toId, body });
}

export async function subscribeChat(otherId, onMessage) {
  const id = await me();
  return sb.channel("chat-" + otherId)
    .on("postgres_changes",
      { event: "INSERT", schema: "public", table: "messages", filter: `recipient_id=eq.${id}` },
      payload => { if (payload.new.sender_id === otherId) onMessage(payload.new); })
    .subscribe();
}

// ---- Voice notes ----
export async function sendVoice(toId, blob) {
  const id = await me();
  const ext = blob.type.includes("mp4") ? "mp4" : "webm";
  const path = `${id}/${crypto.randomUUID()}.${ext}`;
  const up = await sb.storage.from("voice-notes").upload(path, blob, { contentType: blob.type });
  if (up.error) return up;
  return sb.from("messages").insert({ sender_id: id, recipient_id: toId, audio_path: path });
}

export async function voiceUrl(path) {
  const { data } = await sb.storage.from("voice-notes").createSignedUrl(path, 3600);
  return data?.signedUrl;
}

// ---- Safety ----
export async function blockUser(userId) {
  return sb.from("blocks").insert({ blocker_id: await me(), blocked_id: userId });
}
export async function reportUser(userId, reason) {
  return sb.from("reports").insert({ reporter_id: await me(), reported_id: userId, reason });
}

// ---- Live voice calls ----
export const ICE_SERVERS = [{ urls: "stun:stun.l.google.com:19302" }];

export async function createCall(calleeId) {
  return sb.from("calls").insert({ caller_id: await me(), callee_id: calleeId }).select("id").single();
}
export const setCallStatus = (id, status) => sb.from("calls").update({ status }).eq("id", id);
export const callChannel = id => sb.channel(`call:${id}`, { config: { private: true, broadcast: { self: false } } });

export async function subscribeCalls(onInsert, onUpdate) {
  const id = await me();
  return sb.channel("calls-" + id)
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "calls", filter: `callee_id=eq.${id}` }, p => onInsert(p.new))
    .on("postgres_changes", { event: "UPDATE", schema: "public", table: "calls", filter: `callee_id=eq.${id}` }, p => onUpdate(p.new))
    .on("postgres_changes", { event: "UPDATE", schema: "public", table: "calls", filter: `caller_id=eq.${id}` }, p => onUpdate(p.new))
    .subscribe();
}
