import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL

type ErrorBody = {
    detail:string
}

export async function POST(req:NextRequest){
    try{
        const url =`${API_URL}check_user`
        const resp = await fetch(url, {
            method:"POST",
            body:req.body
        })
        if (!resp.ok){
            throw await resp.json()
        }
        const data = await resp.json();
        return NextResponse.json(data, {status:resp.status});
    }catch(e){
        NextResponse.json({detail:"Не удалось записать пользователя в БД"}as ErrorBody, {status:500})
    }
}
//Получить роль у пользователя
export async function  GET(req:NextRequest) {
    try{
        const {searchParams} = new URL(req.url);
        const url = `${API_URL}user/role?${searchParams.toString()}`
        const resp = await fetch(url)
        const data = await resp.json();
        return NextResponse.json(data, {status:200});
    }catch(e){
        NextResponse.json({detail:"Не удалось записать пользователя в БД"}as ErrorBody, {status:500})
    }
}