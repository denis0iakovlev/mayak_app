'use client'

import React, { useState } from "react";
import { Collapsible, CollapsibleContent } from "../ui/collapsible";
import { CollapsibleTrigger } from "@radix-ui/react-collapsible";
import { Button } from "../ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";

type BookingsListProps = {
    title: string,
    bookList: Readonly<React.ReactNode>
}


export default function BookingGroupItem({ title, bookList }: BookingsListProps) {
    const [isOpen, SetOpen] = useState<boolean>(true);
    return (
        <Collapsible
            open={isOpen}
            onOpenChange={SetOpen}
            className="border border-zinc-300 rounded-xl mx-1"
        >
            <div className="w-full flex items-center justify-between">
                <h6 className="text-xl px-2 py-3 font-normal font-stretch-50% text-amber-800">{title}</h6>
                <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="icon" className="size-8">
                        {
                            isOpen ? <ChevronUp /> : <ChevronDown />
                        }
                    </Button>
                </CollapsibleTrigger>
            </div>
            <CollapsibleContent>
                {bookList}
            </CollapsibleContent>
        </Collapsible>
    )
}