import { useQuery } from "@tanstack/react-query";
import { getMilestones } from "../../api/milestones";
import { localDay } from "../recap/format";

export function useMilestones() {
    const today = localDay();
    return useQuery({
        // Under ["analytics"] so the invalidation every application write
        // already does refreshes this too.
        queryKey: ["analytics", "milestones", today],
        queryFn: () => getMilestones(today),
    });
}
