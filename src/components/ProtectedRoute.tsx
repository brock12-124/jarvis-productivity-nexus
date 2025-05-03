
import { useEffect } from "react";
import { useNavigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

const ProtectedRoute = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Skip redirect if this appears to be an OAuth callback (has hash or code parameter)
    const hasAuthCallback = 
      location.hash.includes('access_token') || 
      location.search.includes('code=');
    
    if (!isLoading && !user && !hasAuthCallback) {
      navigate("/auth", { 
        state: { from: location.pathname },
        replace: true
      });
    }
  }, [user, isLoading, navigate, location]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 size={48} className="animate-spin text-jarvis-blue" />
      </div>
    );
  }

  return user ? <Outlet /> : null;
};

export default ProtectedRoute;
