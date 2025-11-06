'use client'


import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CourtInfo } from "@/schemas/Schemas"

export type SelectCourtProps = {
    court: CourtInfo,
    courtList: CourtInfo[],
    SetCourt: (court_id: CourtInfo) => void
}

export default function SelectCourt({ court, courtList, SetCourt }: SelectCourtProps) {
    //Обработка события изменения
    const handleChange = (val: string) => {
        const findInx = courtList.findIndex((court) => (court.name === val))
        if (findInx !== -1) {
            SetCourt(courtList[findInx])
        } else {
            throw new Error("Ошибка в компоненте выбора доступного корта")
        }
    }
    return (
        <div className="w-full">
            <Select defaultValue={court.name} onValueChange={handleChange}>
                <SelectTrigger className="w-full">
                    <SelectValue placeholder="Выбранный корт" className="text-center" />
                </SelectTrigger>
                <SelectContent className="w-full">
                    <SelectGroup >
                        {
                            courtList.map((courtInfo, inx) => (
                                <SelectItem key={courtInfo.id * 1.5} value={courtInfo.name} >{courtInfo.name} <span className="text-left text-xs italic text-muted-foreground">({courtInfo.description})</span></SelectItem>
                            ))
                        }
                    </SelectGroup>
                </SelectContent>
            </Select>
        </div>
    )
}
