'use client'
import { Card, CardContent } from "@/components/ui/card"
import { SetMainButton } from "@/utils/tgUtils"
import Link from "next/link"
import { usePathname } from "next/navigation"

export default function AdminPage() {
    SetMainButton({
        isVisible:false
    }, ()=>{});
    const pathname = usePathname();
    const refs = [
        { href: "/booking", label: "Посмотрететь бронирования" },
        { href: "/users", label: "Посмотрететь пользователей" },
        { href: "/courts", label: "Посмотрететь корты" }
    ]
    return (
        <div className="flex gap-2 flex-col py-4 px-2">
            {
                refs.map((ref, inx) => (
                    <Link href={`${pathname}${ref.href}`}
                        className="w-full h-full"
                        key={inx}
                    >
                        <Card className="hover:bg-blue-200 hover:border-2 hover:border-black">
                            <CardContent >
                                {ref.label}
                            </CardContent>
                        </Card>
                    </Link>
                ))
            }
        </div >
    )
}