import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { NeoCard } from "../components/ui/NeoCard";
import { NeoInput } from "../components/ui/NeoInput";
import { NeoSelect } from "../components/ui/NeoSelect";
import { NeoTextarea } from "../components/ui/NeoTextarea";
import { NeoButton } from "../components/ui/NeoButton";
import { NeoAlert } from "../components/ui/NeoAlert";
import { type CreateApplicationFormData, createApplicationSchema } from "../lib/schemas";
import { createApplication, type ParsedJob } from "../api/applications";
import { JobUrlCapture } from "../features/applications/JobUrlCapture";
import { ArrowLeft } from "lucide-react";
import { localDay } from "../features/recap/format";
import { getErrorMessage } from "../lib/utils";
import { notify } from "../lib/toast";
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
        onSuccess: (created, variables) => {
            queryClient.invalidateQueries({ queryKey: ["applications"] });
            // Also invalidate stats
            queryClient.invalidateQueries({ queryKey: ["analytics"] });
            notify.success(`Added ${variables.companyName}.`, {
                action: { label: "View", to: `/applications/${created.id}`, state: { backTo: "/applications" } },
            });
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
            <Link to="/applications" className="group inline-flex items-center gap-2 font-bold mb-4 ui-link-quiet">
                <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" aria-hidden /> Back to Applications
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
                        <NeoSelect label="Status" error={errors.status?.message} {...register("status")}>
                            {STATUS_ORDER.map((s) => (
                                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                            ))}
                        </NeoSelect>

                        <NeoInput
                            label="Applied Date"
                            type="date"
                            error={errors.appliedDate?.message}
                            {...register("appliedDate")}
                        />
                    </div>

                    <NeoInput
                        label="Follow-up Date (optional)"
                        hint="We remind you on your dashboard and in the weekly email."
                        type="date"
                        error={errors.followUpDate?.message}
                        {...register("followUpDate")}
                    />

                    <NeoInput
                        label="Application Link (optional)"
                        placeholder="https://..."
                        error={errors.applicationLink?.message}
                        {...register("applicationLink")}
                    />

                    <NeoTextarea
                        label="Notes (optional)"
                            placeholder="Job description, referral info, etc."
                        error={errors.notes?.message}
                        {...register("notes")}
                    />

                    {mutation.isError && (
                        <NeoAlert>{getErrorMessage(mutation.error, "Couldn't save this application. Please try again.")}</NeoAlert>
                    )}

                    <NeoButton
                        type="submit"
                        className="w-full"
                        disabled={mutation.isPending}
                    >
                        {mutation.isPending ? "Saving..." : "Save Application"}
                    </NeoButton>
                </form>
            </NeoCard>
        </div>
    );
}
