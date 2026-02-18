import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { PDFDocument, StandardFonts, rgb, degrees } from "pdf-lib";
import QRCode from "qrcode";
import fs from "fs/promises";
import path from "path";

export const runtime = "nodejs";

function rupiah(n: number) {
  return `Rp ${Number(n || 0).toLocaleString("id-ID")}`;
}

function safeText(s: string) {
  // buang karakter non WinAnsi (emoji, dll) biar tidak crash
  return String(s || "").replace(/[^\x00-\xFF]/g, "");
}

function isPaidLike(status: string) {
  // anggap paid kalau sudah review/proses/done
  return ["paid_review", "processing", "done"].includes(String(status || ""));
}

async function tryLoadLogoPng(pdfDoc: PDFDocument) {
  try {
    const logoPath = path.join(process.cwd(), "public", "logo.png");
    const bytes = await fs.readFile(logoPath);
    return await pdfDoc.embedPng(bytes);
  } catch {
    return null;
  }
}

function drawBatikMotifA4(page: any, width: number, height: number) {
  // motif batik ringan: grid diamond + garis halus (print-friendly)
  const ink = rgb(0.1, 0.1, 0.1);

  // background bone tipis
  page.drawRectangle({
    x: 24,
    y: 24,
    width: width - 48,
    height: height - 48,
    color: rgb(0.98, 0.96, 0.92),
    opacity: 0.25,
    borderColor: rgb(0.9, 0.9, 0.9),
    borderWidth: 1,
  });

  const step = 42;
  const size = 6;

  for (let x = 40; x < width - 40; x += step) {
    for (let y = 60; y < height - 60; y += step) {
      // diamond (kotak miring)
      page.drawRectangle({
        x: x,
        y: y,
        width: size,
        height: size,
        rotate: degrees(45),
        borderColor: ink,
        borderWidth: 0.6,
        opacity: 0.06,
      });

      // titik pusat
      page.drawCircle({
        x: x + 10,
        y: y + 10,
        size: 1.2,
        color: ink,
        opacity: 0.05,
      });
    }
  }

  // garis diagonal halus (kesan kain)
  for (let i = -height; i < width; i += 70) {
    page.drawLine({
      start: { x: i, y: 0 },
      end: { x: i + height, y: height },
      thickness: 0.6,
      color: ink,
      opacity: 0.03,
    });
  }
}

function drawWatermarkLogo(page: any, logoImg: any, width: number, height: number) {
  if (!logoImg) return;

  // watermark besar di tengah
  const wmSize = 320;
  page.drawImage(logoImg, {
    x: width / 2 - wmSize / 2,
    y: height / 2 - wmSize / 2,
    width: wmSize,
    height: wmSize,
    opacity: 0.08,
  });
}

function drawPaidStamp(page: any, width: number, height: number, fontBold: any) {
  // stamp merah semi transparan, miring
  const stamp = "PAID";
  const size = 82;
  const color = rgb(0.78, 0.1, 0.1);

  const textWidth = fontBold.widthOfTextAtSize(stamp, size);
  const x = width / 2 - textWidth / 2;
  const y = height / 2 + 40;

  // border stamp (kotak miring)
  page.drawRectangle({
    x: width / 2 - 220,
    y: height / 2 - 20,
    width: 440,
    height: 140,
    borderColor: color,
    borderWidth: 3,
    rotate: degrees(-12),
    opacity: 0.18,
  });

  page.drawText(stamp, {
    x,
    y,
    size,
    font: fontBold,
    color,
    rotate: degrees(-12),
    opacity: 0.18,
  });
}

