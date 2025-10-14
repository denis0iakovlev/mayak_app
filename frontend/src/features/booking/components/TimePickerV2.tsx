'use client'
import { cn } from "@/lib/utils";
import { Button } from "../../../components/ui/button";
import {   addMinutes, format, isAfter,  isBefore, isSameHour, isSameMinute} from "date-fns";

export type TimePickerProps = {
    slots: Date[]
    start:Date|null,
    end:Date|null,
    startBookingTimes:Date[],
    endBookingTimes:Date[],
    onChange: (start:Date|null, end:Date|null) => void
}
/**
 * 
 * @param slots, start и end должны быть нормализованы , иначе компонент не будет работать коррктно
 * 
 * @returns 
 */
export default function TimePickerV2({ 
    slots,
    start,
    end,
    endBookingTimes,
    startBookingTimes,
    onChange,
}: TimePickerProps) 
{
    //
    const startTimesSlot = startBookingTimes.map(t=>format(t, "HH:mm"))
    //startTimesSlot.pop()
    const endTimesSlot = endBookingTimes.map(t=>format(t, "HH:mm"))
    //endTimesSlot.shift()
    const isSelected = (slot: Date) => {
        if (!start) return false;
        if (!end) return isSameHour(slot, start) && isSameMinute(slot, start);
        return isAfter(slot, start) && isBefore(slot, end);
    };
    const isStart = (slot: Date) => start && isSameHour(slot, start) && isSameMinute(slot, start);
    const isEnd = (slot: Date) => end && isSameHour(slot, end) && isSameMinute(slot, end);
    const isStartRejected = (slot:Date)=> startTimesSlot.includes(format(slot, "HH:mm"))
    const isEndRejectedBooking = (slot:Date)=> endTimesSlot.includes(format(slot, "HH:mm"))


    const handlePickTime = (slot:Date)=>{
        if ((!start  ||  isBefore(slot, start) && !isStartRejected(slot) )){
            onChange(slot, null)
        }else if(start && isAfter(slot, start) && !isEndRejectedBooking(slot)){
            //Проверить что выбранный диапазон не имеет слотов из массива начал и концов
            let promo = addMinutes(start, 30);
            while( promo < slot){
                if (isStartRejected(promo) || isEndRejectedBooking(promo)){
                    return;
                }
                promo = addMinutes(promo, 30);
            }
            onChange(start, slot)
        }else if (isSameHour(slot, start) && isSameMinute(slot, start)){
            onChange(null, null)
        }
    }

    return (
        <div>
            <div className="flex flex-row flex-wrap">
                {
                    slots.map((slot, inx) => 
                    {
                        const selected = isSelected(slot);
                        const start = isStart(slot);
                        const end = isEnd(slot);
                        const startInterval = isStartRejected(slot);
                        const endInterval = isEndRejectedBooking(slot);
                        const base = 'px-2 py-1 m-1 border rounded-md transition-all text-black hover:bg-blue-500';
                        const common = selected ? 'bg-blue-100 border-blue-400 text-blue-700' : 'bg-white border-gray-300';
                        let special =
                            start && end
                                ? 'bg-blue-400 text-white'
                                : start
                                    ? 'bg-blue-400 text-white rounded-l-xl '
                                    : end
                                        ? 'bg-blue-400 text-white rounded-r-xl'
                                        : '';
                        special = cn(special, startInterval && "border-2 border-inline border-orange-500", endInterval && "border-2 border-green-500")
                        //
                        return (<Button key={inx} onClick={() => {
                            handlePickTime(slot)
                        }} className={`${base} ${common} ${special}`}>
                            {format(slot, "HH:mm")}
                        </Button>
                        )
                    }
                    )
                }
            </div>
        </div>
    )
}