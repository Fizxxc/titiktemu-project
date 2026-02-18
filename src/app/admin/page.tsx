export default function AdminHome() {
  return (
    <div className="grid md:grid-cols-3 gap-4">
      <div className="card"><div className="font-semibold">Services</div><p className="text-sm opacity-70 mt-2">Tambah/ubah produk/jasa manual.</p></div>
      <div className="card"><div className="font-semibold">Coupons</div><p className="text-sm opacity-70 mt-2">Buat diskon percent/fixed.</p></div>
      <div className="card"><div className="font-semibold">Orders</div><p className="text-sm opacity-70 mt-2">Verifikasi bukti bayar, ubah status, kirim email.</p></div>
    </div>
  );
}
