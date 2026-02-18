import Image from "next/image";
import Link from "next/link";

export function Brand() {
  return (
    <Link
      href="/"
      className="flex items-center gap-3 group"
    >
      {/* Logo container */}
      <div className="
        h-11 w-11 sm:h-12 sm:w-12
        rounded-xl2
        border border-black/10
        bg-white
        flex items-center justify-center
        overflow-hidden
        shadow-sm
        transition-transform duration-200
        group-hover:scale-105
      ">
        <Image
          src="/logo.svg"
          alt="titiktemu production"
          width={34}
          height={34}
          className="object-contain"
        />
      </div>

      {/* Text */}
      <div className="leading-tight">
        <div className="
          font-semibold
          text-base sm:text-lg
          tracking-wide
          text-nusantara-ink
        ">
          titiktemu
        </div>
        <div className="
          text-xs sm:text-sm
          tracking-wider
          uppercase
          text-nusantara-batik
          opacity-80
        ">
          production
        </div>
      </div>
    </Link>
  );
}
