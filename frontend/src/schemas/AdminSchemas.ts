import { BookingInfo, UserInfo } from "./Schemas";

export type ChangeBookingPayload = Partial<
  Pick<BookingInfo, "status" | "fee" | "court_id">
>;

export type UpdateUserData = Partial<
  Pick<UserInfo, "is_trainer" | "username" | "phone_number" | "role">
>;
