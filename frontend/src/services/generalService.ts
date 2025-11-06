import apiSrv from "../api/axios";
import { CourtScheme, BookedTimeSlots, BookedTimeSlotsScheme, CourtInfo } from "../schemas/Schemas";
import { AxiosRequestConfig } from "axios";
import { format } from "date-fns";

//Получение занятого времени на площадки
export async function getTimeSlots(targetDate: string, target_court_id: number): Promise<BookedTimeSlots> {
    //await new Promise(res=>setTimeout(res, 1000))

    const param: AxiosRequestConfig = {
        params: {
            date: format(targetDate, "yyyy-MM-dd"),
            court_id: target_court_id
        }
    }
    try {
        const raw = await apiSrv.get("booking", param)
        const data = BookedTimeSlotsScheme.safeParse(raw.data);
        if (!data.success) {
            throw data.error
        }
        return data.data;
    } catch (e) {
        throw new Error("Не удалось получить данные о доступных бронированиях")

    }
}
//Получить все активные площадки
export async function get_active_courts(): Promise<Array<CourtInfo>> {
    const courts = await get_all_courts();
    const data = courts.filter(court => court.is_active)
    return data
}
//Получить все корты в не зависимотси от их статуса
export async function get_all_courts():Promise<CourtInfo[]> {
    const raw = await apiSrv.get("courts/all")
    if (raw.status != 200 || !Array.isArray(raw.data)){
        throw new Error("Ошибка API. Не удалось получить список кортов");
    }
    const courts = raw.data.map((court)=>CourtScheme.parse(court));
    return courts;
    
}

