"use client";

import Image from "next/image";
import Link from "next/link";

type Service = {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  cover_url?: string | null;
};

export default function ServiceCard({ service }: { service: Service }) {
  return (
    <div className="card hover:shadow-lg transition-shadow duration-300 flex flex-col">
      
      {/* Image */}
      <div className="relative w-full h-44 sm:h-48 rounded-xl2 overflow-hidden bg-black/5">
        {service.cover_url ? (
          <Image
            src={service.cover_url}
            alt={service.title}
            fill
            className="object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-sm opacity-50">
            Tidak ada gambar
          </div>
        )}
      </div>

      {/* Content */}
      <div className="mt-4 flex flex-col flex-1">
        <h3 className="font-semibold text-base sm:text-lg">
          {service.title}
        </h3>

        <p className="text-sm opacity-70 mt-2 line-clamp-3">
          {service.description}
        </p>

        <div className="mt-4 flex items-center justify-between">
          <span className="font-semibold text-nusantara-batik">
            Rp {service.price.toLocaleString("id-ID")}
          </span>

          <Link
            href={`/services/${service.slug}`}
            className="btn-ghost text-sm"
          >
            Detail
          </Link>
        </div>
      </div>
    </div>
  );
}
