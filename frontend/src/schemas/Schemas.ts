import { parse } from "date-fns";
import { z } from "zod/v4";

// Схема для вложенного объекта user
export const UserScheme = z.object({
  telegram_id: z.number(),
  first_name: z.string(),
  last_name: z.string().optional(),
  username: z.string().nullable(),
  created_at: z.string(), // Можно добавить `.transform(str => new Date(str))`
  role: z.number(),
  is_trainer: z.boolean(),
  phone_number: z.string().nullable(),
});
export type UserInfo = z.infer<typeof UserScheme>;

export const PriceGridSchema = z.object({
  time_start: z.iso.time().transform((s) => {
    const time = parse(s, "HH:mm:ss", new Date(0));
    return time.getMinutes() + time.getHours() * 60;
  }), //Получаем только часы
  time_end: z.iso.time().transform((s) => {
    const time = parse(s, "HH:mm:ss", new Date(0));
    return time.getMinutes() + time.getHours() * 60;
  }),
  price: z.number().int().nonnegative(),
  price_trainer: z.number().int().nonnegative(),
});

export type PriceGrid = z.infer<typeof PriceGridSchema>;

export const CourtScheme = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().optional(),
  is_active: z.boolean(),
  grids: z.array(PriceGridSchema).default([]),
});
export type CourtInfo = z.infer<typeof CourtScheme>;

//Схема для обновления кортов
export const UpdateCourtScheme = CourtScheme.partial();
export type UpdateCourtPayload = Omit<z.infer<typeof UpdateCourtScheme>, "id">;
// Основная схема
export const BookingScheme = z.object({
  id: z.number(),
  date: z.iso.date().transform((str) => parse(str, "yyyy-MM-dd", new Date())),
  start_time: z.iso
    .time()
    .transform((str) => parse(str, "HH:mm:ss", new Date(0))),
  end_time: z.iso
    .time()
    .transform((str) => parse(str, "HH:mm:ss", new Date(0))),
  court_id: z.number(),
  court_name: z.string().optional(),
  user_id: z.number(),
  fee: z.number(),
  status: z.number(),
  court: CourtScheme,
});
export type BookingInfo = z.infer<typeof BookingScheme>;

export const BookingWithUserScheme = BookingScheme.extend({
  user: UserScheme,
});

export type BookingInfoWithUser = z.infer<typeof BookingWithUserScheme>;
//Схема для получения занятого времени на площадке
export const BookedTimeSlotsScheme = z.object({
  date: z.iso.date().transform((str) => parse(str, "yyyy-MM-dd", new Date())),
  court_id: z.number(),
  booked_slots: z
    .array(
      z.object({
        booked_start: z.iso
          .time()
          .transform((str) => parse(str, "HH:mm:ss", new Date(0))),
        booked_end: z.iso
          .time()
          .transform((str) => parse(str, "HH:mm:ss", new Date(0))),
      })
    )
    .default([]),
});
export type BookedTimeSlots = z.infer<typeof BookedTimeSlotsScheme>;

export const BookingPayloadScheme = z.object({
  date: z.iso.date(),
  start_time: z.iso.time(),
  end_time: z.iso.time(),
  court_id: z.number(),
});
export type BookingPayload = Omit<
  z.infer<typeof BookingPayloadScheme>,
  "date"
> & { dateBooking: string };
