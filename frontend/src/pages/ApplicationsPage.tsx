import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
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
    NeoTableCell,
} from "../components/ui/NeoTable";
import { listApplications } from "../api/applications";
import { ApplicationFilters } from "../features/applications/ApplicationFilters";
import { ExportCsvButton, ImportCsvButton } from "../features/applications/CsvTools";
import { isFollowUpDue, STATUS_COLORS, STATUS_LABELS } from "../features/applications/statusMeta";
import { useDebouncedValue } from "../features/applications/useDebouncedValue";
import { SortableHead } from "../features/applications/SortableHead";
import { defaultOrderFor, parseListParams, withListParams, type ListParams, type ListView, type SortColumn } from "../features/applications/listParams";
import { cn } from "../lib/utils";

// The board pulls in the drag-and-drop library; load it only for users who
// actually open the board view.
const BoardView = lazy(() => import("../features/applications/BoardView").then((m) => ({ default: m.BoardView })));

type ViewMode = ListView;
const VIEW_STORAGE_KEY = "applications:view";
const PAGE_SIZE = 15;

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
    // The URL is the source of truth for the whole list view (search, status,
    // follow-up, sort, page, view), so Back, refresh and a shared link all
    // return to the same list. Changes replace the history entry instead of
    // stacking one per keystroke.
    const [params, setParams] = useSearchParams();
    const lp = useMemo(() => parseListParams(params), [params]);
    const view: ViewMode = lp.view ?? readStoredView();
    function update(patch: Partial<ListParams>) {
        setParams((current) => withListParams(current, patch), { replace: true });
    }

    // The search box is typed into locally and written to the URL once typing
    // pauses, so a request is not made per keystroke. `pushedQ` lets us tell our
    // own URL write apart from an outside change (Back, "Clear filters").
    const [search, setSearch] = useState(lp.q);
    const debouncedSearch = useDebouncedValue(search.trim(), 300);
    const pushedQ = useRef(lp.q);
    useEffect(() => {
        if (debouncedSearch !== pushedQ.current) {
            pushedQ.current = debouncedSearch;
            update({ q: debouncedSearch });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedSearch]);
    useEffect(() => {
        if (lp.q !== pushedQ.current) {
            pushedQ.current = lp.q;
            setSearch(lp.q);
        }
    }, [lp.q]);

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

    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: ["applications", "list", lp],
        queryFn: () =>
            listApplications({
                page: lp.page,
                limit: PAGE_SIZE,
                status: lp.status || undefined,
                q: lp.q || undefined,
                needsFollowUp: lp.followUp || undefined,
                sort: lp.sort,
                order: lp.order,
            }),
        enabled: view === "list",
        // Keep showing the previous page while the next one loads instead of
        // flashing the loading state on every filter/keystroke.
        placeholderData: keepPreviousData,
    });

    // A link or a shrinking result set can leave the page past the end.
    useEffect(() => {
        if (data && data.meta.totalPages > 0 && lp.page > data.meta.totalPages) update({ page: data.meta.totalPages });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data, lp.page]);

    function changeView(next: ViewMode) {
        try {
            localStorage.setItem(VIEW_STORAGE_KEY, next);
        } catch {
            /* preference just isn't remembered */
        }
        update({ view: next });
    }

    function sortBy(column: SortColumn) {
        if (column === lp.sort) update({ order: lp.order === "asc" ? "desc" : "asc" });
        else update({ sort: column, order: defaultOrderFor(column) });
    }

    function clearFilters() {
        setSearch("");
        pushedQ.current = "";
        update({ q: "", status: "", followUp: false });
    }

    // The board ignores the status dropdown, so it isn't a filter there.
    const hasFilters = Boolean(lp.q || lp.followUp || (view === "list" && lp.status));

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
                            q: lp.q || undefined,
                            needsFollowUp: lp.followUp || undefined,
                            status: view === "list" ? lp.status || undefined : undefined,
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
                onSearchChange={setSearch}
                needsFollowUp={lp.followUp}
                onNeedsFollowUpChange={(value) => update({ followUp: value })}
                listControls={
                    view === "list"
                        ? { status: lp.status, onStatusChange: (value) => update({ status: value as ListParams["status"] }) }
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
                    <BoardView q={lp.q} needsFollowUp={lp.followUp} />
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
                                <SortableHead label="Company" column="companyName" sort={lp.sort} order={lp.order} onSort={sortBy} />
                                <SortableHead label="Role" column="role" sort={lp.sort} order={lp.order} onSort={sortBy} />
                                <SortableHead label="Status" column="status" sort={lp.sort} order={lp.order} onSort={sortBy} />
                                <SortableHead label="Applied Date" column="appliedDate" sort={lp.sort} order={lp.order} onSort={sortBy} />
                            </tr>
                        </NeoTableHeader>
                        <NeoTableBody>
                            {data?.items.map((app) => (
                                <NeoTableRow key={app.id}>
                                    <NeoTableCell>
                                        <Link to={`/applications/${app.id}`} state={{ backTo: `/applications${location.search}` }} className="font-black hover:underline">
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
                                        <span className={`inline-block px-2 py-1 border-2 border-black font-bold text-xs rounded-sm ${STATUS_COLORS[app.status]}`}>
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
                            disabled={lp.page === 1}
                            onClick={() => update({ page: lp.page - 1 })}
                        >
                            Previous
                        </NeoButton>
                        <span className="font-bold text-center">
                            Showing {(lp.page - 1) * PAGE_SIZE + 1}-{Math.min(lp.page * PAGE_SIZE, data?.meta.total ?? 0)} of {data?.meta.total ?? 0}
                            <span className="block text-xs text-slate-600">Page {lp.page} of {Math.max(1, data?.meta.totalPages ?? 1)}</span>
                        </span>
                        <NeoButton
                            variant="ghost"
                            disabled={!data || lp.page >= data.meta.totalPages}
                            onClick={() => update({ page: lp.page + 1 })}
                        >
                            Next
                        </NeoButton>
                    </div>
                </>
            )}
        </div>
    );
}
