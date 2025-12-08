"use client"

import React from "react"
import { useMobile } from "@/hooks/use-mobile"
import { Card, CardContent } from "@/components/ui/card"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

interface DataTableMobileProps<T> {
  data: T[]
  columns: Array<{
    key: string
    label: string
    render?: (value: any, row: T) => React.ReactNode
  }>
  onRowClick?: (row: T) => void
  className?: string
  emptyMessage?: string
}

/**
 * Componente DataTable que renderiza como cards em mobile e tabela em desktop
 */
export function DataTableMobile<T extends Record<string, any>>({
  data,
  columns,
  onRowClick,
  className,
  emptyMessage = "Nenhum registro encontrado"
}: DataTableMobileProps<T>) {
  const isMobile = useMobile()

  if (isMobile) {
    // Renderizar como cards em mobile
    if (data.length === 0) {
      return (
        <div className="flex items-center justify-center py-12 px-4">
          <p className="text-sm text-muted-foreground">{emptyMessage}</p>
        </div>
      )
    }

    return (
      <div className={cn("space-y-3", className)}>
        {data.map((row, index) => (
          <Card
            key={index}
            className={cn(
              "cursor-pointer transition-all touch-manipulation",
              onRowClick && "hover:shadow-md active:scale-[0.98]",
              "border border-border"
            )}
            onClick={() => onRowClick?.(row)}
          >
            <CardContent className="p-4 space-y-3">
              {columns.map((column) => {
                const value = row[column.key]
                const renderedValue = column.render ? column.render(value, row) : value

                return (
                  <div
                    key={column.key}
                    className="flex flex-col gap-1 min-h-[44px] justify-center"
                  >
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {column.label}
                    </div>
                    <div className="text-sm font-medium text-foreground break-words">
                      {renderedValue || <span className="text-muted-foreground">—</span>}
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  // Renderizar como tabela em desktop
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className={cn("rounded-md border", className)}>
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column.key}>{column.label}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, index) => (
            <TableRow
              key={index}
              className={cn(
                onRowClick && "cursor-pointer hover:bg-muted/50"
              )}
              onClick={() => onRowClick?.(row)}
            >
              {columns.map((column) => {
                const value = row[column.key]
                const renderedValue = column.render ? column.render(value, row) : value

                return (
                  <TableCell key={column.key}>
                    {renderedValue || <span className="text-muted-foreground">—</span>}
                  </TableCell>
                )
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

