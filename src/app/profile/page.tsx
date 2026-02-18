import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";

export default async function ProfilePage() {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="card">
        Kamu belum login. <Link className="underline" href="/login">Masuk</Link>
      </div>
    );
  }

  const { data: profile } = await supabase.from("profiles").select("full_name,phone,role").eq("id", user.id).single();
  const { data: orders } = await supabase
    .from("orders")
    .select("id,invoice_number,total,status,created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="badge">Akun</div>
        <div className="text-2xl font-semibold mt-2">{profile?.full_name || "User"}</div>
        <div className="opacity-70 text-sm">{user.email}</div>
        <div className="opacity-70 text-sm">Role: {profile?.role}</div>
        {profile?.role === "admin" && (
          <div className="mt-3">
            <Link className="btn" href="/admin">Masuk Admin</Link>
          </div>
        )}
      </div>

      <div className="card">
        <div className="font-semibold">Riwayat Order</div>
        <div className="mt-3 space-y-2">
          {orders?.map(o => (
            <div key={o.id} className="flex flex-wrap items-center justify-between border-b border-black/10 pb-2">
              <div>
                <div className="font-semibold">{o.invoice_number}</div>
                <div className="text-sm opacity-70">{new Date(o.created_at).toLocaleString("id-ID")} • {o.status}</div>
              </div>
              <div className="flex items-center gap-3">
                <div className="font-semibold">Rp {Number(o.total).toLocaleString("id-ID")}</div>
                <a className="btn-ghost" href={`/api/invoice/${o.id}`} target="_blank" rel="noreferrer">Invoice PDF</a>
              </div>
            </div>
          ))}
          {!orders?.length && <div className="opacity-70 text-sm">Belum ada order.</div>}
        </div>
      </div>
    </div>
  );
}
