import { lazy, Suspense, useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { formatCalendarDay } from "../lib/dates";
import { AlertCircle, LayoutGrid, List, Plus } from "lucide-react";
import { NeoButton } from "../components/ui/NeoButton";
import { NeoLinkButton } from "../components/ui/NeoLinkButton";
import { NeoAlert } from "../components/ui/NeoAlert";
import { NeoNotice } from "../components/ui/NeoNotice";
import { NeoSkeleton } from "../components/ui/NeoSkeleton";

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
import { isFollowUpDue, STATUS_COLORS, STATUS_LABELS } from "../features/applications/statusMeta";
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

    // "Added X." arrives in router state after creating an application. Keep it
    // locally and clear it from history so a refresh does not show it again.
    const location = useLocation();
    const navigate = useNavigate();
    const [notice, setNotice] = useState<string | null>(() => (location.state as { notice?: string } | null)?.notice ?? null);
    useEffect(() => {
        if ((location.state as { notice?: string } | null)?.notice) {
            navigate(location.pathname + location.search, { replace: true, state: null });
        }
    }, [location, navigate]);
    const [sort, setSort] = useState<ApplicationSort>("appliedDate");
    const [order, setOrder] = useState<"asc" | "desc">("desc");

    // Only the debounced value hits the API, so typing doesn't fire a request
    // per keystroke.
    const debouncedSearch = useDebouncedValue(search.trim(), 300);

    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: ["applications", "list", { page, statusFilter, debouncedSearch, needsFollowUp, sort, order }],
        queryFn: () =>
            listApplications({
                page,
                limit: 15,
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

    function clearFilters() {
        setSearch("");
        setNeedsFollowUp(false);
        setStatusFilter("");
        setPage(1);
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
                    <p className="text-slate-600 font-bold">Manage your job hunt</p>
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
                                type="button"
                                key={mode}
                                aria-pressed={view === mode}
                                onClick={() => changeView(mode)}
                                className={cn(
                                    "flex items-center gap-2 px-3 py-2 min-h-11 font-bold text-sm focus-visible:outline-offset-[-4px]",
                                    view === mode ? "bg-neo-primary text-black" : "bg-white hover:bg-slate-100"
                                )}
                            >
                                <Icon className="w-4 h-4" />
                                {label}
                            </button>
                        ))}
                    </div>
                    <NeoLinkButton to="/applications/new" className="flex items-center gap-2">
                        <Plus className="w-5 h-5" />
                        New Application
                    </NeoLinkButton>
                </div>
            </div>

            {notice && <NeoNotice className="mb-6" onDismiss={() => setNotice(null)}>{notice}</NeoNotice>}

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

            {hasFilters && (
                <div className="-mt-3 mb-6">
                    <NeoButton variant="ghost" className="px-4 py-2 text-sm min-h-11" onClick={clearFilters}>
                        Clear filters
                    </NeoButton>
                </div>
            )}

            {view === "board" ? (
                <Suspense fallback={<NeoSkeleton label="Loading board" className="h-80" />}>
                    <BoardView q={debouncedSearch} needsFollowUp={needsFollowUp} />
                </Suspense>
            ) : isLoading ? (
                <NeoSkeleton label="Loading applications" className="h-80" />
            ) : isError ? (
                <NeoAlert className="p-4" onRetry={() => refetch()}>
                    Couldn't load your applications.
                </NeoAlert>
            ) : data?.items.length === 0 ? (
                <div className="text-center p-10 border-2 border-dashed border-black bg-white">
                    <p className="font-bold text-lg mb-4">
                        {hasFilters ? "No applications match these filters." : "No applications yet."}
                    </p>
                    {hasFilters ? (
                        <NeoButton variant="ghost" onClick={clearFilters}>Clear filters</NeoButton>
                    ) : (
                        <NeoLinkButton to="/applications/new">Add your first application</NeoLinkButton>
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
                            </tr>
                        </NeoTableHeader>
                        <NeoTableBody>
                            {data?.items.map((app) => (
                                <NeoTableRow key={app.id}>
                                    <NeoTableCell>
                                        <Link to={`/applications/${app.id}`} className="font-black hover:underline">
                                            {app.companyName}
                                        </Link>
                                        {isFollowUpDue(app) && (
                                            <span className="flex items-center gap-1 text-xs font-bold text-neo-red-deep">
                                                <AlertCircle className="w-3 h-3" aria-hidden /> Follow-up due
                                            </span>
                                        )}
                                    </NeoTableCell>
                                    <NeoTableCell>{app.role}</NeoTableCell>
                                    <NeoTableCell>
                                        <span className={`px-2 py-1 border-2 border-black font-bold text-xs rounded-sm ${STATUS_COLORS[app.status]}`}>
                                            {STATUS_LABELS[app.status]}
                                        </span>
                                    </NeoTableCell>
                                    <NeoTableCell>{formatCalendarDay(app.appliedDate, "MMM d, yyyy")}</NeoTableCell>
                                </NeoTableRow>
                            ))}
                        </NeoTableBody>
                    </NeoTable>

                    {/* Pagination */}
                    <div className="mt-6 flex justify-between items-center">
                        <NeoButton
                            variant="ghost"
                            disabled={page === 1}
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                        >
                            Previous
                        </NeoButton>
                        <span className="font-bold text-center">
                            Showing {(page - 1) * 15 + 1}-{Math.min(page * 15, data?.meta.total ?? 0)} of {data?.meta.total ?? 0}
                            <span className="block text-xs text-slate-600">Page {page} of {Math.max(1, data?.meta.totalPages ?? 1)}</span>
                        </span>
                        <NeoButton
                            variant="ghost"
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
