"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function LoginPage() {
  const supabase = useMemo(() => supabaseBrowser(), []);
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function loginGoogle() {
    setMsg(null);
    setBusy(true);
    try {
      const origin = window.location.origin;
      const redirectTo = `${origin}/auth/callback?next=${encodeURIComponent("/profile")}`;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo },
      });

      if (error) setMsg(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setMsg(error.message);
        return;
      }

      router.push("/profile");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="card bg-nusantara-bone bg-batik-grid space-y-4">
        <div>
          <h1 className="text-2xl font-semibold">Masuk</h1>
          <p className="text-sm opacity-70">Login untuk lanjut checkout dan chat admin.</p>
        </div>

        {/* Google */}
        <button
          type="button"
          onClick={loginGoogle}
          disabled={busy}
          className={[
            "w-full rounded-xl2 border border-black/10 bg-white",
            "px-4 py-3 text-sm font-semibold",
            "hover:bg-black/5 transition",
            "flex items-center justify-center gap-2",
          ].join(" ")}
        >
          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-black/10 bg-white">
            G
          </span>
          {busy ? "Mengalihkan…" : "Login dengan Google"}
        </button>

        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-black/10" />
          <div className="text-xs opacity-60">atau</div>
          <div className="h-px flex-1 bg-black/10" />
        </div>

        {/* Form email/password */}
        <form onSubmit={onSubmit} className="space-y-3">
          <input
            className="input"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            inputMode="email"
          />
          <input
            className="input"
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />

          <button className="btn w-full" disabled={busy}>
            {busy ? "Memproses…" : "Masuk"}
          </button>

          {msg && <p className="text-sm text-nusantara-batik">{msg}</p>}
        </form>

        <p className="text-sm opacity-80">
          Belum punya akun?{" "}
          <Link className="underline" href="/register">
            Daftar
          </Link>
        </p>
      </div>
    </div>
  );
}
