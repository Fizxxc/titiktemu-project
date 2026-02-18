"use client";
import { useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function RegisterPage() {
  const supabase = supabaseBrowser();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } }
    });
    setMsg(error ? error.message : "Berhasil daftar. Silakan login.");
  }

  return (
    <div className="max-w-md mx-auto card">
      <h1 className="text-2xl font-semibold">Daftar</h1>
      <form onSubmit={onSubmit} className="mt-4 space-y-3">
        <input className="input" placeholder="Nama lengkap" value={fullName} onChange={e=>setFullName(e.target.value)} />
        <input className="input" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
        <input className="input" placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
        <button className="btn w-full">Daftar</button>
        {msg && <p className="text-sm text-nusantara-batik">{msg}</p>}
      </form>
      <p className="text-sm mt-4 opacity-80">
        Sudah punya akun? <Link className="underline" href="/login">Masuk</Link>
      </p>
    </div>
  );
}
