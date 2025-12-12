import { User } from "@telegram-apps/sdk-react";
import apiSrv from "../api/axios";
import {
  CourtScheme,
  BookedTimeSlots,
  BookedTimeSlotsScheme,
  CourtInfo,
  UserScheme,
  UserInfo,
} from "../schemas/Schemas";
import { AxiosRequestConfig } from "axios";
import { format } from "date-fns";
//Получение занятого времени на площадки
export async function GetBookedSlots(
  targetDate: string,
  target_court_id: number
): Promise<BookedTimeSlots> {
  //await new Promise(res=>setTimeout(res, 1000))

  const param: AxiosRequestConfig = {
    params: {
      date: format(targetDate, "yyyy-MM-dd"),
      court_id: target_court_id,
    },
  };
  try {
    const raw = await apiSrv.get("booked_slots", param);
    const data = BookedTimeSlotsScheme.safeParse(raw.data);
    if (!data.success) {
      throw data.error;
    }
    return data.data;
  } catch (e) {
    throw new Error("Не удалось получить данные о доступных бронированиях");
  }
}
//Получить все активные площадки
export async function GetActiveCourts(): Promise<Array<CourtInfo>> {
  const courts = await GetAllCourts();
  const data = courts.filter((court) => court.is_active);
  return data;
}
//Получить все корты в не зависимотси от их статуса
export async function GetAllCourts(): Promise<CourtInfo[]> {
  const raw = await apiSrv.get("courts/all");
  if (raw.status != 200 || !Array.isArray(raw.data)) {
    throw new Error("Ошибка API. Не удалось получить список кортов");
  }
  const courts = raw.data.map((court) => CourtScheme.parse(court));
  return courts;
}
//
export async function AddOrUpdateTgUser(user: User): Promise<UserInfo> {
  try {
    const userData = {
      telegram_id: user.id,
      first_name: user.firstName,
      last_name: user.lastName,
      username: user.username,
    };
    const resp = await apiSrv.post("tg_user", userData);
    if (resp.status != 200) {
      throw new Error("Не удалось зарегистрировать пользователя");
    }
    const data = UserScheme.parse(resp.data);
    return data;
  } catch (e) {
    if (e instanceof Error) {
      throw new Error(e.message);
    } else {
      throw new Error("Не удалось зарегестрировать пользователя");
    }
  }
}
