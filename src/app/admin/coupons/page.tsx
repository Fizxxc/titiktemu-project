import { supabaseServer } from "@/lib/supabase/server";
import AdminCouponsClient from "./ui";

export default async function AdminCoupons() {
  const supabase = await supabaseServer();
  const { data } = await supabase.from("coupons").select("*").order("created_at", { ascending: false });
  return <AdminCouponsClient initial={data || []} />;
}
