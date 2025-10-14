import { getTimeSlots } from "@/services/generalService";
import { useState } from "react";
import useSWR from "swr";

type BookingForm = {
    courtId: number,
    date?: Date,
    interval?: TimeInterval
}

type TimeInterval = {
    start: Date | null;
    end: Date | null;
}

export function useBookingForm(initValue: BookingForm) {
    const [courtId, setCourtId] = useState<number | null>(()=>initValue.courtId)
    const [date, setDate] = useState<Date>(()=>initValue.date ? initValue.date : new Date())
    const [interval, setInterval] = useState<TimeInterval>(initValue.interval || { start: null, end: null })

    const slotsKey = courtId && date ? "get-time-slots" : null
    const {data:slots, error:errorSlots } = useSWR([slotsKey, date, courtId],
        ([, targetDate, targetCourtId]: [string, Date, number]) => getTimeSlots(targetDate, targetCourtId),
        { suspense: true }
    )
    const canSubmit = (courtId != null && date && interval.start && interval.end) ? true : false;

    const reset = () => {
        setInterval({
            start: null,
            end: null
        })
    }

    return {
        courtId,
        date,
        interval,
        slots:slots.booked_slots,
        setCourtId,
        setDate,
        setInterval,
        errorSlots,
        canSubmit,
        reset
    }
}