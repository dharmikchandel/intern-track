import { client } from "./client";
import { type LoginFormData, type RegisterFormData } from "../lib/schemas";

interface AuthResponse {
    accessToken: string;
    refreshToken: string;
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
