import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { Button } from "@/components/ui/Button";

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-[#05070f]/85 backdrop-blur-2xl">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-white">
                <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="text-lg font-bold">GannPro9</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            <Link to="/" className="rounded-lg px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-white/5">Home</Link>
            
            {user ? (
              // Authenticated Navigation
              <>
                {user.role === "user" && (
                  <>
                    <Link to="/dashboard" className="rounded-lg px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-white/5">Dashboard</Link>
                    <Link to="/calculator" className="rounded-lg px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-white/5">Calculator</Link>
                    <Link to="/intraday-calculator" className="rounded-lg px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-white/5">Intraday Calculator</Link>
                    <Link to="/subscribe" className="rounded-lg px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-white/5">Subscribe</Link>
                  </>
                )}
                {user.role === "admin" && (
                  <>
                    <Link to="/admin" className="rounded-lg px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-white/5">Dashboard</Link>
                    <Link to="/admin/users" className="rounded-lg px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-white/5">Users</Link>
                    <Link to="/admin/payments" className="rounded-lg px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-white/5">Payments</Link>
                  </>
                )}
                
                <Link to="/contact" className="rounded-lg px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-white/5">Contact</Link>
                <Link to="/privacy" className="rounded-lg px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-white/5">Privacy & Policies</Link>
                
                {user.role === "user" && <NotificationBell />}
                <Button variant="ghost" onClick={handleLogout} className="ml-2">Logout</Button>
              </>
            ) : (
              // Guest Navigation
              <>
                <Link to="/contact" className="rounded-lg px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-white/5">Contact</Link>
                <Link to="/privacy" className="rounded-lg px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-white/5">Privacy & Policies</Link>
                
                <Link to="/login" className="ml-4 rounded-lg px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-white/5">Sign In</Link>
                <Link to="/register">
                  <Button className="ml-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-xs py-1.5 px-3">
                    Start Free Trial
                  </Button>
                </Link>
              </>
            )}
          </nav>

          {/* Mobile Right Icons (Notification + Burger) */}
          <div className="flex items-center gap-3 md:hidden">
            {user && user.role === "user" && <NotificationBell />}
            
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Toggle menu"
            >
              {isOpen ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer/Dropdown */}
      {isOpen && (
        <div className="md:hidden border-t border-white/5 bg-[#05070f]/95 px-4 py-4 space-y-3">
          <Link 
            to="/" 
            onClick={() => setIsOpen(false)}
            className="block rounded-lg px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
          >
            Home
          </Link>
          
          {user ? (
            // Authenticated Mobile Drawer
            <div className="flex flex-col gap-2">
              {user.role === "user" && (
                <>
                  <Link 
                    to="/dashboard" 
                    onClick={() => setIsOpen(false)}
                    className="rounded-lg px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    Dashboard
                  </Link>
                  <Link 
                    to="/calculator" 
                    onClick={() => setIsOpen(false)}
                    className="rounded-lg px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    Calculator
                  </Link>
                  <Link 
                    to="/intraday-calculator" 
                    onClick={() => setIsOpen(false)}
                    className="rounded-lg px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    Intraday Calculator
                  </Link>
                  <Link 
                    to="/subscribe" 
                    onClick={() => setIsOpen(false)}
                    className="rounded-lg px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    Subscribe
                  </Link>
                </>
              )}
              {user.role === "admin" && (
                <>
                  <Link 
                    to="/admin" 
                    onClick={() => setIsOpen(false)}
                    className="rounded-lg px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    Dashboard
                  </Link>
                  <Link 
                    to="/admin/users" 
                    onClick={() => setIsOpen(false)}
                    className="rounded-lg px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    Users
                  </Link>
                  <Link 
                    to="/admin/payments" 
                    onClick={() => setIsOpen(false)}
                    className="rounded-lg px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    Payments
                  </Link>
                </>
              )}
              
              <Link 
                to="/contact" 
                onClick={() => setIsOpen(false)}
                className="rounded-lg px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
              >
                Contact
              </Link>
              <Link 
                to="/privacy" 
                onClick={() => setIsOpen(false)}
                className="rounded-lg px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
              >
                Privacy & Policies
              </Link>

              <div className="pt-2 border-t border-white/5">
                <Button variant="ghost" onClick={handleLogout} className="w-full justify-center text-sm py-2">
                  Logout
                </Button>
              </div>
            </div>
          ) : (
            // Guest Mobile Drawer
            <div className="flex flex-col gap-2">
              <Link 
                to="/contact" 
                onClick={() => setIsOpen(false)}
                className="rounded-lg px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
              >
                Contact
              </Link>
              <Link 
                to="/privacy" 
                onClick={() => setIsOpen(false)}
                className="rounded-lg px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
              >
                Privacy & Policies
              </Link>

              <div className="pt-2 border-t border-white/5 flex flex-col gap-2">
                <Link 
                  to="/login" 
                  onClick={() => setIsOpen(false)}
                  className="block text-center rounded-lg px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
                >
                  Sign In
                </Link>
                <Link 
                  to="/register" 
                  onClick={() => setIsOpen(false)}
                  className="block text-center rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors"
                >
                  Start Free Trial
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
