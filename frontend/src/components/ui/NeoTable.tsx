import { type HTMLAttributes, forwardRef } from "react";
import { cn } from "../../lib/utils";

const NeoTable = forwardRef<HTMLTableElement, HTMLAttributes<HTMLTableElement>>(
    ({ className, children, ...props }, ref) => {
        return (
            <div className="w-full overflow-auto border-2 border-black shadow-neo bg-white rounded-lg">
                <table ref={ref} className={cn("w-full text-left", className)} {...props}>
                    {children}
                </table>
            </div>
        );
    }
);
NeoTable.displayName = "NeoTable";

const NeoTableHeader = forwardRef<
    HTMLTableSectionElement,
    HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
    <thead ref={ref} className={cn("bg-black text-white uppercase", className)} {...props} />
));
NeoTableHeader.displayName = "NeoTableHeader";

const NeoTableBody = forwardRef<
    HTMLTableSectionElement,
    HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
    <tbody ref={ref} className={cn("", className)} {...props} />
));
NeoTableBody.displayName = "NeoTableBody";

const NeoTableRow = forwardRef<
    HTMLTableRowElement,
    HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
    <tr
        ref={ref}
        className={cn("border-b-2 border-black last:border-0 hover:bg-yellow-100 transition-colors", className)}
        {...props}
    />
));
NeoTableRow.displayName = "NeoTableRow";

const NeoTableHead = forwardRef<
    HTMLTableCellElement,
    HTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
    <th
        ref={ref}
        className={cn("p-4 font-bold tracking-wider", className)}
        {...props}
    />
));
NeoTableHead.displayName = "NeoTableHead";

const NeoTableCell = forwardRef<
    HTMLTableCellElement,
    HTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
    <td ref={ref} className={cn("p-4 font-medium", className)} {...props} />
));
NeoTableCell.displayName = "NeoTableCell";

export {
    NeoTable,
    NeoTableHeader,
    NeoTableBody,
    NeoTableHead,
    NeoTableRow,
    NeoTableCell,
};
