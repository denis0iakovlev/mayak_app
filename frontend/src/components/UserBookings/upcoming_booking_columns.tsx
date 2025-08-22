import { cn } from "@/lib/utils";
import { Booking, SetBookingStatus } from "@/utils/userService";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { Button } from "../ui/button";
import { ArchiveX, DeleteIcon } from "lucide-react";
import { useMayakUser } from "../UserInitializer";
import AcceptDialog from "../admin/accept-dialog";
import { useState } from "react";

const headerClass = cn("text-md font-stretch-50%")

export const upcomingBookingCols: ColumnDef<Booking>[] = [
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
        accessorKey: "court_name"
    },
    {
        id: "summ",
        header: () => <div className={headerClass}>Сумма</div>,
        accessorKey: "fee"
    },
    {
        id: "cancelAction",
        header: () => null,
        cell: ({ row }) => {
            const [open, setOpen] = useState<boolean>(false);
            const mayakUser = useMayakUser();
            const original = row.original;
            const handleDelete = async () => {
                try{
                    if (mayakUser) {
                        await SetBookingStatus(original.user_id, original.id, 3)
                    }
                    window.location.reload();
                }catch(e){
                    throw e;
                }
                setOpen(false);
            }
            const handleClick = ()=>{
                setOpen(true);
            }
            return (
                <>
                    <div className="flex flex-row justify-between">
                        <Button variant="outline" onClick={handleClick} className="hover:bg-red-400 hover:text-white">
                            <ArchiveX  className="size-4 " />
                        </Button>
                    </div>
                    <AcceptDialog
                        cancelCallback={() => setOpen(false)}
                        okCallback={handleDelete}
                        isOpen={open}
                        text="Вы уверены что хотите отменить бронирование ?"
                        title="Отмена бронирования"
                    />
                </>
            )
        }
    }
]