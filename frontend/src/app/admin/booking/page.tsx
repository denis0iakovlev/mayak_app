"use client";

import Calendar23 from "@/components/calendar-23";
import { initData, useSignal } from "@telegram-apps/sdk-react";
import { Suspense, useState } from "react";
import { GetActiveCourts, GetAllCourts } from "@/services/shareServices";
import useSWR from "swr";
import Loader from "@/components/layouts/Loader";
import { AdminBookings } from "@/features/admin/bookings/components/AdminBookings";

export default function AdminBookingPage() {
  const [selDate, SetSelDate] = useState<Date>(new Date());
  const user = useSignal(initData.user);
  if (!user) {
    throw new Error("Пользователь не аутенцифицирован");
  }
  const {
    data: courts,
    error: fetchCourtsError,
    isLoading: loadingCourts,
  } = useSWR(`get-сourt-list`, GetActiveCourts, { suspense: true });
  if (!courts) {
    throw new Error("Не удалось получить корты");
  }

  return (
    <div className="p-4">
      <Calendar23 selected={selDate} onSelect={SetSelDate} />
      <Suspense
        fallback={
          <Loader message="Загружаем панель администрирования бронирований" />
        }
      >
        <AdminBookings courts={courts} date={selDate} />
      </Suspense>
    </div>
  );
}
