"use client";

import { useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

type Svc = {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  cover_url: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
};

type FormState = {
  title: string;
  slug: string;
  description: string;
  price: number;
  is_active: boolean;
};

const BUCKET = "service-covers";

function rupiah(n: number) {
  return `Rp ${Number(n || 0).toLocaleString("id-ID")}`;
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function extFromFile(file: File) {
  const p = file.name.split(".").pop()?.toLowerCase();
  return p && ["png", "jpg", "jpeg", "webp"].includes(p) ? p : "jpg";
}

export default function AdminServicesClient({ initial }: { initial: Svc[] }) {
  const supabase = useMemo(() => supabaseBrowser(), []);
  const [list, setList] = useState<Svc[]>(initial);

  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [form, setForm] = useState<FormState>({
    title: "",
    slug: "",
    description: "",
    price: 0,
    is_active: true,
  });

  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  const [editing, setEditing] = useState<Svc | null>(null);
  const [editForm, setEditForm] = useState<FormState | null>(null);
  const [editCoverFile, setEditCoverFile] = useState<File | null>(null);
  const [editCoverPreview, setEditCoverPreview] = useState<string | null>(null);

  function pickCreateCover(file: File | null) {
    setCoverFile(file);
    setCoverPreview(file ? URL.createObjectURL(file) : null);
  }

  function pickEditCover(file: File | null) {
    setEditCoverFile(file);
    setEditCoverPreview(file ? URL.createObjectURL(file) : null);
  }

  async function uploadCover(serviceId: string, file: File) {
    const ext = extFromFile(file);
    const path = `services/${serviceId}/${Date.now()}.${ext}`;

    const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
      upsert: true,
      cacheControl: "3600",
      contentType: file.type || "image/jpeg",
    });
    if (error) throw new Error(`Upload cover gagal: ${error.message}`);

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return data.publicUrl;
  }

  async function create() {
    setMsg(null);
    const title = form.title.trim();
    if (!title) return setMsg("Title wajib diisi.");

    const slug = (form.slug || slugify(title)).trim();
    if (!slug) return setMsg("Slug wajib diisi.");

    setBusy(true);
    try {
      const { data, error } = await supabase
        .from("services")
        .insert({
          title,
          slug,
          description: form.description,
          price: Number(form.price || 0),
          is_active: form.is_active,
        })
        .select("*")
        .single();

      if (error) throw new Error(error.message);

      let created = data as Svc;

      if (coverFile) {
        const url = await uploadCover(created.id, coverFile);
        const { data: u2, error: e2 } = await supabase
          .from("services")
          .update({ cover_url: url })
          .eq("id", created.id)
          .select("*")
          .single();
        if (e2) throw new Error(e2.message);
        created = u2 as Svc;
      }

      setList([created, ...list]);
      setForm({ title: "", slug: "", description: "", price: 0, is_active: true });
      pickCreateCover(null);
      setMsg("Service berhasil dibuat.");
    } catch (e: any) {
      setMsg(e.message);
    } finally {
      setBusy(false);
    }
  }

  function startEdit(s: Svc) {
    setMsg(null);
    setEditing(s);
    setEditForm({
      title: s.title,
      slug: s.slug,
      description: s.description,
      price: Number(s.price || 0),
      is_active: s.is_active,
    });
    setEditCoverFile(null);
    setEditCoverPreview(null);
  }

  function closeEdit() {
    setEditing(null);
    setEditForm(null);
    setEditCoverFile(null);
    setEditCoverPreview(null);
  }

  async function saveEdit() {
    if (!editing || !editForm) return;

    setMsg(null);
    setBusy(true);
    try {
      const title = editForm.title.trim();
      if (!title) throw new Error("Title wajib diisi.");

      const slug = (editForm.slug || slugify(title)).trim();
      if (!slug) throw new Error("Slug wajib diisi.");

      let cover_url = editing.cover_url;
      if (editCoverFile) cover_url = await uploadCover(editing.id, editCoverFile);

      const { data, error } = await supabase
        .from("services")
        .update({
          title,
          slug,
          description: editForm.description,
          price: Number(editForm.price || 0),
          is_active: editForm.is_active,
          cover_url,
        })
        .eq("id", editing.id)
        .select("*")
        .single();

      if (error) throw new Error(error.message);

      setList(list.map((x) => (x.id === editing.id ? (data as Svc) : x)));
      closeEdit();
      setMsg("Service berhasil diupdate.");
    } catch (e: any) {
      setMsg(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function toggle(id: string, val: boolean) {
    setMsg(null);
    const { error } = await supabase.from("services").update({ is_active: val }).eq("id", id);
    if (error) return setMsg(error.message);
    setList(list.map((s) => (s.id === id ? { ...s, is_active: val } : s)));
  }

  async function del(id: string) {
    setMsg(null);
    if (!confirm("Hapus service ini?")) return;
    const { error } = await supabase.from("services").delete().eq("id", id);
    if (error) return setMsg(error.message);
    setList(list.filter((s) => s.id !== id));
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="text-2xl font-semibold tracking-wide">Admin • Services</div>
        <div className="text-sm opacity-70">Tambah, edit, upload cover, dan atur status.</div>
      </div>

      {msg && (
        <div className="rounded-xl2 border border-black/10 bg-white/80 p-3">
          <div className="text-sm text-nusantara-batik">{msg}</div>
        </div>
      )}

      {/* ✅ MOBILE-FIRST: 1 kolom dulu, desktop 2 kolom */}
      <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-4">
        {/* Create */}
        <div className="card bg-nusantara-bone bg-batik-grid bg-batik-grid space-y-3">
          <div className="flex items-center justify-between">
            <div className="font-semibold">Tambah Service</div>
            <span className="badge">Nusantara</span>
          </div>

          <div className="rounded-xl2 border border-black/10 bg-white/90 p-3">
            <div className="text-sm font-semibold">Cover gambar</div>
            <div className="text-xs opacity-70 mt-1">PNG/JPG/WEBP • disarankan landscape.</div>

            <div className="mt-3 flex gap-3 items-center">
              <div className="h-[72px] w-[96px] rounded-xl2 border border-black/10 bg-white overflow-hidden flex items-center justify-center shrink-0">
                {coverPreview ? (
                  <img src={coverPreview} alt="preview" className="h-full w-full object-cover" />
                ) : (
                  <div className="text-[11px] opacity-60 text-center px-2">Preview</div>
                )}
              </div>

              <div className="min-w-0 flex-1 space-y-2">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(e) => pickCreateCover(e.target.files?.[0] || null)}
                />
                {coverFile && (
                  <button className="btn-ghost" type="button" onClick={() => pickCreateCover(null)}>
                    Hapus gambar
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-semibold">Judul</div>
            <input
              className="input"
              placeholder="Contoh: Edit Video Cinematic"
              value={form.title}
              onChange={(e) => {
                const title = e.target.value;
                setForm((p) => ({ ...p, title, slug: p.slug ? p.slug : slugify(title) }));
              }}
            />
          </div>

          <div className="space-y-2">
            <div className="text-sm font-semibold">Slug</div>
            <input
              className="input"
              placeholder="edit-video-cinematic"
              value={form.slug}
              onChange={(e) => setForm((p) => ({ ...p, slug: slugify(e.target.value) }))}
            />
            <div className="text-xs opacity-70">Tanpa spasi, otomatis rapi.</div>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-semibold">Deskripsi</div>
            <textarea
              className="input h-28"
              placeholder="Benefit, revisi, durasi, dll…"
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="space-y-2">
              <div className="text-sm font-semibold">Harga</div>
              <input
                className="input"
                type="number"
                value={form.price}
                onChange={(e) => setForm((p) => ({ ...p, price: Number(e.target.value) }))}
              />
            </div>

            <div className="space-y-2">
              <div className="text-sm font-semibold">Status</div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))}
                />
                Aktif
              </label>
            </div>
          </div>

          <button className="btn w-full" disabled={busy} onClick={create}>
            {busy ? "Memproses…" : "Buat Service"}
          </button>
        </div>

        {/* List */}
        <div className="card space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="font-semibold">Daftar Services</div>
            <div className="text-xs opacity-70">{list.length} item</div>
          </div>

          {/* ✅ MOBILE: list jadi 1 kolom; desktop grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {list.map((s) => (
              <div key={s.id} className="rounded-xl2 border border-black/10 bg-white overflow-hidden">
                <div className="h-32 border-b border-black/10 bg-white overflow-hidden">
                  {s.cover_url ? (
                    <img src={s.cover_url} alt={s.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-xs opacity-60">
                      Tidak ada cover
                    </div>
                  )}
                </div>

                <div className="p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-semibold leading-tight truncate">{s.title}</div>
                      <div className="text-xs opacity-70 truncate">{s.slug}</div>
                    </div>
                    <span className="badge">{s.is_active ? "Aktif" : "Nonaktif"}</span>
                  </div>

                  <div className="text-sm font-semibold">{rupiah(s.price)}</div>

                  {s.description && (
                    <div className="text-xs opacity-70 line-clamp-3">{s.description}</div>
                  )}

                  {/* ✅ MOBILE: tombol jadi 2 baris rapi */}
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <button className="btn-ghost w-full" onClick={() => startEdit(s)}>
                      Edit
                    </button>
                    <button className="btn-ghost w-full" onClick={() => toggle(s.id, !s.is_active)}>
                      {s.is_active ? "Nonaktif" : "Aktifkan"}
                    </button>
                    <button className="btn-ghost w-full col-span-2" onClick={() => del(s.id)}>
                      Hapus
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {!list.length && <div className="text-sm opacity-70">Belum ada service.</div>}
          </div>
        </div>
      </div>

      {/* ✅ EDIT: Mobile jadi full-screen bottom sheet */}
      {editing && editForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center">
          <div className="w-full sm:max-w-2xl bg-white rounded-t-2xl sm:rounded-2xl border border-black/10 overflow-hidden max-h-[92vh] overflow-y-auto">
            <div className="p-4 border-b border-black/10 flex items-center justify-between">
              <div>
                <div className="font-semibold">Edit Service</div>
                <div className="text-xs opacity-70">{editing.id}</div>
              </div>
              <button className="btn-ghost" onClick={closeEdit}>
                Tutup
              </button>
            </div>

            <div className="p-4 space-y-3">
              <div className="rounded-xl2 border border-black/10 bg-white p-3">
                <div className="text-sm font-semibold">Cover</div>
                <div className="text-xs opacity-70 mt-1">Upload untuk mengganti cover.</div>

                <div className="mt-3 flex gap-3 items-center">
                  <div className="h-[72px] w-[96px] rounded-xl2 border border-black/10 overflow-hidden bg-white shrink-0">
                    {(editCoverPreview || editing.cover_url) ? (
                      <img
                        src={editCoverPreview || editing.cover_url!}
                        alt="cover"
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src =
                            "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200'%3E%3Crect width='100%25' height='100%25' fill='%23f2f2f2'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23666' font-size='14'%3ECover%3C/text%3E%3C/svg%3E";
                        }}
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-[11px] opacity-60">
                        Belum ada cover
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1 space-y-2">
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={(e) => pickEditCover(e.target.files?.[0] || null)}
                    />
                    {editCoverFile && (
                      <button className="btn-ghost" type="button" onClick={() => pickEditCover(null)}>
                        Batal ganti gambar
                      </button>
                    )}
                    <div className="text-xs opacity-70">
                      Bucket: <b>{BUCKET}</b>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <div className="text-sm font-semibold">Judul</div>
                  <input
                    className="input"
                    value={editForm.title}
                    onChange={(e) => setEditForm((p) => p && ({ ...p, title: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-semibold">Slug</div>
                  <input
                    className="input"
                    value={editForm.slug}
                    onChange={(e) => setEditForm((p) => p && ({ ...p, slug: slugify(e.target.value) }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-semibold">Deskripsi</div>
                <textarea
                  className="input h-28"
                  value={editForm.description}
                  onChange={(e) => setEditForm((p) => p && ({ ...p, description: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <div className="text-sm font-semibold">Harga</div>
                  <input
                    className="input"
                    type="number"
                    value={editForm.price}
                    onChange={(e) => setEditForm((p) => p && ({ ...p, price: Number(e.target.value) }))}
                  />
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-semibold">Status</div>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={editForm.is_active}
                      onChange={(e) => setEditForm((p) => p && ({ ...p, is_active: e.target.checked }))}
                    />
                    Aktif
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                <button className="btn w-full" disabled={busy} onClick={saveEdit}>
                  {busy ? "Menyimpan…" : "Simpan"}
                </button>
                <button className="btn-ghost w-full" onClick={closeEdit}>
                  Batal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
