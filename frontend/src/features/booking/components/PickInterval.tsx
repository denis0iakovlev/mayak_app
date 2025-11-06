"use client"
import TimePickerV2 from "./TimePickerV2"
import { addMinutes, endOfDay, format, isAfter, isBefore, isSameDay, isSameHour, isSameMinute, isToday, set, startOfDay } from "date-fns"
import { CLOSE_TIME, get_today_near_round_time, merge_time_slots, normalize_time, OPEN_TIME, TimeSlot } from "../utils/timePickerUtils"
import useSWR from "swr"
import { getTimeSlots } from "@/services/generalService"
import { useEffect, useMemo, useState } from "react"
import { BookingPayload } from "@/schemas/Schemas"
import { initData, isMainButtonMounted, mountMainButton, useSignal } from "@telegram-apps/sdk-react"
import { create_booking } from "@/services/userService"
import { MainButtonParams, SetMainButton } from "@/utils/tgUtils"
import { MAIN_BUTTON_MAIN } from "@/styles/styles"

export type BookingInterval = {
    start_time: Date | null,
    end_time: Date | null
};

type PickInterval = {
    courtId: number,
    day: string,
}

export default function PickInterval({ courtId, day }: PickInterval) {
    const user = useSignal(initData.user);
    if (!isMainButtonMounted()) {
        mountMainButton()
    }
    const { data: slots, error, mutate } = useSWR([`time-picker`, courtId, day],
         ([, courtId, day]:[string, number, string]) => getTimeSlots(day, courtId), { suspense: true })
    if (error) {
        throw new Error("Не удалось получить данные о свобоном времени");
    }
    const [interval, setInterval] = useState<BookingInterval>({ start_time: null, end_time: null })
    //Добавить слоты учитывающие открытие и закрытие помещения, а также особый случай ,
    // Если дата брони сегодня то учитывать текущее время
    const [free_times, startBookingTimes, endBookingTimes] = useMemo( ()=>prepare_time_slots(new Date(day), slots.booked_slots), [slots]);
    useEffect(() => {
        const canSubmit = (interval.start_time !== null && interval.end_time !== null)
        const params: MainButtonParams = {
            isEnabled: canSubmit ,
            isVisible: true,
            text: canSubmit ? "Забронировать" : "Укажите время",
            backgroundColor: MAIN_BUTTON_MAIN
        }
        SetMainButton(params, submitBooking);
    }, [interval])

    const submitBooking = async () => {
        if (!user || interval.start_time === null || interval.end_time === null)
            return;
        
        const payload: BookingPayload = {
            user_id: user.id,
            date: day,
            start_time: format(interval.start_time, "HH:mm"),
            end_time: format(interval.end_time, "HH:mm"),
            court_id: courtId
        }
        try {
            await create_booking(payload);
            await mutate()
        } catch (e) {
            throw new Error("Не удалось создать бронирование" + e)
        } finally {
            setInterval({
                start_time: null,
                end_time: null
            })
        }
    }
    const handleChangePickSlot = (start: Date | null, end: Date | null) => {
        setInterval({ end_time: end, start_time: start })
    }
    return (
        <div>
            <TimePickerV2
                slots={free_times}
                start={interval.start_time}
                end={interval.end_time}
                startBookingTimes={startBookingTimes}
                endBookingTimes={endBookingTimes}
                onChange={handleChangePickSlot}
            />
        </div>
    )
}

function get_free_time_of_day(booked_slots: TimeSlot[]): Date[] {
    const normalized_slots: TimeSlot[] = booked_slots.map(slot => ({
        booked_start: normalize_time(slot.booked_start),
        booked_end: normalize_time(slot.booked_end)
    }))

    let start = set(new Date(0), {
        hours: 0,
        minutes: 1,
        seconds: 0,
        milliseconds: 0
    });

    let end = set(new Date(0), {
        hours: CLOSE_TIME.hours,
        minutes: CLOSE_TIME.minutes,
        seconds: 0,
        milliseconds: 0
    });

    if (booked_slots.length > 0) {
        const inx = normalized_slots.findIndex(s => isSameHour(s.booked_end, end) && isSameMinute(s.booked_end, end))
        if (inx > -1) {
            end = normalized_slots[inx].booked_start
        }
    }

    const free_times: Date[] = []
    while (start <= end) {
        const inx = normalized_slots.findIndex(slot => start > slot.booked_start && start < slot.booked_end)
        if (inx < 0) {
            free_times.push(start);
        } else {
            if (normalized_slots[inx].booked_end <= end) {
                free_times.push(normalized_slots[inx].booked_end)
            }
            start = normalized_slots[inx].booked_end
        }
        start = addMinutes(start, 30)
    }
    return free_times;
}

function prepare_time_slots(target_day: Date, time_slots: TimeSlot[]) {
    //Добавить слоты учитывающие открытие и закрытие помещения, а также особый случай ,
    // Если дата брони сегодня то учитывать текущее время
    const startSlot: TimeSlot = {
        booked_start: startOfDay(new Date(0)),
        booked_end: set(new Date(0), {
            hours: OPEN_TIME.hours,
            minutes: OPEN_TIME.minutes,
            seconds: 0,
            milliseconds: 0
        })
    }
    const occuped_slots: TimeSlot[] = [startSlot, ...time_slots, {
        booked_start: set(
            new Date(0), {
            hours: CLOSE_TIME.hours,
            minutes: CLOSE_TIME.minutes,
            seconds: 0,
            milliseconds: 0
        }
        ),
        booked_end: endOfDay(new Date(0))
    }]
    //
    const now = new Date()
    const nowTime = set(
        new Date(0),
        {
            hours:now.getHours(),
            minutes:now.getMinutes(),
        }
    )
    if (isToday(target_day) && nowTime > startSlot.booked_end ) {
        const start_slots = normalize_time(get_today_near_round_time());
        occuped_slots[0].booked_end = start_slots;
        let next_end = occuped_slots[1].booked_end;
        while (start_slots > next_end) {
            occuped_slots.splice(1, 1);
            next_end = occuped_slots[1].booked_end;
        }

    }
    const normalized:TimeSlot[] = occuped_slots.map(slot => ({
        booked_end:normalize_time(slot.booked_end),
        booked_start:normalize_time(slot.booked_start)
    }))
    const mergedIntervals = merge_time_slots(normalized);
    //Получить свободные слоты для заполнения выбора времени 
    const free_times = get_free_time_of_day(mergedIntervals);
    const startBookingTimes = mergedIntervals.map(interval => interval.booked_start)
    const endBookingTimes = mergedIntervals.slice(1, undefined).map(interval => interval.booked_end)
    return [free_times, startBookingTimes, endBookingTimes]
}