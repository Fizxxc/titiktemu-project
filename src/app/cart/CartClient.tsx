"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type CartItem = {
  id: string;
  title: string;
  price: number;
  qty: number;
};

function rupiah(n: number) {
  return `Rp ${n.toLocaleString("id-ID")}`;
}

export default function CartClient() {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("cart");
      setItems(raw ? JSON.parse(raw) : []);
    } catch {
      setItems([]);
    }
  }, []);

  const subtotal = useMemo(
    () => items.reduce((sum, it) => sum + it.price * it.qty, 0),
    [items]
  );

  function persist(next: CartItem[]) {
    setItems(next);
    localStorage.setItem("cart", JSON.stringify(next));
  }

  function inc(id: string) {
    persist(items.map((it) => (it.id === id ? { ...it, qty: it.qty + 1 } : it)));
  }

  function dec(id: string) {
    const next = items
      .map((it) => (it.id === id ? { ...it, qty: Math.max(1, it.qty - 1) } : it))
      .filter((it) => it.qty > 0);
    persist(next);
  }

  function remove(id: string) {
    persist(items.filter((it) => it.id !== id));
  }

  function clear() {
    persist([]);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold">Keranjang</h1>
          <p className="text-sm opacity-70 mt-1">
            Cek item sebelum lanjut checkout.
          </p>
        </div>

        {items.length > 0 && (
          <button onClick={clear} className="btn-ghost text-sm">
            Kosongkan
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="card text-center py-10">
          <div className="text-lg font-semibold">Keranjang kosong</div>
          <p className="mt-2 text-sm opacity-70">
            Tambahkan layanan dulu dari halaman layanan.
          </p>
          <Link className="btn mt-4 inline-flex" href="/services">
            Lihat Layanan
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4 sm:gap-6">
          {/* Items */}
          <div className="space-y-3">
            {items.map((it) => (
              <div key={it.id} className="card flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-semibold truncate">{it.title}</div>
                  <div className="text-sm opacity-70">{rupiah(it.price)}</div>
                </div>

                <div className="flex items-center gap-2">
                  <button className="btn-ghost px-3" onClick={() => dec(it.id)}>-</button>
                  <div className="w-8 text-center font-semibold">{it.qty}</div>
                  <button className="btn-ghost px-3" onClick={() => inc(it.id)}>+</button>
                </div>

                <div className="text-right">
                  <div className="font-semibold">{rupiah(it.price * it.qty)}</div>
                  <button className="text-xs opacity-70 hover:opacity-100" onClick={() => remove(it.id)}>
                    Hapus
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="card h-fit space-y-3">
            <div className="font-semibold text-lg">Ringkasan</div>
            <div className="flex justify-between text-sm">
              <span className="opacity-70">Subtotal</span>
              <span className="font-semibold">{rupiah(subtotal)}</span>
            </div>

            <Link
              className="btn w-full"
              href={`/checkout`}
            >
              Lanjut Checkout
            </Link>

            <div className="text-xs opacity-60">
              Pembayaran via QRIS & upload bukti bayar.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
