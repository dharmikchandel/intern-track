import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { NeoCard } from "../components/ui/NeoCard";
import { NeoInput } from "../components/ui/NeoInput";
import { NeoButton } from "../components/ui/NeoButton";
import { type CreateApplicationFormData, createApplicationSchema } from "../lib/schemas";
import { createApplication } from "../api/applications";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export function CreateApplicationPage() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<CreateApplicationFormData>({
        resolver: zodResolver(createApplicationSchema),
        defaultValues: {
            status: "APPLIED",
            appliedDate: new Date().toISOString().split('T')[0], // Today YYYY-MM-DD
        }
    });

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
        // Ensure date is ISO string if needed by backend, but backend accepts ISO date string.
        // Zod schema expects string date.
        const payload = {
            ...data,
            appliedDate: new Date(data.appliedDate).toISOString(),
        };
        mutation.mutate(payload as any);
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
                                <option value="APPLIED">Applied</option>
                                <option value="OA">Online Assessment</option>
                                <option value="INTERVIEW">Interview</option>
                                <option value="OFFER">Offer</option>
                                <option value="REJECTED">Rejected</option>
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
