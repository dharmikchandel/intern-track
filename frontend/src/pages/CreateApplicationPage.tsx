import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { NeoCard } from "../components/ui/NeoCard";
import { NeoInput } from "../components/ui/NeoInput";
import { NeoButton } from "../components/ui/NeoButton";
import { type CreateApplicationFormData, createApplicationSchema } from "../lib/schemas";
import { createApplication, type ParsedJob } from "../api/applications";
import { JobUrlCapture } from "../features/applications/JobUrlCapture";
import { ArrowLeft } from "lucide-react";
import { localDay } from "../features/recap/format";
import { STATUS_LABELS, STATUS_ORDER } from "../features/applications/statusMeta";
import { useRef } from "react";
import { Link } from "react-router-dom";

export function CreateApplicationPage() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const {
        register,
        handleSubmit,
        getValues,
        setValue,
        formState: { errors },
    } = useForm<CreateApplicationFormData>({
        resolver: zodResolver(createApplicationSchema),
        defaultValues: {
            status: "APPLIED",
            // Today on the user's own calendar. (toISOString() is UTC, which is
            // still "yesterday" for someone ahead of UTC in the early morning
            // and would quietly break their applying streak.)
            appliedDate: localDay(),
        }
    });

    // What autofill last wrote into each field. A field may be overwritten by a
    // later autofill only if it is empty or still holds that value, so nothing
    // the user typed or edited is ever replaced.
    const autofilled = useRef<Partial<Record<"companyName" | "role" | "applicationLink", string>>>({});

    function applyParsed(job: ParsedJob) {
        const filled: string[] = [];
        const kept: string[] = [];
        const fields = [
            ["companyName", "company", job.companyName],
            ["role", "role", job.role],
            ["applicationLink", "link", job.applicationLink],
        ] as const;

        for (const [field, label, value] of fields) {
            if (!value) continue;
            const current = getValues(field) ?? "";
            if (current === "" || current === autofilled.current[field]) {
                setValue(field, value, { shouldDirty: true, shouldValidate: true });
                autofilled.current[field] = value;
                filled.push(label);
            } else if (current !== value) {
                kept.push(label);
            }
        }
        return { filled, kept };
    }

    const mutation = useMutation({
        mutationFn: createApplication,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["applications"] });
            // Also invalidate stats
            queryClient.invalidateQueries({ queryKey: ["analytics"] });
            navigate("/applications");
        },
    });

    const onSubmit = (data: CreateApplicationFormData) => {
        // The date input gives "YYYY-MM-DD"; the backend expects a full ISO datetime.
        const payload: CreateApplicationFormData = {
            ...data,
            appliedDate: new Date(data.appliedDate).toISOString(),
            // Optional: a blank stays "" and is dropped before the request.
            followUpDate: data.followUpDate ? new Date(data.followUpDate).toISOString() : "",
        };
        mutation.mutate(payload);
    };

    return (
        <div className="max-w-2xl mx-auto">
            <Link to="/applications" className="inline-flex items-center gap-2 font-bold mb-4 hover:underline">
                <ArrowLeft className="w-4 h-4" /> Back to List
            </Link>

            <NeoCard>
                <h1 className="text-3xl font-black mb-6 uppercase border-b-2 border-black pb-4">
                    New Application
                </h1>

                <JobUrlCapture onParsed={applyParsed} />

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <NeoInput
                            label="Company Name"
                            placeholder="e.g. Google"
                            error={errors.companyName?.message}
                            {...register("companyName")}
                        />
                        <NeoInput
                            label="Role"
                            placeholder="e.g. Software Engineer Intern"
                            error={errors.role?.message}
                            {...register("role")}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block font-bold mb-1 text-sm uppercase tracking-wide">Status</label>
                            <select
                                className="w-full px-4 py-3 bg-white border-2 border-black focus:outline-none focus:ring-4 focus:ring-neo-primary/50 font-medium"
                                {...register("status")}
                            >
                                {STATUS_ORDER.map((s) => (
                                    <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                                ))}
                            </select>
                        </div>

                        <NeoInput
                            label="Applied Date"
                            type="date"
                            error={errors.appliedDate?.message}
                            {...register("appliedDate")}
                        />
                    </div>

                    <NeoInput
                        label="Follow-up Date (optional)"
                        type="date"
                        error={errors.followUpDate?.message}
                        {...register("followUpDate")}
                    />

                    <NeoInput
                        label="Application Link"
                        placeholder="https://..."
                        error={errors.applicationLink?.message}
                        {...register("applicationLink")}
                    />

                    <div>
                        <label className="block font-bold mb-1 text-sm uppercase tracking-wide">Notes</label>
                        <textarea
                            className="w-full px-4 py-3 bg-white border-2 border-black focus:outline-none focus:ring-4 focus:ring-neo-primary/50 font-medium min-h-[100px]"
                            placeholder="Job description, referral info, etc."
                            {...register("notes")}
                        />
                    </div>

                    <NeoButton
                        type="submit"
                        className="w-full"
                        disabled={mutation.isPending}
                    >
                        {mutation.isPending ? "Tracking..." : "Save Application"}
                    </NeoButton>
                </form>
            </NeoCard>
        </div>
    );
}
