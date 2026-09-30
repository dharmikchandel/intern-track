import { isAxiosError } from "axios";
import { client } from "./client";
import { type CreateApplicationFormData } from "../lib/schemas";

export type ApplicationStatus = "APPLIED" | "OA" | "INTERVIEW" | "OFFER" | "REJECTED";

export interface Application {
    id: string;
    userId: string;
    companyName: string;
    role: string;
    status: ApplicationStatus;
    appliedDate: string;
    applicationLink?: string;
    notes?: string;
    followUpDate?: string;
    createdAt: string;
    updatedAt: string;
}

interface ListApplicationsParams {
    page?: number;
    limit?: number;
    status?: string;
    q?: string;
    needsFollowUp?: boolean;
    sort?: ApplicationSort;
    order?: "asc" | "desc";
}

export type ApplicationSort =
    | "appliedDate"
    | "createdAt"
    | "updatedAt"
    | "companyName"
    | "role"
    | "status";

export interface BoardColumn {
    status: ApplicationStatus;
    // True count for the column under the current filters; items is only the
    // first `perColumn` cards of it.
    total: number;
    items: Application[];
}

export interface BoardResponse {
    perColumn: number;
    columns: BoardColumn[];
}

interface BoardParams {
    q?: string;
    needsFollowUp?: boolean;
    perColumn?: number;
}

interface ListApplicationsResponse {
    items: Application[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export async function listApplications(params?: ListApplicationsParams) {
    const res = await client.get<ListApplicationsResponse>("/applications", { params });
    return res.data;
}

export async function getBoard(params?: BoardParams) {
    const res = await client.get<BoardResponse>("/applications/board", { params });
    return res.data;
}

export async function getApplication(id: string) {
    const res = await client.get<Application>(`/applications/${id}`);
    return res.data;
}

// The form gives "" for an empty optional field; the backend expects the
// key to be absent instead ("" fails its URL/date validation). Normalized
// here, once, rather than in every submit handler that sends this data.
function stripBlanks<T extends Record<string, unknown>>(data: T): T {
    const cleaned = { ...data };
    for (const key of ["applicationLink", "followUpDate"] as const) {
        if (cleaned[key] === "") delete cleaned[key];
    }
    return cleaned;
}

export async function createApplication(data: CreateApplicationFormData) {
    const res = await client.post<Application>("/applications", stripBlanks(data));
    return res.data;
}

// followUpDate is nullable on update: null clears it, while omitting the key
// (what stripBlanks does to "") leaves it untouched.
export type UpdateApplicationPayload = Omit<Partial<CreateApplicationFormData>, "followUpDate"> & {
    followUpDate?: string | null;
};

export async function updateApplication(id: string, data: UpdateApplicationPayload) {
    const res = await client.patch<Application>(`/applications/${id}`, stripBlanks(data));
    return res.data;
}

export async function deleteApplication(id: string) {
    const res = await client.delete<{ success: true; message: string }>(`/applications/${id}`);
    return res.data;
}

export type ActivityType =
    | "APPLICATION_CREATED"
    | "STATUS_CHANGED"
    | "NOTES_CHANGED"
    | "FOLLOW_UP_CHANGED"
    | "FOLLOW_UP_REMINDER_SENT";

export interface ActivityItem {
    id: string;
    type: ActivityType;
    metadata: { from?: string | null; to?: string | null; status?: string; source?: string } | null;
    createdAt: string;
}

export async function getApplicationActivity(id: string) {
    const res = await client.get<{ items: ActivityItem[] }>(`/applications/${id}/activity`);
    return res.data.items;
}

export type CaptureConfidence = "high" | "medium" | "low" | "none";

export interface ParsedJob {
    // Empty string = not found. Only non-empty fields are used to prefill.
    companyName: string;
    role: string;
    applicationLink: string;
    source: string;
    confidence: CaptureConfidence;
    warnings: string[];
}

export async function parseJobUrl(url: string) {
    const res = await client.post<ParsedJob>("/applications/parse-url", { url });
    return res.data;
}

// ---- CSV import / export ---------------------------------------------------

export type CsvDateFormat = "iso" | "mdy" | "dmy";

export interface CsvImportSummary {
    dryRun: boolean;
    // What each header in the file was understood as (field null = ignored).
    columns: { header: string; field: string | null }[];
    totalRows: number;
    importable: number;
    duplicates: number;
    invalid: number;
    imported: number;
    // Capped lists: `invalid` / `duplicates` are the true totals.
    errors: { row: number; message: string }[];
    duplicateRows: { row: number; companyName: string; role: string; appliedDate: string }[];
    sample: { companyName: string; role: string; status: ApplicationStatus; appliedDate: string }[];
}

// The file goes up as the raw request body (text/csv), not wrapped in JSON or
// multipart. dryRun=true validates and reports without writing anything.
export async function importApplicationsCsv(file: Blob, options: { dryRun: boolean; dateFormat: CsvDateFormat }) {
    const res = await client.post<CsvImportSummary>("/applications/import", file, {
        params: options,
        headers: { "Content-Type": "text/csv" },
    });
    return res.data;
}

// The access token lives in memory (not a cookie), so a plain <a href> download
// can't be authenticated: fetch the file through the API client and hand the
// browser a blob instead.
export async function exportApplicationsCsv(params?: { q?: string; status?: string; needsFollowUp?: boolean }) {
    try {
        const res = await client.get<Blob>("/applications/export", { params, responseType: "blob" });
        return res.data;
    } catch (err) {
        // With responseType "blob" even the JSON error body arrives as a Blob;
        // unwrap it so getErrorMessage() can read { error }.
        if (isAxiosError(err) && err.response?.data instanceof Blob) {
            try {
                err.response.data = JSON.parse(await err.response.data.text());
            } catch {
                /* not JSON: keep the generic message */
            }
        }
        throw err;
    }
}
