import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Download, FileUp, Upload } from "lucide-react";
import { NeoButton } from "../../components/ui/NeoButton";
import { NeoModal } from "../../components/ui/NeoModal";
import {
    exportApplicationsCsv,
    importApplicationsCsv,
    type CsvDateFormat,
    type CsvImportSummary,
} from "../../api/applications";
import { downloadBlob } from "../../lib/download";
import { getErrorMessage } from "../../lib/utils";
import { localDay } from "../recap/format";
import { STATUS_LABELS } from "./statusMeta";

const MAX_BYTES = 1024 * 1024; // matches the server's limit for this route
const TEMPLATE =
    "Company,Role,Status,Applied Date,Link,Notes,Follow-up Date\r\n" +
    "Acme Corp,Software Engineer Intern,Applied,2026-09-14,https://example.com/jobs/123,Referred by a friend,2026-09-28\r\n";

const FIELD_LABELS: Record<string, string> = {
    companyName: "Company",
    role: "Role",
    status: "Status",
    appliedDate: "Applied Date",
    applicationLink: "Link",
    notes: "Notes",
    followUpDate: "Follow-up Date",
};

const selectClass = "border-2 border-black p-2 font-bold bg-white focus:outline-none focus:ring-4 focus:ring-neo-primary/50";

// Exports exactly what the list is showing: the same search / follow-up (and
// status, in list view) filters. The label says so when any are active, so
// nobody mistakes a filtered file for their whole history.
export function ExportCsvButton({ filters, filtered }: { filters: { q?: string; status?: string; needsFollowUp?: boolean }; filtered: boolean }) {
    const exportCsv = useMutation({
        mutationFn: () => exportApplicationsCsv(filters),
        onSuccess: (blob) => downloadBlob(blob, `interntrack-applications-${localDay()}.csv`),
    });

    return (
        <div className="flex flex-col items-start">
            <NeoButton variant="secondary" className="flex items-center gap-2" disabled={exportCsv.isPending} onClick={() => exportCsv.mutate()}>
                <Download className="w-5 h-5" />
                {exportCsv.isPending ? "Exporting..." : filtered ? "Export filtered CSV" : "Export CSV"}
            </NeoButton>
            {exportCsv.isError && (
                <p role="alert" className="text-sm font-bold text-neo-destructive mt-1">
                    {getErrorMessage(exportCsv.error, "Couldn't export. Please try again.")}
                </p>
            )}
        </div>
    );
}

export function ImportCsvButton() {
    const [open, setOpen] = useState(false);
    return (
        <>
            <NeoButton variant="secondary" className="flex items-center gap-2" onClick={() => setOpen(true)}>
                <Upload className="w-5 h-5" />
                Import CSV
            </NeoButton>
            {/* Mounted only while open so every visit starts from a clean state. */}
            {open && <ImportCsvModal onClose={() => setOpen(false)} />}
        </>
    );
}

