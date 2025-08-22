'use client'

import generateUsersCols from "@/components/admin/users/users-cols";
import { DataTable } from "@/components/DataTable/data-table";
import BookingGroupItem from "@/components/UserBookings/BookingGroupItem";
import { GetAllUsers, User } from "@/utils/adminService"
import { initData, useSignal } from "@telegram-apps/sdk-react";
import { useEffect, useState } from "react"

export default function AdminUsersPage() {
    const [users, SetUsers] = useState<User[]>([]);
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