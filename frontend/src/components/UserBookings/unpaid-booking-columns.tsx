import { ColumnDef } from "@tanstack/react-table"
import { Booking } from "@/utils/userService"
import { Checkbox } from "../ui/checkbox"
import { differenceInMinutes, format, minutesToHours } from "date-fns"
import { cn } from "@/lib/utils"

const headerClass = cn("text-md font-stretch-50%")

export const unpaidBookingColumns: ColumnDef<Booking>[] = [
    {
        id: "select",
        header: ({ table }) => (
            <Checkbox
                checked={
                    table.getIsAllPageRowsSelected() ||
                    (table.getIsSomePageRowsSelected() && "indeterminate")
                }
                onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                aria-label="Выбрать все"
            />
        ),
        cell: ({ row }) => (
            <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
                aria-label="Выбрать строку"
            />
        )
    },
    {
        id: "date",
        header: () => <div className={headerClass}>Дата</div>,
        accessorFn: row => format(row.dateBooking, "dd/MM/yyyy"),
    },
    {
        id: "time-slot",
        header: () => <div className={headerClass}>Время</div>,
        accessorFn: row => {
            return `${format(row.start_time, "HH:mm")}-${format(row.end_time, "HH:mm")}`
        }
    },
    {
        id: "court",
        header: () => <div className={headerClass}>Корт</div>,
        accessorKey:"court_name"
    },
    {
        id: "summ",
        header: () => <div className={headerClass}>Сумма</div>,
        accessorKey:"fee"
    },
]