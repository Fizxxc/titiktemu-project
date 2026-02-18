"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function LoginPage() {
  const supabase = supabaseBrowser();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return setMsg(error.message);
    router.push("/");
  }

  return (
    <div className="max-w-md mx-auto card">
      <h1 className="text-2xl font-semibold">Masuk</h1>
      <form onSubmit={onSubmit} className="mt-4 space-y-3">
        <input className="input" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
        <input className="input" placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
        <button className="btn w-full">Masuk</button>
        {msg && <p className="text-sm text-nusantara-batik">{msg}</p>}
      </form>
      <p className="text-sm mt-4 opacity-80">
        Belum punya akun? <Link className="underline" href="/register">Daftar</Link>
      </p>
    </div>
  );
}
