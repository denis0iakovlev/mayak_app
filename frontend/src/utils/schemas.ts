import { parse } from "date-fns";
import { z } from "zod/v4";

// Схема для вложенного объекта user
export const UserSchema = z.object({
  telegram_id: z.number(),
  first_name: z.string(),
  last_name: z.string().optional(),
  username: z.string().nullable(),
  created_at: z.string(), // Можно добавить `.transform(str => new Date(str))`
  role: z.string(),
  is_trainer:z.boolean(),
  phone_number:z.string().nullable()
});
// Основная схема
export const UserBookingSchema = z.object({
  id: z.number(),
  dateBooking: z.iso.date().transform(str => parse(str, "yyyy-MM-dd", new Date())),
  start_time: z.iso.time().transform(str => parse(str, "HH:mm:ss", new Date())),
  end_time: z.iso.time().transform(str => parse(str, "HH:mm:ss", new Date())),
  court_id: z.number(),
  court_name:z.string(),
  user_id: z.number(),
  fee:z.number(),
  status: z.number(),
})

export const BookingSchema = UserBookingSchema.extend({
  user: UserSchema,
});

export const CourtSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().optional(),
  is_active: z.boolean()
})