function ImportCsvModal({ onClose }: { onClose: () => void }) {
    const queryClient = useQueryClient();
    const fileInput = useRef<HTMLInputElement>(null);
    const [file, setFile] = useState<File | null>(null);
    const [dateFormat, setDateFormat] = useState<CsvDateFormat>("iso");
    const [localError, setLocalError] = useState<string | null>(null);

    // Step 1: a dry run. Nothing is written; the server validates every row and reports.
    const preview = useMutation({
        mutationFn: (args: { file: File; dateFormat: CsvDateFormat }) =>
            importApplicationsCsv(args.file, { dryRun: true, dateFormat: args.dateFormat }),
    });

    // Step 2: the same request with dryRun=false, only after the user confirms.
    const commit = useMutation({
        mutationFn: (args: { file: File; dateFormat: CsvDateFormat }) =>
            importApplicationsCsv(args.file, { dryRun: false, dateFormat: args.dateFormat }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["applications"] });
            queryClient.invalidateQueries({ queryKey: ["analytics"] });
        },
    });

    function choose(next: File | undefined) {
        commit.reset();
        setLocalError(null);
        if (!next) return;
        if (next.size > MAX_BYTES) {
            setFile(null);
            preview.reset();
            setLocalError("That file is over 1 MB. Split it into smaller files (up to 2,000 rows each).");
            return;
        }
        setFile(next);
        preview.mutate({ file: next, dateFormat });
    }

    function changeDateFormat(next: CsvDateFormat) {
        setDateFormat(next);
        if (file) preview.mutate({ file, dateFormat: next });
    }

    const summary: CsvImportSummary | undefined = preview.data;
    const done = commit.data;
    const error = localError ?? (preview.isError ? getErrorMessage(preview.error, "Couldn't read that file.") : null);

    return (
        <NeoModal isOpen onClose={onClose} title="Import from CSV" widthClass="max-w-2xl">
            {done ? (
                <div className="text-center py-4">
                    <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-emerald-600" />
                    <p className="text-2xl font-black mb-1">
                        Imported {done.imported} {done.imported === 1 ? "application" : "applications"}
                    </p>
                    {(done.duplicates > 0 || done.invalid > 0) && (
                        <p className="font-bold text-slate-600">
                            Skipped {done.duplicates} {done.duplicates === 1 ? "duplicate" : "duplicates"} and {done.invalid} {done.invalid === 1 ? "row" : "rows"} with errors.
                        </p>
                    )}
                    <NeoButton className="mt-6" onClick={onClose}>
                        Done
                    </NeoButton>
                </div>
            ) : (
                <div className="space-y-4">
                    <p className="font-bold text-sm text-slate-700">
                        Required columns: <b>Company, Role, Applied Date</b>. Optional: Status, Link, Notes, Follow-up Date. Up to 2,000 rows and 1 MB per file.
                        Nothing is saved until you confirm.
                    </p>

                    <div className="flex flex-wrap items-center gap-3">
                        <input
                            ref={fileInput}
                            type="file"
                            accept=".csv,text/csv"
                            className="sr-only"
                            aria-label="CSV file"
                            onChange={(e) => {
                                choose(e.target.files?.[0]);
                                e.target.value = ""; // allow re-choosing the same file
                            }}
                        />
                        <NeoButton variant="secondary" className="flex items-center gap-2" onClick={() => fileInput.current?.click()}>
                            <FileUp className="w-5 h-5" />
                            {file ? "Choose a different file" : "Choose CSV file"}
                        </NeoButton>
                        {file && <span className="font-bold text-sm break-all">{file.name}</span>}
                        <button
                            type="button"
                            className="font-bold text-sm underline ml-auto"
                            onClick={() => downloadBlob(new Blob(["﻿" + TEMPLATE], { type: "text/csv" }), "interntrack-import-template.csv")}
                        >
                            Download template
                        </button>
                    </div>

                    {file && (
                        <label className="flex flex-wrap items-center gap-2 font-bold text-sm">
                            Dates written like
                            <select className={selectClass} value={dateFormat} onChange={(e) => changeDateFormat(e.target.value as CsvDateFormat)}>
                                <option value="iso">2026-09-14 (YYYY-MM-DD)</option>
                                <option value="mdy">09/14/2026 (MM/DD/YYYY)</option>
                                <option value="dmy">14/09/2026 (DD/MM/YYYY)</option>
                            </select>
                        </label>
                    )}

                    {error && (
                        <div role="alert" className="bg-neo-destructive text-white p-3 font-bold border-2 border-black">
                            {error}
                        </div>
                    )}
                    {preview.isPending && <p className="font-bold animate-pulse">Checking your file...</p>}

                    {summary && !preview.isPending && <PreviewBody summary={summary} />}

                    {commit.isError && (
                        <div role="alert" className="bg-neo-destructive text-white p-3 font-bold border-2 border-black">
                            {getErrorMessage(commit.error, "The import failed. Nothing was saved.")}
                        </div>
                    )}

                    {summary && !preview.isPending && (
                        <div className="flex justify-end gap-3 pt-2">
                            <NeoButton variant="secondary" onClick={onClose}>
                                Cancel
                            </NeoButton>
                            <NeoButton
                                disabled={summary.importable === 0 || commit.isPending || !file}
                                onClick={() => file && commit.mutate({ file, dateFormat })}
                            >
                                {commit.isPending
                                    ? "Importing..."
                                    : `Import ${summary.importable} ${summary.importable === 1 ? "application" : "applications"}`}
                            </NeoButton>
                        </div>
                    )}
                </div>
            )}
        </NeoModal>
    );
}

