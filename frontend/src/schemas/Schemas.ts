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
  phone_number: z.string().nullable()
});
export type UserInfo = z.infer<typeof UserScheme>; 
// Основная схема
export const BookingScheme = z.object({
  id: z.number(),
  date: z.iso.date().transform(str => parse(str, "yyyy-MM-dd", new Date())),
  start_time: z.iso.time().transform(str => parse(str, "HH:mm:ss", new Date())),
  end_time: z.iso.time().transform(str => parse(str, "HH:mm:ss", new Date())),
  court_id: z.number(),
  court_name: z.string().optional(),
  user_id: z.number(),
  fee: z.number(),
  status: z.number(),
})
export type BookingInfo = z.infer<typeof BookingScheme>;

export const BookingWithUserScheme = BookingScheme.extend({
  user: UserScheme,
});

export type BookingInfoWithUser = z.infer<typeof BookingWithUserScheme>;

export const CourtScheme = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().optional(),
  is_active: z.boolean()
})
export type CourtInfo = z.infer<typeof CourtScheme>;
//Схема для получения занятого времени на площадке
export const BookedTimeSlotsScheme = z.object({
  date: z.iso.date().transform(str => parse(str, "yyyy-MM-dd", new Date())),
  court_id: z.number(),
  booked_slots: z.array(
    z.object({
      booked_start: z.iso.time().transform(str => parse(str, "HH:mm", new Date())),
      booked_end: z.iso.time().transform(str => parse(str, "HH:mm", new Date()))
    })
  ).default([])
})
export type BookedTimeSlots = z.infer<typeof BookedTimeSlotsScheme>;

export const BookingPayloadScheme = z.object({
  user_id:z.number(),
  date:z.iso.date(),
  start_time:z.iso.time(),
  end_time:z.iso.time(),
  court_id:z.number()
})
export type BookingPayload = z.infer<typeof BookingPayloadScheme>;