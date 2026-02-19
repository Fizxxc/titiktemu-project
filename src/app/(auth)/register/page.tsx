"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function RegisterPage() {
  const supabase = useMemo(() => supabaseBrowser(), []);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function signUpGoogle() {
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
      const origin = window.location.origin;
      // untuk email confirmation supabase
      const emailRedirectTo = `${origin}/auth/callback?next=${encodeURIComponent("/profile")}`;

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo,
          data: { full_name: fullName },
        },
      });

      setMsg(
        error
          ? error.message
          : "Berhasil daftar. Cek email untuk konfirmasi (kalau diminta), lalu login."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="card bg-nusantara-bone bg-batik-grid space-y-4">
        <div>
          <h1 className="text-2xl font-semibold">Daftar</h1>
          <p className="text-sm opacity-70">Bikin akun biar bisa checkout & chat admin.</p>
        </div>

        {/* Google */}
        <button
          type="button"
          onClick={signUpGoogle}
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
          {busy ? "Mengalihkan…" : "Daftar dengan Google"}
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
            placeholder="Nama lengkap"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            autoComplete="name"
          />
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
            autoComplete="new-password"
          />

          <button className="btn w-full" disabled={busy}>
            {busy ? "Memproses…" : "Daftar"}
          </button>

          {msg && <p className="text-sm text-nusantara-batik">{msg}</p>}
        </form>

        <p className="text-sm opacity-80">
          Sudah punya akun?{" "}
          <Link className="underline" href="/login">
            Masuk
          </Link>
        </p>
      </div>
    </div>
  );
}
