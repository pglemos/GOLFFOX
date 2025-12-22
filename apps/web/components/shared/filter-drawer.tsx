"use client"

import React from "react"
import { useMobile } from "@/hooks/use-mobile"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Filter, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface FilterOption {
  label: string
  value: string
}

interface FilterField {
  key: string
  label: string
  type: "text" | "select" | "date"
  options?: FilterOption[]
  placeholder?: string
}

interface FilterDrawerProps {
  filters: FilterField[]
  values: Record<string, string>
  onFilterChange: (key: string, value: string) => void
  onReset: () => void
  trigger?: React.ReactNode
  title?: string
  description?: string
}

/**
 * Componente de filtros que usa Drawer em mobile e pode ser usado inline em desktop
 */
export function FilterDrawer({
  filters,
  values,
  onFilterChange,
  onReset,
  trigger,
  title = "Filtros",
  description = "Aplique filtros para refinar os resultados"
}: FilterDrawerProps) {
  const isMobile = useMobile()
  const [open, setOpen] = React.useState(false)

  const hasActiveFilters = Object.values(values).some(v => v && v !== "" && v !== "all")

  const content = (
    <div className="space-y-4">
      {filters.map((filter) => (
        <div key={filter.key} className="space-y-2">
          <Label htmlFor={filter.key} className="text-sm font-medium">
            {filter.label}
          </Label>
          {filter.type === "text" && (
            <Input
              id={filter.key}
              type="text"
              placeholder={filter.placeholder || `Filtrar por ${filter.label.toLowerCase()}`}
              value={values[filter.key] || ""}
              onChange={(e) => onFilterChange(filter.key, e.target.value)}
              className="min-h-[44px] text-base"
            />
          )}
          {filter.type === "select" && (
            <Select
              value={values[filter.key] || "all"}
              onValueChange={(value) => onFilterChange(filter.key, value)}
            >
              <SelectTrigger id={filter.key} className="min-h-[44px] text-base">
                <SelectValue placeholder={`Selecione ${filter.label.toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {filter.options?.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {filter.type === "date" && (
            <Input
              id={filter.key}
              type="date"
              value={values[filter.key] || ""}
              onChange={(e) => onFilterChange(filter.key, e.target.value)}
              className="min-h-[44px] text-base"
            />
          )}
        </div>
      ))}
      <div className="flex gap-2 pt-4">
        <Button
          variant="outline"
          onClick={onReset}
          className="flex-1 min-h-[44px] touch-manipulation"
        >
          Limpar
        </Button>
        <Button
          onClick={() => setOpen(false)}
          className="flex-1 min-h-[44px] touch-manipulation"
        >
          Aplicar
        </Button>
      </div>
    </div>
  )

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          {trigger || (
            <Button
              variant="outline"
              className={cn(
                "min-h-[44px] touch-manipulation",
                hasActiveFilters && "border-primary bg-primary/5"
              )}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtros
              {hasActiveFilters && (
                <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                  {Object.values(values).filter(v => v && v !== "" && v !== "all").length}
                </span>
              )}
            </Button>
          )}
        </SheetTrigger>
        <SheetContent 
          side="right" 
          className="w-[90vw] max-w-sm overflow-y-auto scroll-smooth-touch"
          style={{
            paddingTop: 'max(1rem, env(safe-area-inset-top))',
            paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
          }}
        >
          <SheetHeader>
            <SheetTitle>{title}</SheetTitle>
            <SheetDescription>{description}</SheetDescription>
          </SheetHeader>
          <div className="mt-6">
            {content}
          </div>
        </SheetContent>
      </Sheet>
    )
  }

  // Desktop: usar Dialog (modal)
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button
            variant="outline"
            className={cn(
              "min-h-[44px] touch-manipulation",
              hasActiveFilters && "border-primary bg-primary/5"
            )}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filtros
            {hasActiveFilters && (
              <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                {Object.values(values).filter(v => v && v !== "" && v !== "all").length}
              </span>
            )}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="mt-4">
          {content}
        </div>
      </DialogContent>
    </Dialog>
  )
}
