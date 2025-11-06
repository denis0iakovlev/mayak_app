import { z } from "zod/v4";
import apiSrv from "../api/axios";
import {BookingInfo, BookingPayloadScheme, BookingScheme, UserScheme } from "../schemas/Schemas";
import { AxiosRequestConfig } from "axios";
import { User } from "@telegram-apps/sdk-react";
import { format } from "date-fns";

export type Booking = z.infer<typeof BookingScheme>;
export type MayakUser = z.infer<typeof UserScheme>;
export type BookingPayload = z.infer<typeof BookingPayloadScheme>

export async function GetUserBooking(user_id: number, status:number):Promise<BookingInfo[]> {
    try {
        console.log(user_id)
        const param: AxiosRequestConfig = {
            params: {
                user_id: user_id,
                status: status
            }
        }
        const resp = await apiSrv.get(`user/booking`, param);
        const data = (await resp.data) as [];
        const bookings = data.map(book => (BookingScheme.parse(book)));
        return bookings;
    } catch (e) {
        throw e;
    }
}
//
export async function RegistryUser(user: User): Promise<MayakUser> {
    try {
        const userData = {
            telegram_id: user.id,
            first_name: user.firstName,
            last_name: user.lastName,
            username: user.username
        }
        const resp = await apiSrv.post('check_user', userData);
        if (resp.status != 200) {
            throw new Error("Не удалось зарегистрировать пользователя");
        }
        const data = UserScheme.parse(resp.data);
        return data;

    } catch (e) {

        if (e instanceof Error) {
            throw new Error(e.message);
        } else {
            throw new Error("Не удалось зарегестрировать пользователя")
        }
    }
}
//отменить бронирование
export async function SetBookingStatus(user_id: number, booking_id: number, new_status: number) {
    try {
        const cnx = { user_id, booking_id, new_status }
        const resp = await apiSrv.patch("user/booking/change_status", cnx);
        if (resp.status != 200) {
            throw new Error(resp.data);
        }
    } catch (e) {
        if (e instanceof Error) {
            throw new Error(e.message)
        } else {
            throw new Error("Не удалось отменить бронирование");
        }
    }
}
//Забронировать время 
export async function create_booking(new_booking:BookingPayload) {
    const resp = await apiSrv.post("user/booking/add", new_booking)
    const created = BookingScheme.safeParse(resp.data)
    if (!created.success){
        throw new Error(`Полученные от сервера данные не соответсвуют схеме ${created.error}`)
    }
    return created.data;
}