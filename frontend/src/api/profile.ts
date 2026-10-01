import { client } from "./client";

export interface ProfileUser {
    id: string;
    email: string;
    createdAt: string;
    emailVerified: boolean;
    displayName: string | null;
    timezone: string | null;
}

export async function updateProfile(patch: { displayName?: string | null; timezone?: string }) {
    const res = await client.patch<ProfileUser>("/profile", patch);
    return res.data;
}

// The server ends every other session and starts a fresh one for this device.
export async function changePassword(currentPassword: string, newPassword: string) {
    const res = await client.post<{ accessToken: string }>("/profile/password", { currentPassword, newPassword });
    return res.data;
}

export async function deleteAccount(password: string, confirmEmail: string) {
    await client.delete("/profile", { data: { password, confirmEmail } });
}
