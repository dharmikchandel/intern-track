import { createContext } from "react";

interface User {
    id: string;
    email: string;
    emailVerified: boolean;
    createdAt?: string;
    displayName?: string | null;
    timezone?: string | null;
}

export interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (token: string, user: User) => void;
    logout: () => void;
    // Merge fresh profile fields (name, timezone) into the signed-in user.
    updateUser: (patch: Partial<User>) => void;
    isAuthenticated: boolean;
    // True while the initial silent-refresh check (on app load) is in
    // flight — consumers like RequireAuth should wait for this before
    // deciding to redirect to /login, otherwise a valid session flashes
    // through a logged-out state on every page reload.
    isLoading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
