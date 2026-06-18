import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { AdminLoginPage } from "@/pages/AdminLoginPage";

export function ProtectedRoute({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#05070f] flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
      </div>
    );
  }

  if (adminOnly) {
    if (!user || user.role !== "admin") {
      return <AdminLoginPage />;
    }
    return <>{children}</>;
  }

  if (!user) return <Navigate to="/login" replace />;
  if (user.role === "admin") return <Navigate to="/admin" replace />;

  return <>{children}</>;
}

