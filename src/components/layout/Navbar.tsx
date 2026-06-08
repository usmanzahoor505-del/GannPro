import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { Button } from "@/components/ui/Button";

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-[#05070f]/80 backdrop-blur-2xl">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link to={user?.role === "admin" ? "/admin" : "/dashboard"} className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-white">
                <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="text-lg font-bold">GannPro9</span>
          </Link>

          <nav className="flex items-center gap-1">
            {user?.role === "user" && (
              <>
                <Link to="/dashboard" className="rounded-lg px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-white/5">Dashboard</Link>
                <Link to="/calculator" className="rounded-lg px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-white/5">Calculator</Link>
                <Link to="/subscribe" className="rounded-lg px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-white/5">Subscribe</Link>
                <NotificationBell />
              </>
            )}
            {user?.role === "admin" && (
              <>
                <Link to="/admin" className="rounded-lg px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-white/5">Dashboard</Link>
                <Link to="/admin/users" className="rounded-lg px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-white/5">Users</Link>
                <Link to="/admin/payments" className="rounded-lg px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-white/5">Payments</Link>
              </>
            )}
            <Button variant="ghost" onClick={handleLogout} className="ml-2">Logout</Button>
          </nav>
        </div>
      </div>
    </header>
  );
}
