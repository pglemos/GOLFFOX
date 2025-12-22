/**
 * VirtualizedTable
 * 
 * Tabela com virtualização para grandes volumes de dados.
 * Usa @tanstack/react-virtual para renderização eficiente.
 */

"use client"

import React, { useState, useMemo, useCallback, useRef, memo } from "react"
import { useVirtualizer } from "@tanstack/react-virtual"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { 
  Search, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  ChevronLeft, 
  ChevronRight,
  Loader2 
} from "lucide-react"
import { cn } from "@/lib/utils"

// ============================================================================
// TIPOS
// ============================================================================

export interface VirtualizedColumn<T> {
  key: string
  label: string
  width?: number
  minWidth?: number
  maxWidth?: number
  sortable?: boolean
  render?: (value: unknown, row: T, index: number) => React.ReactNode
  align?: "left" | "center" | "right"
}

export interface VirtualizedTableProps<T extends Record<string, unknown>> {
  data: T[]
  columns: VirtualizedColumn<T>[]
  rowHeight?: number
  overscan?: number
  maxHeight?: number
  searchable?: boolean
  searchPlaceholder?: string
  title?: string
  description?: string
  emptyMessage?: string
  loading?: boolean
  onRowClick?: (row: T, index: number) => void
  getRowKey?: (row: T, index: number) => string
  className?: string
  stickyHeader?: boolean
}

// ============================================================================
// COMPONENTES AUXILIARES
// ============================================================================

interface SortIconProps {
  columnKey: string
  sortColumn: string | null
  sortDirection: "asc" | "desc"
}

const SortIcon = memo(({ columnKey, sortColumn, sortDirection }: SortIconProps) => {
  if (sortColumn !== columnKey) {
    return <ArrowUpDown className="w-4 h-4 ml-1 opacity-50" />
  }
  return sortDirection === "asc" ? (
    <ArrowUp className="w-4 h-4 ml-1" />
  ) : (
    <ArrowDown className="w-4 h-4 ml-1" />
  )
})
SortIcon.displayName = "SortIcon"

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

