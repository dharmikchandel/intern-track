import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { isAxiosError } from "axios";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// The backend always errors as { error: string } (see errorHandler + zod
// validation responses). This pulls that message out of an unknown catch
// value without resorting to `any`.
export function getErrorMessage(error: unknown, fallback: string): string {
    if (isAxiosError<{ error?: string }>(error)) {
        return error.response?.data?.error || fallback;
    }
    return fallback;
}
