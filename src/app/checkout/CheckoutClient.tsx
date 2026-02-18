"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useSearchParams, useRouter } from "next/navigation";

type CartItem = { id: string; title: string; price: number; qty: number };

// ✅ gunakan satu key saja agar konsisten dengan AddToCartButton & CartClient
const CART_KEY = "cart";
// fallback key lama (kalau sebelumnya sempat pakai)
const LEGACY_CART_KEY = "tt_cart";

function safeParseCart(raw: string | null): CartItem[] {
  try {
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function loadCart(): CartItem[] {
  if (typeof window === "undefined") return [];

  // baca cart utama
  const main = safeParseCart(localStorage.getItem(CART_KEY));
  if (main.length) return main;

  // fallback: migrasi dari legacy kalau ada
  const legacy = safeParseCart(localStorage.getItem(LEGACY_CART_KEY));
  if (legacy.length) {
    localStorage.setItem(CART_KEY, JSON.stringify(legacy));
    localStorage.removeItem(LEGACY_CART_KEY);
    return legacy;
  }

  return [];
}

function clearCart() {
  localStorage.removeItem(CART_KEY);
  localStorage.removeItem(LEGACY_CART_KEY);
}

function rupiah(n: number) {
  return `Rp ${n.toLocaleString("id-ID")}`;
}

export default function CheckoutClient() {
  const supabase = useMemo(() => supabaseBrowser(), []);
  const sp = useSearchParams();
  const router = useRouter();

  const [items, setItems] = useState<CartItem[]>([]);
  const [notes, setNotes] = useState("");
  const [couponCode, setCouponCode] = useState((sp.get("coupon") || "").trim().toUpperCase());
  const [orderId, setOrderId] = useState<string | null>(sp.get("orderId"));
  const [msg, setMsg] = useState<string | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const subtotal = useMemo(
    () => items.reduce((sum, it) => sum + it.price * it.qty, 0),
    [items]
  );

  useEffect(() => {
    if (!orderId) {
      const c = loadCart();
      setItems(c);
      if (!c.length) {
        setMsg("Keranjang kosong. Tambahkan layanan dulu dari halaman Layanan.");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  async function createOrder() {
    setMsg(null);

    if (items.length === 0) {
      setMsg("Keranjang kosong. Tidak bisa membuat order.");
      return;
    }

    setBusy(true);
    try {
      const r = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, notes, couponCode }),
      });

      let j: any = null;
      try {
        j = await r.json();
      } catch {
        // kalau server balikin non-json
      }

      if (!r.ok) {
        throw new Error(j?.error || `Checkout gagal (HTTP ${r.status})`);
      }

      setOrderId(j.orderId);
      clearCart();

      setMsg("Order berhasil dibuat. Silakan lanjut pembayaran via QRIS.");
      router.replace(`/checkout?orderId=${j.orderId}`);
    } catch (e: any) {
      console.error(e);
      setMsg(e.message || "Terjadi kesalahan saat membuat order.");
    } finally {
      setBusy(false);
    }
  }

  async function uploadProof() {
    if (!orderId) {
      setMsg("Order ID tidak ditemukan.");
      return;
    }
    if (!file) {
      setMsg("Pilih file bukti bayar terlebih dahulu.");
      return;
    }

    setMsg(null);
    setBusy(true);

    try {
      const fd = new FormData();
      fd.set("orderId", orderId);
      fd.set("file", file);

      const r = await fetch("/api/upload-payment", { method: "POST", body: fd });

      let j: any = null;
      try {
        j = await r.json();
      } catch {}

      if (!r.ok) {
        throw new Error(j?.error || `Upload gagal (HTTP ${r.status})`);
      }

      setMsg("✅ Bukti pembayaran terkirim. Menunggu verifikasi admin.");
      setFile(null);
    } catch (e: any) {
      console.error(e);
      setMsg(e.message || "Terjadi kesalahan saat upload bukti bayar.");
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
      {/* LEFT */}
      <div className="card space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold">Checkout</h1>
            <p className="text-sm opacity-70 mt-1">
              Buat order, bayar via QRIS, lalu upload bukti.
            </p>
          </div>
          <div className="text-right text-sm">
            {!orderId && <div className="opacity-70">Subtotal</div>}
            {!orderId && <div className="font-semibold">{rupiah(subtotal)}</div>}
          </div>
        </div>

        {!orderId ? (
          <>
            <div className="text-sm font-semibold">Ringkasan layanan</div>
            <div className="space-y-2">
              {items.map((it) => (
                <div
                  key={it.id}
                  className="flex items-start justify-between gap-3 text-sm border-b border-black/10 pb-2"
                >
                  <div className="min-w-0">
                    <div className="font-medium truncate">{it.title}</div>
                    <div className="text-xs opacity-70">{it.qty}× {rupiah(it.price)}</div>
                  </div>
                  <div className="font-semibold">{rupiah(it.price * it.qty)}</div>
                </div>
              ))}

              {items.length === 0 && (
                <div className="text-sm opacity-70">Keranjang kosong.</div>
              )}
            </div>

            <div>
              <div className="text-sm font-semibold">Brief/Notes</div>
              <textarea
                className="input mt-2 h-28"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Contoh: edit gaya cinematic, durasi 30 detik, mood hangat..."
              />
            </div>

            <div>
              <div className="text-sm font-semibold">Kupon</div>
              <input
                className="input mt-2"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                placeholder="KODEKUPON"
              />
              <p className="text-xs opacity-70 mt-2">
                Kupon divalidasi server saat buat order.
              </p>
            </div>

            <button
              className="btn w-full"
              disabled={busy || items.length === 0}
              onClick={createOrder}
            >
              {busy ? "Memproses..." : "Buat Order"}
            </button>

            <div className="text-xs opacity-60">
              Jika tombol tidak aktif, berarti keranjang kamu masih kosong.
            </div>
          </>
        ) : (
          <>
            <div className="badge">Order ID: {orderId}</div>

            <div className="card bg-white space-y-3">
              <div>
                <div className="font-semibold">Pembayaran QRIS</div>
                <p className="text-sm opacity-80 mt-1">
                  Scan QRIS di bawah, lalu upload bukti pembayaran.
                </p>
              </div>

              <div className="rounded-xl2 border border-black/10 overflow-hidden bg-white">
                <Image src="/qris.png" alt="QRIS" width={900} height={900} className="w-full h-auto" />
              </div>

              <div className="space-y-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
                <button
                  className="btn w-full"
                  disabled={busy || !file}
                  onClick={uploadProof}
                >
                  {busy ? "Mengunggah..." : "Upload Bukti Bayar"}
                </button>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <a
                  className="btn-ghost w-full sm:w-auto"
                  href={`/api/invoice/${orderId}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Unduh Invoice (PDF)
                </a>
                <button className="btn-ghost w-full sm:w-auto" onClick={logout}>
                  Logout
                </button>
              </div>
            </div>
          </>
        )}

        {msg && (
          <div className="text-sm text-nusantara-batik">{msg}</div>
        )}
      </div>

      {/* RIGHT */}
      <div className="card space-y-3">
        <div className="font-semibold">Nuansa Nusantara</div>
        <p className="text-sm opacity-80">
          Tema terinspirasi batik, tanah, dan rempah. Kamu bisa minta variasi motif: parang, kawung, mega mendung.
        </p>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="card">Warna: Batik Merah</div>
          <div className="card">Aksen: Jade</div>
          <div className="card">Kertas: Bone</div>
          <div className="card">Kayu: Teak</div>
        </div>
      </div>
    </div>
  );
}
