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

        <footer className="border-t border-black/10 bg-nusantara-bone/70">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-8 text-sm opacity-80">
            © {new Date().getFullYear()} titiktemu production — Visual Nusantara.
          </div>
        </footer>
      </body>
    </html>
  );
}
