import UpDownCollapse from "@/components/ui/custom/UpDownCollaps";
import { get_admin_booking_list } from "@/services/adminService";
import { initData, useSignal } from "@telegram-apps/sdk-react";
import { format } from "date-fns";
import useSWR from "swr";
import { bookings_columns } from "../columns/booking-cols";
import { DataTable } from "@/components/ui/custom/data-table";
import { CourtInfo } from "@/schemas/Schemas";

export function AdminBookings({ date, courts }: { date: Date, courts:CourtInfo[] }) {
    const user = useSignal(initData.user);
    if (!user) {
        throw new Error("Пользователь не аутенцифицирован")
    }
    if (!courts){
        throw new Error("Не удалось получить список кортов")
    }
    const { data: bookings, error, mutate } = useSWR(`get-admin-booking-${date.getDate().toString()}`,
        () => (get_admin_booking_list(user.id, date)), { suspense: true });
    
    return (
        <UpDownCollapse
            title={`Бронирования на ${format(date, "dd/MM/yyyy")}`}
            collapsible={
                <DataTable columns={bookings_columns(user!.id, courts)} data={bookings} />
            }
        />
    )
}