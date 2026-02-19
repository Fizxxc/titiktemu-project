"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

type OrderRow = {
  id: string;
  invoice_number: string | null;
  total: number;
  status: string;
  created_at: string;
  payment_proof_path?: string | null;
  coupon_code?: string | null;
  discount?: number | null;
  subtotal?: number | null;
  user_id?: string | null;
};

function rupiah(n: number) {
  return `Rp ${Number(n || 0).toLocaleString("id-ID")}`;
}

function fmtDate(s: string) {
  try {
    return new Date(s).toLocaleString("id-ID");
  } catch {
    return s;
  }
}

const STATUS = [
  "all",
  "pending_payment",
  "paid_review",
  "processing",
  "done",
  "rejected",
] as const;

async function fetchOrders() {
  const supabase = supabaseBrowser();
  const { data, error } = await supabase
    .from("orders")
    .select(
      "id,invoice_number,total,status,created_at,payment_proof_path,coupon_code,discount,subtotal,user_id"
    )
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []) as OrderRow[];
}

export default function AdminOrdersClient({
  initial,
  serverError,
}: {
  initial: OrderRow[];
  serverError?: string | null;
}) {
  const supabase = useMemo(() => supabaseBrowser(), []);

  const [list, setList] = useState<OrderRow[]>(initial);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<(typeof STATUS)[number]>("all");

  const [liveMsg, setLiveMsg] = useState<string | null>(null);
  const [liveBusy, setLiveBusy] = useState(false);

  // ✅ initial -> list (kalau initial berubah dari server component)
  useEffect(() => {
    setList(initial);
  }, [initial]);

  // ✅ REALTIME subscription (tanpa refresh manual)
  useEffect(() => {
    let alive = true;

    async function syncNow(reason: string) {
      try {
        setLiveBusy(true);
        const rows = await fetchOrders();
        if (!alive) return;
        setList(rows);
        setLiveMsg(reason);
        window.clearTimeout((syncNow as any)._t);
        (syncNow as any)._t = window.setTimeout(() => setLiveMsg(null), 1800);
      } catch (e: any) {
        if (!alive) return;
        setLiveMsg(`Realtime sync error: ${e.message}`);
        window.clearTimeout((syncNow as any)._t);
        (syncNow as any)._t = window.setTimeout(() => setLiveMsg(null), 2500);
      } finally {
        if (alive) setLiveBusy(false);
      }
    }

    // Subscribe ke perubahan di table orders
    const ch = supabase
      .channel("admin-orders-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        (payload) => {
          // payload.eventType: INSERT | UPDATE | DELETE
          const eventType = (payload as any).eventType || "CHANGE";
          const reason =
            eventType === "INSERT"
              ? "Order baru masuk ✅"
              : eventType === "UPDATE"
              ? "Order terupdate ✅"
              : eventType === "DELETE"
              ? "Order terhapus ✅"
              : "Order berubah ✅";

          // opsi A (paling aman): re-fetch list agar konsisten
          syncNow(reason);
        }
      )
      .subscribe((status) => {
        // subscribed / timed_out / closed / channel_error
        if (status === "SUBSCRIBED") {
          syncNow("Realtime aktif ✅");
        }
      });

    return () => {
      alive = false;
      supabase.removeChannel(ch);
    };
  }, [supabase]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return list.filter((o) => {
      const matchStatus = status === "all" ? true : o.status === status;
      const matchQuery =
        !query ||
        (o.invoice_number || "").toLowerCase().includes(query) ||
        (o.user_id || "").toLowerCase().includes(query);
      return matchStatus && matchQuery;
    });
  }, [list, q, status]);

  const countPaidReview = useMemo(
    () => list.filter((o) => o.status === "paid_review").length,
    [list]
  );

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold">Admin • Orders</h1>
          <p className="text-sm opacity-70 mt-1">
            Total {list.length} order •{" "}
            <span className="font-semibold">{countPaidReview}</span> menunggu
            verifikasi (paid_review)
          </p>

          {/* ✅ Live banner */}
          <div className="mt-2 flex items-center gap-2 text-xs">
            <span className={liveBusy ? "opacity-60" : "opacity-80"}>
              {liveBusy ? "Sync..." : "Live"}
            </span>
            <span className="opacity-40">•</span>
            <span className="opacity-70">
              {liveMsg || "Menunggu perubahan dari database…"}
            </span>
          </div>
        </div>

        <Link href="/admin" className="btn-ghost hidden sm:inline-flex">
          Dashboard
        </Link>
      </div>

      {serverError && (
        <div className="card border-red-500/30 bg-white">
          <div className="font-semibold text-red-600">Server error</div>
          <div className="text-sm opacity-80 mt-1">{serverError}</div>
        </div>
      )}

      {/* Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_220px] gap-3">
        <input
          className="input"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Cari invoice / user_id…"
        />

        <select
          className="input"
          value={status}
          onChange={(e) => setStatus(e.target.value as any)}
        >
          {STATUS.map((s) => (
            <option key={s} value={s}>
              {s === "all" ? "Semua status" : s}
            </option>
          ))}
        </select>
      </div>

      {/* List */}
      <div className="space-y-3">
        {filtered.map((o) => (
          <div
            key={o.id}
            className="card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <div className="font-semibold truncate">
                  {o.invoice_number || o.id}
                </div>

                {o.status === "paid_review" && (
                  <span className="badge">Perlu dicek</span>
                )}
              </div>

              <div className="mt-1 text-xs sm:text-sm opacity-70 space-y-1">
                <div>Tanggal: {fmtDate(o.created_at)}</div>
                <div className="truncate">User: {o.user_id}</div>
                {o.coupon_code ? (
                  <div>
                    Kupon:{" "}
                    <span className="font-semibold">{o.coupon_code}</span> •
                    Diskon:{" "}
                    <span className="font-semibold">
                      {rupiah(o.discount || 0)}
                    </span>
                  </div>
                ) : (
                  <div>Tanpa kupon</div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-3">
              <div className="text-right">
                <div className="text-xs opacity-70">Total</div>
                <div className="font-semibold">{rupiah(o.total)}</div>
                <div className="text-xs opacity-70">Status: {o.status}</div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <Link href={`/admin/orders/${o.id}`} className="btn-ghost">
                  Detail
                </Link>

                <a
                  href={`/api/invoice/${o.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-ghost"
                >
                  Invoice A4
                </a>

                <a
                  href={`/api/receipt/${o.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-ghost"
                >
                  Struk 58mm
                </a>
              </div>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="card text-center py-10 opacity-70">
            Tidak ada order yang cocok.
          </div>
        )}
      </div>
    </div>
  );
}
