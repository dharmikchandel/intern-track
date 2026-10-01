import { client } from "./client";
import { type LoginFormData, type RegisterFormData } from "../lib/schemas";

interface AuthResponse {
    accessToken: string;
    user: {
        id: string;
        email: string;
        createdAt: string;
        emailVerified: boolean;
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

export async function requestPasswordReset(email: string) {
    const res = await client.post<{ message: string }>("/password-reset/request", { email });
    return res.data;
}

export async function confirmPasswordReset(token: string, password: string) {
    const res = await client.post<{ message: string }>("/password-reset/confirm", { token, password });
    return res.data;
}

export async function verifyEmail(token: string) {
    const res = await client.post<{ message: string }>("/email-verification/verify", { token });
    return res.data;
}

export async function resendVerificationEmail() {
    const res = await client.post<{ message: string }>("/email-verification/resend");
    return res.data;
}

// Ends every session for this account on every device (revokes all refresh tokens).
export async function logoutEverywhere() {
    await client.post("/auth/logout-all");
}
