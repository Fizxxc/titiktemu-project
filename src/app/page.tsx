import Link from "next/link";

export default function HomePage() {
  return (
    <div className="space-y-6 sm:space-y-8">
      <section className="card relative overflow-hidden">
        <div className="badge mb-3">Visual Nusantara • Creative Services</div>

        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
          Titik temu ide & rasa — jadi karya.
        </h1>

        <p className="mt-3 max-w-2xl text-sm sm:text-base opacity-80">
          Jasa edit video, dan desain.
        </p>

        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <Link className="btn w-full sm:w-auto" href="/services">Lihat Layanan</Link>
          <Link className="btn-ghost w-full sm:w-auto" href="/chat">Tanya Admin</Link>
        </div>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="card">
          <div className="font-semibold">Respon Cepat</div>
          <p className="opacity-80 text-sm mt-2">Prioritas kami adalah kecepatan. Tim kami selalu siap membantu kebutuhan Anda kapan saja.</p>
        </div>
        <div className="card">
          <div className="font-semibold">Our Team</div>
          <p className="opacity-80 text-sm mt-2">@fizzx.docx, @xazign</p>
        </div>
        <div className="card">
          <div className="font-semibold">Jam Operasional</div>
          <p className="opacity-80 text-sm mt-2">Pukul 08.00 s/d 23.00 WIB</p>
        </div>
      </section>
    </div>
  );
}
