import { useQuery } from "@tanstack/react-query";
import { listApplications } from "../../api/applications";

// Overdue count comes from the existing list endpoint (limit 1, we only want
// meta.total), so there is no dedicated endpoint to keep in sync with the
// "needs follow-up" rule. The dashboard reads it so its whole first screen
// loads in one phase and the follow-up card never pops in and shifts the page.
export function useFollowUpCount() {
    return useQuery({
        queryKey: ["applications", "follow-up-count"],
        queryFn: () => listApplications({ needsFollowUp: true, limit: 1 }),
        select: (res) => res.meta.total,
    });
}
