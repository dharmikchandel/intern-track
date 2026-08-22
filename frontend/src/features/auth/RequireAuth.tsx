import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./useAuth";

export function RequireAuth() {
    const { isAuthenticated, isLoading } = useAuth();
    const location = useLocation();

    // Session state isn't known synchronously anymore — it comes back from
    // the silent-refresh call on app load. Redirecting before that resolves
    // would bounce an already-logged-in user to /login on every page reload.
    if (isLoading) {
        return null;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return <Outlet />;
}
