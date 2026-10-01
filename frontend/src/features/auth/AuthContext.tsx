import { useEffect, useRef, useState, type ReactNode } from "react";
import { AuthContext } from "./auth-context";
import { setAccessToken } from "../../api/client";
import { refreshSession, logoutUser } from "../../api/auth";
import { updateProfile } from "../../api/profile";
import { browserTimeZone } from "../../lib/dates";

interface User {
    id: string;
    email: string;
    emailVerified: boolean;
    createdAt?: string;
    displayName?: string | null;
    timezone?: string | null;
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

    const updateUser = (patch: Partial<User>) => setUser((current) => (current ? { ...current, ...patch } : current));

    // Everyone gets a timezone without being asked: the first time a signed-in
    // user has none, save this browser's (they can change it on the profile page).
    const adopting = useRef(false);
    useEffect(() => {
        if (!token || !user || user.timezone || adopting.current) return;
        adopting.current = true;
        updateProfile({ timezone: browserTimeZone() })
            .then((fresh) => setUser((current) => (current ? { ...current, ...fresh } : current)))
            .catch(() => {
                /* try again next session; "due" just keeps using UTC meanwhile */
            });
    }, [token, user]);

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
        <AuthContext.Provider value={{ user, token, login, logout, updateUser, isAuthenticated: !!token, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
}
