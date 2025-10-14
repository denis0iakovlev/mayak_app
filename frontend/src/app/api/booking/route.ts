import { addMinutes, parse, format, subHours, subMinutes } from "date-fns";
import { NextResponse, NextRequest } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL
const ENDPOINT = "booking"

type BookedApiSlot = {
    booked_start: string,
    booked_end: string
}

type BookedApiResp = {
    date: string,
    court_id: number,
    booked_slots: BookedApiSlot[]
}

export type BookedResp = {
    occupedSlots: string[],
    startSlots: string[],
    endSlots: string[]
}

//Вернуть занятые слоты времени на кокретную дату на конкретном корте
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const date = searchParams.get("date")

        const court_id = searchParams.get("court_id")
        const url = `${API_URL}${ENDPOINT}?${searchParams.toString()}`;
        console.log('Get request to ', url);
        const res = await fetch(url, {
            headers: { 'Content-Type': "application/json" }
        });
        if (!res.ok) {
            return NextResponse.json({ error: "Не удалось получить данные о бронировании" }, { status: res.status })
        }
        const data = (await res.json()) as BookedApiResp;
        //Нужно преобразовать забронированное время к формату согласно клиента , то есть список времени с чередованием каждые пол часа 
        const time_slots: BookedResp = { endSlots: [], occupedSlots: [], startSlots: [] };
        for (let booked_slot of data.booked_slots) {
            time_slots.startSlots.push(booked_slot.booked_start);
            time_slots.endSlots.push(booked_slot.booked_end);
            let start = parse(booked_slot.booked_start, "HH:mm", new Date());
            let end = parse(booked_slot.booked_end, "HH:mm", new Date());
            //Добавить только промежутки между стартом и концом 
            end = subMinutes(end, 30);
            while (start < end) {
                start = addMinutes(start, 30)
                time_slots.occupedSlots.push(format(start, "HH:mm"))
            }
        }
        console.log(time_slots)
        return NextResponse.json(time_slots)
    } catch (error) {
        console.error('Ошибка', error)
        return NextResponse.json({ error: 'Ошибка внутри приложения' }, { status: 500 })
    }
}
//
export async function POST(req: NextRequest) {
    const obj = await req.json();
    console.log('📦 Получен обьект от клиента:\n', JSON.stringify(obj, null, 2));
    const response = await fetch(`${API_URL}user/booking/add`, {
        method: "POST",
        body: JSON.stringify(obj),
        headers: {
            "content-type": "application/json"
        }
    });
    if (!response.ok) {
        const text = await response.text();
        console.log(text);
        return NextResponse.json({ error: (text) }, { status: 500 });
    }
    return NextResponse.json(await response.json());
}