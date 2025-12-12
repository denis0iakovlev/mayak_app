import { CardTable } from "@/components/tables/CardTabel/CardTable";
import { useEditController } from "@/hooks/useEditController";
import { UserInfo } from "@/schemas/Schemas";
import { ChangeUser, GetAllUsers } from "@/services/adminService";
import { initData, useSignal } from "@telegram-apps/sdk-react";
import { useMemo } from "react";
import useSWR from "swr";
import createUserColumns from "../utils/userTableColumns";
import { getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { SimpleTable } from "@/components/tables/simpleTable/SimpleTable";
import { SetMainButton } from "@/utils/tgUtils";
import { MAIN_BUTTON_MAIN } from "@/styles/styles";
import useSWRMutation from "swr/mutation";
import { UpdateUserData } from "@/schemas/AdminSchemas";

export const AdminUserTable = () => {
  const user = useSignal(initData.user);
  if (!user) {
    throw new Error("Пользователь не аутентифицирован.");
  }
  const { data: users, mutate } = useSWR(
    ["get-admin-users", user?.id],
    ([, user_id]: [string, number]) => {
      return GetAllUsers(user_id);
    },
    { suspense: true }
  );

  const { trigger } = useSWRMutation(
    "update_users",
    (
      key: string,
      {
        arg,
      }: { arg: { user_id: number; admin_id: number; payload: UpdateUserData } }
    ) => ChangeUser(arg.user_id, arg.admin_id, arg.payload)
  );

  const editController = useEditController<UserInfo>(users, "telegram_id");
  SetMainButton(
    {
      backgroundColor: MAIN_BUTTON_MAIN,
      isEnabled: editController.hasChange,
      isVisible: editController.hasChange,
      text: "Сохранить",
    },
    async () => {
      console.log("Save user changes");
      for (const payload of editController.payload) {
        if (payload.id) {
          await trigger({
            user_id: Number(payload.id),
            admin_id: user.id,
            payload,
          });
        }
      }
    }
  );
  const columns = useMemo(
    () =>
      createUserColumns({
        edits: editController.edits,
        setCellEdit: (id: number, field: keyof UserInfo, value: any) =>
          editController.setCellEdit(id, field, value),
      }),
    []
  );
  const table = useReactTable<UserInfo>({
    data: users,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <SimpleTable
      table={table}
      changedRowPredicate={(row) =>
        !!editController.edits[(row as UserInfo).telegram_id]
      }
      onResetRow={(row) =>
        editController.resetRow((row as UserInfo).telegram_id)
      }
    />
  );
};
