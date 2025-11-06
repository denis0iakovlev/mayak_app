"use client"

import { DataTable } from "@/components/ui/custom/data-table";
import { get_all_courts } from "@/services/generalService";
import { initData, isMainButtonMounted, mountMainButton, setMainButtonParams, useSignal } from "@telegram-apps/sdk-react"
import useSWR from "swr"
import { useEditController } from "../hooks/useCourtsController";
import { CourtInfo, UpdateCourtPayload } from "@/schemas/Schemas";
import { EditTableVariantTable } from "./EditTableVariantTable";
import { useEffect, useMemo } from "react";
import { get_courts_admin_columns } from "../columns/courts-admin-columns";
import { getCoreRowModel, useReactTable } from "@tanstack/react-table";
import useSWRMutation from 'swr/mutation'
import { update_court_info } from "@/services/adminService";
import { MAIN_BUTTON_MAIN } from "@/styles/styles";
import { SetMainButton } from "@/utils/tgUtils";
import { EditCourtsVariantCard } from "./EditCourtsVariantCard";

export default function CourtsAdminPage() {
    const user = useSignal(initData.user);
    if (!isMainButtonMounted()){
        mountMainButton();
    }
    if (!user) {
        throw new Error("Пользователь не аутнтифицирован");
    }
    const { data: courts, mutate } = useSWR("get-admin-courts", get_all_courts, { suspense: true })
    const {trigger, error} = useSWRMutation('update-courts-info',
         (key:string, {arg}:{arg:{admin_id:number, payload:UpdateCourtPayload
        }})=>{
            return update_court_info(arg.admin_id, arg.payload)
        })
    const editController = useEditController<CourtInfo>(courts, "id")
    const columns = useMemo(() => get_courts_admin_columns({
        edits: editController.edits,
        setCellEdit: (id: number, field: keyof CourtInfo, value: any) => editController.setCellEdit(id, field, value)
    }), [editController.edits, editController.setCellEdit])
    useEffect(()=>{
        editController.edits
        SetMainButton({
            backgroundColor:MAIN_BUTTON_MAIN,
            isEnabled:editController.hasChange,
            isVisible:true,
            text: editController.hasChange ? `Сохранить ${editController.payload.length}` :"Нет изменений"
        }, async ()=>{
            for(const pyaload of editController.payload){
                await trigger({admin_id:user.id,payload:pyaload})
            }
            await mutate()
        })
    }, [editController.hasChange])
    const table = useReactTable<CourtInfo>({
        data: courts,
        columns,
        getCoreRowModel: getCoreRowModel()
    }
    )
    //
    return (
        <div className="block">
            <h6 className="text-xl text-amber-700 p-2 border-2 m-5"> Управление кортами</h6>
            <EditCourtsVariantCard
                table={table}
                changedRowPredicate={(row)=>!!editController.edits[(row as CourtInfo).id]}
                onResetRow={(row)=>editController.resetRow((row as CourtInfo).id)}
            />

        </div>
    )
}   