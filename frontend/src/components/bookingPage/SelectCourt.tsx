'use client'

import { useEffect, useState } from "react"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export type SelectCourtProps = {
    defaultCourt?:number,
    SetCourt: (court_id: number) => void
}

type CourtInfo = {
    id: number
    name: string
    description: string
}

export default function SelectCourt({defaultCourt, SetCourt }: SelectCourtProps) {
    const [courts, setCourts] = useState<CourtInfo[]>([])
    const [loading, setLoading] = useState<boolean>(true)
    const [error, setError] = useState<string | null>(null)
    useEffect(() => {
        const fetcher = async () => {
            try {
                const res = await fetch('/api/court');
                if (!res.ok) {
                    throw new Error("Не удалось получить данные о доступных кортах")
                }
                const data: CourtInfo[] = await res.json()
                setCourts(data)
                if (defaultCourt){
                   SetCourt(defaultCourt) 
                }else{
                    SetCourt(data[0].id)
                }
            } catch (error) {
                setError((error as Error).message)
            } finally {
                setLoading(false)
            }
        }
        fetcher();
    }, []);
    //Обработка события изменения
    const handleChange = (val:string)=>{
        const findInx = courts.findIndex((court)=>(court.name === val))
        if (findInx !== -1){
            SetCourt(courts[findInx].id)
        }
    }
    if (loading) {
        return (<div>
            Получаем данные ...
        </div>)
    } else {
        return (
            <div className="w-full">
                <Select defaultValue={courts[0].name} onValueChange={handleChange}>
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Выбранный корт" className="text-center"/>
                    </SelectTrigger>
                    <SelectContent className="w-full">
                        <SelectGroup >
                            {
                                courts.map((courtInfo, inx) => (
                                    <SelectItem key={courtInfo.id*1.5} value={courtInfo.name} >{courtInfo.name} <span className="text-left text-xs italic text-muted-foreground">({courtInfo.description})</span></SelectItem>
                                ))
                            }
                        </SelectGroup>
                    </SelectContent>
                </Select>
            </div>
        )
    }
}