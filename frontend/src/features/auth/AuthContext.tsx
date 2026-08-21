import { useState, type ReactNode } from "react";
import { AuthContext } from "./auth-context";

interface User {
    id: string;
    email: string;
}

function readStoredUser(): User | null {
    try {
        const stored = localStorage.getItem("user");
        return stored ? JSON.parse(stored) : null;
    } catch {
        return null;
    }
}

export function AuthProvider({ children }: { children: ReactNode }) {
    // Read localStorage directly during the initial render (lazy initial
    // state) instead of in a useEffect — avoids an extra render on every
    // app load just to hydrate session state that's already available.
    const [token, setToken] = useState<string | null>(() => localStorage.getItem("token"));
    const [user, setUser] = useState<User | null>(() => (token ? readStoredUser() : null));

    const login = (newToken: string, newUser: User) => {
        localStorage.setItem("token", newToken);
        localStorage.setItem("user", JSON.stringify(newUser));
        setToken(newToken);
        setUser(newUser);
    };

    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setToken(null);
        setUser(null);
    };

    // Sync token to axios client is handled in client.ts, but we keep state here for UI

    return (
        <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!token }}>
            {children}
        </AuthContext.Provider>
    );
}
