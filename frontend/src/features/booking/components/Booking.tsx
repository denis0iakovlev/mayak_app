'use client'
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar_user_book/calendar";
import { useEffect, useState, useRef, useMemo } from "react";
import { addDays, addMinutes, differenceInMinutes, endOfDay, format, getMinutes, subDays, subMinutes } from "date-fns";
import { ru } from "date-fns/locale";
import TimePickerV2, { BookingInterval } from "@/features/booking/components/TimePickerV2";
import SelectCourt from "@/features/booking/components/SelectCourt";
import { mainButton, useSignal, initData, type User } from "@telegram-apps/sdk-react";
import { SetMainButton } from "@/utils/tgUtils";
import useSWR from "swr"
import { get_active_courts, getTimeSlots } from "@/services/generalService";
import NoActiveCourtsError from "../../../components/Error/NoCourtsError";
import { BookingPayload, create_booking } from "@/services/userService";
import { useBookingForm } from "../hooks/useBookingForm";
import PickInterval from "./PickInterval";
import useCourts from "../hooks/useCourts";

export type Booking = {
    tgUser: User,
    date: Date,
    bookingInterval: BookingInterval
    court_id?: number
}

const matcher = {
    from: new Date(2019, 1, 2),
    to: subDays(new Date(), 1)
};
const now = new Date()
//
export function Booking() {
    const init = useMemo(()=>({ courtId: 1, date: now }), [])
    const bookingForm = useBookingForm(init)
    const user = useSignal(initData.user);
    const handleBookingClick = async () => {
        const payload: BookingPayload = {
            user_id: user.id,
            date: format(bookingForm.date, "yyyy-MM-dd"),
            start_time: format(bookingForm.interval.start, "HH:mm"),
            end_time: format(bookingForm.interval.end, "HH:mm"),
            court_id: bookingForm.courtId
        }
        const created = await create_booking(payload);
        occupedSlots.booked_slots.push({ booked_end: created.end_time, booked_start: created.start_time });
        bookingForm.reset()
    }
    //
    useEffect(() => {
        const params = {
            isVisible: true,
            isEnabled: bookingForm.canSubmit,
            text: "Забронировать",
        }
        const handleClick = () => {
            handleBookingClick().then().catch();
        }
        SetMainButton(params, handleClick);
    }, [bookingForm.canSubmit])
    
    const handleChangeInterva = (interval) => {
        bookingForm.setInterval({ end: interval.endTime, start: interval.startTime })
    }
    return (
        <Card className="">
            <CardContent className="flex flex-col gap-3">
                <SelectCourt SetCourt={bookingForm.setCourtId} />
                <Calendar
                    mode="single"
                    required
                    selected={bookingForm.date}
                    locale={ru}
                    onSelect={bookingForm.setDate}
                    disabled={matcher}
                    className={"rounded-md border-2 shadow-sm mx-auto "}
                />
                <PickInterval
                    slots={bookingForm.slots}
                    day={bookingForm.date}
                    onChange={handleChangeInterva}
                    value={{ endTime: bookingForm.interval.end, startTime: bookingForm.interval.start }}
                />

                <div>
                    <p className="mt-4 mx-4 text-sm text-muted-foreground">
                        Начало: <span className="font-semibold">{bookingForm.interval.start ? format(bookingForm.interval.start, "HH:mm") : "Не выбрано"}</span>
                    </p>
                    <p className="mt-4 mx-4 text-sm text-muted-foreground">
                        Конец: <span className="font-semibold">{bookingForm.interval.end ? format(bookingForm.interval.end, "HH:mm") : "Не выбрано"}</span>
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
