import { format } from "date-fns";
import { BadgeCheck, Flame } from "lucide-react";
import { cn } from "../../lib/utils";

interface ProfileHeroProps {
    name: string;
    email: string;
    verified: boolean;
    memberSince?: string;
    streak?: number;
}

// The identity block that opens the profile: a Signal Blue panel with the
// avatar, the name, and a few facts as chips.
export function ProfileHero({ name, email, verified, memberSince, streak }: ProfileHeroProps) {
    const chip = "inline-flex items-center gap-1.5 px-2.5 py-1 border-2 border-black rounded-md text-sm font-bold";
    return (
        <div className="bg-neo-primary border-2 border-black rounded-lg shadow-neo p-6 md:p-8 mb-8 flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
            <div className="w-20 h-20 shrink-0 rounded-full bg-white border-2 border-black shadow-neo-sm flex items-center justify-center text-4xl font-black" aria-hidden>
                {name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
                <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter break-words">{name}</h1>
                <p className="font-bold break-all">{email}</p>
                <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-4">
                    <span className={cn(chip, verified ? "bg-neo-mint" : "bg-neo-blue-tint")}>
                        {verified && <BadgeCheck className="w-4 h-4" aria-hidden />}
                        {verified ? "Verified" : "Not verified"}
                    </span>
                    {memberSince && <span className={cn(chip, "bg-white")}>Member since {format(new Date(memberSince), "MMM yyyy")}</span>}
                    {streak !== undefined && streak > 0 && (
                        <span className={cn(chip, "bg-white")}>
                            <Flame className="w-4 h-4 text-neo-primary" aria-hidden /> {streak}-day streak
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}