export async function GET(
  req: Request,
  ctx: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await ctx.params;

    const supabase = await supabaseServer();
    const admin = supabaseAdmin();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: order, error: oErr } = await admin
      .from("orders")
      .select("id,user_id,invoice_number,total,created_at,discount,subtotal,coupon_code,notes,status")
      .eq("id", orderId)
      .single();

    if (oErr) return NextResponse.json({ error: oErr.message }, { status: 500 });
    if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // owner OR admin
    if (order.user_id !== user.id) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: items, error: iErr } = await admin
      .from("order_items")
      .select("title,qty,price")
      .eq("order_id", order.id);

    if (iErr) return NextResponse.json({ error: iErr.message }, { status: 500 });

    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

    const qrTarget = `${baseUrl}/checkout?orderId=${order.id}`;
    const qrDataUrl = await QRCode.toDataURL(qrTarget, { margin: 1, scale: 6 });
    const qrBytes = Buffer.from(qrDataUrl.split(",")[1], "base64");

    // ===== PDF =====
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // A4
    const { width, height } = page.getSize();

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const BATIK = rgb(0.35, 0.16, 0.16);
    const JADE = rgb(0.15, 0.4, 0.3);
    const INK = rgb(0.1, 0.1, 0.1);
    const MUTED = rgb(0.35, 0.35, 0.35);
    const LINE = rgb(0.88, 0.88, 0.88);

    const margin = 52;

    const logoImg = await tryLoadLogoPng(pdfDoc);

    // batik background
    drawBatikMotifA4(page, width, height);

    // watermark logo besar
    drawWatermarkLogo(page, logoImg, width, height);

    // stamp PAID jika status paid/proses/done
    if (isPaidLike(order.status)) {
      drawPaidStamp(page, width, height, bold);
    }

    // ===== Header =====
    let y = height - margin;

    // aksen garis parang minimalis (2 layer)
    page.drawRectangle({
      x: margin,
      y: y + 10,
      width: width - margin * 2,
      height: 6,
      color: BATIK,
      opacity: 0.95,
    });
    page.drawRectangle({
      x: margin,
      y: y + 5,
      width: width - margin * 2,
      height: 2,
      color: JADE,
      opacity: 0.9,
    });

    // logo kecil kiri
    if (logoImg) {
      page.drawImage(logoImg, {
        x: margin,
        y: y - 54,
        width: 44,
        height: 44,
        opacity: 0.95,
      });
    } else {
      page.drawRectangle({
        x: margin,
        y: y - 54,
        width: 44,
        height: 44,
        borderColor: LINE,
        borderWidth: 1,
      });
      page.drawText("TT", { x: margin + 12, y: y - 38, size: 14, font: bold, color: INK });
    }

    page.drawText("titiktemu production", {
      x: margin + 58,
      y: y - 20,
      size: 18,
      font: bold,
      color: INK,
    });
    page.drawText("Invoice Layanan • Nusantara", {
      x: margin + 58,
      y: y - 38,
      size: 11,
      font,
      color: BATIK,
    });

    // info kanan
    const rightX = width - margin;
    const invNo = safeText(order.invoice_number || order.id);
    const dateText = safeText(new Date(order.created_at).toLocaleString("id-ID"));
    const statusText = safeText(String(order.status || ""));

    const drawRight = (label: string, value: string, yy: number) => {
      page.drawText(label, { x: rightX - 210, y: yy, size: 9, font, color: MUTED });
      const w = bold.widthOfTextAtSize(value, 10);
      page.drawText(value, { x: rightX - w, y: yy - 1, size: 10, font: bold, color: INK });
    };

    drawRight("Invoice", invNo, y - 14);
    drawRight("Tanggal", dateText, y - 30);
    drawRight("Status", statusText, y - 46);

    y -= 86;

    // divider
    page.drawLine({
      start: { x: margin, y },
      end: { x: width - margin, y },
      thickness: 1,
      color: LINE,
      opacity: 0.9,
    });
    y -= 18;

    // ===== Items Table =====
    page.drawText("Rincian Layanan", { x: margin, y, size: 12, font: bold, color: INK });
    y -= 14;

    const tableX = margin;
    const tableW = width - margin * 2;
    const rowH = 22;

    // header row bg
    page.drawRectangle({
      x: tableX,
      y: y - rowH + 6,
      width: tableW,
      height: rowH,
      color: rgb(0.97, 0.97, 0.97),
      opacity: 0.95,
      borderColor: LINE,
      borderWidth: 1,
    });

    const cols = {
      no: 32,
      name: tableW * 0.50,
      qty: tableW * 0.10,
      price: tableW * 0.18,
      total: tableW * 0.22,
    };

    page.drawText("No", { x: tableX + 8, y: y - 10, size: 9, font: bold, color: MUTED });
    page.drawText("Layanan", { x: tableX + cols.no + 8, y: y - 10, size: 9, font: bold, color: MUTED });
    page.drawText("Qty", { x: tableX + cols.no + cols.name + 8, y: y - 10, size: 9, font: bold, color: MUTED });
    page.drawText("Harga", { x: tableX + cols.no + cols.name + cols.qty + 8, y: y - 10, size: 9, font: bold, color: MUTED });
    page.drawText("Total", { x: tableX + cols.no + cols.name + cols.qty + cols.price + 8, y: y - 10, size: 9, font: bold, color: MUTED });

    y -= 28;

    const safeItems = items || [];
    for (let i = 0; i < safeItems.length; i++) {
      const it = safeItems[i];
      const lineY = y;

      // row border
      page.drawRectangle({
        x: tableX,
        y: lineY - 14,
        width: tableW,
        height: rowH,
        borderColor: LINE,
        borderWidth: 1,
        opacity: 0.9,
      });

      const title = safeText(it.title || "");
      const qty = Number(it.qty || 1);
      const price = Number(it.price || 0);
      const total = qty * price;

      // truncation
      const maxW = cols.name - 16;
      let shown = title;
      while (font.widthOfTextAtSize(shown, 10) > maxW && shown.length > 0) shown = shown.slice(0, -1);
      if (shown !== title) shown = shown.slice(0, Math.max(0, shown.length - 3)) + "...";

      page.drawText(String(i + 1), { x: tableX + 10, y: lineY - 2, size: 10, font, color: INK });
      page.drawText(shown, { x: tableX + cols.no + 8, y: lineY - 2, size: 10, font, color: INK });
      page.drawText(String(qty), { x: tableX + cols.no + cols.name + 12, y: lineY - 2, size: 10, font, color: INK });

      const priceText = rupiah(price);
      const totalText = rupiah(total);

      const priceW = font.widthOfTextAtSize(priceText, 10);
      const totalW = bold.widthOfTextAtSize(totalText, 10);

      page.drawText(priceText, {
        x: tableX + cols.no + cols.name + cols.qty + cols.price - priceW - 10,
        y: lineY - 2,
        size: 10,
        font,
        color: INK,
      });

      page.drawText(totalText, {
        x: tableX + tableW - totalW - 10,
        y: lineY - 2,
        size: 10,
        font: bold,
        color: INK,
      });

      y -= rowH;

      // stop before bottom area (QR + footer)
      if (y < 220) break;
    }

    y -= 18;

    // ===== Summary =====
    const subtotal = Number(order.subtotal ?? order.total ?? 0);
    const discount = Number(order.discount ?? 0);
    const total = Number(order.total ?? 0);

    const sumW = 270;
    const sumX = width - margin - sumW;
    const sumY = Math.max(140, y - 80);

    page.drawRectangle({
      x: sumX,
      y: sumY,
      width: sumW,
      height: 86,
      borderColor: LINE,
      borderWidth: 1,
      color: rgb(1, 1, 1),
      opacity: 0.96,
    });

    const sumRow = (label: string, value: string, yy: number, isBoldRow = false) => {
      page.drawText(label, { x: sumX + 12, y: yy, size: 10, font, color: MUTED });
      const f = isBoldRow ? bold : font;
      const w = f.widthOfTextAtSize(value, 10);
      page.drawText(value, { x: sumX + sumW - 12 - w, y: yy, size: 10, font: f, color: INK });
    };

    sumRow("Subtotal", rupiah(subtotal), sumY + 60);
    if (discount > 0) sumRow("Diskon", `- ${rupiah(discount)}`, sumY + 44);
    sumRow("Total", rupiah(total), sumY + 20, true);

    // ===== QR Box (rapi) =====
    const qrImg = await pdfDoc.embedPng(qrBytes);
    const qrSize = 110;
    const boxW = qrSize + 22;
    const boxH = qrSize + 36;
    const boxX = margin;
    const boxY = 92;

    page.drawRectangle({
      x: boxX,
      y: boxY,
      width: boxW,
      height: boxH,
      borderColor: JADE,
      borderWidth: 2,
      opacity: 0.95,
    });

    page.drawText("Scan untuk cek order", {
      x: boxX + 10,
      y: boxY + boxH - 18,
      size: 9,
      font: bold,
      color: JADE,
    });

    page.drawImage(qrImg, {
      x: boxX + 11,
      y: boxY + 10,
      width: qrSize,
      height: qrSize,
    });

    // link kecil di bawah QR
    const linkSmall = safeText(qrTarget.replace("https://", "").replace("http://", ""));
    page.drawText(linkSmall.slice(0, 38), {
      x: boxX,
      y: boxY - 14,
      size: 8,
      font,
      color: MUTED,
    });

    // ===== Footer =====
    page.drawLine({
      start: { x: margin, y: 70 },
      end: { x: width - margin, y: 70 },
      thickness: 1,
      color: LINE,
    });

    page.drawText("Terima kasih telah menggunakan layanan titiktemu production.", {
      x: margin,
      y: 52,
      size: 9,
      font,
      color: MUTED,
    });

    page.drawText("Pembayaran via QRIS • Live Chat Admin tersedia di website", {
      x: margin,
      y: 38,
      size: 8.5,
      font,
      color: MUTED,
    });

    const pdfBytes = await pdfDoc.save();

// ✅ FIX: gunakan Buffer + Response (TS aman)
return new Response(Buffer.from(pdfBytes), {
  headers: {
    "Content-Type": "application/pdf",
    "Content-Disposition": `inline; filename="${safeText(order.invoice_number || "invoice")}.pdf"`,
  },
});

  } catch (e: any) {
    console.error("invoice error:", e);
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}
