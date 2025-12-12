import axios, { AxiosRequestConfig } from "axios";
import apiSrv from "@/api/axios";
import { format } from "date-fns";
import {
  BookingInfo,
  BookingInfoWithUser,
  BookingScheme,
  BookingWithUserScheme,
  UpdateCourtPayload,
  UserInfo,
  UserScheme,
} from "@/schemas/Schemas";
import { ChangeBookingPayload, UpdateUserData } from "@/schemas/AdminSchemas";

export async function GetBookingsByAdmin(
  admin_id: number,
  targetDate: Date
): Promise<BookingInfoWithUser[]> {
  const params: AxiosRequestConfig = {
    params: {
      targetDate: format(targetDate, "yyyy-MM-dd"),
      admin_id: admin_id,
    },
  };
  try {
    const resp = await apiSrv.get("admin/booking/all", params);
    const data = (await resp.data) as [];
    console.log(data);
    const bookingsList = data.map((booking) =>
      BookingWithUserScheme.parse(booking)
    );
    return bookingsList;
  } catch (err) {
    console.log(err);
    throw new Error(
      `Не удалось получить список бронирований ${(err as Error).message}`
    );
  }
}

export async function ChangeBooking(
  admin_id: number,
  booking_id: number,
  payload: ChangeBookingPayload
): Promise<BookingInfo> {
  try {
    const response = await apiSrv.patch(
      `admin/booking/${booking_id}`,
      payload,
      { params: { admin_id } }
    );
    const booking = BookingScheme.parse(response.data);
    return booking;
  } catch (err) {
    if (axios.isAxiosError(err)) {
      console.log("Ошибка Axios:", err.response?.data);
      console.log("Статус:", err.response?.status);
    } else {
      console.log("Неизвестная ошибка:", err);
    }
    throw Error("Не удалось изменить бронирование");
  }
}

export async function GetAllUsers(admin_id: number) {
  try {
    const param = {
      params: {
        admin_id,
      },
    };
    //const resp = await apiSrv.get("admin/user/all", param);
    const resp = await apiSrv<UserInfo[]>(`admin/user/users`, param);
    if (resp.status != 200) {
      throw new Error(resp.statusText);
    }
    const res = resp.data.map((d) => UserScheme.parse(d));
    return res;
  } catch (e) {
    throw e;
  }
}

export async function ChangeUser(
  changing_user_id: number,
  admin_id: number,
  payload: UpdateUserData
) {
  try {
    const resp = await apiSrv.patch(`admin/user/${changing_user_id}`, payload, {
      params: { admin_id },
    });
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

export async function ChangeCourt(
  admin_id: number,
  court_id: number,
  payload: UpdateCourtPayload
) {
  try {
    const params: AxiosRequestConfig = {
      params: {
        admin_id,
      },
    };
    await apiSrv.patch(`admin/courts/${court_id}`, payload, params);
  } catch (e) {
    throw e;
  }
}
