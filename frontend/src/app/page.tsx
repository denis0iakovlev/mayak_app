'use client'
import Loader from "@/components/layouts/Loader"
import { Booking } from "@/features/booking/components/Booking"
import { Suspense } from "react"

export default function Home() {
  return (
    // <Suspense fallback={<Loader message="Загружаем доступное время на кортах" />}>
      <Booking />
  )
}
