import { browserTimeZone } from "../../lib/dates";
import { useAuth } from "./useAuth";

// The user's saved timezone, or this browser's until one is saved.
export function useTimeZone(): string {
    const { user } = useAuth();
    return user?.timezone ?? browserTimeZone();
}
