import { supabaseAdmin } from "@/lib/supabase/admin";
import AdminOrdersClient from "./ui";

export default async function AdminOrders() {
  const admin = supabaseAdmin();

  const { data, error } = await admin
    .from("orders")
    .select("id,invoice_number,total,status,created_at,payment_proof_path,coupon_code,discount,subtotal,user_id")
    .order("created_at", { ascending: false });

  // kalau ada error, tetap render UI dengan empty supaya tidak crash
  return <AdminOrdersClient initial={data || []} serverError={error?.message || null} />;
}
