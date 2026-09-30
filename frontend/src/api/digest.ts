import { client } from "./client";

export async function getDigestPreferences() {
    const res = await client.get<{ emailDigestEnabled: boolean }>("/digest/preferences");
    return res.data;
}

export async function setDigestPreferences(emailDigestEnabled: boolean) {
    const res = await client.patch<{ emailDigestEnabled: boolean }>("/digest/preferences", { emailDigestEnabled });
    return res.data;
}

// Public: the token in the email link is the credential, no session needed.
export async function unsubscribeFromDigest(token: string) {
    await client.post("/digest/unsubscribe", { token });
}
