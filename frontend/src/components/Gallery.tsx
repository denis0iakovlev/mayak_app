'use client'
//components/Gallery.tsx

import Image from "next/image"
import { AspectRatio } from "@/components/ui/aspect-ratio"
import { Card, CardContent } from '@/components/ui/card'

type GalleryProps = {
    images: string[]
}

export const Gallery = ({ images }: GalleryProps) => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-4">
            {
                images.map((src, inx) => (
                    <Card  key={inx}>
                        <CardContent>
                            <AspectRatio ratio={16 / 9} className="bg-muted rounded-lg">
                                <Image
                                    src={src}
                                    fill
                                    alt="courts"
                                    className="rounded-md max-h-screen object-cover"
                                />
                            </AspectRatio>
                        </CardContent>
                    </Card>
                ))
            }
        </div>
    )
}