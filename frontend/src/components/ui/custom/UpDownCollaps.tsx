'use client'
import React, { useState } from "react";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { CollapsibleTrigger } from "@radix-ui/react-collapsible";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";

type UpDownCollapseProps = {
    title: string,
    collapsible: Readonly<React.ReactNode>
}

export default function UpDownCollapse({ title, collapsible }: UpDownCollapseProps) {
    const [isOpen, SetOpen] = useState<boolean>(true);
    if (collapsible === null){
        return null;
    }
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
                {collapsible}
            </CollapsibleContent>
        </Collapsible>
    )
}