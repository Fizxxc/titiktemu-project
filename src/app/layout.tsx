import "./globals.css";
import Link from "next/link";
import { Brand } from "@/components/Brand";
import MobileNav from "@/components/MobileNav";

export const metadata = { title: "titiktemu production" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className="
  min-h-screen
  bg-nusantara-bone
  bg-batik-grid
  bg-[length:18px_18px]
  text-nusantara-ink
">
        <header className="sticky top-0 z-50 border-b border-black/10 bg-nusantara-bone/80 backdrop-blur">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-3">
            <Brand />

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-2">
              <Link className="btn-ghost" href="/services">Layanan</Link>
              <Link className="btn-ghost" href="/cart">Keranjang</Link>
              <Link className="btn-ghost" href="/chat">Chat</Link>
              <Link className="btn-ghost" href="/profile">Profil</Link>
            </nav>

            {/* Mobile menu button */}
            <MobileNav />
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-8">
          {children}
        </main>

        <footer className="border-t border-black/10 bg-nusantara-bone/80">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">

            {/* Top section */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">

              {/* Brand info */}
              <div className="space-y-2">
                <div className="font-semibold tracking-wide">
                  titiktemu production
                </div>
                <div className="text-sm opacity-70">
                  Visual Nusantara • Creative Services
                </div>
              </div>

              {/* Legal links */}
              <div className="flex items-center gap-6 text-sm">
                <Link
                  href="/privacy"
                  className="
            relative
            opacity-70 hover:opacity-100
            transition
            after:absolute after:left-0 after:-bottom-1
            after:h-[1px] after:w-0
            after:bg-nusantara-ink
            after:transition-all after:duration-300
            hover:after:w-full
          "
                >
                  Privacy Policy
                </Link>

                <Link
                  href="/terms"
                  className="
            relative
            opacity-70 hover:opacity-100
            transition
            after:absolute after:left-0 after:-bottom-1
            after:h-[1px] after:w-0
            after:bg-nusantara-ink
            after:transition-all after:duration-300
            hover:after:w-full
          "
                >
                  Terms of Service
                </Link>
              </div>
            </div>

            {/* Divider */}
            <div className="my-6 h-px bg-black/10" />

            {/* Bottom copyright */}
            <div className="text-xs opacity-60 text-center md:text-left">
              © {new Date().getFullYear()} titiktemu production — Hak Cipta Dilindungi.
            </div>

          </div>
        </footer>

      </body>
    </html>
  );
}
