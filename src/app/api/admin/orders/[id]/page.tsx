import { supabaseAdmin } from "@/lib/supabase/admin";
import Image from "next/image";
import ApproveButtons from "./ApproveButtons";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function AdminOrderDetail({ params }: Props) {
  const { id } = await params;
  const admin = supabaseAdmin();

  const { data: order } = await admin
    .from("orders")
    .select("*")
    .eq("id", id)
    .single();

  if (!order) {
    return <div>Order tidak ditemukan</div>;
  }

  let proofUrl: string | null = null;

  if (order.payment_proof_path) {
    const { data } = await admin.storage
      .from("payment-proofs")
      .createSignedUrl(order.payment_proof_path, 60 * 10);

    proofUrl = data?.signedUrl || null;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">
        {order.invoice_number}
      </h1>

      <div className="card space-y-3">
        <div>Status: {order.status}</div>
        <div>Total: Rp {order.total.toLocaleString("id-ID")}</div>

        {proofUrl && (
          <div className="space-y-2">
            <div className="font-semibold">Bukti Pembayaran</div>
            <Image
              src={proofUrl}
              alt="Proof"
              width={800}
              height={800}
              className="rounded-xl2 border"
            />
          </div>
        )}

        <ApproveButtons orderId={order.id} />
      </div>
    </div>
  );
}
