"use client";

import { GetAllCourts } from "@/services/shareServices";
import {
  initData,
  isMainButtonMounted,
  mountMainButton,
  useSignal,
} from "@telegram-apps/sdk-react";
import useSWR from "swr";
import { useEditController } from "@/hooks/useEditController";
import { CourtInfo, UpdateCourtPayload } from "@/schemas/Schemas";
import { useEffect, useMemo } from "react";
import { get_courts_admin_columns } from "../utils/courtsColumns";
import { getCoreRowModel, useReactTable } from "@tanstack/react-table";
import useSWRMutation from "swr/mutation";
import { ChangeCourt } from "@/services/adminService";
import { MAIN_BUTTON_MAIN } from "@/styles/styles";
import { SetMainButton } from "@/utils/tgUtils";
import { CardTable } from "@/components/tables/CardTabel/CardTable";

export default function CourtsAdminPage() {
  const user = useSignal(initData.user);
  if (!isMainButtonMounted()) {
    mountMainButton();
  }
  if (!user) {
    throw new Error("Пользователь не аутнтифицирован");
  }
  const { data: courts, mutate } = useSWR("get-admin-courts", GetAllCourts, {
    suspense: true,
  });
  const { trigger, error } = useSWRMutation(
    "update-courts-info",
    (
      key: string,
      {
        arg,
      }: {
        arg: {
          admin_id: number;
          court_id: number;
          payload: UpdateCourtPayload;
        };
      }
    ) => {
      return ChangeCourt(arg.admin_id, arg.court_id, arg.payload);
    }
  );

  const editController = useEditController<CourtInfo>(courts, "id");

  const columns = useMemo(
    () =>
      get_courts_admin_columns({
        edits: editController.edits,
        setCellEdit: (id: number, field: keyof CourtInfo, value: any) =>
          editController.setCellEdit(id, field, value),
      }),
    [editController.edits, editController.setCellEdit]
  );

  useEffect(() => {
    editController.edits;
    SetMainButton(
      {
        backgroundColor: MAIN_BUTTON_MAIN,
        isEnabled: editController.hasChange,
        isVisible: true,
        text: editController.hasChange
          ? `Сохранить ${editController.payload.length}`
          : "Нет изменений",
      },
      async () => {
        for (const payload of editController.payload) {
          if (payload.id) {
            await trigger({
              admin_id: user.id,
              court_id: payload.id,
              payload: payload,
            });
          } else {
            throw new Error("Ошибка логики. Нет id корта");
          }
        }
        await mutate();
      }
    );
  }, [editController.hasChange]);
  const table = useReactTable<CourtInfo>({
    data: courts,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });
  //
  return (
    <div className="block">
      <h6 className="text-xl text-amber-700 p-2 border-2 m-5">
        {" "}
        Управление кортами
      </h6>
      <CardTable
        table={table}
        changedRowPredicate={(row) =>
          !!editController.edits[(row as CourtInfo).id]
        }
        onResetRow={(row) => editController.resetRow((row as CourtInfo).id)}
      />
    </div>
  );
}
