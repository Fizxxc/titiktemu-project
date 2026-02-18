"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Service = {
  id: string;
  title: string;
  price: number;
};

type CartItem = {
  id: string;
  title: string;
  price: number;
  qty: number;
};

function rupiah(n: number) {
  return `Rp ${n.toLocaleString("id-ID")}`;
}

function readCart(): CartItem[] {
  try {
    const raw = localStorage.getItem("cart");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeCart(items: CartItem[]) {
  localStorage.setItem("cart", JSON.stringify(items));
}

export default function AddToCartButton({ service }: { service: Service }) {
  const [qty, setQty] = useState(1);
  const [inCartQty, setInCartQty] = useState(0);
  const [addedPulse, setAddedPulse] = useState(false);

  const cartTotal = useMemo(() => {
    if (!inCartQty) return 0;
    return inCartQty * service.price;
  }, [inCartQty, service.price]);

  useEffect(() => {
    const items = readCart();
    const found = items.find((i) => i.id === service.id);
    setInCartQty(found?.qty ?? 0);
  }, [service.id]);

  function add() {
    const items = readCart();
    const found = items.find((i) => i.id === service.id);

    if (found) {
      found.qty += qty;
    } else {
      items.push({
        id: service.id,
        title: service.title,
        price: service.price,
        qty,
      });
    }

    writeCart(items);

    const newFound = items.find((i) => i.id === service.id);
    setInCartQty(newFound?.qty ?? 0);

    setAddedPulse(true);
    window.setTimeout(() => setAddedPulse(false), 450);
  }

  function removeFromCart() {
    const items = readCart().filter((i) => i.id !== service.id);
    writeCart(items);
    setInCartQty(0);
  }

  return (
    <div className="space-y-3">
      {/* Price row */}
      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="text-sm opacity-70">Harga</div>
          <div className="text-xl sm:text-2xl font-semibold text-nusantara-batik">
            {rupiah(service.price)}
          </div>
        </div>

        {inCartQty > 0 && (
          <div className="text-right">
            <div className="text-xs opacity-70">Di keranjang</div>
            <div className="font-semibold">
              {inCartQty}x • {rupiah(cartTotal)}
            </div>
          </div>
        )}
      </div>

      {/* Qty + actions */}
      <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-3">
        {/* Qty stepper */}
        <div className="card flex items-center justify-between py-2 px-3">
          <button
            className="btn-ghost px-3"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            aria-label="Kurangi jumlah"
          >
            −
          </button>
          <div className="text-center">
            <div className="text-xs opacity-70">Jumlah</div>
            <div className="font-semibold">{qty}</div>
          </div>
          <button
            className="btn-ghost px-3"
            onClick={() => setQty((q) => q + 1)}
            aria-label="Tambah jumlah"
          >
            +
          </button>
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={add}
            className={[
              "btn w-full",
              addedPulse ? "scale-[1.01]" : "",
            ].join(" ")}
          >
            {inCartQty > 0 ? "Tambah Lagi" : "Tambah ke Keranjang"}
          </button>

          <Link className="btn-ghost w-full sm:w-auto" href="/cart">
            Lihat Keranjang
          </Link>

          {inCartQty > 0 && (
            <button
              onClick={removeFromCart}
              className="btn-ghost w-full sm:w-auto"
              title="Hapus item ini dari keranjang"
            >
              Hapus
            </button>
          )}
        </div>
      </div>

      {/* subtle hint */}
      <div className="text-xs opacity-60">
        Pembayaran via QRIS • Upload bukti • Invoice PDF otomatis
      </div>
    </div>
  );
}
