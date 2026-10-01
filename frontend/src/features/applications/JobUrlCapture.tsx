import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { Sparkles } from "lucide-react";
import { NeoButton } from "../../components/ui/NeoButton";
import { NeoInput } from "../../components/ui/NeoInput";
import { cn, getErrorMessage } from "../../lib/utils";
import { parseJobUrl, type ParsedJob } from "../../api/applications";

interface JobUrlCaptureProps {
    // Applies the parsed values to the form; returns which fields were filled
    // and which were left alone because the user had already typed something.
    onParsed: (job: ParsedJob) => { filled: string[]; kept: string[] };
}

const HEADLINE: Record<ParsedJob["confidence"], string> = {
    high: "Filled in from the job posting. Check it, then save.",
    medium: "Filled in, but please double-check the details.",
    low: "Best guess only. Check every field before saving.",
    none: "Couldn't find job details. Fill the form in yourself.",
};

// People often paste "boards.greenhouse.io/..." without the scheme.
function withScheme(input: string) {
    const trimmed = input.trim();
    return /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

export function JobUrlCapture({ onParsed }: JobUrlCaptureProps) {
    const [url, setUrl] = useState("");
    const [summary, setSummary] = useState<{ job: ParsedJob; filled: string[]; kept: string[] } | null>(null);

    const capture = useMutation({
        mutationFn: (value: string) => parseJobUrl(withScheme(value)),
        onSuccess: (job) => setSummary({ job, ...onParsed(job) }),
        onError: () => setSummary(null),
    });

    function run() {
        if (url.trim() === "" || capture.isPending) return;
        setSummary(null);
        capture.mutate(url);
    }

    const errorMessage = capture.isError
        ? isAxiosError(capture.error) && capture.error.response?.status === 429
            ? "You've looked up a lot of links. Try again in a while, or fill the form in by hand."
            : getErrorMessage(capture.error, "Couldn't look that link up. Fill the form in by hand.")
        : null;

    return (
        <div className="mb-8 border-2 border-black bg-neo-bg p-4 rounded-lg">
            <div className="flex items-center gap-2 font-black uppercase text-sm mb-2">
                <Sparkles className="w-4 h-4" /> Paste a job link to autofill
            </div>
            <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
                <NeoInput
                    aria-label="Job posting URL"
                    placeholder="https://boards.greenhouse.io/company/jobs/123"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    onKeyDown={(e) => {
                        // Enter runs the lookup; it must not submit the application form.
                        if (e.key === "Enter") {
                            e.preventDefault();
                            run();
                        }
                    }}
                />
                <NeoButton type="button" variant="ghost" onClick={run} disabled={capture.isPending || url.trim() === ""} className="shrink-0">
                    {capture.isPending ? "Reading..." : "Autofill"}
                </NeoButton>
            </div>

            {errorMessage && (
                <p role="alert" className="mt-3 font-bold text-neo-red-deep">
                    {errorMessage}
                </p>
            )}

            {summary && (
                <div
                    role="status"
                    className={cn(
                        "mt-3 border-2 border-black p-3 text-sm font-medium",
                        summary.job.confidence === "high" ? "bg-neo-mint" : "bg-neo-blue-tint"
                    )}
                >
                    <p className="font-bold">{HEADLINE[summary.job.confidence]}</p>
                    {summary.filled.length > 0 && <p>Filled: {summary.filled.join(", ")}.</p>}
                    {summary.kept.length > 0 && <p>Kept what you typed for: {summary.kept.join(", ")}.</p>}
                    {summary.job.warnings.length > 0 && (
                        <ul className="list-disc pl-5 mt-1">
                            {summary.job.warnings.map((w) => (
                                <li key={w}>{w}</li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
}
