'use client'
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar_user_book/calendar";
import { useEffect, useState, useRef } from "react";
import { addDays, differenceInMinutes, endOfDay, format, subDays } from "date-fns";
import { ru } from "date-fns/locale";
import TimePickerV2 from "@/components/bookingPage/TimePickerV2";
import SelectCourt from "@/components/bookingPage/SelectCourt";
import { mainButton, useSignal, initData, type User} from "@telegram-apps/sdk-react";
import { BookedResp } from "@/app/api/booking/route";
import { SetMainButton } from "@/utils/tgUtils";
import { difference } from "next/dist/build/utils";

export type Booking = {
    tgUser: User,
    date: Date,
    start_time: string | null,
    end_time: string | null,
    court_id?: number
}

function isComplete(booking: Booking) {
    return (booking.court_id && booking.date && booking.end_time && booking.start_time) ? true : false;
}

const matcher = {
    from: new Date(2019, 1, 2),
    to: subDays(new Date(), 1)
};
const now = new Date()
if (differenceInMinutes(endOfDay(now), now) <= 60){
    matcher.to = now;
}

export function Booking() {
    const user = useSignal(initData.user);
    const [booking, SetBooking] = useState<Booking>({
        tgUser:user!,
        date: addDays(matcher.to,1),
        start_time: null,
        end_time: null,
    });
    const [occupedTime, SetOccupedTime] = useState<BookedResp>({ endSlots: [], occupedSlots: [], startSlots: [] });
    const bookingRef = useRef(booking);
    const handleChange = (start: string | null, end: string | null) => {
        console.log("Изменение диапазона времени бронирования");
        SetBooking(prev => ({ ...prev, start_time: start, end_time: end }))
    }
    const handleBookingClick = async (book: Booking) => {
        const bookingToApi = {
            user_id: book.tgUser.id,
            date: format(book.date, "yyyy-MM-dd"),
            start_time: book.start_time,
            end_time: book.end_time,
            court_id: book.court_id
        }
        const resp = await fetch("/api/booking", {
            method: "POST",
            body: JSON.stringify(bookingToApi),
            headers: {
                "content-type": "application/json"
            }
        })
        let msg;
        const data = await resp.json();
        if (resp.ok) {
            msg = "Бронирование прошло успешно !!!"
        } else {
            msg = `Не удалось забронировать ${data}`
        }
        alert(msg);
        window.location.reload();
    }
    //
    useEffect(() => {
        const params = {
            isVisible: true,
            isEnabled: isComplete(booking),
            text: "Забронировать",
        }
        const handleClick =  ()=>{
             handleBookingClick(bookingRef.current).then().catch();
        }
        SetMainButton(params, handleClick);
      }, [])
    //
    useEffect(() => {
        console.log(JSON.stringify(booking));
        const complete = isComplete(booking);
        if (mainButton.isMounted()) {
            mainButton.setParams({
                isEnabled: complete
            })
        }
        bookingRef.current = booking;
    }, [booking.start_time, booking.end_time])
    //Изменение id корта или даты , необходимо отправить запрос на сервер для получения забронированного времени
    useEffect(() => {
        if (!booking.court_id)
            return;
        console.log(`Получить данные о бронировании на корте ${booking.court_id} на ${format(booking.date, "yyyy-MM-dd")} для пользователя ${user?.id}`);
        const get_occupedTime = async () => {
            const searchParams = new URLSearchParams();
            searchParams.set("date", format(booking.date, "yyyy-MM-dd"))
            searchParams.set("court_id", `${booking.court_id}`);
            const response = await fetch(`/api/booking?${searchParams.toString()}`)
            const data = await response.json();
            if (!response.ok) {
                alert(`${data["error"]}`)
            } else {
                SetOccupedTime((data as BookedResp));
            }
        }
        get_occupedTime()
    }, [booking.court_id, booking.date])
    //
    return (
        <Card className="">
            <CardContent className="flex flex-col gap-3">
                <SelectCourt SetCourt={(court_id: number) => SetBooking(prev => ({ ...prev, court_id: court_id }))} />
                <Calendar
                    mode="single"
                    required
                    selected={booking.date}
                    locale={ru}
                    onSelect={(newDate: Date) => {
                        SetBooking(prev => ({ ...prev, date: newDate }))
                    }}
                    disabled={matcher}
                    className={"rounded-md border-2 shadow-sm mx-auto "}
                />
                <TimePickerV2 date={booking.date} onChange={handleChange} startTimes={occupedTime.startSlots} endTimes={occupedTime.endSlots} occupedTime={occupedTime.occupedSlots} />
                <div>
                    <p className="mt-4 mx-4 text-sm text-muted-foreground">
                        Начало: <span className="font-semibold">{booking.start_time}</span>
                    </p>
                    <p className="mt-4 mx-4 text-sm text-muted-foreground">
                        Конец: <span className="font-semibold">{booking.end_time}</span>
                    </p>
                </div>
            </CardContent>
        </Card>
    );

}