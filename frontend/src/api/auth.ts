import { client } from "./client";
import { type LoginFormData, type RegisterFormData } from "../lib/schemas";

interface AuthResponse {
    accessToken: string;
    user: {
        id: string;
        email: string;
        createdAt: string;
    };
}

export async function loginUser(data: LoginFormData) {
    const res = await client.post<AuthResponse>("/auth/login", data);
    return res.data;
}

export async function registerUser(data: Omit<RegisterFormData, "confirmPassword">) {
    const res = await client.post<AuthResponse>("/auth/register", {
        email: data.email,
        password: data.password,
    });
    return res.data;
}

// Called on app load: the refresh token cookie (if any) rehydrates the
// session without the user having to log in again. A 401 here just means
// there's no valid session — not an error the caller needs to report.
export async function refreshSession() {
    const res = await client.post<AuthResponse>("/auth/refresh");
    return res.data;
}

export async function logoutUser() {
    await client.post("/auth/logout");
}
