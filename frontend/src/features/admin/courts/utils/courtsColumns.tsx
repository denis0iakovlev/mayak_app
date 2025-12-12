import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { CourtInfo } from "@/schemas/Schemas";
import { ColumnDef, createColumnHelper } from "@tanstack/react-table";
import { Delete, Plus } from "lucide-react";
import { useState } from "react";
import { toTime } from "./utils";

export function get_courts_admin_columns(opts: {
  edits: Record<number, Partial<CourtInfo>>;
  setCellEdit: (id: number, field: keyof CourtInfo, value: unknown) => void;
}): ColumnDef<CourtInfo, any>[] {
  const { edits, setCellEdit } = opts;

  const h = createColumnHelper<CourtInfo>();

  const get = <K extends keyof CourtInfo>(row: CourtInfo, key: K) =>
    (edits[row.id] && key in edits[row.id]! ? edits[row.id]![key] : row[key]) ??
    "";

  return [
    h.accessor("name", {
      header: "Имя корта",
      cell: ({ row }) => (
        <Input
          className="h-8"
          defaultValue={get(row.original, "name") as string}
          onBlur={(e) => setCellEdit(row.original.id, "name", e.target.value)}
        />
      ),
    }),
    h.accessor("description", {
      header: "Описание",
      cell: ({ row }) => (
        <Input
          className="h-8"
          defaultValue={get(row.original, "description") as string}
          onBlur={(e) =>
            setCellEdit(row.original.id, "description", e.target.value)
          }
        />
      ),
    }),
    h.accessor("is_active", {
      header: "Корт открыт ?",
      cell: ({ row }) => (
        <Switch
          checked={get(row.original, "is_active") as boolean}
          onCheckedChange={(checked: boolean) =>
            setCellEdit(row.original.id, "is_active", checked)
          }
        />
      ),
    }),
    {
      id: "range-open",
      header: "Время работы",
      cell: ({ row }) => {
        const [range, setRange] = useState<number[]>([0, 12, 23.5]);
        const deleteClick = (inx: number) => {
          if (range.length === 2) return;
          if (inx === range.length - 1) {
            //Удалить предпоследний
            setRange((prev) => [...prev.slice(0, -2), prev[prev.length - 1]]);
          } else {
            setRange((prev) => [...prev.slice(0, inx), ...prev.slice(inx + 1)]);
          }
        };

        return (
          <div className="w-full mx-auto">
            <Slider
              value={range}
              onValueChange={(v) => {
                v.sort((a, b) => a - b);
                setRange([...v]);
              }}
              min={0}
              max={24}
              step={0.5}
              className="pt-3 mx-auto"
            />
            <div className="w-max mx-auto flex flex-col gap-3 pt-5">
              {range.map((r, i) => {
                if (i === range.length - 1) return;
                return (
                  <div className="w-full mx-auto flex gap-2" key={i}>
                    <p className="w-max border rounded-lg px-2">
                      {toTime(r)}
                      <span className="text-xl px-1 font-semibold">:</span>
                      {toTime(range[i + 1])}
                    </p>
                    <Input
                      type="number"
                      className="max-w-20"
                      step={50}
                      defaultValue={600}
                    />
                    <Input
                      type="number"
                      className="max-w-20"
                      step={50}
                      defaultValue={400}
                    />
                    <Button
                      variant="outline"
                      className="hover:bg-red-400"
                      onClick={() => {
                        deleteClick(i + 1);
                      }}
                    >
                      <Delete />
                    </Button>
                  </div>
                );
              })}
            </div>
            <div className="w-full flex justify-center pt-2">
              <Button
                variant="outline"
                className="bg-green-600 hover:bg-green-300 border-2"
                onClick={() => {
                  setRange((prev) => [
                    ...prev.slice(0, -1),
                    prev[prev.length - 1] - 1,
                    prev[prev.length - 1],
                  ]);
                }}
              >
                <Plus />
              </Button>
            </div>
          </div>
        );
      },
    },
  ];
}
