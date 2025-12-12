import { z } from "zod/v4";
import apiSrv from "../api/axios";
import { BookingInfo, BookingPayload, BookingScheme } from "../schemas/Schemas";
import { AxiosRequestConfig } from "axios";

export async function GetUserBooking(
  user_id: number,
  status: number
): Promise<BookingInfo[]> {
  try {
    console.log(user_id);
    const param: AxiosRequestConfig = {
      params: {
        status: status,
      },
    };
    const resp = await apiSrv.get(`user/${user_id}/bookings`, param);
    const data = (await resp.data) as [];
    const bookings = data.map((book) => BookingScheme.parse(book));
    return bookings;
  } catch (e) {
    throw e;
  }
}
//отменить бронирование
export async function SetBookingStatus(
  user_id: number,
  booking_id: number,
  new_status: number
) {
  try {
    const cnx = { booking_id, new_status };
    const resp = await apiSrv.patch(`user/${user_id}/booking`, cnx);
    if (resp.status != 200) {
      throw new Error(resp.data);
    }
  } catch (e) {
    if (e instanceof Error) {
      throw new Error(e.message);
    } else {
      throw new Error("Не удалось отменить бронирование");
    }
  }
}
//Забронировать время
export async function create_booking(
  user_id: number,
  new_booking: BookingPayload
) {
  const resp = await apiSrv.post(`user/${user_id}/booking`, new_booking);
  const created = BookingScheme.safeParse(resp.data);
  if (!created.success) {
    throw new Error(
      `Полученные от сервера данные не соответсвуют схеме ${created.error}`
    );
  }
  return created.data;
}
