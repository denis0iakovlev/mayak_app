import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../table";

interface UnpaidTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[],
    data: TData[],
    isRowSelection?: boolean,
    setRowSelection?: (rows: {}) => void,
    rowSelection?: {},
    getRowId?: (row: TData, relativeIndex: number) => string
}

export function DataTable<TData, TValue>({
    columns,
    data,
    setRowSelection,
    rowSelection,
    getRowId
}: UnpaidTableProps<TData, TValue>) {
    if (data.length === 0) {
        return null;
    }
    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getRowId,
        ...(
            setRowSelection ?
                {
                    onRowSelectionChange: setRowSelection,
                    state: {
                        rowSelection
                    },
                } : {}
        ),
    })
    return (
        <div className="overflow-hidden rounded-md border" >
            <Table>
                <TableHeader>
                    {
                        table.getHeaderGroups().map((headerGroup) => {
                            return (
                                <TableRow key={headerGroup.id}>
                                    {
                                        headerGroup.headers.map((header) => (
                                            <TableHead key={header.id}>
                                                {
                                                    header.isPlaceholder
                                                        ? null :
                                                        flexRender(
                                                            header.column.columnDef.header,
                                                            header.getContext()
                                                        )
                                                }
                                            </TableHead>
                                        ))
                                    }
                                </TableRow>
                            )
                        })
                    }
                </TableHeader>
                <TableBody>
                    {
                        table.getRowModel().rows.map((row) => (
                            <TableRow
                                key={row.id}
                                date-state={row.getIsSelected().toString() && "selected"}>
                                {
                                    row.getVisibleCells().map((cell) => {
                                        return (
                                            <TableCell key={cell.id}>
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </TableCell>
                                        )
                                    })
                                }
                            </TableRow>
                        ))
                    }
                </TableBody>

            </Table>

        </div>
    )
}