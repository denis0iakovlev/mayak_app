'use client'

import { initData, useSignal } from "@telegram-apps/sdk-react"
import { useEffect, useState } from "react";
import { GetUserBooking, Booking, SetBookingStatus } from "@/utils/userService";
import { MainButtonParams, SetMainButton } from "@/utils/tgUtils";
import BookingGroupItem from "./BookingGroupItem";
import { DataTable } from "../DataTable/data-table";
import { unpaidBookingColumns } from "./unpaid-booking-columns";
import { upcomingBookingCols } from "./upcoming_booking_columns";
import Link from "next/link";
import AcceptDialog from "../admin/accept-dialog";

type BookingGroup = Record<string, Booking[]>;

export function UserBooking() {
    const user = useSignal(initData.user);
    const [isLoading, SetIsLoading] = useState<boolean>(false);
    const [rowSelection, SetRowSelection] = useState<Object>({});
    const [bookingList, SetBookingList] = useState<BookingGroup>({});
    const [paymentSumm, SetPaymentSumm] = useState<number>(0);
    const [open, setOpen] = useState<boolean>(false);
    const mainButtonClick = async () => {
        setOpen(true);
    }
    useEffect(() => {
        updateBookingList()
    }, []);
    useEffect(() => {
        console.log(rowSelection);
        const keys = Object.keys(rowSelection)
        if (keys.length > 0) {
            let summFee = 0;
            for (const key of keys) {
                const inx = parseInt(key)
                if (inx > -1 && inx < bookingList["unpaid"].length) {
                    summFee += bookingList["unpaid"][inx].fee;
                }
            }
            SetPaymentSumm(summFee);

            const userBookingParams: MainButtonParams = {
                text: "Оплатить",
                isEnabled: true,
                isVisible: true
            }
            SetMainButton(userBookingParams, mainButtonClick)
        } else {
            const userBookingParams: MainButtonParams = {
                text: "Оплатить",
                isEnabled: true,
                isVisible: false
            }
            SetMainButton(userBookingParams, mainButtonClick)
        }
    }, [rowSelection])

    const handleAcceptPayments = async () => {
        setOpen(false);
        const keys = Object.keys(rowSelection);
        for (const key of keys) {
            const inx = parseInt(key)
            if (inx > -1 && inx < bookingList["unpaid"].length) {
                const booking = bookingList["unpaid"][inx];
                await SetBookingStatus(booking.user_id, booking.id, 1);
            }
        }
        window.location.reload();
    }

    const updateBookingList = async () => {
        SetIsLoading(true);
        let bookingGroups: BookingGroup = {};
        try {
            bookingGroups["upcoming"] = await GetUserBooking(user!.id, 'upcoming');
            bookingGroups["unpaid"] = await GetUserBooking(user!.id, 'unpaid');
        } catch (e) {
            throw e;
        } finally {
            SetBookingList(bookingGroups);
            SetIsLoading(false)
        }
    }
    if (isLoading) {
        return (
            <div className="mx-auto mt-20 w-full">
                Данные загружаются...
            </div>
        )
    }

    if (Object.keys(bookingList).length === 0) {
        return (
            <div className="my-10 p-4">
                <h6>У вас пока что нет бронирований</h6>
            </div>
        )
    }
    return (
        <div className="w-full mt-8 flex flex-col gap-4">
            {
                bookingList["unpaid"].length ?
                    <BookingGroupItem
                        title="Завершенные"
                        bookList={
                            <DataTable columns={unpaidBookingColumns} data={bookingList["unpaid"]} rowSelection={rowSelection} setRowSelection={SetRowSelection} />
                        }
                    /> : null
            }
            {
                bookingList["upcoming"].length ?
                    <BookingGroupItem
                        title="Мои бронирования"
                        bookList={<DataTable columns={upcomingBookingCols} data={bookingList["upcoming"]} />}
                    />
                    : null
            }
            {
                !bookingList["upcoming"].length && !bookingList["unpaid"].length &&
                <div className="w-full h-screen">
                    <Link href={"/"} className="mx-auto px-4 py-3 rounded-lg hover:bg-orange-100 hover:text-amber-700 my-auto text-xl text-orange-500 w-max block border shadow-2xl text-center">
                        Забронировать корт !
                    </Link>
                </div>
            }
            <AcceptDialog
                isOpen={open}
                cancelCallback={() => setOpen(false)}
                okCallback={handleAcceptPayments}
                text={
                <div>
                    <h6 className="my-4">{`Подтвердить платеж на сумму ${paymentSumm} руб`}</h6>
                    <p className="font-light text-sm p-4 border rounded-lg">
                        <span className="text-normal inline-block my-2 font-normal ">Реквизиты:</span> <br/>
                        Номер телефона: +79034701125 <br/>
                        Ф.И.О: Мария М.<br/>
                        Банк: Озон Банк
                    </p>
                </div>}
                title="Оплата корта"
            />
        </div>
    )


}