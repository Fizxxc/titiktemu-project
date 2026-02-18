"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

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

export default function AdminOrdersClient({
  initial,
  serverError,
}: {
  initial: OrderRow[];
  serverError?: string | null;
}) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<(typeof STATUS)[number]>("all");

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();

    return initial.filter((o) => {
      const matchStatus = status === "all" ? true : o.status === status;
      const matchQuery =
        !query ||
        (o.invoice_number || "").toLowerCase().includes(query) ||
        (o.user_id || "").toLowerCase().includes(query);

      return matchStatus && matchQuery;
    });
  }, [initial, q, status]);

  const countPaidReview = useMemo(
    () => initial.filter((o) => o.status === "paid_review").length,
    [initial]
  );

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold">Admin • Orders</h1>
          <p className="text-sm opacity-70 mt-1">
            Total {initial.length} order • <span className="font-semibold">{countPaidReview}</span> menunggu verifikasi (paid_review)
          </p>
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
                    Kupon: <span className="font-semibold">{o.coupon_code}</span> • Diskon:{" "}
                    <span className="font-semibold">{rupiah(o.discount || 0)}</span>
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
