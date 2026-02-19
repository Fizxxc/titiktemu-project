export const metadata = {
  title: "Privacy Policy • titiktemu production",
};

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Privacy Policy</h1>
        <p className="text-sm opacity-70 mt-2">
          Terakhir diperbarui: {new Date().toLocaleDateString("id-ID")}
        </p>
      </div>

      <section className="space-y-3 text-sm leading-relaxed">
        <p>
          Di <strong>titiktemu production</strong>, kami menghargai dan melindungi
          privasi Anda. Kebijakan Privasi ini menjelaskan bagaimana kami
          mengumpulkan, menggunakan, dan melindungi informasi pribadi Anda
          saat menggunakan layanan kami.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">1. Informasi yang Kami Kumpulkan</h2>
        <ul className="list-disc pl-6 text-sm space-y-2">
          <li>Nama lengkap dan email saat registrasi akun.</li>
          <li>Informasi login melalui Google (OAuth).</li>
          <li>Data pesanan seperti layanan yang dipilih dan catatan/brief.</li>
          <li>Bukti pembayaran yang Anda unggah.</li>
          <li>Pesan dalam sistem chat dengan admin.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">2. Bagaimana Kami Menggunakan Data</h2>
        <ul className="list-disc pl-6 text-sm space-y-2">
          <li>Memproses pesanan dan pembayaran Anda.</li>
          <li>Mengirim notifikasi status pesanan melalui email.</li>
          <li>Menyediakan dukungan pelanggan melalui fitur chat.</li>
          <li>Meningkatkan kualitas layanan kami.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">3. Penyimpanan & Keamanan</h2>
        <p className="text-sm">
          Data disimpan menggunakan layanan pihak ketiga terpercaya seperti
          Supabase dan penyedia hosting resmi. Kami berupaya melindungi data
          Anda dari akses tidak sah, kehilangan, atau penyalahgunaan.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">4. Pembayaran</h2>
        <p className="text-sm">
          Pembayaran dilakukan melalui QRIS dan bukti pembayaran diunggah
          oleh pengguna. Kami tidak menyimpan informasi kartu kredit atau
          data finansial sensitif lainnya.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">5. Hak Anda</h2>
        <p className="text-sm">
          Anda dapat meminta penghapusan akun atau data pribadi dengan
          menghubungi kami melalui email resmi atau fitur chat admin.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">6. Perubahan Kebijakan</h2>
        <p className="text-sm">
          Kami dapat memperbarui kebijakan ini dari waktu ke waktu.
          Perubahan akan diumumkan di halaman ini.
        </p>
      </section>

      <div className="pt-6 text-xs opacity-70">
        © {new Date().getFullYear()} titiktemu production • Visual Nusantara
      </div>
    </div>
  );
}
