'use client'
import { useEffect, useState } from "react";
import { BookingInfo } from "@/schemas/Schemas";
import UpDownCollapse from "../../../components/ui/custom/UpDownCollaps";
import { DataTable } from "@/components/ui/custom/data-table";
import { userBookingsCols } from "../columns/user-bookings-col";
import Link from "next/link";
import AcceptDialog from "@/components/ui/accept-dialog";
import { useUserBooking } from "../hooks/useUserBooking";
import { initData, isMainButtonMounted, mountMainButton, useSignal } from "@telegram-apps/sdk-react";
import { SetMainButton } from "@/utils/tgUtils";
import Loader from "@/components/layouts/Loader";
import { MAIN_BUTTON_DELETE, MAIN_BUTTON_MAIN } from "@/styles/styles";

export function UserBooking() {
    const user = useSignal(initData.user);
    if (!user) {
        throw new Error("Пользователь не аутентифицирован.")
    }
    if (!isMainButtonMounted()) {
        mountMainButton()
    }
    const userBookings = useUserBooking(user.id);
    
    if (userBookings.isEmpty) {
        <div className="w-full h-screen">
            <Link href={"/"} className="mx-auto px-4 py-3 rounded-lg hover:bg-orange-100 hover:text-amber-700 my-auto text-xl text-orange-500 w-max block border shadow-2xl text-center">
                Забронировать корт !
            </Link>
        </div>
    }
    const [open, setOpen] = useState<boolean>(false);
    const mainButtonClick = async () => {
        if (userBookings.tableNum === 2 ){
            setOpen(true);
        }else{
            await userBookings.ChangeStatusOnPicked(3);
        }
    }
    useEffect(() => {
        SetMainButton({
            isEnabled: true,
            isVisible: userBookings.isSelected,
            text: userBookings.tableNum === 0 ? `Удалить` : `Подтвердить платеж ${userBookings.fee} руб` ,
            backgroundColor: userBookings.tableNum === 0 ? MAIN_BUTTON_DELETE : MAIN_BUTTON_MAIN
        },
            mainButtonClick);
    }, [userBookings.picked])
    const changeCurrentTable = (numTable: 0 | 2, rows: {}) => {
        userBookings.SetTableNum(numTable);
        if (numTable === 0) {
            userBookings.setUnpaidRows({})
            userBookings.setUpcomigRows(rows)
        } else {
            userBookings.setUnpaidRows(rows)
            userBookings.setUpcomigRows({})
        }
    }
    const rowIndex = (row: BookingInfo, index: number) => {
        return String(row.id);
    }
    if (userBookings.isLoading){
        let text = "Удаляем бронирования";
        if (userBookings.tableNum === 2 ){
            text = "Проводим оплату"
        }
        return <Loader message={text}/>
    }
    return (
        <div className="w-full mt-8 flex flex-col gap-4">
            {
                userBookings.unpaidBookings.length ?
                    <UpDownCollapse
                        title="Завершенные"
                        collapsible={
                            <DataTable
                                columns={userBookingsCols}
                                data={userBookings.unpaidBookings}
                                rowSelection={userBookings.unpaidRows}
                                setRowSelection={
                                    (rows: {}) => {
                                        changeCurrentTable(2, rows)
                                    }
                                }
                                getRowId={rowIndex}
                            />
                        }
                    /> : null
            }
            {
                userBookings.upcomingBookings.length ?
                <UpDownCollapse
                    title="Предстоящие"
                    collapsible={
                        <DataTable
                            columns={userBookingsCols}
                            data={userBookings.upcomingBookings}
                            rowSelection={userBookings.upcomingRows}
                            setRowSelection={(rows: {}) => {
                                changeCurrentTable(0, rows)
                            }}
                            getRowId={rowIndex}
                        />
                    }
                />
                :null

            }
            <AcceptDialog
                isOpen={open}
                cancelCallback={() => setOpen(false)}
                okCallback={async() => { 
                    await userBookings.ChangeStatusOnPicked(1)
                    setOpen(false);
                }}
                text={
                    <div>
                        <h6 className="my-4">{`Подтвердить платеж на сумму ${userBookings.fee} руб`}</h6>
                        <p className="font-light text-sm p-4 border rounded-lg">
                            <span className="text-normal inline-block my-2 font-normal ">Реквизиты:</span><br />
                            Номер телефона: +79282702071 <br />
                            Ф.И.О: Александр Н.<br />
                            Банк: Озон Банк
                        </p>
                    </div>}
                title="Оплата корта"
            />
            {
                userBookings.isLoading ?<Loader message="hello"/> :null
            }
        </div>
    )


}