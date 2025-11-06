import { flexRender, Table as RTTable } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RotateCcw } from "lucide-react";

export function EditTableVariantTable<T>({
  table,
  changedRowPredicate,
  onResetRow,
}: {
  table: RTTable<T>;
  changedRowPredicate?: (row: T) => boolean;
  onResetRow?: (row: T) => void;
}) {
  return (
    <div className="overflow-auto rounded-md border">
      <Table className=" w-full text-sm">
        <TableHeader className="bg-muted/50">
          {table.getHeaderGroups().map(hg => (
            <TableRow key={hg.id}>
              {hg.headers.map(h => (
                <TableHead key={h.id} className="px-3 py-2 text-left">
                  {flexRender(h.column.columnDef.header, h.getContext())}
                </TableHead>
              ))}
              <TableCell className="px-3 py-2"></TableCell>
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map(r => {
            const changed = changedRowPredicate?.(r.original) ?? false;
            return (
              <TableRow key={r.id} className={changed ? "bg-amber-50" : ""}>
                {r.getVisibleCells().map(c => (
                  <TableCell key={c.id} className="px-3 py-2 align-middle">
                    {flexRender(c.column.columnDef.cell, c.getContext())}
                  </TableCell>
                ))}
                <TableCell className="px-3 py-2">
                  {changed && onResetRow && (
                    <Button size="sm" variant="ghost" onClick={() => onResetRow(r.original)}>
                     <RotateCcw size={6}/>
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
