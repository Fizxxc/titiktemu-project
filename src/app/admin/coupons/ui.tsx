"use client";
import { useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

type Coupon = any;

export default function AdminCouponsClient({ initial }: { initial: Coupon[] }) {
  const supabase = useMemo(() => supabaseBrowser(), []);
  const [list, setList] = useState(initial);
  const [msg, setMsg] = useState<string|null>(null);

  const [form, setForm] = useState({
    code: "",
    type: "percent",
    value: 10,
    min_order: 0,
    max_discount: null as number | null,
    usage_limit: null as number | null,
    is_active: true,
  });

  async function create() {
    setMsg(null);
    const payload = { ...form, code: form.code.trim().toUpperCase() };
    const { data, error } = await supabase.from("coupons").insert(payload).select("*").single();
    if (error) return setMsg(error.message);
    setList([data, ...list]);
    setForm({ code:"", type:"percent", value:10, min_order:0, max_discount:null, usage_limit:null, is_active:true });
  }

  async function toggle(id: string, is_active: boolean) {
    const { error } = await supabase.from("coupons").update({ is_active }).eq("id", id);
    if (error) return setMsg(error.message);
    setList(list.map(c => c.id===id ? { ...c, is_active } : c));
  }

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div className="card space-y-3">
        <div className="font-semibold">Buat Kupon</div>
        <input className="input" placeholder="CODE (mis: NUSA10)" value={form.code} onChange={e=>setForm({...form,code:e.target.value})} />
        <select className="input" value={form.type} onChange={e=>setForm({...form,type:e.target.value})}>
          <option value="percent">Percent (%)</option>
          <option value="fixed">Fixed (Rp)</option>
        </select>
        <input className="input" type="number" placeholder="Value" value={form.value} onChange={e=>setForm({...form,value:Number(e.target.value)})} />
        <input className="input" type="number" placeholder="Min order (Rp)" value={form.min_order} onChange={e=>setForm({...form,min_order:Number(e.target.value)})} />
        <input className="input" type="number" placeholder="Max discount (optional)" value={form.max_discount ?? ""} onChange={e=>setForm({...form,max_discount: e.target.value===""?null:Number(e.target.value)})} />
        <input className="input" type="number" placeholder="Usage limit (optional)" value={form.usage_limit ?? ""} onChange={e=>setForm({...form,usage_limit: e.target.value===""?null:Number(e.target.value)})} />
        <label className="text-sm flex items-center gap-2">
          <input type="checkbox" checked={form.is_active} onChange={e=>setForm({...form,is_active:e.target.checked})} />
          Active
        </label>
        <button className="btn" onClick={create}>Create</button>
        {msg && <div className="text-sm text-nusantara-batik">{msg}</div>}
      </div>

      <div className="card">
        <div className="font-semibold">Daftar Kupon</div>
        <div className="mt-3 space-y-2">
          {list.map(c => (
            <div key={c.id} className="border-b border-black/10 pb-2 flex items-center justify-between">
              <div>
                <div className="font-semibold">{c.code}</div>
                <div className="text-xs opacity-70">
                  {c.type} • {c.type==="percent" ? `${c.value}%` : `Rp ${Number(c.value).toLocaleString("id-ID")}`}
                  {" "}• min Rp {Number(c.min_order).toLocaleString("id-ID")}
                  {c.usage_limit ? ` • limit ${c.usage_limit}` : ""}
                </div>
              </div>
              <button className="btn-ghost" onClick={()=>toggle(c.id, !c.is_active)}>
                {c.is_active ? "Nonaktif" : "Aktifkan"}
              </button>
            </div>
          ))}
          {!list.length && <div className="text-sm opacity-70">Belum ada kupon.</div>}
        </div>
      </div>
    </div>
  );
}
