"use client";
import { GetAllCourts } from "@/services/shareServices";
import {
  initData,
  isMainButtonMounted,
  mountMainButton,
  useSignal,
} from "@telegram-apps/sdk-react";
import useSWR from "swr";
import { CourtInfo } from "@/schemas/Schemas";
import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectGroup,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { CourtCard } from "./CourtCard";
import { Button } from "@/components/ui/button";
import { Minus, MinusSquare, Plus } from "lucide-react";
import useSWRMutation from "swr/mutation";
import {
  CreateCourt,
  DeleteCourt,
  GetCourtPriceGrids,
  UpdatePriceGrids,
} from "@/services/adminService";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { parse } from "date-fns";

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
  const { trigger, error } = useSWRMutation("create-court", async () => {
    const newCourt = await CreateCourt(user.id, {
      description: "",
      is_active: false,
      name: `Корт ${courts.length > 0 ? courts[courts.length - 1].id : ""} `,
    });
    await UpdatePriceGrids(user.id, newCourt.id, [
      {
        price: 1000,
        price_trainer: 500,
        time_start: 5 * 60,
        time_end: 21 * 60,
      },
    ]);
    return newCourt;
  });

  const { trigger: deleteCourt } = useSWRMutation("delete-court", async () => {
    await DeleteCourt(user.id, currrent.id);
  });

  const [currrent, SetCurrent] = useState<CourtInfo>(courts[0]);
  //
  const {
    data: grids,
    error: gridError,
    mutate: muatateGrids,
  } = useSWR(
    currrent?.id && user?.id ? ["get-price-grids", currrent.id, user.id] : null,
    async ([, courtId, userId]) => {
      const grids = await GetCourtPriceGrids(userId, courtId);
      if (grids.length === 0) {
        return [
          {
            price: 500,
            price_trainer: 300,
            time_start: 6 * 60,
            time_end: 22 * 60,
          },
        ];
      }
      return grids;
    },
    { suspense: true }
  );
  const handleAddCourt = async () => {
    const newCourt = await trigger();
    await mutate();
    SetCurrent(newCourt);
  };
  //
  useEffect(() => {
    const inx = courts.findIndex((c) => c.id === currrent.id);
    if (inx < 0) {
      SetCurrent(courts[0]);
    } else {
      SetCurrent(courts[inx]);
    }
  }, [courts]);
  const handleDeleteCourt = async () => {
    await deleteCourt();
    await mutate();
  };
  return (
    <Card>
      <CardHeader>Управление кортами</CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Button
          variant="outline"
          className="content-center hover:bg-green-500 w-min self-end h-8"
          onClick={handleAddCourt}
        >
          <p>Новый корт</p>
          <Plus />
        </Button>
        <div className="flex gap-2">
          <Select
            onValueChange={(val) => {
              SetCurrent(courts.find((c) => c.id === Number(val))!);
            }}
            value={`${currrent.id}`}
            key={currrent.name}
          >
            <SelectTrigger className="w-full" key={`${currrent.name}__trigger`}>
              <SelectValue>
                <p className="">{currrent.name}</p>
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="w-full">
              <SelectGroup className="w-full">
                {courts.map((c) => (
                  <SelectItem
                    key={c.id}
                    value={`${c.id}`}
                    className="flex w-full justify-between"
                  >
                    {c.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <Button variant="outline" className="" onClick={handleDeleteCourt}>
            <Minus stroke="#de1e1e" className="size-8" />
          </Button>
        </div>
        <CourtCard court={currrent} grids={grids} refresh={mutate} />
      </CardContent>
    </Card>
  );
}
