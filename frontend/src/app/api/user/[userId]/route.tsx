import { NextRequest, NextResponse } from "next/server";
import { BookedResp } from "../../booking/route";
import { error } from "console";

const API_URL = process.env.NEXT_PUBLIC_API_URL
const ENDPOINT = "booking/user"

export type UserBooking = {
  id: number;
  date: string; // ISO-format string, e.g. "2025-06-28"
  start_time: string; // "HH:mm:ss" или "HH:mm"
  end_time: string;
  court_id: number;
  user_id: number;
  status: number;
};

export type UserBookingResponse = UserBooking[];

export async function GET(req:NextRequest, {params}:{params:Promise<{userId:string}>}){
    try{
        //Получем id юзера
        const {searchParams} = new URL(req.url);
        console.log()
        const {userId} = await params;
        const url = `${API_URL}user/booking/upcoming?user_id=${userId}`;
        console.log("Api for get booking ", url)
        const resp = await fetch(url) 
        const data = (await resp.json()) as BookedResp;
        if (!resp.ok){
            return NextResponse.json({error:"error"}, {status:resp.status});
        }
        return NextResponse.json(data);
    }catch(e){
        return NextResponse.json({error:"Не удалось получить список бронирования"}, {status:502})
    }
}

export async function DELETE(req:NextRequest, {params}:{params:Promise<{userId:string}>}) {
    try{
        const {userId} = await params;
        const {searchParams} = new URL(req.url);
        const booking_id = searchParams.get("booking_id");
        const newReq = `${API_URL}${ENDPOINT}/${userId}?booking_id=${booking_id}`;
        console.log("DELETE request to ", newReq)
        return await fetch(newReq, {
            method:"DELETE"
        });
    }catch(e){
        return NextResponse.json({error:"Не удалось удалить бронирование"}, {status:501});
    }
    
}