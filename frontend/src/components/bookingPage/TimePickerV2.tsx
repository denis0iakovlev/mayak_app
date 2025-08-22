'use client'

import { useState } from "react";
import { Button } from "../ui/button";
import { addHours, addMinutes, compareAsc, compareDesc, endOfDay, format, isSameDay, isSameHour, isToday, parse, startOfDay, startOfHour, subMinutes } from "date-fns";

export type BookingInterval = {
    startTime: string | null,
    endTime: string | null
}

export type TimePickerProps = {
    date?: Date,
    occupedTime: string[],
    startTimes: string[],
    endTimes: string[],
    onChange: (start: string | null, end: string | null) => void
}

function generateHalfHourOptions(startSlot: string, endSlot: string,
    occupedTime: string[] = []
): string[] {
    let current = parse(startSlot, "HH:mm", new Date());
    const end = parse(endSlot, "HH:mm", new Date());
    const options = []
    while (current < end && current < endOfDay(new Date())) {
        const currentStr = format(current, "HH:mm");
        if (!occupedTime.includes(currentStr)) {
            options.push(currentStr);
        }
        current = addMinutes(current, 30);
    }
    return options;
}

function calcStartTime(date: Date, openCortSlot: string): TimeSlot {
    let startTime = parse(openCortSlot, "HH:mm", date);
    
    if (isToday(date) && startTime < new Date()) {
        startTime = new Date();
        const minutes = startTime.getMinutes();
        if (minutes < 15) {
            startTime = addMinutes(startOfHour(startTime), 30);
        } else if (minutes > 45) {
            startTime = addMinutes(startOfHour(startTime), 90);
        } else {
            startTime = addMinutes(startOfHour(startTime), 60);
        }
    }
    return format(startTime, "HH:mm");
}

type TimeSlot = string;

export default function TimePickerV2({ date, occupedTime, startTimes, endTimes, onChange }: TimePickerProps) {
    const [startTime, setStartTime] = useState<TimeSlot | null>(null);
    const [endTime, setEndTime] = useState<TimeSlot | null>(null);
    if (!date) {
        date = new Date()
    }
    if (!occupedTime) {
        occupedTime = []
    }
    const start = calcStartTime(date, "05:00");
    console.log("Selected start in " , start);
    if (startTimes?.includes(start)) {
        occupedTime.push(start);
    }
    const options = generateHalfHourOptions(start, "23:59", occupedTime);
    //
    const handleClick = (slot: TimeSlot) => {
        //Случай когда уже выбрано и время начало 
        if ((!startTime || (startTime && endTime)) && !isStartBooked(slot)){
            setStartTime(slot);
            setEndTime(null);
            onChange(slot, null)
        } else if ( startTime && slot > startTime && !isEndBooked(slot) && !includesInInterval(slot)) {
            setEndTime(slot);
            onChange(startTime, slot)
        } else if (!isStartBooked(slot)) {
            setStartTime(slot);
            setEndTime(null);
            onChange(slot, null)
        }

    }
    const isSelected = (slot: string) => {
        if (!startTime) return false;
        if (!endTime) return slot === startTime;
        return slot >= startTime && slot <= endTime;
    };

    const isStart = (slot: string) => slot === startTime;
    const isEnd = (slot: string) => slot === endTime;
    const isStartBooked = (slot: string) => startTimes.includes(slot);
    const isEndBooked = (slot: string) => endTimes.includes(slot);
    const includesInInterval = ( end:string)=>{
        if (!startTime)
            return false;
        const startTm = parse(startTime,"HH:mm", new Date() )
        const endTime = parse(end, "HH:mm", new Date());
        //
        const startTmList = startTimes.map(time=>parse(time, "HH:mm", new Date()));
        const endTmList = startTimes.map(time=>parse(time, "HH:mm", new Date()));
        let inx = 0;
        while(inx < startTmList.length){
            const intervalStart = startTmList[inx];
            const intervalEnd = startTmList[inx];
            if (intervalStart > startTm && intervalEnd < endTime){
                return true;
            }
            inx++;
        }
        return false;
    }

    return (
        <div>
            <div className="flex flex-row flex-wrap">
                {
                    options.map((interval, inx) => {
                        const selected = isSelected(interval);
                        const start = isStart(interval);
                        const end = isEnd(interval);
                        const base = 'px-2 py-1 m-1 border rounded-md transition-all text-black hover:bg-blue-500';
                        const common = selected ? 'bg-blue-100 border-blue-400 text-blue-700' : 'bg-white border-gray-300';
                        const special =
                            start && end
                                ? 'bg-blue-500 text-white'
                                : start
                                    ? 'bg-blue-500 text-white rounded-l-xl'
                                    : end
                                        ? 'bg-blue-500 text-white rounded-r-xl'
                                        : '';
                        //
                        const startIsBooked = isStartBooked(interval);
                        const endIsBooked = isEndBooked(interval);
                        const limitted = !selected && ((startIsBooked && "border border-orange-500") || (endIsBooked && "border border-green-500"))

                        return (<Button key={interval} onClick={() => {
                            handleClick(interval)
                        }} className={`${base} ${common} ${special} ${limitted}`}>
                            {interval}
                        </Button>
                        )
                    }
                    )
                }
            </div>
        </div>
    )
}