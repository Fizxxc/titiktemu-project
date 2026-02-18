import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";
import { nusantaraEmailTemplate } from "@/lib/email-template";

export async function GET() {
  try {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    const html = nusantaraEmailTemplate({
      title: "Test Email Berhasil 🚀",
      subtitle: "Gmail SMTP aktif dan siap dipakai untuk notifikasi order & invoice.",
      contentHtml: `
        <p style="margin:0 0 10px 0;">
          Halo! Ini adalah email test dari <b>titiktemu production</b>.
        </p>
        <ul style="margin:0; padding-left:18px;">
          <li>SMTP: <b>Gmail</b></li>
          <li>Status: <b>OK</b></li>
          <li>Waktu: <b>${new Date().toLocaleString("id-ID")}</b></li>
        </ul>
        <p style="margin:12px 0 0 0;">
          Jika email ini masuk inbox, berarti sistem pengiriman email kamu sudah jalan.
        </p>
      `,
      ctaLabel: "Buka Website",
      ctaHref: siteUrl,
    });

    await sendEmail({
      to: process.env.SMTP_USER!, // kirim ke email pengirim dulu
      subject: "✅ Test Email - titiktemu production",
      html,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed" }, { status: 500 });
  }
}