function PreviewBody({ summary }: { summary: CsvImportSummary }) {
    const ignored = summary.columns.filter((c) => !c.field).map((c) => c.header || "(blank)");
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3 text-center">
                <Stat value={summary.importable} label="Ready to import" tone="bg-emerald-100" />
                <Stat value={summary.duplicates} label="Duplicates (skipped)" tone="bg-amber-100" />
                <Stat value={summary.invalid} label="With errors (skipped)" tone="bg-rose-100" />
            </div>

            <p className="text-sm font-bold text-slate-700">
                Read {summary.totalRows} {summary.totalRows === 1 ? "row" : "rows"}. Columns understood:{" "}
                {summary.columns
                    .filter((c) => c.field)
                    .map((c) => {
                        const label = FIELD_LABELS[c.field!]!;
                        return c.header.toLowerCase() === label.toLowerCase() ? label : `${c.header} → ${label}`;
                    })
                    .join(", ")}.
                {ignored.length > 0 && <> Ignored: {ignored.join(", ")}.</>}
            </p>

            {summary.sample.length > 0 && (
                <div className="overflow-x-auto border-2 border-black">
                    <table className="w-full text-sm">
                        <caption className="sr-only">First rows that will be imported</caption>
                        <thead className="bg-slate-100 text-left">
                            <tr>
                                <th className="p-2">Company</th>
                                <th className="p-2">Role</th>
                                <th className="p-2">Status</th>
                                <th className="p-2">Applied</th>
                            </tr>
                        </thead>
                        <tbody>
                            {summary.sample.map((row, i) => (
                                <tr key={i} className="border-t border-black/20">
                                    <td className="p-2 font-bold">{row.companyName}</td>
                                    <td className="p-2">{row.role}</td>
                                    <td className="p-2">{STATUS_LABELS[row.status]}</td>
                                    <td className="p-2 whitespace-nowrap">{row.appliedDate}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {summary.errors.length > 0 && (
                <div>
                    <p className="font-black text-sm uppercase mb-1">Rows with errors (they will be skipped)</p>
                    <ul className="max-h-40 overflow-y-auto border-2 border-black p-2 text-sm space-y-1 bg-rose-50">
                        {summary.errors.map((e) => (
                            <li key={e.row}>
                                <b>Row {e.row}:</b> {e.message}
                            </li>
                        ))}
                    </ul>
                    {summary.invalid > summary.errors.length && (
                        <p className="text-xs font-bold text-slate-600 mt-1">Showing the first {summary.errors.length} of {summary.invalid}.</p>
                    )}
                </div>
            )}

            {summary.duplicateRows.length > 0 && (
                <details className="text-sm">
                    <summary className="font-black uppercase cursor-pointer">Duplicates that will be skipped ({summary.duplicates})</summary>
                    <ul className="mt-1 max-h-32 overflow-y-auto border-2 border-black p-2 space-y-1 bg-amber-50">
                        {summary.duplicateRows.map((d) => (
                            <li key={d.row}>
                                Row {d.row}: {d.companyName}, {d.role} ({d.appliedDate})
                            </li>
                        ))}
                    </ul>
                    <p className="text-xs font-bold text-slate-600 mt-1">
                        A duplicate has the same company, role and applied date as an application you already have (or an earlier row in this file).
                    </p>
                </details>
            )}
        </div>
    );
}

function Stat({ value, label, tone }: { value: number; label: string; tone: string }) {
    return (
        <div className={`border-2 border-black p-3 ${tone}`}>
            <div className="text-3xl font-black">{value}</div>
            <div className="text-xs font-bold uppercase">{label}</div>
        </div>
    );
}
