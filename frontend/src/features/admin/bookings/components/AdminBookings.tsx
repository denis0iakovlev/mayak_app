import UpDownCollapse from "@/components/ui/custom/UpDownCollaps";
import { ChangeBooking, GetBookingsByAdmin } from "@/services/adminService";
import { initData, useSignal } from "@telegram-apps/sdk-react";
import { format } from "date-fns";
import useSWR from "swr";
import { bookings_columns } from "../columns/booking-cols";
import { SimpleTable } from "@/components/tables/simpleTable/SimpleTable";
import { BookingInfoWithUser, CourtInfo } from "@/schemas/Schemas";
import { useEffect, useMemo } from "react";
import { useEditController } from "@/hooks/useEditController";
import { getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { SetMainButton } from "@/utils/tgUtils";
import { MAIN_BUTTON_MAIN } from "@/styles/styles";
import useSWRMutation from "swr/mutation";
import { ChangeBookingPayload } from "@/schemas/AdminSchemas";

export function AdminBookings({
  date,
  courts,
}: {
  date: Date;
  courts: CourtInfo[];
}) {
  const user = useSignal(initData.user);
  if (!user) {
    throw new Error("Пользователь не аутенцифицирован");
  }
  if (!courts) {
    throw new Error("Не удалось получить список кортов");
  }

  const {
    data: bookings,
    error,
    mutate,
  } = useSWR(
    `get-admin-booking-${date.getDate().toString()}`,
    () => GetBookingsByAdmin(user.id, date),
    { suspense: true }
  );
  const { trigger, error: updateError } = useSWRMutation(
    "update-bookings",
    (
      key: string,
      {
        arg,
      }: {
        arg: {
          admin_id: number;
          booking_id: number;
          payload: ChangeBookingPayload;
        };
      }
    ) => {
      return ChangeBooking(arg.admin_id, arg.booking_id, arg.payload);
    }
  );
  const editController = useEditController<BookingInfoWithUser>(bookings, "id");
  useEffect(() => {
    editController.edits;
    SetMainButton(
      {
        backgroundColor: MAIN_BUTTON_MAIN,
        isEnabled: editController.hasChange,
        isVisible: true,
        text: editController.hasChange
          ? `Сохранить (${editController.payload.length} изм.)`
          : "Нет изменений",
      },
      async () => {
        for (const payload of editController.payload) {
          if (payload.id) {
            await trigger({
              admin_id: user.id,
              booking_id: payload.id,
              payload: payload,
            });
          } else {
            throw new Error("Ошибка логики. Нет id корта");
          }
        }
        await mutate();
      }
    );
  }, [editController.hasChange, editController.payload.length]);

  const columns = useMemo(
    () =>
      bookings_columns(courts, {
        edits: editController.edits,
        setCellEdit: (
          id: number,
          field: keyof BookingInfoWithUser,
          value: any
        ) => editController.setCellEdit(id, field, value),
      }),
    []
  );

  const table = useReactTable<BookingInfoWithUser>({
    data: bookings,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <UpDownCollapse
      title={`Бронирования на ${format(date, "dd/MM/yyyy")}`}
      collapsible={
        <SimpleTable
          table={table}
          key={`${editController.edits}`}
          changedRowPredicate={(row) =>
            !!editController.edits[(row as BookingInfoWithUser).id]
          }
          onResetRow={(row) =>
            editController.resetRow((row as BookingInfoWithUser).id)
          }
        />
      }
    />
  );
}
