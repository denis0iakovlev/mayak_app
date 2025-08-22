import { z } from "zod/v4";
import apiSrv from "./axios";
import { BookingSchema, UserBookingSchema, UserSchema } from "./schemas";
import { AxiosRequestConfig } from "axios";
import { User } from "@telegram-apps/sdk-react";

export type Booking = z.infer<typeof UserBookingSchema>;

export async function GetUserBooking(user_id: number, typeBooking: "upcoming" | "unpaid") {
    try {
        console.log(user_id)
        const param: AxiosRequestConfig = {
            params: {
                user_id: user_id,
                status: typeBooking === "unpaid" ? 2 : 0
            }
        }
        const resp = await apiSrv.get(`user/booking`, param);
        const data = (await resp.data) as [];
        const bookings = data.map(book => (UserBookingSchema.parse(book)));
        return bookings;
    } catch (e) {
        throw e;
    }
}
export type MayakUser = z.infer<typeof UserSchema>;
export async function RegistryUser(user: User): Promise<MayakUser> {
    try {
        const userData = {
            telegram_id: user.id,
            first_name: user.firstName,
            last_name: user.lastName,
            username: user.username
        }
        const resp = await apiSrv.post('check_user',userData);
        if (resp.status != 200) {
            throw new Error("Не удалось зарегистрировать пользователя");
        }
        const data = UserSchema.parse(resp.data);
        return data;

    } catch (e) {

        if (e instanceof Error) {
            throw new Error(e.message);
        } else {
            throw new Error("Не удалось зарегистировать пользователя")
        }
    }
}
//отменить бронирование
export async function SetBookingStatus(user_id:number, booking_id:number, new_status:number){
    try{
        const cnx = {user_id, booking_id, new_status}
        const resp = await apiSrv.patch("user/booking/change_status", cnx);
        if(resp.status != 200){
            throw new Error(resp.data);
        }
    }catch(e){
        if(e instanceof Error){
            throw new Error(e.message)
        }else{
            throw new Error("Не удалось отменить бронирование");
        }
    }
}
