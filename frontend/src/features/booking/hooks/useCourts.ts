import { get_active_courts } from "@/services/generalService";
import useSWR from "swr";

export default function useCourts(){
    const { data, error, mutate } =  useSWR("get-active-courts", get_active_courts, { suspense: true })
    return{
        courts:data,
        isError: !!error,
        refresh:()=>mutate()
    }
}