import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { useState } from "react";

interface UnpaidTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[],
    data: TData[],
    isRowSelection?: boolean,
    setRowSelection?: (rows: {}) => void,
    rowSelection?: {}
}

export function DataTable<TData, TValue>({
    columns,
    data,
    setRowSelection,
    rowSelection
}: UnpaidTableProps<TData, TValue>) {

    const table = useReactTable(setRowSelection ? {
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        onRowSelectionChange: setRowSelection,
        state: {
            rowSelection
        },
    }:{
       data,
        columns,
        getCoreRowModel: getCoreRowModel(), 
    }
)

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
                        table.getRowModel().rows?.length ?
                            (
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
                            ) :
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center">
                                    Завершенных бронирований нет
                                </TableCell>
                            </TableRow>
                    }
                </TableBody>

            </Table>

        </div>
    )
}