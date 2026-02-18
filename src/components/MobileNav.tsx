"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/services", label: "Layanan" },
  { href: "/cart", label: "Keranjang" },
  { href: "/chat", label: "Chat Admin" },
  { href: "/profile", label: "Profil" },
];

function Item({ href, label, onClick }: { href: string; label: string; onClick: () => void }) {
  const pathname = usePathname();
  const active = pathname === href;

  return (
    <Link
      href={href}
      onClick={onClick}
      className={[
        "flex items-center justify-between rounded-xl2 px-4 py-3",
        "border border-black/10",
        "text-base",
        active ? "bg-black text-white" : "bg-white hover:bg-black/5",
      ].join(" ")}
    >
      <span className="font-medium">{label}</span>
      <span className={active ? "opacity-90" : "opacity-40"}>›</span>
    </Link>
  );
}

export default function MobileNav() {
  const [open, setOpen] = useState(false);

  // lock scroll saat drawer open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // esc to close
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        className="btn-ghost md:hidden"
        aria-label="Open menu"
        onClick={() => setOpen(true)}
      >
        ☰
      </button>

      {/* Overlay + sheet */}
      <div
        className={[
          "fixed inset-0 z-[9999] md:hidden",
          open ? "pointer-events-auto" : "pointer-events-none",
        ].join(" ")}
        aria-hidden={!open}
      >
        {/* Backdrop */}
        <div
          className={[
            "absolute inset-0",
            "bg-black/55 backdrop-blur-sm transition-opacity duration-200",
            open ? "opacity-100" : "opacity-0",
          ].join(" ")}
          onClick={() => setOpen(false)}
        />

        {/* Sheet */}
        <aside
          className={[
            "absolute right-0 top-0 h-full w-[88vw] max-w-sm",
            "bg-nusantara-bone",
            "border-l border-black/10 shadow-2xl",
            "transition-transform duration-200 ease-out",
            open ? "translate-x-0" : "translate-x-full",
          ].join(" ")}
        >
          {/* Header */}
          <div className="px-4 pt-4 pb-3 border-b border-black/10 bg-nusantara-bone/95">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-white border border-black/10 grid place-items-center">
                  <span className="font-bold text-sm"></span>
                <img src="/logo.svg" alt="Logo" className="h-full w-full" />
                </div>
                <div className="leading-tight">
                  <div className="font-semibold">Menu</div>
                  <div className="text-xs opacity-70">titiktemu production</div>
                </div>
              </div>

              <button className="btn-ghost" aria-label="Close menu" onClick={() => setOpen(false)}>
                ✕
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-4">
            <div className="rounded-xl2 border border-black/10 bg-white/70 p-3">
              <div className="text-xs opacity-70">Navigasi</div>
              <div className="mt-2 space-y-2">
                {items.map((it) => (
                  <Item key={it.href} href={it.href} label={it.label} onClick={() => setOpen(false)} />
                ))}
              </div>
            </div>

            {/* CTA */}
            <div className="mt-4 grid grid-cols-1 gap-2">
              <Link className="btn w-full" href="/services" onClick={() => setOpen(false)}>
                Lihat Layanan
              </Link>
              <Link className="btn-ghost w-full" href="/chat" onClick={() => setOpen(false)}>
                Tanya Admin
              </Link>
            </div>

            {/* Footer */}
            <div className="mt-6 text-xs opacity-70">
              Visual Nusantara • Creative Services
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
