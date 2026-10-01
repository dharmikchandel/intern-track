import { Link } from "react-router-dom";
import { BellRing } from "lucide-react";
import { NeoCard } from "../../components/ui/NeoCard";

// Only rendered when something needs a follow-up: it is a call to action, so
// when there is nothing to do the dashboard shows nothing (the subtitle says
// "all caught up"). The reminder email setting lives on the profile page.
export function FollowUpCard({ overdue }: { overdue: number }) {
    return (
        <NeoCard className="mb-8 flex items-center gap-4">
            <BellRing className="w-8 h-8 text-neo-red-deep shrink-0" aria-hidden />
            <div>
                <p className="text-xl font-black text-neo-red-deep">
                    {overdue} {overdue === 1 ? "application needs" : "applications need"} a follow-up
                </p>
                <Link to="/applications?followUp=1" className="inline-flex items-center min-h-11 font-bold ui-link">
                    Review them
                </Link>
            </div>
        </NeoCard>
    );
}
