import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { UpdateUser, User } from "@/utils/adminService";
import { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner"
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { SendHorizonalIcon } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { Switch } from "@/components/ui/switch";

const headerClass = cn("text-md font-stretch-50%")

const header = (title: string, className: string) => {
    return (
        <div className={className}>{title}</div>
    )
}

export default function generateUsersCols(admin_id: number): ColumnDef<User>[] {
    return (
        [
            {
                id: "id",
                header: () => header("id", headerClass),
                accessorKey: "telegram_id",
                enableHiding: true,
                enableResizing: true
            },
            {
                id: "name",
                header: () => header("Имя в ТГ", headerClass),
                accessorKey: "first_name"
            },
            {
                id: "phoneNumber",
                header: () => header("Номер", headerClass),
                cell: ({ row }) => {
                    const [phNumber, SetNumber] = useState<string>(row.original.phone_number || "")
                    return (
                        <Input
                            className="min-w-10 w-max-16 text-sm font-stretch-100%"
                            value={phNumber}
                            type="tel"
                            placeholder="+7 (___) ___ - __ - __"
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                SetNumber(e.target.value);
                            }}
                            onBlur={(e) => {
                                row.original.phone_number = e.target.value;
                            }}
                        />
                    )
                }
            },
            {
                id: "usernameField",
                header: () => header("Имя игрока", headerClass),
                cell: ({ row }) => {
                    const original = row.original;
                    const [val, setVal] = useState<string>(original.username || "")
                    const handleOnBlur = (e: React.FocusEvent<HTMLInputElement>) => {
                        if (val.length > 0 && val != original.username) {
                            setVal(e.target.value);
                            original.username = e.target.value;
                        }
                    }
                    const handleOnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
                        setVal(e.target.value)
                    }
                    return (
                        <>
                            <div className="flex flex-row justify-start min-w-32">
                                <Input type="text" className="text-sm" value={val} onChange={handleOnChange} onBlur={handleOnBlur} />
                            </div>
                        </>
                    )
                }
            },
            {
                id: "role",
                header: () => header("Админ", headerClass),
                cell: ({ row }) => {
                    const [isAdmin, setIsAdmin] = useState(row.original.role.toLowerCase() === "админ")
                    return (
                        <Switch
                            checked={isAdmin}
                            onCheckedChange={(checked) => {
                                setIsAdmin(checked);
                                row.original.role = checked ? "Админ" : "Булка";
                            }} />
                    )
                }
            },
            {
                id: "isTrainer",
                header: () => header("Тренер?", headerClass),
                cell: ({ row }) => {
                    const [isTrainer, SetIsTrainer] = useState<boolean>(row.original.is_trainer);
                    return (
                        <Switch checked={isTrainer} onCheckedChange={(checked) => {
                            SetIsTrainer(checked)
                            row.original.is_trainer = checked;
                        }} />
                    )
                }
            },
            {
                id: "acceptChanges",
                cell: ({ row }) => {
                    const origin = row.original;
                    const updateUser = async () => {
                        try {
                            const upUser = {
                                admin_id: admin_id,
                                user_id: origin.telegram_id,
                                is_trainer: origin.is_trainer,
                                phone_number: origin.phone_number,
                                role: origin.role.toLocaleLowerCase() === "админ" ? 1 : 0,
                                username: origin.username
                            }
                            await UpdateUser(upUser)
                        } catch (e) {
                            throw e;
                        }
                    }
                    return (
                        <>
                            <Button variant="outline" onClick={() => {
                                toast("Данные изменены", {
                                    description: () => (
                                        <div>
                                            <p>Имя игрока {origin.username || "Не указано"}</p>
                                            <p>Админ: {origin.role.toLocaleLowerCase() === "админ" ? "Да" : "Нет"}</p>
                                            <p>Тренер: {origin.is_trainer ? "Да" : "Нет"}</p>
                                            <p>Телефон: {origin.phone_number || "Не указан"}</p>
                                        </div>)
                                    ,
                                    action: {
                                        label: "Обновить",
                                        onClick: updateUser
                                    },
                                })
                            }}>
                                <SendHorizonalIcon className="size-6" />
                            </Button>
                            <Toaster position="top-center" duration={3000} />
                        </>
                    )
                }
            }
        ]
    )
}