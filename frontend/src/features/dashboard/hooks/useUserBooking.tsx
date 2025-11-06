"use client"
import { BookingInfo } from "@/schemas/Schemas";
import { GetUserBooking, SetBookingStatus } from "@/services/userService";
import { SetMainButton } from "@/utils/tgUtils";
import { isMainButtonMounted, mainButton, mountMainButton, setMainButtonParams } from "@telegram-apps/sdk-react";
import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
export type UserBookings = Record<number, BookingInfo[]>

const fetcher_user_booking = async ([, user_id]: [string, number]): Promise<UserBookings> => {
    return {
        2: (await GetUserBooking(user_id, 2)),
        0: (await GetUserBooking(user_id, 0))
    }
}
export function useUserBooking(user_id: number) {
    const [unpaidRows, setUnpaidRows] = useState<{}>({});
    const [upcomingRows, setUpcomigRows] = useState<{}>({});
    const [tableNum, SetTableNum] = useState<0 | 2>(0);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const { data, error, mutate: updateUpcoming } = useSWR(["get-user-bookings", user_id], fetcher_user_booking, { suspense: true })
    const isEmpty = data[0].length === 0 && data[2].length === 0;
    //
    const ChangeStatusOnPicked = async (new_status: number) => {
        setIsLoading(true);
        try {
            await Promise.all(
                picked.map(b => SetBookingStatus(user_id, b.id, new_status))
            );
            await updateUpcoming(); // дождаться обновления SWR
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false); // гарантированно сбросим
        }
    }
    const allBookings = useMemo(() => [...data[0], ...data[2]], [data]);
    //
    const selectedIds = useMemo(() => {
        const ids = [...Object.keys(unpaidRows), ...Object.keys(upcomingRows)].map(Number);
        return new Set(ids);
    }, [unpaidRows, upcomingRows]);

    const picked = useMemo(
        () => allBookings.filter(b => selectedIds.has(b.id)),
        [allBookings, selectedIds]
    );

    const fee = useMemo(
        () => picked.reduce((acc, cur) => acc + cur.fee, 0),
        [picked]
    );
    return (
        {
            unpaidBookings: data[2],
            isEmpty,
            fee,
            picked,
            isLoading,
            isSelected: (picked.length > 0),
            upcomingBookings: data[0],
            isFetchError: !!error,
            unpaidRows,
            upcomingRows,
            tableNum,
            setUnpaidRows,
            setUpcomigRows,
            SetTableNum,
            ChangeStatusOnPicked
        }
    )
}

function omitKey<T extends object, K extends keyof T>(o: T, key: K): Omit<T, K> {
    // при динамическом ключе трюк с деструктуризацией не работает,
    // поэтому копируем и удаляем
    const copy = { ...o };
    delete (copy as any)[key];
    return copy;
}