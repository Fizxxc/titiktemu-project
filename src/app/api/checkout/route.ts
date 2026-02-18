import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { computeDiscount } from "@/lib/discount";
import { nanoid } from "nanoid";
import { sendEmail } from "@/lib/email";

type Item = { id: string; title: string; price: number; qty: number };

export async function POST(req: NextRequest) {
  const supabase = await supabaseServer();
  const admin = supabaseAdmin();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const items: Item[] = body.items || [];
  const notes: string = body.notes || "";
  const couponCode: string = String(body.couponCode || "").trim().toUpperCase();

  if (!items.length) {
    return NextResponse.json({ error: "Cart empty" }, { status: 400 });
  }

  const subtotal = items.reduce((a, b) => a + b.price * b.qty, 0);

  // validate coupon server-side
  let discount = 0;
  let couponApplied: string | null = null;

  if (couponCode) {
    const now = new Date().toISOString();
    const { data: coupon } = await admin
      .from("coupons")
      .select("code,type,value,min_order,max_discount,starts_at,ends_at,usage_limit,used_count,is_active")
      .eq("code", couponCode)
      .single();

    const ok =
      coupon &&
      coupon.is_active &&
      (!coupon.starts_at || coupon.starts_at <= now) &&
      (!coupon.ends_at || coupon.ends_at >= now) &&
      (!coupon.usage_limit || coupon.used_count < coupon.usage_limit);

    if (ok) {
      discount = computeDiscount({
        subtotal,
        coupon: {
          type: coupon.type,
          value: coupon.value,
          min_order: coupon.min_order,
          max_discount: coupon.max_discount ?? null,
        },
      });

      couponApplied = coupon.code;

      // increment used_count (simple)
      await admin
        .from("coupons")
        .update({ used_count: (coupon.used_count ?? 0) + 1 })
        .eq("code", coupon.code);
    }
  }

  const total = subtotal - discount;
  const invoiceNumber = `TT-${new Date().getFullYear()}-${nanoid(6).toUpperCase()}`;

  // create order
  const { data: order, error: e1 } = await supabase
    .from("orders")
    .insert({
      user_id: user.id,
      subtotal,
      discount,
      total,
      coupon_code: couponApplied,
      notes,
      invoice_number: invoiceNumber,
      status: "pending_payment",
    })
    .select("id,invoice_number,total")
    .single();

  if (e1 || !order) {
    return NextResponse.json({ error: e1?.message || "Create order failed" }, { status: 500 });
  }

  // create items
  const payload = items.map((it) => ({
    order_id: order.id,
    service_id: it.id,
    title: it.title,
    qty: it.qty,
    price: it.price,
  }));

  const { error: e2 } = await supabase.from("order_items").insert(payload);
  if (e2) {
    return NextResponse.json({ error: e2.message }, { status: 500 });
  }

  // email notify user (order created)
  const site = process.env.SITE_NAME || "titiktemu production";
  await sendEmail({
    to: user.email,
    subject: `[${site}] Order dibuat: ${order.invoice_number}`,
    html: `
      <div style="font-family:Arial,sans-serif;">
        <h2>Order kamu sudah dibuat</h2>
        <p>Invoice: <b>${order.invoice_number}</b></p>
        <p>Total: <b>Rp ${Number(order.total).toLocaleString("id-ID")}</b></p>
        <p>Silakan lanjut ke checkout untuk bayar via QRIS & upload bukti.</p>
        <p>
          <a href="${process.env.NEXT_PUBLIC_SITE_URL}/checkout?orderId=${order.id}">
            Buka checkout
          </a>
        </p>
      </div>
    `,
  });

  return NextResponse.json({ ok: true, orderId: order.id });
}
