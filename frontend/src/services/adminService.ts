import axios, { AxiosError, AxiosRequestConfig } from "axios";
import apiSrv from "@/api/axios";
import { format } from "date-fns";
import {
  BookingInfo,
  BookingInfoWithUser,
  BookingScheme,
  BookingWithUserScheme,
  CourtInfo,
  CourtScheme,
  UpdateCourtPayload as CreateUpdateCourtPayload,
  UserInfo,
  UserScheme,
  PriceGrid,
  PriceGridSchema,
} from "@/schemas/Schemas";
import { ChangeBookingPayload, UpdateUserData } from "@/schemas/AdminSchemas";
import { ZodError } from "zod/v4";
import { getAppErrorMessage } from "@/utils/handlingError";
import { minutesToTime } from "@/features/admin/courts/utils/utils";

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
  } catch (e) {
    throw new Error(getAppErrorMessage(e));
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
  } catch (e) {
    throw new Error(getAppErrorMessage(e));
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
    throw new Error(getAppErrorMessage(e));
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
    throw new Error(getAppErrorMessage(e));
  }
}

export async function ChangeCourt(
  admin_id: number,
  court_id: number,
  payload: CreateUpdateCourtPayload
) {
  try {
    const params: AxiosRequestConfig = {
      params: {
        admin_id,
      },
    };
    await apiSrv.patch(`admin/courts/${court_id}`, payload, params);
  } catch (e) {
    throw new Error(getAppErrorMessage(e));
  }
}

export async function CreateCourt(
  admin_id: number,
  payload: CreateUpdateCourtPayload
) {
  try {
    const resp = await apiSrv.post("admin/courts/add", payload, {
      params: { admin_id },
    });
    return CourtScheme.parse(resp.data);
  } catch (e) {
    throw new Error(getAppErrorMessage(e));
  }
}
export async function DeleteCourt(admin_id: number, court_id: number) {
  try {
    await apiSrv.delete(`admin/courts/${court_id}`, { params: { admin_id } });
  } catch (e) {
    throw new Error(getAppErrorMessage(e));
  }
}

export async function GetCourtPriceGrids(
  admin_id: number,
  court_id: number
): Promise<PriceGrid[]> {
  try {
    const response = await apiSrv.get(`admin/courts/priceGrid/${court_id}`, {
      params: { admin_id },
    });
    if (Array.isArray(response.data)) {
      const grids = response.data.map((g) => PriceGridSchema.parse(g));
      return grids;
    }
    return [];
  } catch (e) {
    throw new Error(getAppErrorMessage(e));
  }
}
//
export async function UpdatePriceGrids(
  admin_id: number,
  court_id: number,
  grids: PriceGrid[]
) {
  try {
    if (grids.length === 0) {
      return [];
    }
    const data = grids.map((g) => ({
      price: g.price,
      price_trainer: g.price_trainer,
      time_start: minutesToTime(g.time_start),
      time_end: minutesToTime(g.time_end),
    }));
    const resp = await apiSrv.post(`admin/courts/priceGrid/${court_id}`, data, {
      params: { admin_id },
    });
    if (Array.isArray(resp.data)) {
      return resp.data.map((g) => PriceGridSchema.parse(g));
    }
    throw new Error("Неизвестный ответ от сервера");
  } catch (e) {
    throw new Error(getAppErrorMessage(e));
  }
}
