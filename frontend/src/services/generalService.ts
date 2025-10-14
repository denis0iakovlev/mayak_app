import apiSrv from "../api/axios";
import { CourtScheme, BookedTimeSlots, BookedTimeSlotsScheme, CourtInfo } from "../schemas/Schemas";
import { AxiosRequestConfig } from "axios";
import { format } from "date-fns";

//Получение занятого времени на площадки
export async function getTimeSlots(targetDate: Date, target_court_id: number):Promise<BookedTimeSlots> {
    //await new Promise(res=>setTimeout(res, 1000))
    const param: AxiosRequestConfig = {
        params: {
            date: format(targetDate, "yyyy-MM-dd"),
            court_id: target_court_id
        }
    }
    const raw = await apiSrv.get("booking", param)
    const data = BookedTimeSlotsScheme.safeParse(raw.data);
    if (!data.success){
        throw data.error
    }
    return data.data;
}
//Получить все активные площадки
export async function get_active_courts():Promise<Array<CourtInfo>>
{
    await new Promise(res=>setTimeout(res, 2000))
    const raw = await apiSrv.get("courts/all")
    if (! Array.isArray(raw.data)){
        throw new Error("Ошибка получения данных")
    }
    const data = raw.data.map(to=>CourtScheme.parse(to)).filter(court=> court.is_active)
    return data
}

