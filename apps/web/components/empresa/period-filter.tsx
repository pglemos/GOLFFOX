"use client"

import { Button } from "@/components/ui/button"
import { Calendar, CalendarDays, CalendarRange } from "lucide-react"
import { cn } from "@/lib/utils"
import { t } from "@/lib/i18n"

export type PeriodFilter = "today" | "week" | "month" | "custom"

interface PeriodFilterProps {
  value: PeriodFilter
  onChange: (period: PeriodFilter) => void
  className?: string
}

export function PeriodFilter({ value, onChange, className }: PeriodFilterProps) {
  const options: { value: PeriodFilter; label: string; icon: typeof Calendar }[] = [
    { value: "today", label: t('operador', 'charts.today'), icon: Calendar },
    { value: "week", label: t('operador', 'charts.week'), icon: CalendarDays },
    { value: "month", label: t('operador', 'charts.month'), icon: CalendarRange },
  ]

  return (
    <div className={cn("flex gap-2 flex-wrap", className)}>
      {options.map((option) => {
        const Icon = option.icon
        return (
          <Button
            key={option.value}
            variant={value === option.value ? "default" : "outline"}
            size="sm"
            onClick={() => onChange(option.value)}
            className={cn(
              value === option.value && "bg-orange-500 hover:bg-orange-600 text-white"
            )}
          >
            <Icon className="h-4 w-4 mr-2" />
            {option.label}
          </Button>
        )
      })}
    </div>
  )
}

