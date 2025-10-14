import { addMinutes, getMinutes, roundToNearestHours, roundToNearestMinutes, set } from "date-fns";
import { minutesInHour } from "date-fns/constants";
import { TimeSlot } from "../hooks/useTimeSlots";

export function get_today_near_round_time(): Date {
    const now = new Date();
    const nearestUpHour = roundToNearestHours(now, { roundingMethod: "ceil" })
    const minutes = getMinutes(now)
    if (minutes > minutesInHour / 2) {
        return addMinutes(nearestUpHour, 30)
    }
    return nearestUpHour;
}

export function normalize_time(datetime: Date): Date {
    return set(
        new Date(0),
        {
            hours: datetime.getHours(),
            minutes: datetime.getMinutes()
        }
    )
}

export function merge_time_slots(time_slots: TimeSlot[]) {
    const merged_slots: TimeSlot[] = []
    for (let i = 0; i < time_slots.length - 1;) {
        const start = time_slots[i].booked_start; //начало текущее
        let end = time_slots[i].booked_end // Конец диапазона
        i++;
        let next_start: Date = time_slots[i].booked_start;
        while (next_start <= end && i < time_slots.length) { // Условие выполняется если конец диапазона равен началу следующего
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