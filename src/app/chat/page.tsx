"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

type Room = { id: string; user_id: string; created_at: string };
type Msg = {
  id: string;
  room_id: string;
  sender_id: string;
  message: string;
  created_at: string;
};

const WHATSAPP_RAW = "0889911149393";
const WHATSAPP_E164 = "62889911149393"; // 0 -> 62
const WA_LINK = `https://wa.me/${WHATSAPP_E164}`;

function safeText(s: string) {
  return String(s || "").trim();
}

function formatTimeJakarta(iso: string) {
  try {
    return new Intl.DateTimeFormat("id-ID", {
      timeZone: "Asia/Jakarta",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

function getJakartaNowParts() {
  // Ambil jam Jakarta secara stabil (tanpa library)
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);

  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? "0");
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? "0");
  return { hour, minute };
}

function isOperationalHourJakarta() {
  const { hour } = getJakartaNowParts();
  // 08:00 sampai 23:00 (anggap 23:00 masih masuk, tapi 23:01 tidak)
  return hour >= 8 && hour <= 23;
}

export default function ChatPage() {
  const supabase = useMemo(() => supabaseBrowser(), []);
  const [userId, setUserId] = useState<string | null>(null);

  const [roomId, setRoomId] = useState<string | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [isOpen, setIsOpen] = useState(true);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  // Jam operasional: update tiap 30 detik (biar otomatis berubah tanpa refresh)
  useEffect(() => {
    const tick = () => setIsOpen(isOperationalHourJakarta());
    tick();
    const t = setInterval(tick, 30_000);
    return () => clearInterval(t);
  }, []);

  // Auth user
  useEffect(() => {
    let alive = true;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!alive) return;
      setUserId(data.user?.id || null);
    })();
    return () => {
      alive = false;
    };
  }, [supabase]);

  // Ensure room exists (insert if none, else select) — aman RLS
  useEffect(() => {
    if (!userId) return;

    let alive = true;

    (async () => {
      setErr(null);

      // 1) coba ambil room existing
      const existing = await supabase
        .from("chat_rooms")
        .select("id,user_id,created_at")
        .eq("user_id", userId)
        .maybeSingle<Room>();

      if (!alive) return;

      if (existing.data?.id) {
        setRoomId(existing.data.id);
        return;
      }

      // 2) kalau belum ada, insert (sekali)
      const created = await supabase
        .from("chat_rooms")
        .insert({ user_id: userId })
        .select("id,user_id,created_at")
        .single<Room>();

      if (!alive) return;

      if (created.error) {
        setErr(created.error.message);
        return;
      }

      setRoomId(created.data.id);
    })();

    return () => {
      alive = false;
    };
  }, [supabase, userId]);

  // Load messages + realtime (tanpa refresh)
 useEffect(() => {
  if (!roomId) return;

  let alive = true;
  let channel: any = null;
  let pollTimer: any = null;

  const upsertMsg = (m: any) => {
    setMsgs((prev) => {
      if (prev.some((x) => x.id === m.id)) return prev;
      return [...prev, m].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    });
  };

  const loadAll = async () => {
    const { data, error } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("room_id", roomId)
      .order("created_at", { ascending: true });

    if (!alive) return;
    if (!error) setMsgs((data as any) || []);
  };

  const pollNew = async () => {
    if (!alive) return;
    const last = msgs[msgs.length - 1]?.created_at;
    const q = supabase
      .from("chat_messages")
      .select("*")
      .eq("room_id", roomId)
      .order("created_at", { ascending: true })
      .limit(50);

    const { data, error } = last ? await q.gt("created_at", last) : await q;
    if (!alive) return;
    if (!error && data?.length) data.forEach(upsertMsg);
  };

  (async () => {
    // 1) load awal
    await loadAll();

    // 2) realtime auth token (penting kalau RLS)
    const { data: s } = await supabase.auth.getSession();
    if (s.session?.access_token) supabase.realtime.setAuth(s.session.access_token);

    // 3) subscribe realtime
    channel = supabase
      .channel(`tt-room:${roomId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages", filter: `room_id=eq.${roomId}` },
        (payload) => upsertMsg(payload.new)
      )
      .subscribe((status) => {
        // 4) fallback polling selalu jalan (ringan) supaya pasti live
        // kalau realtime tidak masuk, polling tetap update
        if (!pollTimer) pollTimer = setInterval(pollNew, 1000);
      });
  })();

  return () => {
    alive = false;
    if (pollTimer) clearInterval(pollTimer);
    if (channel) supabase.removeChannel(channel);
  };
  // sengaja tidak taruh msgs sebagai deps biar interval tidak reset terus
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [supabase, roomId]);


  // Auto scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs.length]);

  async function send() {
    setErr(null);
    const message = safeText(text);

    if (!roomId) return setErr("Room belum siap. Coba refresh.");
    if (!userId) return setErr("Silakan login dulu.");
    if (!message) return;

    if (!isOpen) {
      setErr("Di luar jam operasional. Silakan chat via WhatsApp.");
      return;
    }

    setBusy(true);
    try {
      setText("");

      const { error } = await supabase.from("chat_messages").insert({
        room_id: roomId,
        sender_id: userId,
        message,
      });

      if (error) throw new Error(error.message);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  const showAutoOperationalMessage = !isOpen;

  return (
    <div className="min-h-[calc(100vh-120px)]">
      <div className="mb-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-2xl font-semibold tracking-wide">Live Chat Admin</div>
            <div className="text-sm opacity-70">
              Nuansa Nusantara • Balas cepat untuk order kamu
            </div>
          </div>
          <Link href="/" className="btn-ghost">
            Kembali
          </Link>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_360px] gap-4">
        {/* Chat Panel */}
        <div className="card bg-nusantara-bone bg-batik-grid bg-batik-grid space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="font-semibold">Ruang Chat</div>
              <div className="text-xs opacity-70">
                {roomId ? `Room: ${roomId.slice(0, 8)}…` : "Menyiapkan room…"}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`badge ${
                  isOpen ? "bg-white" : "bg-white"
                }`}
              >
                {isOpen ? "Online 08:00–23:00" : "Offline (di luar jam)"}
              </span>
            </div>
          </div>

          {/* Auto operational message */}
          {showAutoOperationalMessage && (
            <div className="rounded-xl2 border border-black/10 bg-white/80 p-3">
              <div className="font-semibold text-nusantara-batik">Di luar jam operasional</div>
              <div className="text-sm opacity-80 mt-1">
                Jam operasional admin: <b>08:00</b> sampai <b>23:00</b> (WIB).
                Untuk respon cepat, silakan hubungi WhatsApp:
              </div>

              <a
                href={WA_LINK}
                target="_blank"
                rel="noreferrer"
                className="btn mt-3 w-full"
              >
                WhatsApp Admin • {WHATSAPP_RAW}
              </a>

              <div className="text-xs opacity-70 mt-2">
                Kamu tetap bisa lihat chat sebelumnya. Pengiriman pesan akan aktif kembali saat jam operasional.
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="h-[60vh] lg:h-[520px] overflow-auto rounded-xl2 border border-black/10 bg-white/90 p-3">
            {msgs.length === 0 ? (
              <div className="text-sm opacity-70">
                Belum ada pesan. Tulis kebutuhan kamu: jenis edit, durasi, mood, deadline.
              </div>
            ) : (
              <div className="space-y-3">
                {msgs.map((m) => {
                  const mine = userId && m.sender_id === userId;
                  return (
                    <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                      <div
                        className={[
                          "max-w-[85%] rounded-2xl px-3 py-2 border border-black/10",
                          mine
                            ? "bg-white shadow-sm"
                            : "bg-white/80",
                        ].join(" ")}
                      >
                        <div className="text-[11px] opacity-60">
                          {formatTimeJakarta(m.created_at)}
                        </div>
                        <div className="text-sm whitespace-pre-wrap leading-relaxed">
                          {m.message}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>
            )}
          </div>

          {/* Composer */}
          <div className="flex gap-2">
            <input
              className="input"
              placeholder={isOpen ? "Tulis pesan…" : "Chat nonaktif di luar jam operasional"}
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={!isOpen || busy || !roomId}
              onKeyDown={(e) => {
                if (e.key === "Enter") send();
              }}
            />
            <button className="btn" disabled={!isOpen || busy || !roomId} onClick={send}>
              {busy ? "..." : "Kirim"}
            </button>
          </div>

          {err && <div className="text-sm text-nusantara-batik">{err}</div>}
        </div>

        {/* Side panel tips */}
        <div className="card space-y-3">
          <div className="font-semibold">Tips biar cepat diproses</div>
          <ul className="text-sm opacity-80 space-y-2">
            <li>• Jelaskan style: cinematic / clean / vintage / estetik</li>
            <li>• Kirim referensi (link) kalau ada</li>
            <li>• Tulis durasi & deadline</li>
            <li>• Sebut platform: IG / TikTok / YouTube</li>
          </ul>

          <div className="rounded-xl2 border border-black/10 bg-white p-3">
            <div className="text-sm font-semibold">WhatsApp cepat</div>
            <div className="text-sm opacity-80 mt-1">{WHATSAPP_RAW}</div>
            <a className="btn mt-3 w-full" href={WA_LINK} target="_blank" rel="noreferrer">
              Buka WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
