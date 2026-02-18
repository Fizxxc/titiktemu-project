"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ApproveButtons({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function updateStatus(status: string) {
    setLoading(true);

    await fetch(`/api/admin/orders/${orderId}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    setLoading(false);
    router.refresh();
  }

  return (
    <div className="flex gap-3 mt-4">
      <button
        className="btn"
        disabled={loading}
        onClick={() => updateStatus("processing")}
      >
        Terima
      </button>

      <button
        className="btn-ghost"
        disabled={loading}
        onClick={() => updateStatus("rejected")}
      >
        Tolak
      </button>
    </div>
  );
}
