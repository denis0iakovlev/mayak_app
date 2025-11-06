import { ColumnDef } from "@tanstack/react-table"
import { Checkbox } from "../../../components/ui/checkbox"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { BookingInfo } from "@/schemas/Schemas"

const headerClass = cn("text-md font-stretch-50%")

export const userBookingsCols: ColumnDef<BookingInfo>[] = [
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
        accessorFn: row => format(row.date, "dd.MM.yyyy"),
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
         accessorFn: row => {
            return row.court.name;
        }
    },
    {
        id: "summ",
        header: () => <div className={headerClass}>Сумма</div>,
        accessorKey:"fee"
    },
]