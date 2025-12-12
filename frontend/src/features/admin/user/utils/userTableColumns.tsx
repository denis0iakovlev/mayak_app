import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ColumnDef, createColumnHelper } from "@tanstack/react-table";
import React, { useState } from "react";

import { UserInfo } from "@/schemas/Schemas";
import { ColumnCreaterProps } from "@/types/tableTypes";
import { Switch } from "@/components/ui/switch";

const headerClass = cn("text-md font-stretch-50%, mx-auto, block");

const header = (title: string, className: string) => {
  return <div className={className}>{title}</div>;
};

export default function createUserColumns(
  opts: ColumnCreaterProps<UserInfo>
): ColumnDef<UserInfo, any>[] {
  const { edits, setCellEdit } = opts;

  const get = <K extends keyof UserInfo>(row: UserInfo, key: K) =>
    (edits[row.telegram_id] && key in edits[row.telegram_id]!
      ? edits[row.telegram_id][key]
      : row[key]) ?? "";
  const h = createColumnHelper<UserInfo>();
  return [
    h.accessor((row) => `${row.first_name} ${row.last_name}`, {
      id: "tgName",
      header: "Tg имя",
      cell: (info) => {
        return (
          <p className=" text-xs ">
            {`${info.row.original.first_name} ${info.row.original.last_name}`}
          </p>
        );
      },
    }),
    h.accessor("username", {
      header: "Имя игрока",
      cell: (info) => (
        <Input
          className="text-xs w-[120]"
          defaultValue={info.getValue()}
          onBlur={(e) =>
            setCellEdit(
              info.row.original.telegram_id,
              "username",
              e.target.value
            )
          }
        />
      ),
    }),
    h.accessor("phone_number", {
      header: "Телефон",
      cell: ({ row }) => {
        const { original } = row;
        const phoneNumber = get(original, "phone_number");
        return (
          <Input
            defaultValue={phoneNumber}
            className="w-[120] text-sm"
            onBlur={(e) => {
              setCellEdit(original.telegram_id, "phone_number", e.target.value);
            }}
          />
        );
      },
    }),
    h.accessor("is_trainer", {
      id: "set_isTraner",
      header: "Тренер",
      cell: ({ row }) => {
        const [isTrainer, setIsTrainer] = useState<boolean>(
          () => Number(get(row.original, "is_trainer")) === 1
        );
        return (
          <Switch
            checked={isTrainer}
            onCheckedChange={(checked: boolean) => {
              setCellEdit(row.original.telegram_id, "is_trainer", checked);
              setIsTrainer(checked);
            }}
          />
        );
      },
    }),
    h.accessor("role", {
      header: "Админ",
      cell: ({ row }) => {
        const [isAdmin, setIsAdmin] = useState<boolean>(
          () => Number(get(row.original, "role")) === 1
        );
        return (
          <Switch
            checked={isAdmin}
            onCheckedChange={(checked: boolean) => {
              setCellEdit(row.original.telegram_id, "role", checked ? 1 : 0);
              setIsAdmin(checked);
            }}
          />
        );
      },
    }),
  ];
}
// return [
//   {
//     id: "id",
//     header: () => header("id", headerClass),
//     accessorKey: "telegram_id",
//     enableHiding: true,
//     enableResizing: true,
//   },
//   {
//     id: "name",
//     header: () => header("Имя в ТГ", headerClass),
//     accessorKey: "first_name",
//   },
//   {
//     id: "phoneNumber",
//     header: () => header("Номер", cn(headerClass)),
//     cell: ({ row }) => {
//       const [phNumber, SetNumber] = useState<string>(
//         row.original.phone_number || ""
//       );
//       return (
//         <Input
//           className="min-w-30 text-sm"
//           value={phNumber}
//           type="tel"
//           placeholder="+7(___)-___-__-__"
//           onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
//             SetNumber(e.target.value);
//           }}
//           onBlur={(e) => {
//             row.original.phone_number = e.target.value;
//           }}
//         />
//       );
//     },
//   },
//   {
//     id: "usernameField",
//     header: () => header("Имя игрока", headerClass),
//     cell: ({ row }) => {
//       const original = row.original;
//       const [val, setVal] = useState<string>(original.username || "");
//       const handleOnBlur = (e: React.FocusEvent<HTMLInputElement>) => {
//         if (val.length > 0 && val != original.username) {
//           setVal(e.target.value);
//           original.username = e.target.value;
//         }
//       };
//       const handleOnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//         setVal(e.target.value);
//       };
//       return (
//         <>
//           <div className="flex flex-row justify-start w-min">
//             <Input
//               type="text"
//               className="text-sm min-w-28"
//               value={val}
//               onChange={handleOnChange}
//               onBlur={handleOnBlur}
//             />
//           </div>
//         </>
//       );
//     },
//   },
//   {
//     id: "role",
//     header: () => header("Админ", headerClass),
//     cell: ({ row }) => {
//       const [isAdmin, setIsAdmin] = useState(row.original.role === 1);
//       return (
//         <Switch
//           checked={isAdmin}
//           onCheckedChange={(checked) => {
//             setIsAdmin(checked);
//             checked ? "Админ" : "Булка";
//           }}
//         />
//       );
//     },
//   },
//   {
//     id: "isTrainer",
//     header: () => header("Тренер?", headerClass),
//     cell: ({ row }) => {
//       const [isTrainer, SetIsTrainer] = useState<boolean>(
//         row.original.is_trainer
//       );
//       return (
//         <Switch
//           checked={isTrainer}
//           onCheckedChange={(checked) => {
//             SetIsTrainer(checked);
//             row.original.is_trainer = checked;
//           }}
//         />
//       );
//     },
//   },
//   {
//     id: "acceptChanges",
//     cell: ({ row }) => {
//       const origin = row.original;
//       const updateUser = async () => {
//         try {
//           const upUser = {
//             admin_id: admin_id,
//             user_id: origin.telegram_id,
//             is_trainer: origin.is_trainer,
//             phone_number: origin.phone_number,
//             role: origin.role,
//             username: origin.username,
//           };
//           await ChangeUser(upUser);
//         } catch (e) {
//           throw e;
//         }
//       };
//       return (
//         <>
//           <Button
//             variant="outline"
//             onClick={() => {
//               toast("Данные изменены", {
//                 description: () => (
//                   <div>
//                     <p>Имя игрока {origin.username || "Не указано"}</p>
//                     <p>Админ: {origin.role === 1 ? "Да" : "Нет"}</p>
//                     <p>Тренер: {origin.is_trainer ? "Да" : "Нет"}</p>
//                     <p>Телефон: {origin.phone_number || "Не указан"}</p>
//                   </div>
//                 ),
//                 action: {
//                   label: "Обновить",
//                   onClick: updateUser,
//                 },
//               });
//             }}
//           >
//             <SendHorizonalIcon className="size-6" />
//           </Button>
//           <Toaster position="top-center" duration={3000} />
//         </>
//       );
//     },
//   },
// ];
