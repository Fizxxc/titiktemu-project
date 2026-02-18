"use client";
import { useState } from "react";

type CartItem = { id: string; title: string; price: number; slug: string; qty: number };
function getCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  return JSON.parse(localStorage.getItem("tt_cart") || "[]");
}
function setCart(items: CartItem[]) {
  localStorage.setItem("tt_cart", JSON.stringify(items));
}

export default function AddToCart({ item }: { item: Omit<CartItem,"qty"> }) {
  const [added, setAdded] = useState(false);

  function add() {
    const cart = getCart();
    const idx = cart.findIndex(x => x.id === item.id);
    if (idx >= 0) cart[idx].qty += 1;
    else cart.push({ ...item, qty: 1 });
    setCart(cart);
    setAdded(true);
    setTimeout(()=>setAdded(false), 1200);
  }

  return (
    <button className="btn" onClick={add}>
      {added ? "Ditambahkan ✓" : "Tambah ke Keranjang"}
    </button>
  );
}
