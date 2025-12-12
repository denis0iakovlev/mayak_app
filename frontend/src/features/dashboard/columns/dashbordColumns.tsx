import { createColumnHelper } from "@tanstack/react-table";
import { format } from "date-fns";
import { BookingInfo } from "@/schemas/Schemas";
import { Checkbox } from "@/components/ui/checkbox";

export const dashbordColumns = () => {
  const h = createColumnHelper<BookingInfo>();
  return [
    h.display({
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Выбрать все"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Выбрать строку"
        />
      ),
    }),
    h.accessor("date", {
      header: "Дата",
      cell: (info) => `${format(info.getValue(), "dd.MM.yyyy")}`,
    }),
    h.accessor(
      (row) => ({
        start: format(row.start_time, "HH:mm"),
        end: format(row.end_time, "HH:mm"),
      }),
      {
        id: "time-slot",
        header: "Время",
        cell: (info) => {
          const { start, end } = info.getValue();
          return `${start}-${end}`;
        },
      }
    ),
    h.accessor("court", {
      header: "Корт",
      cell: (info) => {
        const court = info.getValue();
        return court.name;
      },
    }),
    h.accessor("fee", {
      header: "Стоимость",
    }),
  ];
};
