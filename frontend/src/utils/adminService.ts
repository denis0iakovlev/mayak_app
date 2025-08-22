import { AxiosRequestConfig } from "axios";
import apiSrv from "./axios";
import { format, parse } from "date-fns";
import { z } from "zod/v4"
import { BookingSchema, CourtSchema, UserBookingSchema, UserSchema } from "./schemas";
import { exitCode } from "process";

const API_URL = process.env.NEXT_PUBLIC_API_URL

// if (!API_URL) {
//   throw new Error("NEXT_PUBLIC_API_URL is not defined");
// }

export type AdminBooking = z.infer<typeof BookingSchema>;
export type CourtInfo = z.infer<typeof CourtSchema>;
export type User = z.infer<typeof UserSchema>;

export async function GetBookings(admin_id: number, targetDate: Date): Promise<AdminBooking[]> {
    const params: AxiosRequestConfig = {
        params: {
            admin_id: admin_id,
            targetDate: format(targetDate, "yyyy-MM-dd")
        }
    }
    try {
        const resp = await apiSrv.get("admin/booking/all", params);
        const data = await resp.data as [];
        console.log(data)
        const bookingsList = data.map(booking => (BookingSchema.parse(booking)))
        return bookingsList;
    } catch (err) {
        console.log(err);
        throw new Error(`Не удалось получить список бронирований ${(err as Error).message}`);
    }
}


export async function GetCourts(): Promise<CourtInfo[]> {
    try {
        const resp = await apiSrv.get("courts/all");
        const res = (await resp.data) as CourtInfo[];
        return res;
    } catch (e) {
        throw new Error("Не удалось получить список кортов");
    }
}

export async function BookingChangeCourt(admin_id: number, booking_id: number, court_id: number) {
    try {
        const resp = apiSrv.patch("admin/booking/change_court", { admin_id, booking_id, court_id })

    } catch (e) {
        throw e;
    }
}

export async function BookingChangeStatus(admin_id: number, booking_id: number, new_status: number) {
    try {
        const resp = await apiSrv.patch("admin/booking/change_status", { admin_id, booking_id, new_status })
        if (resp.status != 200) {
            throw new Error(resp.statusText);
        }
    } catch (e) {
        throw e;
    }
}

export async function GetAllUsers(admin_id: number) {
    try {
        const param = {
            params: {
                admin_id
            }
        }
        //const resp = await apiSrv.get("admin/user/all", param);
        const resp = await fetch(`${API_URL}admin/user/all?admin_id=${admin_id}`);
        if (resp.status != 200) {
            throw new Error(resp.statusText)
        }
        const data = (await resp.json()) as [];
        const res = data.map(d => UserSchema.parse(d))
        return res;
    } catch (e) {
        throw e;
    }
}

export type UpdateUserData = Partial<Pick<User, "is_trainer" | "username" | "phone_number">> &
{
    admin_id: number,
    user_id: number,
    role?: number
}
export async function UpdateUser(data: UpdateUserData) {
    try {
        const resp = await apiSrv.put("admin/user/update", data);
        if (resp.status != 200) {
            throw new Error(resp.data);
        }
    } catch (e) {
        if (e instanceof Error) {
            throw e;
        } else {
            throw new Error("Не удалось обновить данные пользователя");
        }
    }
}

export async function ChangePrice(payload: { admin_id: number, booking_id: number, price: number }) {
    try {
        await apiSrv.patch("admin/booking/change_price", payload);
    } catch (e) {
        
    }
}


