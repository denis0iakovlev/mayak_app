"use client";
import { Button } from "@/components/ui/button";
import { Field, FieldContent, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { CourtInfo, UpdateCourtPayload } from "@/schemas/Schemas";
import { ChangeCourt, UpdatePriceGrids } from "@/services/adminService";
import { MAIN_BUTTON_MAIN } from "@/styles/styles";
import { SetMainButton } from "@/utils/tgUtils";
import { useForm } from "@tanstack/react-form";
import { initData, useSignal } from "@telegram-apps/sdk-react";
import { useMemo, useState } from "react";
import useSWRMutation from "swr/mutation";
import { PriceGrid } from "@/schemas/Schemas";
import { Slider } from "@/components/ui/slider";
import { Delete, PlusSquare, RefreshCcw } from "lucide-react";
import { minutesToTime } from "../utils/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSWRConfig } from "swr";
import { cn } from "@/lib/utils";

type CourtCardProps = {
  court: CourtInfo;
  grids: PriceGrid[];
  refresh: () => any;
};

export const CourtCard = ({ court, grids, refresh }: CourtCardProps) => {
  const user = useSignal(initData.user);
  const [isChanged, setIsChanged] = useState(false);
  const { mutate } = useSWRConfig();
  const { trigger, error } = useSWRMutation(
    "update-courts-info",
    async (
      key: string,
      {
        arg,
      }: {
        arg: {
          admin_id: number;
          court_id: number;
          payload: UpdateCourtPayload;
          new_grids: PriceGrid[];
        };
      }
    ) => {
      await ChangeCourt(arg.admin_id, arg.court_id, arg.payload);
      await UpdatePriceGrids(arg.admin_id, arg.court_id, arg.new_grids);
    }
  );

  const form = useForm({
    defaultValues: {
      ...court,
      grids,
    },
    onSubmit: async ({ value, meta, formApi }) => {
      const grids = value.grids;
      await trigger({
        admin_id: user?.id!,
        court_id: court.id,
        payload: { ...value },
        new_grids: value.grids,
      });
      await refresh();
      await mutate("get-active-courts");
      setIsChanged(false);
    },
    listeners: {
      onChange: ({ formApi }) => {
        setIsChanged(!formApi.state.isDefaultValue);
      },
    },
  });
  SetMainButton(
    {
      isEnabled: isChanged,
      backgroundColor: MAIN_BUTTON_MAIN,
      isVisible: isChanged,
      text: "Сохранить",
    },
    async () => {
      await form.handleSubmit();
    }
  );
  return (
    <div className="p-5 border rounded-2xl">
      <div className="flex justify-end w-full">
        <Button
          onClick={() => {
            form.reset();
            setIsChanged(false);
          }}
          variant="outline"
        >
          <RefreshCcw />
        </Button>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        className=""
      >
        <div className="flex flex-col gap-4">
          <form.Field
            name="name"
            children={(field) => {
              return (
                <Field orientation="vertical" className="">
                  <FieldLabel htmlFor={field.name}>Имя</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    autoComplete="off"
                  />
                </Field>
              );
            }}
          />
          <form.Field
            name="description"
            children={(field) => (
              <Field orientation="vertical">
                <FieldLabel className="" htmlFor={field.name}>
                  Описание
                </FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  autoComplete="off"
                />
              </Field>
            )}
          />
          <form.Field
            name="is_active"
            children={(field) => {
              return (
                <Field orientation="horizontal">
                  <FieldContent>Корт доступен</FieldContent>
                  <Switch
                    checked={field.state.value}
                    onCheckedChange={(check) => {
                      field.handleChange(check);
                      field.handleBlur();
                    }}
                    id={field.name}
                    name={field.name}
                    className="self-center"
                  />
                </Field>
              );
            }}
          />
          <form.Field name="grids" mode="array">
            {(field) => {
              const range = [
                ...new Set(
                  field.state.value
                    .map((g) => [g.time_start, g.time_end])
                    .flat()
                ),
              ];
              const handleChangeRange = (newRange: number[]) => {
                //отсортировать
                newRange.sort((a, b) => a - b);
                const grid_cp = field.state.value.map((f) => ({ ...f }));
                if (newRange.length != grid_cp.length + 1) {
                  throw new Error("Ошибка алгоритма");
                }
                let prev_end: number | null = null;
                let j = 0;
                for (let i = 0; i < grid_cp.length; i++) {
                  if (prev_end === null) {
                    grid_cp[i].time_start = newRange[j++];
                  } else {
                    grid_cp[i].time_start = prev_end;
                  }
                  grid_cp[i].time_end = newRange[j++];
                  prev_end = grid_cp[i].time_end;
                }
                field.handleChange(grid_cp);
              };
              return (
                <div>
                  <Slider
                    value={range}
                    className="border rounded-lg p-4"
                    name={field.name}
                    min={0}
                    max={24 * 60}
                    step={30}
                    onValueChange={handleChangeRange}
                  />
                  <div className="w-full mx-auto flex flex-col gap-3 pt-3">
                    {field.state.value.map((g, i) => {
                      const handleDelete = (inx: number) => {
                        if (inx === 0 || inx === field.state.value.length - 1) {
                          field.setValue(
                            field.state.value.filter((_, i) => i !== inx)
                          );
                        } else {
                          //Расширить диапзоны
                          const prev = field.state.value[inx - 1];
                          const next = field.state.value[inx + 1];
                          prev.time_end = next.time_start;
                          const cp = [...field.state.value];
                          field.setValue([
                            ...cp.splice(0, inx - 1),
                            prev,
                            ...cp.slice(inx + 1),
                          ]);
                        }
                      };
                      const handleAdd = (inx: number) => {
                        const cp = [...field.state.value];
                        const prev_grid = cp[inx];
                        if (inx === cp.length - 1) {
                          const end = 24 * 60;
                          const midle =
                            prev_grid.time_end + (end - prev_grid.time_end) / 2;
                          cp.push({
                            price: prev_grid.price,
                            price_trainer: prev_grid.price_trainer,
                            time_start: prev_grid.time_end,
                            time_end: midle,
                          });
                          field.setValue(cp);
                        } else {
                          const next = cp[inx + 1];
                          let middle =
                            prev_grid.time_end +
                            (next.time_end - prev_grid.time_end) / 2;
                          //
                          middle = middle - (middle % 30);
                          if (middle < 60) return;
                          next.time_start = middle;
                          const newRange: PriceGrid = {
                            ...prev_grid,
                            time_start: prev_grid.time_end,
                            time_end: middle,
                          };
                          field.setValue([
                            ...cp.slice(0, inx + 1),
                            newRange,
                            next,
                            ...cp.slice(inx + 2),
                          ]);
                        }
                      };
                      const textProp =
                        "text-[0.75rem] font-semibold  h-fit py-1 px-2 text-center sm:text-[1rem] sm:py-2";
                      return (
                        <div
                          className="w-full mx-auto flex gap-2 flex-wrap items-center justify-center"
                          key={i}
                        >
                          <p
                            className={cn(
                              "w-max border rounded-lg self-center",
                              textProp
                            )}
                          >
                            <form.Field
                              name={`grids[${i}].time_start`}
                              key={`time_start_${i}`}
                            >
                              {(subField) =>
                                minutesToTime(subField.state.value)
                              }
                            </form.Field>
                            <span className=" px-1 font-semibold">:</span>
                            <form.Field
                              name={`grids[${i}].time_end`}
                              key={`time_end_${i}`}
                            >
                              {(subField) =>
                                minutesToTime(subField.state.value)
                              }
                            </form.Field>
                          </p>
                          <form.Field
                            name={`grids[${i}].price`}
                            key={`price_${i}`}
                          >
                            {(subField) => (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Input
                                    type="number"
                                    className={cn(
                                      "max-w-15 sm:max-w-20",
                                      textProp
                                    )}
                                    step={50}
                                    defaultValue={subField.state.value}
                                    name={subField.name}
                                    id={subField.name}
                                    onChange={(e) =>
                                      subField.handleChange(
                                        Number(e.target.value)
                                      )
                                    }
                                  />
                                </TooltipTrigger>
                                <TooltipContent>
                                  Стоимость часа игрока
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </form.Field>
                          <form.Field
                            name={`grids[${i}].price_trainer`}
                            key={`price_trainer${i}`}
                          >
                            {(subField) => (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Input
                                    type="number"
                                    className={cn(
                                      "max-w-15 sm:max-w-20",
                                      textProp
                                    )}
                                    step={50}
                                    defaultValue={subField.state.value}
                                    onChange={(e) =>
                                      subField.handleChange(
                                        Number(e.target.value)
                                      )
                                    }
                                  />
                                </TooltipTrigger>
                                <TooltipContent>
                                  Стоимость часа тренера
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </form.Field>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                className="hover:bg-red-300 border disabled:border"
                                onClick={() => handleDelete(i)}
                                disabled={field.state.value.length === 1}
                              >
                                <Delete className="size-6" stroke="#d40b52d6" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent sideOffset={-10}>
                              Удалить диапазон
                            </TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="icon"
                                className="self-center"
                                disabled={g.time_end >= 22 * 60}
                                onClick={() => handleAdd(i)}
                              >
                                <PlusSquare
                                  className="size-6"
                                  stroke="#15b512"
                                />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Дабавить диапазон</TooltipContent>
                          </Tooltip>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            }}
          </form.Field>
        </div>
      </form>
    </div>
  );
};
