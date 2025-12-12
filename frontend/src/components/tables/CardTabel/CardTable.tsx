import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { flexRender, Table as RTTable } from "@tanstack/react-table";

export function CardTable<T>({
  table,
  changedRowPredicate,
  onResetRow,
}: {
  table: RTTable<T>;
  changedRowPredicate?: (row: T) => boolean;
  onResetRow?: (row: T) => void;
}) {
  return (
    <div className="flex flex-col gap-2 ">
      {table.getRowModel().rows.map((r) => {
        const changed = changedRowPredicate?.(r.original) ?? false;
        const header = r.getValue<string>("name") ?? "";
        return (
          <Card className="w-full mx-auto" key={r.id}>
            {header ? <CardHeader>{header}</CardHeader> : null}
            <CardContent className="w-full mx-auto">
              {r.getVisibleCells().map((cell) => (
                <div className="flex flex-col gap-2" key={cell.id}>
                  <p className="text-l">
                    {flexRender(
                      cell.column.columnDef.header,
                      cell.getContext() as any
                    )}
                  </p>
                  <div className="w-full mx-auto">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
