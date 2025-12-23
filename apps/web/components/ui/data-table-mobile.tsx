"use client"

import React, { useRef, useCallback } from "react"

import { useVirtualizer } from "@tanstack/react-virtual"

import { Card, CardContent } from "@/components/ui/card"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { useMobile } from "@/hooks/use-mobile"
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

// Componente memoizado para cada card
const TableRowCard = React.memo(function TableRowCard<T extends Record<string, any>>({
  row,
  columns,
  onRowClick
}: {
  row: T
  columns: Array<{
    key: string
    label: string
    render?: (value: any, row: T) => React.ReactNode
  }>
  onRowClick?: (row: T) => void
}) {
  const handleClick = useCallback(() => {
    onRowClick?.(row)
  }, [onRowClick, row])

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all touch-manipulation",
        onRowClick && "hover:shadow-md active:scale-[0.98]",
        "border border-border"
      )}
      onClick={handleClick}
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
  )
}) as <T extends Record<string, any>>(props: {
  row: T
  columns: Array<{
    key: string
    label: string
    render?: (value: any, row: T) => React.ReactNode
  }>
  onRowClick?: (row: T) => void
}) => React.ReactElement

/**
 * Componente DataTable que renderiza como cards em mobile e tabela em desktop
 */
export const DataTableMobile = React.memo(function DataTableMobile<T extends Record<string, any>>({
  data,
  columns,
  onRowClick,
  className,
  emptyMessage = "Nenhum registro encontrado"
}: DataTableMobileProps<T>) {
  const isMobile = useMobile()
  const parentRef = useRef<HTMLDivElement>(null)
  const shouldVirtualize = data.length > 50

  const virtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 120, // altura estimada de cada card
    overscan: 5, // renderizar 5 itens extras fora da viewport
    enabled: shouldVirtualize && isMobile,
  })

  const handleRowClick = useCallback((row: T) => {
    onRowClick?.(row)
  }, [onRowClick])

  if (isMobile) {
    // Renderizar como cards em mobile
    if (data.length === 0) {
      return (
        <div className="flex items-center justify-center py-12 px-4">
          <p className="text-sm text-muted-foreground">{emptyMessage}</p>
        </div>
      )
    }

    // Usar virtualização para listas grandes
    if (shouldVirtualize) {
      return (
        <div
          ref={parentRef}
          className={cn("h-[600px] overflow-auto", className)}
        >
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const row = data[virtualRow.index]
              return (
                <div
                  key={virtualRow.key}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                  className="px-4 pb-3"
                >
                  <TableRowCard row={row} columns={columns} onRowClick={handleRowClick} />
                </div>
              )
            })}
          </div>
        </div>
      )
    }

    // Fallback para listas pequenas
    return (
      <div className={cn("space-y-3", className)}>
        {data.map((row, index) => (
          <TableRowCard key={index} row={row} columns={columns} onRowClick={handleRowClick} />
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
              onClick={() => handleRowClick(row)}
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
}) as <T extends Record<string, any>>(props: DataTableMobileProps<T>) => React.ReactElement

