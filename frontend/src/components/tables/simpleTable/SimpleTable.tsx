import {
  flexRender,
  useReactTable,
  Table as RTTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../ui/table";

type DataTableProps<T> = {
  table: RTTable<T>;
  changedRowPredicate?: (row: T) => boolean;
  onResetRow: (row: T) => void;
};

export function SimpleTable<T>({
  table,
  changedRowPredicate,
  onResetRow,
}: DataTableProps<T>) {
  return (
    <div className="overflow-hidden rounded-md border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => {
            return (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="w-fit">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            );
          })}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow
              key={row.id}
              date-state={row.getIsSelected().toString() && "selected"}
            >
              {row.getVisibleCells().map((cell) => {
                return (
                  <TableCell key={cell.id} className="w-min">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
