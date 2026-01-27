import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Plus } from "lucide-react";
import { NeoButton } from "../components/ui/NeoButton";

import {
    NeoTable,
    NeoTableHeader,
    NeoTableBody,
    NeoTableRow,
    NeoTableHead,
    NeoTableCell,
} from "../components/ui/NeoTable";
import { listApplications } from "../api/applications";

export function ApplicationsPage() {
    const [page, setPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState<string>("");

    const { data, isLoading, isError } = useQuery({
        queryKey: ["applications", page, statusFilter],
        queryFn: () => listApplications({ page, limit: 8, status: statusFilter || undefined }),
    });

    const statusColors: Record<string, string> = {
        APPLIED: "bg-blue-100 text-blue-800",
        OA: "bg-yellow-100 text-yellow-800",
        INTERVIEW: "bg-purple-100 text-purple-800",
        // OFFER: "bg-neo-primary text-black",
        OFFER: "bg-green-300 text-black",
        REJECTED: "bg-neo-destructive text-white",
    };

    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-4xl font-black uppercase tracking-tighter">
                        Applications
                    </h1>
                    <p className="text-gray-600 font-bold">Manage your job hunt</p>
                </div>
                <Link to="/applications/new">
                    <NeoButton className="flex items-center gap-2">
                        <Plus className="w-5 h-5" />
                        Add Application
                    </NeoButton>
                </Link>
            </div>

            {/* Filters (simplified for now) */}
            <div className="flex gap-4 mb-6">
                <div className="flex gap-2 items-center">
                    <span className="font-bold">Filter Status:</span>
                    <select
                        className="border-2 border-black p-2 font-bold focus:outline-none focus:ring-4 focus:ring-neo-primary/50"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="">All</option>
                        <option value="APPLIED">Applied</option>
                        <option value="OA">OA</option>
                        <option value="INTERVIEW">Interview</option>
                        <option value="OFFER">Offer</option>
                        <option value="REJECTED">Rejected</option>
                    </select>
                </div>
            </div>

            {isLoading ? (
                <div className="text-center font-bold p-10 animate-pulse">Loading Applications...</div>
            ) : isError ? (
                <div className="bg-neo-destructive text-white p-4 font-bold border-2 border-black">
                    Error loading applications.
                </div>
            ) : data?.items.length === 0 ? (
                <div className="text-center p-10 border-2 border-dashed border-black bg-white">
                    <p className="font-bold text-lg mb-4">No applications found.</p>
                    <Link to="/applications/new">
                        <NeoButton variant="secondary">Track your first job</NeoButton>
                    </Link>
                </div>
            ) : (
                <>
                    <NeoTable>
                        <NeoTableHeader>
                            <tr>
                                <NeoTableHead>Company</NeoTableHead>
                                <NeoTableHead>Role</NeoTableHead>
                                <NeoTableHead>Status</NeoTableHead>
                                <NeoTableHead>Applied Date</NeoTableHead>
                                <NeoTableHead>Actions</NeoTableHead>
                            </tr>
                        </NeoTableHeader>
                        <NeoTableBody>
                            {data?.items.map((app) => (
                                <NeoTableRow key={app.id}>
                                    <NeoTableCell className="font-bold">{app.companyName}</NeoTableCell>
                                    <NeoTableCell>{app.role}</NeoTableCell>
                                    <NeoTableCell>
                                        <span className={`px-2 py-1 border-2 border-black font-bold text-xs ${statusColors[app.status] || "bg-gray-100"}`}>
                                            {app.status}
                                        </span>
                                    </NeoTableCell>
                                    <NeoTableCell>{format(new Date(app.appliedDate), "MMM d, yyyy")}</NeoTableCell>
                                    <NeoTableCell>
                                        <Link to={`/applications/${app.id}`}>
                                            <NeoButton variant="secondary" className="px-3 py-1 text-sm h-auto rounded-md">
                                                View
                                            </NeoButton>
                                        </Link>
                                    </NeoTableCell>
                                </NeoTableRow>
                            ))}
                        </NeoTableBody>
                    </NeoTable>

                    {/* Pagination */}
                    <div className="mt-6 flex justify-between items-center">
                        <NeoButton
                            variant="secondary"
                            disabled={page === 1}
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                        >
                            Previous
                        </NeoButton>
                        <span className="font-bold">Page {page} of {Math.max(1, Math.ceil((data?.meta.total || 0) / 10))}</span>
                        <NeoButton
                            variant="secondary"
                            disabled={!data || data.items.length < 8} // Simple check, ideally use totalPages
                            onClick={() => setPage(p => p + 1)}
                        >
                            Next
                        </NeoButton>
                    </div>
                </>
            )}
        </div>
    );
}
