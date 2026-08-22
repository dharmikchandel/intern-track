import axios, { type InternalAxiosRequestConfig } from "axios";

// import.meta.env.PROD is set automatically by Vite (true for `vite build`,
// false for `vite dev`) — no manual env var to keep in sync and no risk of
// a stale local .env silently pointing dev at the production API.
const API_URL = import.meta.env.PROD ? import.meta.env.VITE_API_URL_PROD : "http://localhost:3000/api/v1";

export const client = axios.create({
    baseURL: API_URL,
    headers: {
        "Content-Type": "application/json",
    },
    // The refresh token lives in an httpOnly cookie set by the backend —
    // the browser needs this to send/accept it, since frontend and backend
    // are different origins in production.
    withCredentials: true,
});

// The access token lives in memory only (never localStorage) so it isn't
// readable by an XSS payload the way a persisted token would be. AuthContext
// is the only writer; this module just holds the value axios needs.
let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
    accessToken = token;
}

client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
});

// Silent refresh: on a 401 (expired access token), use the httpOnly refresh
// cookie to get a new one and retry the original request once. Concurrent
// 401s share a single in-flight refresh call instead of each firing their
// own — a burst of requests right after expiry shouldn't race the backend
// into rotating the refresh token multiple times.
let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
    if (!refreshPromise) {
        refreshPromise = client
            .post<{ accessToken: string }>("/auth/refresh")
            .then((res) => {
                accessToken = res.data.accessToken;
                return res.data.accessToken;
            })
            .finally(() => {
                refreshPromise = null;
            });
    }
    return refreshPromise;
}

client.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config as (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined;
        const isAuthRoute = originalRequest?.url?.includes("/auth/");

        if (error.response?.status === 401 && originalRequest && !originalRequest._retried && !isAuthRoute) {
            originalRequest._retried = true;
            try {
                const newToken = await refreshAccessToken();
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                return client(originalRequest);
            } catch {
                accessToken = null;
                if (window.location.pathname !== "/login" && window.location.pathname !== "/register") {
                    window.location.href = "/login";
                }
                return Promise.reject(error);
            }
        }

        return Promise.reject(error);
    }
);
