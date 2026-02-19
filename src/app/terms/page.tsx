export const metadata = {
  title: "Terms of Service • titiktemu production",
};

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Terms of Service</h1>
        <p className="text-sm opacity-70 mt-2">
          Terakhir diperbarui: {new Date().toLocaleDateString("id-ID")}
        </p>
      </div>

      <section className="space-y-3 text-sm leading-relaxed">
        <p>
          Dengan menggunakan layanan <strong>titiktemu production</strong>,
          Anda setuju untuk terikat dengan Syarat dan Ketentuan berikut.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">1. Layanan</h2>
        <p className="text-sm">
          Kami menyediakan jasa kreatif seperti edit video, desain grafis,
          branding, dan produksi konten lainnya sesuai pesanan pengguna.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">2. Akun Pengguna</h2>
        <ul className="list-disc pl-6 text-sm space-y-2">
          <li>Pengguna bertanggung jawab atas keamanan akun masing-masing.</li>
          <li>Dilarang menggunakan layanan untuk aktivitas ilegal.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">3. Pembayaran</h2>
        <ul className="list-disc pl-6 text-sm space-y-2">
          <li>Pembayaran dilakukan melalui QRIS.</li>
          <li>Pesanan diproses setelah pembayaran diverifikasi.</li>
          <li>Harga dapat berubah sewaktu-waktu tanpa pemberitahuan sebelumnya.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">4. Revisi & Pengembalian Dana</h2>
        <p className="text-sm">
          Ketentuan revisi dan refund mengikuti kesepakatan proyek.
          Pengembalian dana dapat dipertimbangkan sesuai kebijakan internal.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">5. Hak Kekayaan Intelektual</h2>
        <p className="text-sm">
          Hak cipta hasil karya akan diserahkan kepada klien setelah
          pembayaran lunas, kecuali disepakati lain secara tertulis.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">6. Batasan Tanggung Jawab</h2>
        <p className="text-sm">
          Kami tidak bertanggung jawab atas kerugian tidak langsung yang
          timbul dari penggunaan layanan ini.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">7. Perubahan Ketentuan</h2>
        <p className="text-sm">
          Kami dapat memperbarui syarat dan ketentuan ini kapan saja.
        </p>
      </section>

      <div className="pt-6 text-xs opacity-70">
        © {new Date().getFullYear()} titiktemu production • Visual Nusantara
      </div>
    </div>
  );
}
