export const dynamic = "force-dynamic";
export const revalidate = 0;

import { supabaseServer } from "@/lib/supabase/server";
import AdminOrdersClient from "./ui";

export default async function AdminOrders() {
  const supabase = await supabaseServer();

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    return (
      <div className="card">
        <div className="font-semibold">Unauthorized</div>
        <div className="text-sm opacity-70 mt-1">Silakan login dulu.</div>
      </div>
    );
  }

  const { data, error } = await supabase
    .from("orders")
    .select("id,invoice_number,total,status,created_at,payment_proof_url,coupon_code,discount,subtotal,user_id")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="card">
        <div className="font-semibold">Error load orders</div>
        <pre className="text-xs mt-2 opacity-80 whitespace-pre-wrap">
          {JSON.stringify(error, null, 2)}
        </pre>
      </div>
    );
  }

  return <AdminOrdersClient initial={data || []} />;
}
