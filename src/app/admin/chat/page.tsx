import { supabaseAdmin } from "@/lib/supabase/admin";
import AdminChatClient from "./ui";

export const runtime = "nodejs";

export default async function AdminChatPage() {
  const admin = supabaseAdmin();

  const { data: rooms } = await admin
    .from("chat_rooms")
    .select("id,user_id,created_at")
    .order("created_at", { ascending: false });

  return <AdminChatClient initialRooms={rooms || []} />;
}
