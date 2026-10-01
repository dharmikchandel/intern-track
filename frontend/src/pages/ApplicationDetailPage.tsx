import { isAxiosError } from "axios";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { NeoCard } from "../components/ui/NeoCard";
import { NeoButton } from "../components/ui/NeoButton";
import { NeoInput } from "../components/ui/NeoInput";
import { NeoSelect } from "../components/ui/NeoSelect";
import { NeoTextarea } from "../components/ui/NeoTextarea";
import { NeoSkeleton } from "../components/ui/NeoSkeleton";
import { NeoModal } from "../components/ui/NeoModal";
import { NeoNotice } from "../components/ui/NeoNotice";
import { StatusChip } from "../components/ui/StatusChip";
import { NeoAlert } from "../components/ui/NeoAlert";
import { getApplication, updateApplication, deleteApplication, type UpdateApplicationPayload } from "../api/applications";
import { ActivityTimeline } from "../features/applications/ActivityTimeline";
import { isFollowUpDue, STATUS_LABELS, STATUS_ORDER } from "../features/applications/statusMeta";
import { useTimeZone } from "../features/auth/useTimeZone";
import { type CreateApplicationFormData, createApplicationSchema } from "../lib/schemas";
import { getErrorMessage } from "../lib/utils";
import { ArrowLeft, Trash2, ExternalLink, Calendar } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { formatCalendarDay } from "../lib/dates";

export function ApplicationDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const timeZone = useTimeZone();
    // Back returns to the list as you left it (search, filters, sort, page).
    const backTo = (useLocation().state as { backTo?: string } | null)?.backTo ?? "/applications";
    const queryClient = useQueryClient();
    const [isEditing, setIsEditing] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [notice, setNotice] = useState<string | null>(null);
    const headingRef = useRef<HTMLHeadingElement>(null);

    const { data: application, isLoading, isError, error, refetch } = useQuery({
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
            setNotice("Changes saved.");
            // The Edit/Save buttons unmount, so put focus back on the page title.
            requestAnimationFrame(() => headingRef.current?.focus());
        },
    });

    const deleteMutation = useMutation({
        mutationFn: () => deleteApplication(id!),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["applications"] });
            queryClient.invalidateQueries({ queryKey: ["analytics"] });
            navigate(backTo);
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

    const backLink = (
        <Link to={backTo} className="group inline-flex items-center gap-2 font-bold mb-4 ui-link-quiet">
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" aria-hidden /> Back to Applications
        </Link>
    );

    if (isLoading) {
        return (
            <div className="max-w-3xl mx-auto">
                {backLink}
                <NeoSkeleton label="Loading application" className="h-64" />
            </div>
        );
    }

    if (isError || !application) {
        const notFound = isAxiosError(error) && error.response?.status === 404;
        return (
            <div className="max-w-3xl mx-auto">
                {backLink}
                <NeoCard>
                    <h1 className="text-3xl font-black uppercase mb-2">{notFound ? "Application not found" : "Couldn't load this application"}</h1>
                    <p className="font-bold text-slate-600 mb-6">
                        {notFound ? "It may have been deleted, or the link is wrong." : "Check your connection and try again."}
                    </p>
                    {!notFound && <NeoButton onClick={() => refetch()}>Try again</NeoButton>}
                </NeoCard>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto">
            {backLink}

            {notice && <NeoNotice className="mb-6" onDismiss={() => setNotice(null)}>{notice}</NeoNotice>}

            <NeoCard className="mb-6">
                <div className="flex flex-col md:flex-row justify-between items-start mb-6 border-b-2 border-black pb-4 gap-4">
                    <div className="flex-1 min-w-0 pr-4">
                        <h1 ref={headingRef} tabIndex={-1} className="text-3xl md:text-4xl font-black break-words leading-tight focus:outline-none">{application.companyName}</h1>
                        <p className="text-lg md:text-xl font-bold text-slate-600 break-words">{application.role}</p>
                    </div>
                    {!isEditing && (
                        <div className="flex gap-2 shrink-0">
                            <NeoButton variant="ghost" onClick={() => {
                                setNotice(null);
                                setIsEditing(true);
                            }}>Edit</NeoButton>
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
                            hint="We remind you on your dashboard and in the weekly email."
                            type="date"
                            error={errors.followUpDate?.message}
                            {...register("followUpDate")}
                        />

                        <NeoInput
                            label="Application Link (optional)"
                            error={errors.applicationLink?.message}
                            {...register("applicationLink")}
                        />

                        <NeoTextarea
                            label="Notes (optional)"
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
                                variant="ghost"
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
                                <StatusChip status={application.status} className="mt-1 px-3 text-sm font-black" />
                            </div>
                            <div>
                                <span className="block text-sm font-bold text-slate-500 uppercase">Applied Date</span>
                                <div className="flex items-center gap-2 mt-1 font-bold">
                                    <Calendar className="w-5 h-5" />
                                    {formatCalendarDay(application.appliedDate, "PPP")}
                                </div>
                            </div>
                        </div>

                        {application.followUpDate && (
                            <div>
                                <span className="block text-sm font-bold text-slate-500 uppercase">Follow-up Date</span>
                                <div className={`flex items-center gap-2 mt-1 font-bold ${isFollowUpDue(application, timeZone) ? "text-neo-red-deep" : ""}`}>
                                    <Calendar className="w-5 h-5" />
                                    {formatCalendarDay(application.followUpDate, "PPP")}
                                    {isFollowUpDue(application, timeZone) && <span className="text-xs uppercase border-2 border-black bg-neo-destructive text-black px-1">Overdue</span>}
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
                                    className="inline-flex items-start gap-2 font-bold ui-link break-all mt-1"
                                >
                                    {application.applicationLink} <ExternalLink className="w-4 h-4 shrink-0 mt-1" aria-hidden />
                                </a>
                            </div>
                        )}

                        {application.notes && (
                            <div>
                                <span className="block text-sm font-bold text-slate-500 uppercase mb-2">Notes</span>
                                <div className="bg-neo-bg p-4 border-2 border-black font-medium whitespace-pre-wrap">
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
                title={`Delete ${application.companyName}?`}
            >
                <p className="font-bold mb-6">Are you sure you want to delete this application? This action cannot be undone.</p>
                {deleteMutation.isError && (
                    <NeoAlert className="mb-6">{getErrorMessage(deleteMutation.error, "Couldn't delete this application. Please try again.")}</NeoAlert>
                )}
                <div className="flex justify-end gap-4">
                    <NeoButton variant="ghost" onClick={closeDeleteModal}>Cancel</NeoButton>
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
