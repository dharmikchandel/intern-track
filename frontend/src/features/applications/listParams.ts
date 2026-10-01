import type { ApplicationSort, ApplicationStatus } from "../../api/applications";
import { STATUS_ORDER } from "./statusMeta";

// The applications list keeps its whole view in the URL (?q=stripe&status=OA&sort=role&page=2),
// so Back, refresh and a copied link all land on the same list. Defaults are left out
// of the URL to keep it short. Anything unrecognised in the URL falls back to a default
// rather than breaking the page.

export const SORT_COLUMNS = ["appliedDate", "companyName", "role", "status"] as const satisfies readonly ApplicationSort[];
export type SortColumn = (typeof SORT_COLUMNS)[number];
export type SortOrder = "asc" | "desc";
export type ListView = "list" | "board";

export interface ListParams {
    view: ListView | null; // null = no explicit choice in the URL: use the saved preference
    q: string;
    status: ApplicationStatus | "";
    followUp: boolean;
    sort: SortColumn;
    order: SortOrder;
    page: number;
}

export const DEFAULT_SORT: SortColumn = "appliedDate";
export const MAX_QUERY_LENGTH = 100;

// Dates read newest-first; text and status read A to Z.
export const defaultOrderFor = (sort: SortColumn): SortOrder => (sort === "appliedDate" ? "desc" : "asc");

export function parseListParams(params: URLSearchParams): ListParams {
    const view = params.get("view");
    const status = params.get("status");
    const sort = params.get("sort");
    const sortColumn = (SORT_COLUMNS as readonly string[]).includes(sort ?? "") ? (sort as SortColumn) : DEFAULT_SORT;
    const order = params.get("order");
    const page = Number.parseInt(params.get("page") ?? "1", 10);

    return {
        view: view === "board" || view === "list" ? view : null,
        q: (params.get("q") ?? "").trim().slice(0, MAX_QUERY_LENGTH),
        status: (STATUS_ORDER as readonly string[]).includes(status ?? "") ? (status as ApplicationStatus) : "",
        followUp: params.get("followUp") === "1",
        sort: sortColumn,
        order: order === "asc" || order === "desc" ? order : defaultOrderFor(sortColumn),
        page: Number.isFinite(page) && page > 1 ? page : 1,
    };
}

// Apply a change to the current URL. Changing any filter or the sort sends you
// back to page 1 (the old page number may no longer exist), unless the change
// names a page itself.
export function withListParams(current: URLSearchParams, patch: Partial<ListParams>): URLSearchParams {
    const merged: ListParams = { ...parseListParams(current), ...patch };
    // Picking a different column starts from that column's natural order.
    if ("sort" in patch && !("order" in patch)) merged.order = defaultOrderFor(merged.sort);
    const changesResults = ["q", "status", "followUp", "sort", "order"].some((key) => key in patch);
    if (changesResults && !("page" in patch)) merged.page = 1;

    const next = new URLSearchParams();
    if (merged.view) next.set("view", merged.view);
    if (merged.q) next.set("q", merged.q.trim().slice(0, MAX_QUERY_LENGTH));
    if (merged.status) next.set("status", merged.status);
    if (merged.followUp) next.set("followUp", "1");
    if (merged.sort !== DEFAULT_SORT) next.set("sort", merged.sort);
    if (merged.order !== defaultOrderFor(merged.sort)) next.set("order", merged.order);
    if (merged.page > 1) next.set("page", String(merged.page));
    return next;
}
