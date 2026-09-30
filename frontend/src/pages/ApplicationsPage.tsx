import { lazy, Suspense, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { LayoutGrid, List, Plus } from "lucide-react";
import { NeoButton } from "../components/ui/NeoButton";

import {
    NeoTable,
    NeoTableHeader,
    NeoTableBody,
    NeoTableRow,
    NeoTableHead,
    NeoTableCell,
} from "../components/ui/NeoTable";
import { listApplications, type ApplicationSort } from "../api/applications";
import { ApplicationFilters } from "../features/applications/ApplicationFilters";
import { ExportCsvButton, ImportCsvButton } from "../features/applications/CsvTools";
import { STATUS_COLORS, STATUS_LABELS } from "../features/applications/statusMeta";
import { useDebouncedValue } from "../features/applications/useDebouncedValue";
import { cn } from "../lib/utils";

// The board pulls in the drag-and-drop library; load it only for users who
// actually open the board view.
const BoardView = lazy(() => import("../features/applications/BoardView").then((m) => ({ default: m.BoardView })));

type ViewMode = "list" | "board";
const VIEW_STORAGE_KEY = "applications:view";

// localStorage can throw (private mode, blocked site data) - the toggle must
// still work without persistence.
function readStoredView(): ViewMode {
    try {
        return localStorage.getItem(VIEW_STORAGE_KEY) === "board" ? "board" : "list";
    } catch {
        return "list";
    }
}

export function ApplicationsPage() {
    const [view, setView] = useState<ViewMode>(readStoredView);
    const [page, setPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState<string>("");
    const [search, setSearch] = useState("");
    // The dashboard's "Review them" link arrives as /applications?followUp=1.
    const [searchParams] = useSearchParams();
    const [needsFollowUp, setNeedsFollowUp] = useState(searchParams.get("followUp") === "1");
    const [sort, setSort] = useState<ApplicationSort>("appliedDate");
    const [order, setOrder] = useState<"asc" | "desc">("desc");

    // Only the debounced value hits the API, so typing doesn't fire a request
    // per keystroke.
    const debouncedSearch = useDebouncedValue(search.trim(), 300);

    const { data, isLoading, isError } = useQuery({
        queryKey: ["applications", "list", { page, statusFilter, debouncedSearch, needsFollowUp, sort, order }],
        queryFn: () =>
            listApplications({
                page,
                limit: 8,
                status: statusFilter || undefined,
                q: debouncedSearch || undefined,
                needsFollowUp: needsFollowUp || undefined,
                sort,
                order,
            }),
        enabled: view === "list",
        // Keep showing the previous page while the next one loads instead of
        // flashing the loading state on every filter/keystroke.
        placeholderData: keepPreviousData,
    });

    function changeView(next: ViewMode) {
        setView(next);
        try {
            localStorage.setItem(VIEW_STORAGE_KEY, next);
        } catch {
            /* preference just isn't remembered */
        }
    }

    // Any filter change invalidates the current page number.
    function withPageReset<T>(setter: (value: T) => void) {
        return (value: T) => {
            setter(value);
            setPage(1);
        };
    }

    // The board ignores the status dropdown, so it isn't a filter there.
    const hasFilters = Boolean(debouncedSearch || needsFollowUp || (view === "list" && statusFilter));

    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-4xl font-black uppercase tracking-tighter">
                        Applications
                    </h1>
                    <p className="text-gray-600 font-bold">Manage your job hunt</p>
                </div>
                <div className="flex flex-wrap items-start gap-4">
                    <ImportCsvButton />
                    {/* The board has no status filter, so only send it from the list view. */}
                    <ExportCsvButton
                        filtered={hasFilters}
                        filters={{
                            q: debouncedSearch || undefined,
                            needsFollowUp: needsFollowUp || undefined,
                            status: view === "list" ? statusFilter || undefined : undefined,
                        }}
                    />
                    <div role="group" aria-label="View" className="flex border-2 border-black rounded-lg overflow-hidden shadow-neo">
                        {([
                            ["list", List, "List"],
                            ["board", LayoutGrid, "Board"],
                        ] as const).map(([mode, Icon, label]) => (
                            <button
                                key={mode}
                                aria-pressed={view === mode}
                                onClick={() => changeView(mode)}
                                className={cn(
                                    "flex items-center gap-2 px-3 py-2 font-bold text-sm",
                                    view === mode ? "bg-neo-primary text-black" : "bg-white hover:bg-slate-100"
                                )}
                            >
                                <Icon className="w-4 h-4" />
                                {label}
                            </button>
                        ))}
                    </div>
                    <Link to="/applications/new">
                        <NeoButton className="flex items-center gap-2">
                            <Plus className="w-5 h-5" />
                            Add Application
                        </NeoButton>
                    </Link>
                </div>
            </div>

            <ApplicationFilters
                search={search}
                onSearchChange={withPageReset(setSearch)}
                needsFollowUp={needsFollowUp}
                onNeedsFollowUpChange={withPageReset(setNeedsFollowUp)}
                listControls={
                    view === "list"
                        ? {
                              status: statusFilter,
                              onStatusChange: withPageReset(setStatusFilter),
                              sort,
                              onSortChange: withPageReset(setSort),
                              order,
                              onOrderChange: withPageReset(setOrder),
                          }
                        : undefined
                }
            />

            {view === "board" ? (
                <Suspense fallback={<div className="text-center font-bold p-10 animate-pulse">Loading Board...</div>}>
                    <BoardView q={debouncedSearch} needsFollowUp={needsFollowUp} />
                </Suspense>
            ) : isLoading ? (
                <div className="text-center font-bold p-10 animate-pulse">Loading Applications...</div>
            ) : isError ? (
                <div className="bg-neo-destructive text-white p-4 font-bold border-2 border-black">
                    Error loading applications.
                </div>
            ) : data?.items.length === 0 ? (
                <div className="text-center p-10 border-2 border-dashed border-black bg-white">
                    <p className="font-bold text-lg mb-4">
                        {hasFilters ? "No applications match these filters." : "No applications found."}
                    </p>
                    {!hasFilters && (
                        <Link to="/applications/new">
                            <NeoButton variant="secondary">Track your first job</NeoButton>
                        </Link>
                    )}
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
                                        <span className={`px-2 py-1 border-2 border-black font-bold text-xs rounded-sm ${STATUS_COLORS[app.status]}`}>
                                            {STATUS_LABELS[app.status]}
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
                        <span className="font-bold">Page {page} of {Math.max(1, data?.meta.totalPages ?? 1)}</span>
                        <NeoButton
                            variant="secondary"
                            disabled={!data || page >= data.meta.totalPages}
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
