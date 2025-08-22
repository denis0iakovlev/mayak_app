import { NextRequest, NextResponse } from "next/server";

const API_URL= process.env.NEXT_PUBLIC_API_URL

export async function GET(req:NextRequest){
    const urlFull = `${API_URL}courts/all`
    console.log("Get all courts ", urlFull)
    const resp = await fetch(urlFull);
    const data = await resp.json();
    console.log(JSON.stringify(data))
    return NextResponse.json(data);
}