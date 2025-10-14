'use client'

import generateUsersCols from "@/features/admin/columns/users-cols";
import { DataTable } from "@/components/ui/data-table";
import BookingGroupItem from "@/features/admin/components/BookingGroupItem";
import { initData, useSignal } from "@telegram-apps/sdk-react";
import { useEffect, useState } from "react"
import { GetAllUsers } from "@/services/adminService";
import { UserInfo } from "@/schemas/Schemas";

export default function AdminUsersPage() {
    const [users, SetUsers] = useState<UserInfo[]>([]);
    const user = useSignal(initData.user)

    useEffect(() => {
        const getUsers = async () => {
            if (user) {
                SetUsers(await GetAllUsers(user.id));
            }
        }
        getUsers();
    },[])
    return (
        <div className="p-2">
            <h6 className="my-4 text-lg font-semibold font-stretch-75%">Все пользователи системы</h6>
            <BookingGroupItem
                title="Все любители кортов маяк"
                bookList={<DataTable columns={generateUsersCols(user!.id)} data={users} />}
            />
        </div>
    )

}