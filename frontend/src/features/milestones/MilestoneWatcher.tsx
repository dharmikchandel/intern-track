import { useEffect, useRef } from "react";
import { Award, Flame } from "lucide-react";
import type { MilestoneId } from "../../api/milestones";
import { notify } from "../../lib/toast";
import { useAuth } from "../auth/useAuth";
import { MILESTONE_TITLES, newlyAchieved } from "./milestoneMeta";
import { useMilestones } from "./useMilestones";

const storageKey = (userId: string) => `interntrack:celebrated:${userId}`;

function readCelebrated(userId: string): Set<MilestoneId> {
    try {
        const raw: unknown = JSON.parse(localStorage.getItem(storageKey(userId)) ?? "[]");
        return new Set(Array.isArray(raw) ? (raw.filter((id) => typeof id === "string" && id in MILESTONE_TITLES) as MilestoneId[]) : []);
    } catch {
        return new Set();
    }
}

function writeCelebrated(userId: string, ids: Set<MilestoneId>) {
    try {
        localStorage.setItem(storageKey(userId), JSON.stringify([...ids]));
    } catch {
        /* without storage a milestone may be celebrated again after a reload; harmless */
    }
}

// Mounted once in the signed-in layout. Every application write already invalidates the
// milestones query, so this sees the new numbers a moment after the write and toasts the
// milestones it unlocked. The first result it sees is only a baseline.
export function MilestoneWatcher() {
    const { user } = useAuth();
    const { data } = useMilestones();
    const seen = useRef<Set<MilestoneId> | null>(null);

    useEffect(() => {
        if (!data || !user) return;
        const fresh = newlyAchieved(seen.current, data.milestones, readCelebrated(user.id));
        seen.current = new Set(data.milestones.filter((m) => m.achieved).map((m) => m.id));
        if (fresh.length === 0) return;

        writeCelebrated(user.id, new Set([...readCelebrated(user.id), ...fresh]));
        const titles = fresh.map((id) => MILESTONE_TITLES[id]);
        notify.milestone(titles.join(", "), {
            id: "milestone",
            kicker: fresh.length === 1 ? "Milestone unlocked" : `${fresh.length} milestones unlocked`,
            icon: fresh.length === 1 && fresh[0] === "streak_5" ? Flame : Award,
            action: { label: "See all", to: "/profile" },
        });
    }, [data, user]);

    return null;
}
