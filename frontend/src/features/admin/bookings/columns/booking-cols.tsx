import { cn } from "@/lib/utils";
import { ColumnDef, createColumnHelper } from "@tanstack/react-table";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import AcceptDialog from "@/components/ui/accept-dialog";
import { Input } from "@/components/ui/input";
import { CourtInfo, BookingInfoWithUser } from "@/schemas/Schemas";
import { ColumnCreaterProps } from "@/types/tableTypes";
import { Field } from "@/components/ui/field";

const headerClass = cn("text-md font-stretch-50%");

const statusList = [
  {
    code: 0,
    label: "Забронировано",
    color: "bg-blue-300",
  },
  {
    code: 1,
    label: "Оплачено",
    color: "bg-green-200",
  },
  {
    code: 2,
    label: "Не оплачено",
    color: "bg-yellow-300",
  },
  {
    code: 3,
    label: "Отменить",
    color: "bg-red-300",
  },
];

export function bookings_columns(
  courts: CourtInfo[],
  opts: ColumnCreaterProps<BookingInfoWithUser>
): ColumnDef<BookingInfoWithUser, any>[] {
  const { edits, setCellEdit } = opts;
  const h = createColumnHelper<BookingInfoWithUser>();
  //Взять значение из правок в приритете
  const get = <K extends keyof BookingInfoWithUser>(
    row: BookingInfoWithUser,
    key: K
  ) =>
    (edits[row.id] && key in edits[row.id]! ? edits[row.id][key] : row[key]) ??
    "";
  return [
    h.accessor("user.username", {
      id: "user",
      header: "Игрок",
    }),
    h.accessor(
      (row) => ({
        start: row.start_time,
        end: row.end_time,
      }),
      {
        id: "timeRange",
        header: "Время",
        cell: ({ row }) => {
          return `${format(row.original.start_time, "HH:mm")} - ${format(
            row.original.end_time,
            "HH:mm"
          )}`;
        },
      }
    ),
    h.display({
      id: "selectCourt",
      header: "Корт",
      cell: ({ row }) => {
        const { original } = row;
        const [selCourtId, setSelCourt_id] = useState(() =>
          get(original, "court_id")
        );
        if (false) {
          return (
            <Select
              value={`${selCourtId}`}
              onValueChange={(e) => {
                setCellEdit(original.id, "court_id", Number(e));
                setSelCourt_id(Number(e));
              }}
            >
              <SelectTrigger className="w-[100]">
                <SelectValue placeholder="Изменить корт">
                  {courts.find((c) => c.id === selCourtId)?.name}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {courts.map((c, i) => (
                    <SelectItem key={i} value={`${c.id}`}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          );
        } else {
          return <p className="text-xs">{original.court.name}</p>;
        }
      },
    }),
    h.display({
      id: "status",
      header: "Статус",
      cell: ({ row }) => {
        const { original } = row;
        const [status, setStatus] = useState(() => get(original, "status"));
        const current_status = statusList[Number(status)];
        return (
          <Select
            value={`${status}`}
            onValueChange={(e) => {
              setCellEdit(original.id, "status", Number(e));
              setStatus(Number(e));
            }}
          >
            <SelectTrigger className={cn(current_status.color, "text-xs")}>
              <SelectValue>{current_status.label}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {statusList.map((st) => (
                  <SelectItem
                    value={`${st.code}`}
                    key={`${st.code}`}
                    className={cn("text-xs")}
                  >
                    {st.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        );
      },
    }),
    h.accessor("fee", {
      header: "Стоимость",
      cell: ({ row }) => {
        const { original } = row;
        return (
          <Input
            defaultValue={get(original, "fee")}
            className="w-[80]"
            type="number"
            step={100}
            min={0}
            onBlur={(e) => {
              setCellEdit(original.id, "fee", Number(e.target.value));
            }}
          />
        );
      },
    }),
  ];
}

// return [
//   {
//     id: "time-slot",
//     header: () => <div className={headerClass}>Время</div>,
//     accessorFn: (row) => {
//       return `${format(row.start_time, "HH:mm")}-${format(
//         row.end_time,
//         "HH:mm"
//       )}`;
//     },
//   },
//   {
//     id: "phone_number",
//     header: () => <div className={cn(headerClass, "w-fit")}>Номер </div>,
//     accessorFn: (data) => data.user.phone_number || "Не указан",
//   },
//   {
//     id: "username",
//     header: () => <div className={headerClass}>Имя </div>,
//     accessorFn: (data) => data.user.username || "Не указано",
//   },
//   {
//     id: "court",
//     header: () => <div className={headerClass}>Корт</div>,
//     cell: ({ row }) => {
//       const original = row.original;
//       const [court, setCourt] = useState<CourtInfo | undefined>(
//         courts.find((c) => c.id === original.court.id)
//       );
//       const [prevCourt, setPrevCourt] = useState<CourtInfo>(
//         courts.find((c) => c.id === original.court.id)!
//       );
//       const [open, setOpen] = useState<boolean>(false);
//       const bookId = row.getValue("bookId") as number;
//       const handleChange = (value: string) => {
//         const newCourt = courts.find((c) => c.name === value);
//         if (newCourt) {
//           setOpen(true);
//           setCourt(newCourt);
//         }
//       };
//       const handleAccept = async (isAccept: boolean) => {
//         setOpen(false);
//         if (isAccept && court) {
//           await BookingChangeCourt(adminId, bookId, court.id);
//           setPrevCourt(court);
//         } else {
//           setCourt(prevCourt);
//         }
//       };
//       return (
//         <>
//           <Select value={court?.name} onValueChange={handleChange}>
//             <SelectTrigger className={cn("text-xs py-0")}>
//               <SelectValue placeholder="Изменить корт" className="text-xs" />
//             </SelectTrigger>
//             <SelectContent className="text-xs">
//               <SelectGroup>
//                 {courts.map((court) => (
//                   <SelectItem
//                     className="text-xs"
//                     key={court.id}
//                     value={court.name}
//                   >
//                     {court.name}
//                   </SelectItem>
//                 ))}
//               </SelectGroup>
//             </SelectContent>
//           </Select>
//           <AcceptDialog
//             isOpen={open}
//             text="Вы хотите перенести бронирование на другой корт?"
//             title="Изменения корта"
//             okCallback={() => handleAccept(true)}
//             cancelCallback={() => handleAccept(false)}
//           />
//         </>
//       );
//     },
//   },
//   {
//     id: "summ",
//     header: () => <div className={headerClass}>Сумма</div>,
//     cell: ({ row }) => {
//       const [price, setPrice] = useState<number>(row.original.fee);
//       const [open, setOpen] = useState<boolean>(false);
//       const handleDialog = async (isAccept: boolean) => {
//         setOpen(false);
//         if (isAccept) {
//           row.original.fee = price;
//           await ChangePrice({
//             admin_id: adminId,
//             booking_id: row.original.id,
//             price,
//           });
//         }
//       };
//       return (
//         <>
//           <Input
//             type="number"
//             step={250}
//             className="text-xs w-20"
//             value={price}
//             onChange={(e) => setPrice(parseInt(e.target.value))}
//             onBlur={(e) => {
//               const newPrice = parseInt(e.target.value);
//               if (newPrice != row.original.fee) {
//                 setOpen(true);
//               }
//             }}
//           />
//           <AcceptDialog
//             isOpen={open}
//             cancelCallback={() => handleDialog(false)}
//             okCallback={() => handleDialog(true)}
//             text={`Вы поменяли цену бронирования c ${row.original.fee} на ${price} , принять изменения ?`}
//             title="Цена бронирования"
//           />
//         </>
//       );
//     },
//   },
//   {
//     id: "status",
//     accessorKey: "status",
//     header: () => <div className={headerClass}>Статус</div>,
//     cell: ({ row, getValue }) => {
//       const [statusLabel, setStatusLabel] = useState<
//         (typeof statusList)[number]
//       >(statusList.find((s) => s.code === getValue())!);
//       const [prevStatus, SetPrevStatus] = useState<
//         (typeof statusList)[number]
//       >(statusList.find((s) => s.code === getValue())!);
//       const [isOpen, SetOpen] = useState(false);
//       const bookId = row.getValue("bookId") as number;
//       const handleSelectedStatus = async (value: string) => {
//         SetOpen(true);
//         const st = statusList.find((s) => s.label === value);
//         if (st) setStatusLabel(st);
//       };
//       const handleChangeStatus = async (accepted: boolean) => {
//         SetOpen(false);
//         if (accepted) {
//           SetPrevStatus(statusLabel);
//           await BookingChangeStatus(adminId, bookId, statusLabel.code);
//           if (statusLabel.code === 3) window.location.reload();
//         } else {
//           setStatusLabel(prevStatus);
//         }
//       };
//       return (
//         <>
//           <Select
//             value={statusLabel.label}
//             onValueChange={handleSelectedStatus}
//           >
//             <SelectTrigger className={cn("text-xs py-0", statusLabel.color)}>
//               <SelectValue placeholder="Изменить корт" className="text-xs" />
//             </SelectTrigger>
//             <SelectContent className="text-xs">
//               <SelectGroup>
//                 {statusList.map((st) => (
//                   <SelectItem
//                     disabled={st.code === 0 || st.code === 2}
//                     className={cn(
//                       "text-xs data-[highlighted]:bg-amber-700 data-[highlighted]:text-blue-100",
//                       st.color
//                     )}
//                     key={st.code}
//                     value={st.label}
//                   >
//                     {st.label}
//                   </SelectItem>
//                 ))}
//               </SelectGroup>
//             </SelectContent>
//           </Select>
//           <AcceptDialog
//             isOpen={isOpen}
//             cancelCallback={() => handleChangeStatus(false)}
//             okCallback={() => handleChangeStatus(true)}
//             text="Вы уверены что хотите поменять статус заказа ?"
//             title="Изменить статус"
//           />
//         </>
//       );
//     },
//   },
// ];
