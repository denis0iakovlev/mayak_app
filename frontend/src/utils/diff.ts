import path from "path";

export function buildDiff<T extends Record<string, any>>(
    originals:T[],//Оригинальнные обьекты , то с чем сравниваем
    edits:Record<number, Partial<T>>, //Обьекты с исправленными значениями
    idKey: keyof T = "id" as keyof T // Уникальный ключ для обьекта по умолчанию id
):Array<{id:T[typeof idKey]} & Partial<T>>
{
    const byId = new Map<any, T>(originals.map(o=>[o[idKey], o]))
    const out:Array<any>=[]
    for (const [idStr, patch] of Object.entries(edits)){
        const id = isNaN(Number(idStr)) ? idStr : Number(idStr)
        const orig = byId.get(id)
        if(!orig) continue;
        const diff:Partial<T> = {}
        for (const k of Object.keys(patch) as (keyof T)[]){
            const v = patch[k]
            if (v !== undefined && v !== orig[k]) 
                diff[k] = v;
        }
        if (Object.keys(diff).length)
            out.push({id, ...diff})
    }
    return out;
}