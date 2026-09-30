import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { NeoCard } from "../components/ui/NeoCard";
import { NeoButton } from "../components/ui/NeoButton";
import { NeoInput } from "../components/ui/NeoInput";
import { NeoSelect } from "../components/ui/NeoSelect";
import { NeoTextarea } from "../components/ui/NeoTextarea";
import { NeoModal } from "../components/ui/NeoModal"; // Assuming we have this, or use Confirm pattern
import { NeoAlert } from "../components/ui/NeoAlert";
import { getApplication, updateApplication, deleteApplication, type UpdateApplicationPayload } from "../api/applications";
import { ActivityTimeline } from "../features/applications/ActivityTimeline";
import { isFollowUpDue, STATUS_COLORS, STATUS_LABELS, STATUS_ORDER } from "../features/applications/statusMeta";
import { type CreateApplicationFormData, createApplicationSchema } from "../lib/schemas";
import { getErrorMessage } from "../lib/utils";
import { ArrowLeft, Trash2, ExternalLink, Calendar } from "lucide-react";
import { useState, useEffect } from "react";
import { format } from "date-fns";

export function ApplicationDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [isEditing, setIsEditing] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const { data: application, isLoading, isError } = useQuery({
        queryKey: ["application", id],
        queryFn: () => getApplication(id!),
        enabled: !!id,
    });

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<CreateApplicationFormData>({
        resolver: zodResolver(createApplicationSchema),
    });

    // Reset form when data loads
    useEffect(() => {
        if (application) {
            reset({
                companyName: application.companyName,
                role: application.role,
                status: application.status,
                appliedDate: new Date(application.appliedDate).toISOString().split('T')[0],
                applicationLink: application.applicationLink || "",
                notes: application.notes || "",
                followUpDate: application.followUpDate ? new Date(application.followUpDate).toISOString().split('T')[0] : "",
            });
        }
    }, [application, reset]);

    const updateMutation = useMutation({
        mutationFn: (data: UpdateApplicationPayload) => updateApplication(id!, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["application", id] });
            queryClient.invalidateQueries({ queryKey: ["applications"] });
            queryClient.invalidateQueries({ queryKey: ["analytics"] });
            setIsEditing(false);
        },
    });

    const deleteMutation = useMutation({
        mutationFn: () => deleteApplication(id!),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["applications"] });
            queryClient.invalidateQueries({ queryKey: ["analytics"] });
            navigate("/applications");
        },
    });

    const closeDeleteModal = () => {
        deleteMutation.reset();
        setShowDeleteModal(false);
    };

    const onSubmit = (data: CreateApplicationFormData) => {
        const payload: UpdateApplicationPayload = {
            ...data,
            appliedDate: new Date(data.appliedDate).toISOString(),
            // null (not undefined) so emptying the field actually clears it.
            followUpDate: data.followUpDate ? new Date(data.followUpDate).toISOString() : null,
        };
        updateMutation.mutate(payload);
    };

    if (isLoading) return <div className="p-10 text-center font-bold">Loading...</div>;
    if (isError || !application) return <div className="p-10 text-center font-bold text-neo-destructive">Application not found.</div>;

    return (
        <div className="max-w-3xl mx-auto">
            <Link to="/applications" className="inline-flex items-center gap-2 font-bold mb-4 hover:underline">
                <ArrowLeft className="w-4 h-4" /> Back to List
            </Link>

            <NeoCard className="mb-6">
                <div className="flex flex-col md:flex-row justify-between items-start mb-6 border-b-2 border-black pb-4 gap-4">
                    <div className="flex-1 min-w-0 pr-4">
                        <h1 className="text-3xl md:text-4xl font-black break-words leading-tight">{application.companyName}</h1>
                        <p className="text-lg md:text-xl font-bold text-slate-600 truncate">{application.role}</p>
                    </div>
                    {!isEditing && (
                        <div className="flex gap-2 shrink-0">
                            <NeoButton variant="secondary" onClick={() => setIsEditing(true)}>Edit</NeoButton>
                            <NeoButton variant="destructive" onClick={() => setShowDeleteModal(true)} aria-label="Delete application"><Trash2 className="w-4 h-4" aria-hidden /></NeoButton>
                        </div>
                    )}
                </div>

                {isEditing ? (
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <NeoInput
                                label="Company Name"
                                error={errors.companyName?.message}
                                {...register("companyName")}
                            />
                            <NeoInput
                                label="Role"
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
                            type="date"
                            error={errors.followUpDate?.message}
                            {...register("followUpDate")}
                        />

                        <NeoInput
                            label="Application Link"
                            error={errors.applicationLink?.message}
                            {...register("applicationLink")}
                        />

                        <NeoTextarea
                            label="Notes"
                            error={errors.notes?.message}
                            {...register("notes")}
                        />

                        {updateMutation.isError && (
                            <NeoAlert>{getErrorMessage(updateMutation.error, "Couldn't save your changes. Please try again.")}</NeoAlert>
                        )}

                        <div className="flex gap-4">
                            <NeoButton type="submit" disabled={updateMutation.isPending}>
                                {updateMutation.isPending ? "Saving..." : "Save Changes"}
                            </NeoButton>
                            <NeoButton
                                type="button"
                                variant="secondary"
                                onClick={() => {
                                    updateMutation.reset();
                                    setIsEditing(false);
                                }}
                            >
                                Cancel
                            </NeoButton>
                        </div>
                    </form>
                ) : (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <span className="block text-sm font-bold text-slate-500 uppercase">Status</span>
                                <span className={`inline-block mt-1 px-3 py-1 border-2 border-black font-black ${STATUS_COLORS[application.status]}`}>
                                    {STATUS_LABELS[application.status]}
                                </span>
                            </div>
                            <div>
                                <span className="block text-sm font-bold text-slate-500 uppercase">Applied Date</span>
                                <div className="flex items-center gap-2 mt-1 font-bold">
                                    <Calendar className="w-5 h-5" />
                                    {format(new Date(application.appliedDate), "PPP")}
                                </div>
                            </div>
                        </div>

                        {application.followUpDate && (
                            <div>
                                <span className="block text-sm font-bold text-slate-500 uppercase">Follow-up Date</span>
                                <div className={`flex items-center gap-2 mt-1 font-bold ${isFollowUpDue(application) ? "text-neo-destructive" : ""}`}>
                                    <Calendar className="w-5 h-5" />
                                    {format(new Date(application.followUpDate), "PPP")}
                                    {isFollowUpDue(application) && <span className="text-xs uppercase border-2 border-neo-destructive px-1">Due</span>}
                                </div>
                            </div>
                        )}

                        {application.applicationLink && (
                            <div>
                                <span className="block text-sm font-bold text-slate-500 uppercase">Link</span>
                                <a
                                    href={application.applicationLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 font-bold text-neo-secondary hover:underline mt-1"
                                >
                                    {application.applicationLink} <ExternalLink className="w-4 h-4" />
                                </a>
                            </div>
                        )}

                        {application.notes && (
                            <div>
                                <span className="block text-sm font-bold text-slate-500 uppercase mb-2">Notes</span>
                                <div className="bg-yellow-100 p-4 border-2 border-black font-medium whitespace-pre-wrap">
                                    {application.notes}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </NeoCard>

            <ActivityTimeline applicationId={application.id} />

            <NeoModal
                isOpen={showDeleteModal}
                onClose={closeDeleteModal}
                title="Delete Application?"
            >
                <p className="font-bold mb-6">Are you sure you want to delete this application? This action cannot be undone.</p>
                {deleteMutation.isError && (
                    <NeoAlert className="mb-6">{getErrorMessage(deleteMutation.error, "Couldn't delete this application. Please try again.")}</NeoAlert>
                )}
                <div className="flex justify-end gap-4">
                    <NeoButton variant="secondary" onClick={closeDeleteModal}>Cancel</NeoButton>
                    <NeoButton
                        variant="destructive"
                        onClick={() => deleteMutation.mutate()}
                        disabled={deleteMutation.isPending}
                    >
                        {deleteMutation.isPending ? "Deleting..." : "Confirm Delete"}
                    </NeoButton>
                </div>
            </NeoModal>
        </div>
    );
}
