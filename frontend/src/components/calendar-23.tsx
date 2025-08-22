"use client"

import * as React from "react"
import { ChevronDownIcon } from "lucide-react"
import { type DateRange } from "react-day-picker"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { date } from "zod/v4"
import { ru } from "date-fns/locale"

export type CalandarProps = {
  selected:Date,
  onSelect:(newDate:Date)=>void
}

export default function Calendar23({selected,onSelect }:CalandarProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <div className="flex flex-col gap-3">
      <Label htmlFor="dates" className="px-1">
        Выбери Дату
      </Label>
      <Popover open={open} onOpenChange={setOpen}>
         <PopoverTrigger asChild>
          <Button
            variant="outline"
            id="date"
            className="w-48 justify-between font-normal"
          >
            {selected ? selected.toLocaleDateString() : "Выбери день"}
            <ChevronDownIcon />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto overflow-hidden p-0" align="start">
          <Calendar
            mode="single"
            required
            locale={ru}
            selected={selected}
            captionLayout="dropdown"
            onSelect={onSelect}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
