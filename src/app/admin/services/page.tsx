import { supabaseServer } from "@/lib/supabase/server";
import AdminServicesClient from "./ui";

export const runtime = "nodejs";

export default async function AdminServicesPage() {
  const supabase = await supabaseServer();

  const { data } = await supabase
    .from("services")
    .select("id,title,slug,description,price,cover_url,is_active,created_at,updated_at")
    .order("created_at", { ascending: false });

  return <AdminServicesClient initial={data || []} />;
}
