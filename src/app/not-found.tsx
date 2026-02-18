import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen px-4 py-10 flex items-center justify-center bg-nusantara-bone bg-batik-grid">
      <div className="w-full max-w-xl relative">
        {/* animated aura */}
        <div className="pointer-events-none absolute -inset-10">
          <div className="tt-aura tt-aura-1" />
          <div className="tt-aura tt-aura-2" />
          <div className="tt-aura tt-aura-3" />
        </div>

        <div className="relative card overflow-hidden text-center">
          {/* batik strip */}
          <div className="h-2 w-full tt-motif-strip" />

          {/* stamp */}
          <div className="tt-stamp-wrap">
            <div className="tt-stamp">NYASAR</div>
          </div>

          <div className="p-6 sm:p-8">
            <div className="inline-flex items-center gap-3 rounded-xl2 border border-black/10 bg-white/85 px-4 py-2">
              <span className="tt-keris" aria-hidden />
              <div className="text-left leading-tight">
                <div className="text-xs opacity-70">Status</div>
                <div className="font-extrabold tracking-tight">404 • Not Found</div>
              </div>
            </div>

            <h1 className="mt-5 text-2xl sm:text-3xl font-extrabold tracking-tight">
              Halaman ini… <span className="tt-underline">menghilang</span>.
            </h1>

            <p className="mt-3 text-sm sm:text-base opacity-80 leading-relaxed">
              Kamu barusan nyari halaman yang bahkan <b>server pun pura-pura nggak kenal</b>.
              Mungkin halamannya lagi <i>mudik</i> tanpa pamit.
            </p>

            <div className="mt-4 tt-quote">
              <div className="tt-quote-inner">
                “Kalau nyasar, jangan panik. Panik itu urusan <b>deadline</b>.”
                <span className="tt-wink" aria-hidden> 😉</span>
              </div>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-2 justify-center">
              <Link href="/" className="btn w-full sm:w-auto">
                Balik ke Beranda (biar waras)
              </Link>
              <Link href="/services" className="btn-ghost w-full sm:w-auto">
                Lihat Layanan (biar ada tujuan)
              </Link>
            </div>

            {/* animated “jalan pulang” */}
            <div className="mt-6 rounded-xl2 border border-black/10 bg-white/75 p-4 text-left">
              <div className="flex items-center justify-between gap-3">
                <div className="font-semibold">Jalan Pulang Nusantara</div>
                <div className="text-xs opacity-70">parang • kawung • mega mendung</div>
              </div>

              <div className="mt-3 tt-road">
                <span className="tt-dot" />
                <span className="tt-dot" />
                <span className="tt-dot" />
                <span className="tt-dot" />
                <span className="tt-dot" />
                <span className="tt-dot" />
                <span className="tt-dot" />
                <span className="tt-dot" />
                <span className="tt-runner" />
              </div>

              <p className="mt-3 text-xs opacity-70 leading-relaxed">
                Kalau URL kamu panjang banget, jangan salahin 404. Salahinnya
                <b> kebiasaan copy-paste tanpa baca</b>.
              </p>
            </div>

            {/* footer */}
            <div className="mt-6 text-xs opacity-70">
              Kalau kamu yakin ini seharusnya ada, mungkin halamannya lagi “maintenance”
              (bahasa halusnya: <b>belum sempat dibikin wkwkwkwk</b>).
            </div>
          </div>

          {/* kain bergoyang */}
          <div className="tt-cloth" aria-hidden />
        </div>

        {/* Styles */}
        <style>{`
          .tt-motif-strip{
            background:
              repeating-linear-gradient(
                45deg,
                rgba(17,24,39,.14) 0px,
                rgba(17,24,39,.14) 10px,
                rgba(59,29,16,.14) 10px,
                rgba(59,29,16,.14) 20px
              );
          }

          /* aura */
          .tt-aura{
            position:absolute;
            inset:0;
            border-radius: 28px;
            filter: blur(26px);
            opacity: .28;
            animation: ttFloat 7s ease-in-out infinite;
          }
          .tt-aura-1{
            background: radial-gradient(circle at 28% 38%, rgba(59,29,16,.95), rgba(0,0,0,0) 60%);
          }
          .tt-aura-2{
            background: radial-gradient(circle at 78% 22%, rgba(17,24,39,.95), rgba(0,0,0,0) 55%);
            animation-delay: -2.1s;
          }
          .tt-aura-3{
            background: radial-gradient(circle at 55% 78%, rgba(34,197,94,.55), rgba(0,0,0,0) 55%);
            animation-delay: -4.2s;
          }
          @keyframes ttFloat{
            0%,100% { transform: translate3d(0,0,0) scale(1); }
            50%     { transform: translate3d(0,-10px,0) scale(1.02); }
          }

          /* keris icon (pure css) */
          .tt-keris{
            width: 22px; height: 22px; border-radius: 8px;
            background:
              linear-gradient(180deg, rgba(17,24,39,.95), rgba(17,24,39,.75));
            position: relative;
            box-shadow: 0 10px 22px rgba(0,0,0,.12);
          }
          .tt-keris:before{
            content:"";
            position:absolute;
            left: 10px; top: 4px;
            width: 2px; height: 14px;
            background: rgba(255,255,255,.85);
            border-radius: 999px;
            transform: rotate(12deg);
            opacity:.9;
          }

          /* underline */
          .tt-underline{
            background: linear-gradient(180deg, rgba(0,0,0,0) 60%, rgba(59,29,16,.18) 60%);
            padding: 0 .15em;
            border-radius: 6px;
          }

          /* quote */
          .tt-quote{
            margin-top: 14px;
            border-radius: 16px;
            border: 1px solid rgba(0,0,0,.10);
            background: rgba(255,255,255,.7);
            overflow: hidden;
          }
          .tt-quote-inner{
            padding: 12px 14px;
            font-size: 13px;
            line-height: 1.6;
            opacity: .9;
            position: relative;
          }
          .tt-quote-inner:before{
            content:"";
            position:absolute; inset:0;
            background:
              radial-gradient(circle at 18% 35%, rgba(59,29,16,.06) 0 18px, rgba(0,0,0,0) 19px),
              radial-gradient(circle at 72% 62%, rgba(17,24,39,.06) 0 16px, rgba(0,0,0,0) 17px),
              repeating-linear-gradient(45deg, rgba(59,29,16,.045) 0, rgba(59,29,16,.045) 8px, rgba(0,0,0,0) 8px, rgba(0,0,0,0) 16px);
            opacity:.75;
            pointer-events:none;
          }
          .tt-wink{ display:inline-block; animation: ttWink 2.6s ease-in-out infinite; }
          @keyframes ttWink { 0%,100%{ transform: translateY(0) } 50%{ transform: translateY(-2px) } }

          /* stamp */
          .tt-stamp-wrap{
            position:absolute;
            right: 14px;
            top: 14px;
            transform: rotate(12deg);
          }
          .tt-stamp{
            font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial;
            font-weight: 900;
            letter-spacing: .18em;
            font-size: 12px;
            color: rgba(239,68,68,.85);
            border: 2px solid rgba(239,68,68,.55);
            padding: 10px 12px;
            border-radius: 14px;
            background: rgba(255,255,255,.6);
            box-shadow: 0 14px 24px rgba(239,68,68,.10);
            text-transform: uppercase;
            mix-blend-mode: multiply;
          }

          /* road */
          .tt-road{
            display:flex;
            align-items:center;
            gap: 10px;
            overflow:hidden;
            padding: 10px 8px 6px 8px;
            border-radius: 14px;
            background: rgba(255,255,255,.55);
            border: 1px solid rgba(0,0,0,.06);
          }
          .tt-dot{
            width: 10px; height: 10px; border-radius: 999px;
            border: 1px solid rgba(0,0,0,.12);
            background: rgba(255,255,255,.92);
            box-shadow: 0 10px 18px rgba(0,0,0,.06);
            animation: ttPulse 1.8s ease-in-out infinite;
          }
          .tt-dot:nth-child(2){ animation-delay: .15s; }
          .tt-dot:nth-child(3){ animation-delay: .3s; }
          .tt-dot:nth-child(4){ animation-delay: .45s; }
          .tt-dot:nth-child(5){ animation-delay: .6s; }
          .tt-dot:nth-child(6){ animation-delay: .75s; }
          .tt-dot:nth-child(7){ animation-delay: .9s; }
          .tt-dot:nth-child(8){ animation-delay: 1.05s; }
          @keyframes ttPulse{
            0%,100% { transform: translateY(0); opacity:.85; }
            50%     { transform: translateY(-4px); opacity:1; }
          }

          .tt-runner{
            height: 10px;
            width: 140px;
            border-radius: 999px;
            border: 1px solid rgba(0,0,0,.10);
            background: linear-gradient(90deg,
              rgba(17,24,39,0),
              rgba(17,24,39,.18),
              rgba(59,29,16,.18),
              rgba(17,24,39,0)
            );
            animation: ttSlide 2.6s linear infinite;
            margin-left: 8px;
          }
          @keyframes ttSlide{
            0% { transform: translateX(-180px); opacity:.0; }
            15% { opacity:.9; }
            85% { opacity:.9; }
            100% { transform: translateX(180px); opacity:.0; }
          }

          /* cloth at bottom */
          .tt-cloth{
            height: 26px;
            width: 100%;
            background:
              repeating-linear-gradient(
                -45deg,
                rgba(59,29,16,.10) 0px,
                rgba(59,29,16,.10) 10px,
                rgba(17,24,39,.08) 10px,
                rgba(17,24,39,.08) 20px
              );
            opacity: .85;
            animation: ttCloth 4.8s ease-in-out infinite;
          }
          @keyframes ttCloth{
            0%,100% { transform: translateY(0); }
            50%     { transform: translateY(2px); }
          }
        `}</style>
      </div>
    </div>
  );
}
