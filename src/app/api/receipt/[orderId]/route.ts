import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { PDFDocument, StandardFonts, rgb, degrees } from "pdf-lib";
import QRCode from "qrcode";
import fs from "fs/promises";
import path from "path";

export const runtime = "nodejs";

const MM_TO_PT = 72 / 25.4;
const mm = (n: number) => n * MM_TO_PT;
const PAGE_W = mm(58);

function rupiah(n: number) {
    return `Rp ${Number(n || 0).toLocaleString("id-ID")}`;
}

function safeText(s: string) {
    return String(s || "").replace(/[^\x00-\xFF]/g, "");
}

function isPaidLike(status: string) {
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

function drawBatikStripe58(page: any, width: number, height: number) {
    const BATIK = rgb(0.35, 0.16, 0.16);
    const JADE = rgb(0.15, 0.4, 0.3);

    // top stripe
    page.drawRectangle({ x: 0, y: height - mm(2.2), width, height: mm(2.2), color: BATIK, opacity: 0.95 });
    page.drawRectangle({ x: 0, y: height - mm(3.3), width, height: mm(1.1), color: JADE, opacity: 0.9 });

    // bottom stripe
    page.drawRectangle({ x: 0, y: mm(2.2), width, height: mm(2.2), color: BATIK, opacity: 0.20 });
    page.drawRectangle({ x: 0, y: mm(1.1), width, height: mm(1.1), color: JADE, opacity: 0.18 });

    // subtle motif dots
    const ink = rgb(0.1, 0.1, 0.1);
    for (let y = mm(8); y < height - mm(8); y += mm(9)) {
        for (let x = mm(4); x < width - mm(4); x += mm(9)) {
            page.drawCircle({ x, y, size: 0.7, color: ink, opacity: 0.04 });
        }
    }
}

function drawWatermarkLogo58(page: any, logoImg: any, width: number, height: number) {
    if (!logoImg) return;
    const s = mm(26);
    page.drawImage(logoImg, {
        x: width / 2 - s / 2,
        y: height / 2 - s / 2,
        width: s,
        height: s,
        opacity: 0.10,
    });
}

function drawPaidStamp58(page: any, width: number, height: number, fontBold: any) {
    const color = rgb(0.78, 0.1, 0.1);
    const text = "PAID";
    const size = 26;
    const w = fontBold.widthOfTextAtSize(text, size);

    page.drawText(text, {
        x: width / 2 - w / 2,
        y: height / 2 + mm(22),
        size,
        font: fontBold,
        color,
        rotate: degrees(-12),
        opacity: 0.20,
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

        const itemCount = (items || []).length;
        const pageH = Math.max(mm(140), mm(140 + itemCount * 8)); // tinggi dinamis

        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage([PAGE_W, pageH]);
        const { width, height } = page.getSize();

        const font = await pdfDoc.embedFont(StandardFonts.Courier);
        const bold = await pdfDoc.embedFont(StandardFonts.CourierBold);

        const logoImg = await tryLoadLogoPng(pdfDoc);

        // batik background + watermark + stamp
        drawBatikStripe58(page, width, height);
        drawWatermarkLogo58(page, logoImg, width, height);
        if (isPaidLike(order.status)) drawPaidStamp58(page, width, height, bold);

        const pad = mm(4);
        let y = height - mm(8);
        const lh = 10;

        const line = (t: string, isBold = false, size = 9) => {
            page.drawText(safeText(t), {
                x: pad,
                y,
                size,
                font: isBold ? bold : font,
                color: rgb(0.1, 0.1, 0.1),
            });
            y -= lh;
        };

        const center = (t: string, isBold = false, size = 9) => {
            const s = safeText(t);
            const f = isBold ? bold : font;
            const w = f.widthOfTextAtSize(s, size);
            page.drawText(s, {
                x: width / 2 - w / 2,
                y,
                size,
                font: f,
                color: rgb(0.1, 0.1, 0.1),
            });
            y -= lh;
        };

        const hr = () => {
            page.drawText("-".repeat(32), { x: pad, y, size: 9, font, color: rgb(0.35, 0.35, 0.35) });
            y -= lh;
        };

        // Header
        if (logoImg) {
            const s = mm(10);
            page.drawImage(logoImg, { x: width / 2 - s / 2, y: y - s + 2, width: s, height: s, opacity: 0.95 });
            y -= s + 2;
        }
        center("titiktemu production", true, 10);
        center("STRUK NUSANTARA", true, 9);
        hr();

        line(`Invoice : ${order.invoice_number || order.id}`, true);
        line(`Tanggal : ${new Date(order.created_at).toLocaleString("id-ID")}`, false, 8.5);
        line(`Status  : ${String(order.status)}`, false, 8.5);
        hr();

        // Items
        center("RINCIAN", true, 9);
        y -= 2;

        for (const it of items || []) {
            const title = safeText(it.title || "");
            const qty = Number(it.qty || 1);
            const price = Number(it.price || 0);
            const total = qty * price;

            line(title.length > 24 ? title.slice(0, 23) + "…" : title, true);

            const left = `${qty} x ${rupiah(price)}`;
            const right = rupiah(total);

            const size = 8.8;
            page.drawText(left, { x: pad, y, size, font, color: rgb(0.1, 0.1, 0.1) });

            const rw = bold.widthOfTextAtSize(right, size);
            page.drawText(right, { x: width - pad - rw, y, size, font: bold, color: rgb(0.1, 0.1, 0.1) });

            y -= lh;
            y -= 2;
        }

        hr();

        // Totals
        const subtotal = Number(order.subtotal ?? order.total ?? 0);
        const discount = Number(order.discount ?? 0);
        const total = Number(order.total ?? 0);

        const row = (label: string, value: string, isBold = false) => {
            const size = 9;
            page.drawText(label, { x: pad, y, size, font, color: rgb(0.35, 0.35, 0.35) });
            const f = isBold ? bold : font;
            const w = f.widthOfTextAtSize(value, size);
            page.drawText(value, { x: width - pad - w, y, size, font: f, color: rgb(0.1, 0.1, 0.1) });
            y -= lh;
        };

        row("Subtotal", rupiah(subtotal));
        if (discount > 0) row("Diskon", `- ${rupiah(discount)}`);
        row("TOTAL", rupiah(total), true);

        hr();

        // QR rapi center + box
        const qrImg = await pdfDoc.embedPng(qrBytes);
        const qrSize = mm(24);
        const boxW = qrSize + mm(8);
        const boxH = qrSize + mm(12);
        const boxX = width / 2 - boxW / 2;
        const boxY = Math.max(mm(18), y - boxH - mm(4));

        // box
        page.drawRectangle({
            x: boxX,
            y: boxY,
            width: boxW,
            height: boxH,
            borderColor: rgb(0.15, 0.4, 0.3),
            borderWidth: 1.8,
            opacity: 0.95,
        });

        // label
        const label = "Scan cek order";
        const lw = bold.widthOfTextAtSize(label, 8.5);
        page.drawText(label, {
            x: width / 2 - lw / 2,
            y: boxY + boxH - mm(6),
            size: 8.5,
            font: bold,
            color: rgb(0.15, 0.4, 0.3),
        });

        // qr
        page.drawImage(qrImg, {
            x: width / 2 - qrSize / 2,
            y: boxY + mm(3),
            width: qrSize,
            height: qrSize,
        });

        // footer
        const footerY = boxY - mm(10);
        if (footerY > mm(8)) {
            page.drawText("Terima kasih.", { x: width / 2 - font.widthOfTextAtSize("Terima kasih.", 8.5) / 2, y: footerY, size: 8.5, font, color: rgb(0.35, 0.35, 0.35) });
        }

        const pdfBytes = await pdfDoc.save();

        return new Response(Buffer.from(pdfBytes), {
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `inline; filename="struk-${safeText(order.invoice_number || order.id)}.pdf"`,
            },
        });

    } catch (e: any) {
        console.error("receipt error:", e);
        return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
    }
}
