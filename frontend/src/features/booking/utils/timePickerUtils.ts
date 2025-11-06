import { addDays, addMinutes, getMinutes, roundToNearestHours, roundToNearestMinutes, set } from "date-fns";
import { minutesInHour } from "date-fns/constants";
export type TimeSlot = {
    booked_start: Date,
    booked_end: Date
}

export const OPEN_TIME = {
    hours: 8,
    minutes: 0
}
export const CLOSE_TIME = {
    hours: 22,
    minutes: 0
}

export function getBookingDateStart(){
    const now = new Date();
    const limitTime = set(now,{
        hours:CLOSE_TIME.hours,
        minutes:CLOSE_TIME.minutes,
        milliseconds:0,
        seconds:0
    });
    if (now > limitTime){
        return addDays(now, 1)
    }
    return now;
}
//
export function get_today_near_round_time(): Date {
    const now = new Date();
    const nearestUpHour = roundToNearestHours(now, { roundingMethod: "ceil" })
    const minutes = getMinutes(now)
    if (minutes > minutesInHour / 2) {
        return addMinutes(nearestUpHour, 30)
    }
    return nearestUpHour;
}
//
export function normalize_time(datetime: Date): Date {
    return set(
        new Date(0),
        {
            hours: datetime.getHours(),
            minutes: datetime.getMinutes()
        }
    )
}
//
export function merge_time_slots(time_slots: TimeSlot[]) {
    const merged_slots: TimeSlot[] = []
    for (let i = 0; i < time_slots.length - 1;) {
        const start = time_slots[i].booked_start; //начало текущее
        let end = time_slots[i].booked_end // Конец диапазона
        i++;
        let next_start: Date = time_slots[i].booked_start;
        while (next_start <= end && i < time_slots.length-1) { // Условие выполняется если конец диапазона равен началу следующего
            end = time_slots[i++].booked_end
            next_start = time_slots[i].booked_start;//берем следуюшее начало диапазона       
        }
        //
        merged_slots.push({
            booked_start: start,
            booked_end: end
        })
    }
    return merged_slots;
}