'use client'

import Loader from "@/components/layouts/Loader"
import { UserBooking } from "@/features/dashboard/components/UserBookings"
import { Suspense } from "react"

export default function MyBookingPage() {
    return (
        <Suspense fallback={<Loader message="Получаем бронирования пользовтеля"/>}>
            <UserBooking />
        </Suspense>
    )
}