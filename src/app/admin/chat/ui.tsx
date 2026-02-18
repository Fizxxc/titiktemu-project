"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

type Room = { id: string; user_id: string; created_at: string };
type Msg = { id: string; room_id: string; sender_id: string; message: string; created_at: string };

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

export default function AdminChatClient({ initialRooms }: { initialRooms: Room[] }) {
  const supabase = useMemo(() => supabaseBrowser(), []);
  const [adminId, setAdminId] = useState<string | null>(null);

  const [rooms, setRooms] = useState<Room[]>(initialRooms);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(initialRooms[0]?.id || null);

  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!alive) return;
      setAdminId(data.user?.id || null);
    })();
    return () => {
      alive = false;
    };
  }, [supabase]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs.length]);

  // Load + realtime for selected room
  useEffect(() => {
    if (!activeRoomId) return;

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
        .eq("room_id", activeRoomId)
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
        .eq("room_id", activeRoomId)
        .order("created_at", { ascending: true })
        .limit(50);

      const { data, error } = last ? await q.gt("created_at", last) : await q;

      if (!alive) return;
      if (!error && data?.length) data.forEach(upsertMsg);
    };

    (async () => {
      await loadAll();

      const { data: s } = await supabase.auth.getSession();
      if (s.session?.access_token) supabase.realtime.setAuth(s.session.access_token);

      channel = supabase
        .channel(`admin-room:${activeRoomId}`)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "chat_messages", filter: `room_id=eq.${activeRoomId}` },
          (payload) => upsertMsg(payload.new)
        )
        .subscribe(() => {
          if (!pollTimer) pollTimer = setInterval(pollNew, 1000);
        });
    })();

    return () => {
      alive = false;
      if (pollTimer) clearInterval(pollTimer);
      if (channel) supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, activeRoomId]);


  async function send() {
    setErr(null);
    if (!activeRoomId) return;
    if (!adminId) return setErr("Admin harus login.");
    const message = text.trim();
    if (!message) return;

    setBusy(true);
    try {
      setText("");
      const { error } = await supabase.from("chat_messages").insert({
        room_id: activeRoomId,
        sender_id: adminId,
        message,
      });
      if (error) throw new Error(error.message);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="text-2xl font-semibold tracking-wide">Admin Live Chat</div>
        <div className="text-sm opacity-70">Kelola chat user secara realtime</div>
      </div>

      <div className="grid lg:grid-cols-[340px_1fr] gap-4">
        {/* Rooms */}
        <div className="card space-y-3">
          <div className="font-semibold">Daftar Room</div>
          <div className="space-y-2 max-h-[70vh] overflow-auto">
            {rooms.map((r) => {
              const active = r.id === activeRoomId;
              return (
                <button
                  key={r.id}
                  onClick={() => setActiveRoomId(r.id)}
                  className={[
                    "w-full text-left rounded-xl2 border border-black/10 p-3",
                    active ? "bg-white shadow-sm" : "bg-white/60",
                  ].join(" ")}
                >
                  <div className="text-sm font-semibold break-all">{r.user_id}</div>
                  <div className="text-xs opacity-70 mt-1">
                    {new Date(r.created_at).toLocaleString("id-ID")}
                  </div>
                </button>
              );
            })}
            {rooms.length === 0 && <div className="text-sm opacity-70">Belum ada chat.</div>}
          </div>
        </div>

        {/* Chat */}
        <div className="card bg-nusantara-bone bg-batik-grid bg-batik-grid space-y-3">
          <div className="flex items-center justify-between">
            <div className="font-semibold">Percakapan</div>
            <div className="text-xs opacity-70">
              {activeRoomId ? `Room: ${activeRoomId.slice(0, 8)}…` : "Pilih room"}
            </div>
          </div>

          <div className="h-[70vh] lg:h-[560px] overflow-auto rounded-xl2 border border-black/10 bg-white/90 p-3">
            {msgs.length === 0 ? (
              <div className="text-sm opacity-70">Belum ada pesan / pilih room.</div>
            ) : (
              <div className="space-y-3">
                {msgs.map((m) => {
                  const mine = adminId && m.sender_id === adminId;
                  return (
                    <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                      <div
                        className={[
                          "max-w-[85%] rounded-2xl px-3 py-2 border border-black/10",
                          mine ? "bg-white shadow-sm" : "bg-white/80",
                        ].join(" ")}
                      >
                        <div className="text-[11px] opacity-60">{formatTimeJakarta(m.created_at)}</div>
                        <div className="text-sm whitespace-pre-wrap leading-relaxed">{m.message}</div>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <input
              className="input"
              placeholder="Balas sebagai admin…"
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={!activeRoomId || busy}
              onKeyDown={(e) => e.key === "Enter" && send()}
            />
            <button className="btn" disabled={!activeRoomId || busy} onClick={send}>
              {busy ? "..." : "Kirim"}
            </button>
          </div>

          {err && <div className="text-sm text-nusantara-batik">{err}</div>}
        </div>
      </div>
    </div>
  );
}
