import { useEffect, useState } from "react";
import { api, AdminUser } from "@/lib/api";
import { Navbar } from "@/components/layout/Navbar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/context/ToastContext";

export function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [notifyUser, setNotifyUser] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const { toast } = useToast();

  const load = () => api.adminUsers().then((d) => setUsers(d.users)).catch(() => {});

  useEffect(() => { load(); }, []);

  const handleDeactivate = async (id: string) => {
    await api.adminDeactivateUser(id);
    toast("User deactivated", "success");
    load();
  };

  const handleExtend = async (id: string) => {
    const months = prompt("Extend by how many months?", "1");
    if (!months) return;
    await api.adminExtendUser(id, parseInt(months));
    toast("Subscription extended", "success");
    load();
  };

  const handleNotify = async () => {
    if (!notifyUser || !message) return;
    await api.adminNotifyUser(notifyUser, message);
    toast("Notification sent", "success");
    setNotifyUser(null);
    setMessage("");
  };

  return (
    <div className="min-h-screen bg-[#05070f] text-white">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">User Management</h1>
        <div className="overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.03]">
                <th className="px-4 py-3 text-left text-slate-400 font-medium">Name</th>
                <th className="px-4 py-3 text-left text-slate-400 font-medium">Email</th>
                <th className="px-4 py-3 text-left text-slate-400 font-medium">Plan</th>
                <th className="px-4 py-3 text-left text-slate-400 font-medium">Status</th>
                <th className="px-4 py-3 text-left text-slate-400 font-medium">Trial End</th>
                <th className="px-4 py-3 text-left text-slate-400 font-medium">Sub Expiry</th>
                <th className="px-4 py-3 text-left text-slate-400 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const sub = u.subscription as Record<string, string> | null;
                return (
                  <tr key={u.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="px-4 py-3 font-medium">{u.name}</td>
                    <td className="px-4 py-3 text-slate-400">{u.email}</td>
                    <td className="px-4 py-3 capitalize">{sub?.plan || "—"}</td>
                    <td className="px-4 py-3">
                      <Badge status={sub?.status || (u.is_active ? "active" : "cancelled")} />
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      {sub?.trial_end ? new Date(sub.trial_end).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      {sub?.sub_end ? new Date(sub.sub_end).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 flex-wrap">
                        <Button variant="ghost" className="text-xs px-2 py-1" onClick={() => handleExtend(u.id)}>Extend</Button>
                        <Button variant="ghost" className="text-xs px-2 py-1" onClick={() => setNotifyUser(u.id)}>Notify</Button>
                        <Button variant="danger" className="text-xs px-2 py-1" onClick={() => handleDeactivate(u.id)}>Cancel</Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {notifyUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0b1120] p-6">
              <h3 className="font-bold mb-4">Send Custom Notification</h3>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full rounded-xl bg-[#05070f] border border-white/10 p-3 text-sm outline-none h-24"
                placeholder="Your message..."
              />
              <div className="flex gap-2 mt-4">
                <Button onClick={handleNotify}>Send</Button>
                <Button variant="ghost" onClick={() => setNotifyUser(null)}>Cancel</Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
