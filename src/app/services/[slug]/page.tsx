import { supabaseServer } from "@/lib/supabase/server";
import AddToCartButton from "@/components/AddToCartButton";
import Image from "next/image";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function ServiceDetailPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await supabaseServer();

  const { data: service } = await supabase
    .from("services")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!service) return notFound();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
      
      {/* Image */}
      <div className="relative w-full h-64 sm:h-96 rounded-xl2 overflow-hidden bg-black/5">
        {service.cover_url ? (
          <Image
            src={service.cover_url}
            alt={service.title}
            fill
            className="object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full opacity-50">
            Tidak ada gambar
          </div>
        )}
      </div>

      {/* Detail */}
      <div className="space-y-4">
        <h1 className="text-2xl sm:text-3xl font-semibold">
          {service.title}
        </h1>

        <p className="opacity-80 text-sm sm:text-base">
          {service.description}
        </p>

        <div className="text-xl sm:text-2xl font-semibold text-nusantara-batik">
          Rp {service.price.toLocaleString("id-ID")}
        </div>

        <AddToCartButton service={service} />
      </div>
    </div>
  );
}
