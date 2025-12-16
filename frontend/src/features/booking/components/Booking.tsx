"use client";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar_user_book/calendar";
import { useState } from "react";
import { format, subDays } from "date-fns";
import { ru } from "date-fns/locale";
import SelectCourt from "@/features/booking/components/SelectCourt";
import PickInterval from "./PickInterval";
import { getBookingDateStart } from "../utils/timePickerUtils";
import { CourtInfo } from "@/schemas/Schemas";
import { GetActiveCourts } from "@/services/shareServices";
import useSWR from "swr";

const start = getBookingDateStart();
const matcher = {
  from: subDays(start, 50),
  to: subDays(start, 1),
};
//
export function Booking() {
  const { data: courts, error } = useSWR("get-active-courts", GetActiveCourts, {
    suspense: true,
  });
  if (error || courts.length === 0) {
    throw new Error("Не удалось получить информацию о доступных кортах");
  }
  const [targetDate, setTargetDate] = useState<Date>(start);
  const [targetCourt, setTargetCourt] = useState<CourtInfo>(courts[0]);
  return (
    <Card className="">
      <CardContent className="flex flex-col gap-3">
        <SelectCourt
          court={targetCourt}
          SetCourt={setTargetCourt}
          courtList={courts}
        />
        <Calendar
          mode="single"
          required
          selected={targetDate}
          locale={ru}
          onSelect={setTargetDate}
          disabled={matcher}
          className={"rounded-md border-2 shadow-sm mx-auto "}
        />
        <PickInterval
          day={format(targetDate, "yyyy-MM-dd")}
          court={targetCourt}
        />
      </CardContent>
    </Card>
  );
}
