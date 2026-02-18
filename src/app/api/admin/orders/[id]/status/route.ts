import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";

export const runtime = "nodejs";

const ALLOWED = new Set([
  "pending_payment",
  "paid_review",
  "processing",
  "done",
  "rejected",
]);

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> } // ✅ params Promise
) {
  try {
    const { id } = await ctx.params; // ✅ FIX: await params

    const supabase = await supabaseServer();
    const admin = supabaseAdmin();

    // ensure requester logged in
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // ensure requester admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const status = String(body.status || "");

    if (!ALLOWED.has(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // fetch order
    const { data: order, error: oErr } = await admin
      .from("orders")
      .select("id,invoice_number,user_id,total")
      .eq("id", id)
      .single();

    if (oErr) return NextResponse.json({ error: oErr.message }, { status: 500 });
    if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // update
    const { error: uErr } = await admin.from("orders").update({ status }).eq("id", order.id);
    if (uErr) return NextResponse.json({ error: uErr.message }, { status: 500 });

    // email user
    const userRes = await admin.auth.admin.getUserById(order.user_id);
    const email = userRes.data.user?.email;

    if (email) {
      const site = process.env.SITE_NAME || "titiktemu production";
      const base =
        process.env.NEXT_PUBLIC_SITE_URL ||
        (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

      await sendEmail({
        to: email,
        subject: `[${site}] Status order: ${order.invoice_number || order.id}`,
        html: `
          <div style="font-family:Arial,sans-serif">
            <h2 style="margin:0 0 10px">Update Status Order</h2>
            <p>Order <b>${order.invoice_number || order.id}</b> sekarang: <b>${status}</b></p>
            <p>Total: <b>Rp ${Number(order.total).toLocaleString("id-ID")}</b></p>
            <p>
              Invoice A4: <a href="${base}/api/invoice/${order.id}">Unduh PDF</a><br/>
              Struk 58mm: <a href="${base}/api/receipt/${order.id}">Unduh Struk</a>
            </p>
          </div>
        `,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("admin status error:", e);
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}
