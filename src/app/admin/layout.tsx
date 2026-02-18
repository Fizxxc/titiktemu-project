import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <div className="card flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="badge">Admin</div>
          <div className="text-2xl font-semibold mt-2">Dashboard</div>
        </div>
        <div className="flex gap-2">
          <Link className="btn-ghost" href="/admin/services">Services</Link>
          <Link className="btn-ghost" href="/admin/coupons">Coupons</Link>
          <Link className="btn-ghost" href="/admin/orders">Orders</Link>
          <Link className="btn-ghost" href="/admin/chat">Chats</Link>
        </div>
      </div>
      {children}
    </div>
  );
}
