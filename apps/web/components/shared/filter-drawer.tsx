"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter } from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X, Filter, RotateCcw } from "lucide-react"
import { modalContent } from "@/lib/animations"

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
  open: boolean
  onOpenChange: (open: boolean) => void
  filters: Record<string, string>
  onFiltersChange: (filters: Record<string, string>) => void
  fields: FilterField[]
  onReset?: () => void
}

export function FilterDrawer({
  open,
  onOpenChange,
  filters,
  onFiltersChange,
  fields,
  onReset
}: FilterDrawerProps) {
  const handleFilterChange = (key: string, value: string) => {
    onFiltersChange({ ...filters, [key]: value })
  }

  const handleReset = () => {
    const resetFilters: Record<string, string> = {}
    fields.forEach(field => {
      resetFilters[field.key] = ""
    })
    onFiltersChange(resetFilters)
    if (onReset) onReset()
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="bg-card/95 backdrop-blur-lg border-t border-[var(--border)]">
        <motion.div
          variants={modalContent}
          initial="hidden"
          animate="visible"
        >
          <DrawerHeader className="border-b border-[var(--border)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-[var(--brand-light)] to-[var(--brand-soft)]">
                  <Filter className="h-5 w-5 text-[var(--brand)]" />
                </div>
                <div>
                  <DrawerTitle className="text-lg font-semibold">Filtros</DrawerTitle>
                  <DrawerDescription className="text-sm text-[var(--ink-muted)]">
                    Aplique filtros para refinar sua busca
                  </DrawerDescription>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onOpenChange(false)}
                className="h-9 w-9"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DrawerHeader>

          <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
            {fields.map((field, index) => (
              <motion.div
                key={field.key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="space-y-2"
              >
                <label className="text-sm font-medium text-[var(--ink-strong)]">
                  {field.label}
                </label>
                {field.type === "text" && (
                  <Input
                    value={filters[field.key] || ""}
                    onChange={(e) => handleFilterChange(field.key, e.target.value)}
                    placeholder={field.placeholder || `Digite ${field.label.toLowerCase()}`}
                    className="bg-card/50 backdrop-blur-sm"
                  />
                )}
                {field.type === "select" && (
                  <Select
                    value={filters[field.key] || ""}
                    onValueChange={(value) => handleFilterChange(field.key, value)}
                  >
                    <SelectTrigger className="bg-card/50 backdrop-blur-sm">
                      <SelectValue placeholder={field.placeholder || `Selecione ${field.label.toLowerCase()}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {field.options?.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {field.type === "date" && (
                  <Input
                    type="date"
                    value={filters[field.key] || ""}
                    onChange={(e) => handleFilterChange(field.key, e.target.value)}
                    className="bg-card/50 backdrop-blur-sm"
                  />
                )}
              </motion.div>
            ))}
          </div>

          <DrawerFooter className="border-t border-[var(--border)]">
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleReset}
                className="flex-1"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Limpar
              </Button>
              <Button
                onClick={() => onOpenChange(false)}
                className="flex-1 bg-gradient-to-r from-[var(--brand)] to-[var(--brand-hover)]"
              >
                Aplicar Filtros
              </Button>
            </div>
          </DrawerFooter>
        </motion.div>
      </DrawerContent>
    </Drawer>
  )
}

