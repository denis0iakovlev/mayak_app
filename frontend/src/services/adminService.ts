import { AxiosRequestConfig } from "axios";
import apiSrv from "@/api/axios";
import { format } from "date-fns";
import {BookingInfoWithUser, BookingWithUserScheme, UserInfo, UserScheme } from "@/schemas/Schemas";

export async function GetBookings(admin_id: number, targetDate: Date): Promise<BookingInfoWithUser[]> {
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
        const bookingsList = data.map(booking => (BookingWithUserScheme.parse(booking)))
        return bookingsList;
    } catch (err) {
        console.log(err);
        throw new Error(`Не удалось получить список бронирований ${(err as Error).message}`);
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
        const resp = await apiSrv<UserInfo[]>(`admin/user/all`, param);
        if (resp.status != 200) {
            throw new Error(resp.statusText)
        }
        const res = resp.data.map(d => UserScheme.parse(d))
        return res;
    } catch (e) {
        throw e;
    }
}

export type UpdateUserData = Partial<Pick<UserInfo, "is_trainer" | "username" | "phone_number">> &
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
        throw e;
    }
}


