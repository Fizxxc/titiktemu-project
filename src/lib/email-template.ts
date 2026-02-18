export function nusantaraEmailTemplate(opts: {
  title: string;
  subtitle?: string;
  contentHtml: string;
  ctaLabel?: string;
  ctaHref?: string;
}) {
  const { title, subtitle, contentHtml, ctaLabel, ctaHref } = opts;

  const cta =
    ctaLabel && ctaHref
      ? `
      <div style="margin-top:18px;">
        <a href="${ctaHref}"
           style="
            display:inline-block;
            background:#111111;
            color:#ffffff;
            text-decoration:none;
            padding:12px 16px;
            border-radius:14px;
            font-weight:600;
            font-size:14px;
           ">
          ${ctaLabel}
        </a>
      </div>
    `
      : "";

  return `
  <div style="margin:0; padding:28px; background:#F7F1E3;">
    <div style="
      max-width:640px;
      margin:0 auto;
      background:#ffffff;
      border:1px solid rgba(0,0,0,.08);
      border-radius:18px;
      overflow:hidden;
      box-shadow:0 8px 26px rgba(0,0,0,.10);
      font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, Helvetica, sans-serif;
    ">

      <!-- Top motif bar -->
      <div style="
        height:10px;
        background: linear-gradient(90deg, rgba(122,30,30,.95), rgba(15,118,110,.85), rgba(180,83,9,.90));
      "></div>

      <!-- Header -->
      <div style="padding:22px 22px 14px 22px; background:#FAF7EF;">
        <div style="display:flex; align-items:center; gap:12px;">
          <div style="
            width:40px; height:40px;
            border-radius:14px;
            background:#ffffff;
            border:1px solid rgba(0,0,0,.08);
            display:flex; align-items:center; justify-content:center;
            font-weight:800;
            color:#111111;
          ">TT</div>

          <div style="line-height:1.1;">
            <div style="font-weight:800; letter-spacing:.6px; color:#111111;">
              titiktemu production
            </div>
            <div style="font-size:12px; color:rgba(0,0,0,.60); margin-top:4px;">
              Visual Nusantara • Creative Services
            </div>
          </div>
        </div>

        <div style="margin-top:16px;">
          <div style="font-size:18px; font-weight:800; color:#111111;">
            ${title}
          </div>
          ${
            subtitle
              ? `<div style="margin-top:6px; font-size:13px; color:rgba(0,0,0,.65);">
                  ${subtitle}
                </div>`
              : ""
          }
        </div>
      </div>

      <!-- Body -->
      <div style="padding:20px 22px 10px 22px;">
        <div style="
          font-size:14px;
          color:rgba(0,0,0,.78);
          line-height:1.65;
        ">
          ${contentHtml}
        </div>
        ${cta}
      </div>

      <!-- Footer -->
      <div style="padding:16px 22px 22px 22px;">
        <div style="
          background:#FAF7EF;
          border:1px solid rgba(0,0,0,.06);
          border-radius:16px;
          padding:14px;
        ">
          <div style="font-size:12px; color:rgba(0,0,0,.62); line-height:1.6;">
            Ini email otomatis untuk testing pengiriman email. <br/>
            Jika kamu tidak meminta ini, abaikan saja.
          </div>
        </div>

        <div style="margin-top:14px; font-size:11px; color:rgba(0,0,0,.45);">
          © ${new Date().getFullYear()} titiktemu production • Nusantara theme
        </div>
      </div>
    </div>
  </div>
  `;
}
