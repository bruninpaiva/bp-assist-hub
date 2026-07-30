import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/common/EmptyState";
import { TableSkeleton } from "@/components/tables/TableSkeleton";
import { cn } from "@/lib/utils";

export interface DataTableColumn<T> {
  key: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  className?: string;
}

/**
 * Standard "loading skeleton -> empty state -> table" shell shared by every
 * listing page. Column definitions keep each page in charge of what to
 * render per cell, without re-implementing the loading/empty branches.
 */
export function DataTable<T>({
  columns,
  data,
  isLoading,
  emptyIcon,
  emptyTitle,
  emptyDescription,
  getRowKey,
}: {
  columns: DataTableColumn<T>[];
  data: T[];
  isLoading?: boolean;
  emptyIcon: LucideIcon;
  emptyTitle: string;
  emptyDescription?: string;
  getRowKey: (row: T) => string;
}) {
  if (isLoading) return <TableSkeleton cols={columns.length} />;

  if (data.length === 0) {
    return <EmptyState icon={emptyIcon} title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((col) => (
            <TableHead key={col.key} className={cn(col.className)}>
              {col.header}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((row) => (
          <TableRow key={getRowKey(row)}>
            {columns.map((col) => (
              <TableCell key={col.key} className={cn(col.className)}>
                {col.cell(row)}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
