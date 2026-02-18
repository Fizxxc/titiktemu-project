import { supabaseAdmin } from "@/lib/supabase/admin";
import Link from "next/link";
import Image from "next/image";
import ApproveButtons from "./ApproveButtons";

type Props = {
  params: Promise<{ id: string }>; // ✅ FIX: Next.js 16 params is Promise
};

function rupiah(n: number) {
  return `Rp ${Number(n || 0).toLocaleString("id-ID")}`;
}

export default async function AdminOrderDetailPage({ params }: Props) {
  const admin = supabaseAdmin();
  const { id } = await params; // ✅ FIX: await params

  const { data: order, error } = await admin
    .from("orders")
    .select("id,invoice_number,user_id,total,status,created_at,payment_proof_path,notes")
    .eq("id", id)
    .single();

  if (error || !order) {
    return (
      <div className="card">
        <div className="font-semibold">Order tidak ditemukan</div>
        <div className="text-sm opacity-70 mt-2">{error?.message}</div>
        <Link className="btn-ghost mt-4 inline-flex" href="/admin/orders">
          Kembali
        </Link>
      </div>
    );
  }

  // Signed URL untuk bukti bayar (bucket private)
  let proofUrl: string | null = null;
  if (order.payment_proof_path) {
    const { data } = await admin.storage
      .from("payment-proofs")
      .createSignedUrl(order.payment_proof_path, 60 * 10);
    proofUrl = data?.signedUrl || null;
  }

  const base =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">
            {order.invoice_number || order.id}
          </h1>
          <div className="text-sm opacity-70 mt-1">
            {new Date(order.created_at).toLocaleString("id-ID")}
          </div>
        </div>
        <Link href="/admin/orders" className="btn-ghost">
          Kembali
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card space-y-2">
          <div className="text-sm opacity-70">User</div>
          <div className="font-semibold break-all">{order.user_id}</div>

          <div className="mt-3 text-sm opacity-70">Status</div>
          <div className="font-semibold">{order.status}</div>

          <div className="mt-3 text-sm opacity-70">Total</div>
          <div className="font-semibold">{rupiah(order.total)}</div>

          {order.notes && (
            <>
              <div className="mt-3 text-sm opacity-70">Notes</div>
              <div className="text-sm whitespace-pre-wrap">{order.notes}</div>
            </>
          )}

          <div className="mt-4 flex flex-col sm:flex-row gap-2">
            <a
              className="btn-ghost w-full sm:w-auto"
              href={`${base}/api/invoice/${order.id}`}
              target="_blank"
              rel="noreferrer"
            >
              Invoice A4
            </a>

            <a
              className="btn-ghost w-full sm:w-auto"
              href={`${base}/api/receipt/${order.id}`}
              target="_blank"
              rel="noreferrer"
            >
              Struk 58mm (QR)
            </a>
          </div>

          <ApproveButtons orderId={order.id} />
        </div>

        <div className="card space-y-3">
          <div className="font-semibold">Bukti Pembayaran</div>

          {!proofUrl ? (
            <div className="text-sm opacity-70">
              Belum ada bukti pembayaran diupload.
            </div>
          ) : (
            <>
              <div className="rounded-xl2 border border-black/10 overflow-hidden bg-white">
                <Image
                  src={proofUrl}
                  alt="Bukti pembayaran"
                  width={1200}
                  height={1200}
                  className="w-full h-auto"
                />
              </div>

              <a
                className="btn-ghost w-full sm:w-auto"
                href={proofUrl}
                target="_blank"
                rel="noreferrer"
              >
                Buka gambar (signed)
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
