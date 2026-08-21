import { useContext } from "react";
import { AuthContext } from "./auth-context";

// Split into its own file (rather than colocated in AuthContext.tsx) so that
// file only exports the AuthProvider component — Vite's Fast Refresh needs
// a component-only file to hot-reload it without a full page reload.
export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
