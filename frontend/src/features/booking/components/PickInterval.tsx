import useSWR from "swr"
import { TimeSlot, useTimeSlots } from "../hooks/useTimeSlots"
import TimePickerV2 from "./TimePickerV2"
import { start } from "repl"
import { addMinutes, endOfDay, format, isAfter, isBefore, isSameDay, isSameHour, isSameMinute, isToday, set, startOfDay } from "date-fns"
import { get_today_near_round_time, merge_time_slots, normalize_time } from "../utils/timePickerUtils"
import Loader from "@/components/layouts/Loader"

const OPEN_TIME = {
    hours: 5,
    minutes: 30
}
const CLOSE_TIME = {
    hours: 23,
    minutes: 30
}

export type BookingInterval = {
    startTime: Date | null,
    endTime: Date | null
}
export type TimeSlot = {
    booked_start: Date,
    booked_end: Date
}

type PickInterval = {
    slots: TimeSlot[],
    day: Date,
    onChange: (value: BookingInterval) => void,
    value: BookingInterval
}

export default function PickInterval({ slots, day, onChange, value }: PickInterval) {
    //Добавить слоты учитывающие открытие и закрытие помещения, а также особый случай ,
    // Если дата брони сегодня то учитывать текущее время
    const startSlot: TimeSlot = {
        booked_start: startOfDay(day),
        booked_end: set(day, {
            hours: OPEN_TIME.hours,
            minutes: OPEN_TIME.minutes,
            seconds: 0,
            milliseconds: 0
        })
    }
    const occuped_slots: TimeSlot[] = [startSlot, ...slots, {
        booked_start: set(
            day, {
                hours: CLOSE_TIME.hours,
                minutes: CLOSE_TIME.minutes,
                seconds: 0,
                milliseconds: 0
            }
        ),
        booked_end: endOfDay(day)
    }]
    if (isToday(day)) {
        const start_slots = get_today_near_round_time();
        occuped_slots[0].booked_end = start_slots;
        let next_end = occuped_slots[1].booked_end;
        while(start_slots > next_end){
            occuped_slots.splice(1,1);
            next_end = occuped_slots[1].booked_end;
        }

    }
    const mergedIntervals = merge_time_slots(occuped_slots);
    //Получить свободные слоты для заполнения выбора времени 
    const free_times = get_free_time_of_day(mergedIntervals);
    const startBookingTimes = mergedIntervals.map(interval => interval.booked_start)
    const endBookingTimes = mergedIntervals.slice(1,undefined).map(interval => interval.booked_end)
    const handlePickTime = (start: Date | null, end: Date | null) => {
        onChange({ endTime: end, startTime: start })
    }
    return (
        <div>
            <TimePickerV2
                slots={free_times}
                start={value.startTime}
                end={value.endTime}
                startBookingTimes={startBookingTimes}
                endBookingTimes={endBookingTimes}
                onChange={handlePickTime}
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
    });;
    let end = set(new Date(0), {
        hours: 23,
        minutes: 59,
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