function VirtualizedTableComponent<T extends Record<string, unknown>>({
  data,
  columns,
  rowHeight = 48,
  overscan = 5,
  maxHeight = 600,
  searchable = true,
  searchPlaceholder = "Buscar...",
  title,
  description,
  emptyMessage = "Nenhum registro encontrado",
  loading = false,
  onRowClick,
  getRowKey = (_, index) => String(index),
  className,
  stickyHeader = true,
}: VirtualizedTableProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null)
  
  // Estados
  const [searchQuery, setSearchQuery] = useState("")
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")

  // Filtrar dados
  const filteredData = useMemo(() => {
    if (!searchQuery) return data

    const query = searchQuery.toLowerCase()
    return data.filter((row) =>
      columns.some((col) => {
        const value = row[col.key]
        return value?.toString().toLowerCase().includes(query)
      })
    )
  }, [data, searchQuery, columns])

  // Ordenar dados
  const sortedData = useMemo(() => {
    if (!sortColumn) return filteredData

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortColumn]
      const bValue = b[sortColumn]

      if (aValue === null || aValue === undefined) return 1
      if (bValue === null || bValue === undefined) return -1

      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue
      }

      const aStr = String(aValue).toLowerCase()
      const bStr = String(bValue).toLowerCase()

      if (sortDirection === "asc") {
        return aStr < bStr ? -1 : aStr > bStr ? 1 : 0
      }
      return aStr > bStr ? -1 : aStr < bStr ? 1 : 0
    })
  }, [filteredData, sortColumn, sortDirection])

  // Virtualizador
  const virtualizer = useVirtualizer({
    count: sortedData.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan,
  })

  const virtualRows = virtualizer.getVirtualItems()
  const totalSize = virtualizer.getTotalSize()

  // Handlers
  const handleSort = useCallback((columnKey: string) => {
    if (sortColumn === columnKey) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"))
    } else {
      setSortColumn(columnKey)
      setSortDirection("asc")
    }
  }, [sortColumn])

  const handleRowClick = useCallback((row: T, index: number) => {
    onRowClick?.(row, index)
  }, [onRowClick])

  // Calcular largura total
  const totalWidth = useMemo(() => {
    return columns.reduce((acc, col) => acc + (col.width || col.minWidth || 150), 0)
  }, [columns])

  return (
    <Card className={cn("bg-card overflow-hidden", className)}>
      {/* Header */}
      {(title || description || searchable) && (
        <CardHeader className="px-4 sm:px-6 bg-card">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
            <div className="flex-1 min-w-0">
              {title && <CardTitle className="text-lg sm:text-xl">{title}</CardTitle>}
              {description && (
                <CardDescription className="text-xs sm:text-sm mt-1">
                  {description}
                </CardDescription>
              )}
            </div>
            {searchable && (
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder={searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-card"
                />
              </div>
            )}
          </div>
          
          {/* Info de resultados */}
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-muted-foreground">
              {sortedData.length.toLocaleString()} {sortedData.length === 1 ? "registro" : "registros"}
              {searchQuery && ` encontrado${sortedData.length !== 1 ? "s" : ""}`}
            </span>
          </div>
        </CardHeader>
      )}

      <CardContent className="p-0">
        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Carregando...</span>
          </div>
        )}

        {/* Empty State */}
        {!loading && sortedData.length === 0 && (
          <div className="text-center py-12">
            <p className="text-sm text-muted-foreground">{emptyMessage}</p>
          </div>
        )}

        {/* Table */}
        {!loading && sortedData.length > 0 && (
          <div className="overflow-x-auto">
            {/* Header fixo */}
            {stickyHeader && (
              <div className="sticky top-0 z-10 bg-card border-b border-border">
                <Table style={{ minWidth: totalWidth }}>
                  <TableHeader>
                    <TableRow>
                      {columns.map((column) => (
                        <TableHead
                          key={column.key}
                          style={{
                            width: column.width,
                            minWidth: column.minWidth || 100,
                            maxWidth: column.maxWidth,
                          }}
                          className={cn(
                            "px-4 py-3 text-xs font-semibold uppercase tracking-wider",
                            column.sortable && "cursor-pointer select-none hover:bg-muted/50",
                            column.align === "center" && "text-center",
                            column.align === "right" && "text-right"
                          )}
                          onClick={() => column.sortable && handleSort(column.key)}
                        >
                          <div className={cn(
                            "flex items-center gap-1",
                            column.align === "center" && "justify-center",
                            column.align === "right" && "justify-end"
                          )}>
                            <span className="truncate">{column.label}</span>
                            {column.sortable && (
                              <SortIcon
                                columnKey={column.key}
                                sortColumn={sortColumn}
                                sortDirection={sortDirection}
                              />
                            )}
                          </div>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                </Table>
              </div>
            )}

            {/* Body virtualizado */}
            <div
              ref={parentRef}
              style={{ maxHeight, overflow: "auto" }}
              className="scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent"
            >
              <div style={{ height: totalSize, position: "relative" }}>
                <Table style={{ minWidth: totalWidth }}>
                  {!stickyHeader && (
                    <TableHeader>
                      <TableRow>
                        {columns.map((column) => (
                          <TableHead
                            key={column.key}
                            style={{
                              width: column.width,
                              minWidth: column.minWidth || 100,
                              maxWidth: column.maxWidth,
                            }}
                            className={cn(
                              "px-4 py-3 text-xs font-semibold uppercase tracking-wider",
                              column.sortable && "cursor-pointer select-none hover:bg-muted/50"
                            )}
                            onClick={() => column.sortable && handleSort(column.key)}
                          >
                            <div className="flex items-center gap-1">
                              <span className="truncate">{column.label}</span>
                              {column.sortable && (
                                <SortIcon
                                  columnKey={column.key}
                                  sortColumn={sortColumn}
                                  sortDirection={sortDirection}
                                />
                              )}
                            </div>
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                  )}
                  <TableBody>
                    {virtualRows.map((virtualRow) => {
                      const row = sortedData[virtualRow.index]
                      const rowKey = getRowKey(row, virtualRow.index)

                      return (
                        <TableRow
                          key={rowKey}
                          data-index={virtualRow.index}
                          style={{
                            height: rowHeight,
                            transform: `translateY(${virtualRow.start}px)`,
                            position: "absolute",
                            top: 0,
                            left: 0,
                            width: "100%",
                          }}
                          className={cn(
                            "hover:bg-muted/50 transition-colors",
                            onRowClick && "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          )}
                          onClick={() => handleRowClick(row, virtualRow.index)}
                          onKeyDown={(e) => {
                            if (onRowClick && (e.key === "Enter" || e.key === " ")) {
                              e.preventDefault()
                              handleRowClick(row, virtualRow.index)
                            }
                          }}
                          role={onRowClick ? "button" : undefined}
                          tabIndex={onRowClick ? 0 : undefined}
                        >
                          {columns.map((column) => (
                            <TableCell
                              key={column.key}
                              style={{
                                width: column.width,
                                minWidth: column.minWidth || 100,
                                maxWidth: column.maxWidth,
                              }}
                              className={cn(
                                "px-4 py-2 text-sm",
                                column.align === "center" && "text-center",
                                column.align === "right" && "text-right"
                              )}
                            >
                              <div className="truncate">
                                {column.render
                                  ? column.render(row[column.key], row, virtualRow.index)
                                  : String(row[column.key] ?? "-")}
                              </div>
                            </TableCell>
                          ))}
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export const VirtualizedTable = memo(VirtualizedTableComponent) as typeof VirtualizedTableComponent

export default VirtualizedTable

