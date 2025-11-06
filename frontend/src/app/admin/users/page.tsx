'use client'

import users_columns from "@/features/admin/columns/users-cols";
import { DataTable } from "@/components/ui/custom/data-table";
import { initData, useSignal } from "@telegram-apps/sdk-react";
import { useEffect, useState } from "react"
import { GetAllUsers } from "@/services/adminService";
import { UserInfo } from "@/schemas/Schemas";
import UpDownCollapse from "@/components/ui/custom/UpDownCollaps";
import useSWR from "swr";
import { useMayakUser } from "@/components/context/UserInitializer";

export default function AdminUsersPage() {
    const user = useSignal(initData.user);
    if (!user) {
        throw new Error("Пользователь не аутентифицирован.")
    }
    const { data: users, mutate } = useSWR(["get-admin-users", user?.id], ([, user_id]: [string, number]) => {
        return GetAllUsers(user_id)
    }, { suspense: true })

    return (
        <div className="p-2">
            <h6 className="my-4 text-lg font-semibold font-stretch-75%">Все пользователи системы</h6>
            <UpDownCollapse
                title="Все любители кортов маяк"
                collapsible={
                    <DataTable columns={users_columns(user!.id)} data={users} />
                }
            />
        </div>
    )

}