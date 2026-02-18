import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { supabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";

function extFromType(type: string) {
  if (type === "image/png") return "png";
  if (type === "image/jpeg") return "jpg";
  if (type === "image/webp") return "webp";
  return "bin";
}

export async function POST(req: Request) {
  try {
    const supabase = await supabaseServer();
    const admin = supabaseAdmin();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const form = await req.formData();
    const orderId = String(form.get("orderId") || "");
    const file = form.get("file") as File | null;

    if (!orderId) return NextResponse.json({ error: "orderId wajib" }, { status: 400 });
    if (!file) return NextResponse.json({ error: "file wajib" }, { status: 400 });

    const allowed = new Set(["image/png", "image/jpeg", "image/webp"]);
    if (!allowed.has(file.type)) {
      return NextResponse.json({ error: "Format harus PNG/JPG/WEBP" }, { status: 400 });
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    const ext = extFromType(file.type);
    const path = `payments/${user.id}/${orderId}/${Date.now()}.${ext}`;

    // cek order milik user
    const { data: order, error: ordErr } = await admin
      .from("orders")
      .select("id,user_id")
      .eq("id", orderId)
      .single();

    if (ordErr || !order) return NextResponse.json({ error: "Order tidak ditemukan" }, { status: 404 });
    if (order.user_id !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // upload storage
    const { error: upErr } = await admin.storage
      .from("payment-proofs")
      .upload(path, bytes, { contentType: file.type, upsert: true });

    if (upErr) {
      console.error("storage upload error:", upErr);
      return NextResponse.json({ error: `Upload storage gagal: ${upErr.message}` }, { status: 500 });
    }

    // update order
    const { error: updErr } = await admin
      .from("orders")
      .update({ payment_proof_path: path, status: "paid_review" })
      .eq("id", orderId);

    if (updErr) {
      console.error("orders update error:", updErr);
      return NextResponse.json({ error: `Update order gagal: ${updErr.message}` }, { status: 500 });
    }

    return NextResponse.json({ ok: true, path });
  } catch (e: any) {
    console.error("upload-payment fatal:", e);
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}
