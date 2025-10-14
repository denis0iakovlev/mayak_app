import { BookedTimeSlots } from "@/schemas/Schemas";
import { getTimeSlots } from "@/services/generalService";
import { addMinutes, format, isSameDay, isToday, startOfDay, subMinutes } from "date-fns";
import useSWR from "swr";
import { get_today_near_round_time } from "../utils/timePickerUtils";


export type TimeSlot = {
    booked_start: Date,
    booked_end: Date
}
export type TimeSlotsProps = {
    isError: boolean,
    refresh: () => void,
    booked_slots: TimeSlot[],
    isLoading: boolean
}

export function useTimeSlots(date: Date, court_id: number): TimeSlotsProps {
    const { data, error, mutate, isLoading } = useSWR<BookedTimeSlots>(["get-time-slots", date, court_id],
        ([, targetDate, targetCourtId]: [string, Date, number]) => getTimeSlots(targetDate, targetCourtId),
        { suspense: true }
    )
    if (error || ! data) {
        return {
            isError: true,
            refresh: () => new Error("Ошибка получения данных о занятом времени"),
            booked_slots: [],
            isLoading: false
        }
    }
    //const timeSlots = to_time_picker_parameters(data?.booked_slots)
    return {
        isError: false,
        refresh: () => mutate(),
        booked_slots: data.booked_slots,
        isLoading
    }
}