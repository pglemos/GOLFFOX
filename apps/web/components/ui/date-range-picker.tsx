"use client"

import * as React from "react"

import { addDays, format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Calendar as CalendarIcon } from "lucide-react"
import { DateRange } from "react-day-picker"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface DatePickerWithRangeProps {
    className?: string
    date?: DateRange
    onDateChange?: (date: DateRange | undefined) => void
}

export function DatePickerWithRange({
    className,
    date,
    onDateChange,
}: DatePickerWithRangeProps) {
    const [internalDate, setInternalDate] = React.useState<DateRange | undefined>(date)

    React.useEffect(() => {
        setInternalDate(date)
    }, [date])

    const handleSelect = (newDate: DateRange | undefined) => {
        setInternalDate(newDate)
        if (onDateChange) {
            onDateChange(newDate)
        }
    }

    return (
        <div className={cn("grid gap-2", className)}>
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        id="date"
                        variant={"outline"}
                        className={cn(
                            "w-[300px] justify-start text-left font-normal",
                            !internalDate && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {internalDate?.from ? (
                            internalDate.to ? (
                                <>
                                    {format(internalDate.from, "dd 'de' MMM, yyyy", { locale: ptBR })} -{" "}
                                    {format(internalDate.to, "dd 'de' MMM, yyyy", { locale: ptBR })}
                                </>
                            ) : (
                                format(internalDate.from, "dd 'de' MMM, yyyy", { locale: ptBR })
                            )
                        ) : (
                            <span>Selecione um período</span>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={internalDate?.from}
                        selected={internalDate}
                        onSelect={handleSelect}
                        numberOfMonths={2}
                        locale={ptBR}
                    />
                </PopoverContent>
            </Popover>
        </div>
    )
}
