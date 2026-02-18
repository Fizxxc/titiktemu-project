import { supabaseServer } from "@/lib/supabase/server";
import ServiceCard from "@/components/ServiceCard";

export default async function ServicesPage() {
  const supabase = await supabaseServer();

  const { data: services } = await supabase
    .from("services")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold">
          Layanan Kami
        </h1>
        <p className="opacity-70 text-sm sm:text-base mt-2">
          Pilih layanan terbaik untuk kebutuhan kreatif kamu.
        </p>
      </div>

      {/* Responsive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {services?.map((service) => (
          <ServiceCard key={service.id} service={service} />
        ))}
      </div>

      {!services?.length && (
        <div className="card text-center py-10 opacity-60">
          Belum ada layanan tersedia.
        </div>
      )}
    </div>
  );
}
