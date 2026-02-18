"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Portal from "@/components/Portal";

const items = [
  { href: "/services", label: "Layanan" },
  { href: "/cart", label: "Keranjang" },
  { href: "/chat", label: "Chat Admin" },
  { href: "/profile", label: "Profil" },
];

function Item({
  href,
  label,
  onClick,
}: {
  href: string;
  label: string;
  onClick: () => void;
}) {
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

function MenuDots() {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="h-1.5 w-1.5 rounded-full bg-black/70" />
      <span className="h-1.5 w-1.5 rounded-full bg-black/40" />
      <span className="h-1.5 w-1.5 rounded-full bg-black/25" />
    </span>
  );
}

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);

  // lock scroll
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // esc
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // focus
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => panelRef.current?.focus(), 0);
    return () => clearTimeout(t);
  }, [open]);

  return (
    <>
      <button
        className={[
          "md:hidden inline-flex items-center gap-2",
          "rounded-xl2 border border-black/10 bg-white",
          "px-3 py-2 text-sm font-semibold",
          "shadow-sm hover:bg-black/5 active:scale-[0.99] transition",
        ].join(" ")}
        aria-label="Open menu"
        onClick={() => setOpen(true)}
      >
        <span>Menu</span>
        <MenuDots />
      </button>

      {/* PORTAL overlay: keluar dari stacking context layout */}
      <Portal>
        <div
          className={[
            "fixed inset-0 z-[2147483647] md:hidden",
            open ? "pointer-events-auto" : "pointer-events-none",
          ].join(" ")}
          aria-hidden={!open}
        >
          {/* Backdrop */}
          <div
            className={[
              "absolute inset-0 bg-black/60 backdrop-blur-sm",
              "transition-opacity duration-150",
              open ? "opacity-100" : "opacity-0",
            ].join(" ")}
            onClick={() => setOpen(false)}
          />

          {/* Panel */}
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div
              ref={panelRef}
              tabIndex={-1}
              onClick={(e) => e.stopPropagation()}
              className={[
                "w-full max-w-md rounded-2xl overflow-hidden",
                "border border-black/10 shadow-2xl",
                "bg-nusantara-bone bg-batik-grid",
                "transition-opacity duration-150",
                open ? "opacity-100" : "opacity-0",
                "max-h-[85vh] flex flex-col",
              ].join(" ")}
              role="dialog"
              aria-modal="true"
            >
              {/* Header */}
              <div className="px-4 py-4 border-b border-black/10 bg-nusantara-bone/90 backdrop-blur flex items-start justify-between gap-3">
                <div className="leading-tight">
                  <div className="text-xs opacity-70">Navigasi</div>
                  <div className="text-lg font-semibold tracking-tight">
                    Menu
                  </div>
                  <div className="text-xs opacity-70">titiktemu production</div>
                </div>

                <button
                  className="rounded-xl2 border border-black/10 bg-white px-3 py-2 text-sm font-semibold hover:bg-black/5"
                  onClick={() => setOpen(false)}
                >
                  Tutup
                </button>
              </div>

              {/* Body scroll */}
              <div className="p-4 space-y-4 overflow-y-auto">
                <div className="rounded-xl2 border border-black/10 bg-white/80 p-3">
                  <div className="text-xs opacity-70">Pilih halaman</div>
                  <div className="mt-2 space-y-2">
                    {items.map((it) => (
                      <Item
                        key={it.href}
                        href={it.href}
                        label={it.label}
                        onClick={() => setOpen(false)}
                      />
                    ))}
                  </div>
                </div>

                {/* CTA */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Link
                    className="btn w-full justify-center"
                    href="/services"
                    onClick={() => setOpen(false)}
                  >
                    Lihat Layanan
                  </Link>
                  <Link
                    className="btn-ghost w-full justify-center"
                    href="/chat"
                    onClick={() => setOpen(false)}
                  >
                    Tanya Admin
                  </Link>
                </div>

                <div className="text-xs opacity-70 pb-1">
                  Visual Nusantara • Creative Services
                </div>
              </div>
            </div>
          </div>
        </div>
      </Portal>
    </>
  );
}
