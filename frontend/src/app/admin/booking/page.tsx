'use client'
import { adminBookingCols } from "@/components/admin/booking/admin-booking-cols";
import Calendar23 from "@/components/calendar-23";
import { DataTable } from "@/components/DataTable/data-table";
import BookingGroupItem from "@/components/UserBookings/BookingGroupItem";
import { AdminBooking, CourtInfo, GetBookings, GetCourts } from "@/utils/adminService";
import { initData, useSignal } from "@telegram-apps/sdk-react";
import { format } from "date-fns";
import { useEffect, useState } from "react"


export default function AdminBookingPage() {
    const [isLoading, SetLoading] = useState<boolean>(false);
    const [selDate, SetSelDate] = useState<Date>(new Date());
    const [error, SetError] = useState<string>("")
    const [bookings, SetBookings] = useState<AdminBooking[]>([])
    const [courts, SetCourts] = useState<CourtInfo[]>([]);
    const [status, setStaus] = useState<number[]>([]);
    const user = useSignal(initData.user);
    //Получить бронирования на текущую дату
    useEffect(() => {
        const getBookings = async () => {
            SetLoading(true);
            try {
                if (user) {
                    const bookList = await GetBookings(user.id, selDate);
                    SetBookings(bookList);
                }
            } catch (e) {
                SetError((e as Error).message);
                console.log(e);
            } finally {
                SetLoading(false);
            }
        }
        const getCourts = async () => {
            SetLoading(true);
            try {
                const courts = await GetCourts();
                const aviable = courts.filter(court => court.is_active);
                SetCourts(aviable);
            } catch (e) {
                console.log(e);
                throw new Error(`Не удалось получить список кортов ${e}`);
            } finally {
                SetLoading(false);
            }

        }
        getBookings()
        getCourts();
    }, [])
    //
    if (isLoading) {
        return (
            <div className="w-full h-full">
                <p className="mx-auto my-auto">
                    Данные загружаются ...
                </p>
            </div>
        )
    }
    const handleDaySelect = async (date: Date) => {
        SetSelDate(date)
        const bookList = await GetBookings(user!.id, date);
        SetBookings(bookList);
    }
    return (
        <div className="p-4">
            <div>
                {

                }
            </div>
            <Calendar23
                selected={selDate}
                onSelect={handleDaySelect}
            />
            {
                (courts.length > 0 && user ) ?
                <BookingGroupItem
                    title={`Бронирования на ${format(selDate, "dd/MM/yyyy")}`}
                    bookList={
                        <DataTable columns={adminBookingCols(user!.id, courts)} data={bookings} />
                    }
                />
                : <div>Не удалось получить данные</div>
            }
        </div>
    )
}