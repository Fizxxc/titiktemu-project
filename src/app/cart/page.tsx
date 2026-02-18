import { Suspense } from "react";
import CartClient from "./CartClient";

export default function CartPage() {
  return (
    <Suspense fallback={<div className="card">Memuat keranjang…</div>}>
      <CartClient />
    </Suspense>
  );
}
