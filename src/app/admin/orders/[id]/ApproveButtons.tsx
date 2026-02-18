"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ApproveButtons({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function updateStatus(status: string) {
    setMsg(null);
    setLoading(true);
    try {
      const r = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || "Gagal update status");

      setMsg("Status berhasil diupdate.");
      router.refresh();
    } catch (e: any) {
      setMsg(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-4 space-y-2">
      <div className="flex gap-2">
        <button
          className="btn w-full sm:w-auto"
          disabled={loading}
          onClick={() => updateStatus("processing")}
        >
          {loading ? "Memproses..." : "Terima (Processing)"}
        </button>

        <button
          className="btn-ghost w-full sm:w-auto"
          disabled={loading}
          onClick={() => updateStatus("rejected")}
        >
          Tolak
        </button>

        <button
          className="btn-ghost w-full sm:w-auto"
          disabled={loading}
          onClick={() => updateStatus("done")}
        >
          Done
        </button>
      </div>

      {msg && <div className="text-sm opacity-80">{msg}</div>}
    </div>
  );
}
