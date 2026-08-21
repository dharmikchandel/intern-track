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
});

// Add auth token to requests
client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token.replace(/^Bearer\s+/i, "")}`;
    }
    return config;
});

// Handle 401 Unauthorized (optional: redirect to login)
client.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Clear token if invalid, but avoid infinite loops if already on login
            if (window.location.pathname !== "/login" && window.location.pathname !== "/register") {
                localStorage.removeItem("token");
                window.location.href = "/login";
            }
        }
        return Promise.reject(error);
    }
);
