import { useEffect, useState, type ReactNode } from "react";
import { AuthContext } from "./auth-context";
import { setAccessToken } from "../../api/client";
import { refreshSession, logoutUser } from "../../api/auth";

interface User {
    id: string;
    email: string;
    emailVerified: boolean;
    createdAt?: string;
}

export function AuthProvider({ children }: { children: ReactNode }) {
    // No localStorage: the access token lives only in memory (see
    // api/client.ts) and the refresh token is an httpOnly cookie neither
    // this component nor any other JS on the page can read. On mount we
    // trade that cookie for a fresh access token to rehydrate the session.
    const [token, setToken] = useState<string | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        refreshSession()
            .then(({ accessToken, user }) => {
                if (cancelled) return;
                setAccessToken(accessToken);
                setToken(accessToken);
                setUser(user);
            })
            .catch(() => {
                // No valid refresh cookie — that's just "logged out", not an error.
            })
            .finally(() => {
                if (!cancelled) setIsLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, []);

    const login = (newToken: string, newUser: User) => {
        setAccessToken(newToken);
        setToken(newToken);
        setUser(newUser);
    };

    const logout = () => {
        setAccessToken(null);
        setToken(null);
        setUser(null);
        // Fire and forget: the UI should log the user out immediately
        // regardless of whether the network call to revoke the refresh
        // token on the server succeeds.
        logoutUser().catch(() => {});
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!token, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
}
