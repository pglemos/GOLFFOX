"use client"

import { useState, useMemo } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { t } from "@/lib/i18n"

export interface Column<T> {
  key: string
  label: string
  sortable?: boolean
  render?: (value: any, row: T) => React.ReactNode
  filterable?: boolean
  filterType?: "text" | "select" | "date"
  filterOptions?: { label: string; value: string }[]
}

interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  searchable?: boolean
  searchPlaceholder?: string
  pagination?: boolean
  pageSize?: number
  title?: string
  description?: string
  emptyMessage?: string
  onRowClick?: (row: T) => void
  className?: string
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  searchable = true,
  searchPlaceholder = "Buscar...",
  pagination = true,
  pageSize = 10,
  title,
  description,
  emptyMessage = "Nenhum registro encontrado",
  onRowClick,
  className
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [filters, setFilters] = useState<Record<string, string>>({})

  // Filter data
  const filteredData = useMemo(() => {
    let result = [...data]

    // Apply search
    if (searchQuery) {
      result = result.filter((row) =>
        columns.some((col) => {
          const value = row[col.key]
          return value?.toString().toLowerCase().includes(searchQuery.toLowerCase())
        })
      )
    }

    // Apply column filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        result = result.filter((row) => {
          const cellValue = row[key]?.toString().toLowerCase()
          return cellValue?.includes(value.toLowerCase())
        })
      }
    })

    return result
  }, [data, searchQuery, filters, columns])

  // Sort data
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

      const aStr = aValue.toString().toLowerCase()
      const bStr = bValue.toString().toLowerCase()

      if (sortDirection === "asc") {
        return aStr < bStr ? -1 : aStr > bStr ? 1 : 0
      } else {
        return aStr > bStr ? -1 : aStr < bStr ? 1 : 0
      }
    })
  }, [filteredData, sortColumn, sortDirection])

  // Paginate data
  const paginatedData = useMemo(() => {
    if (!pagination) return sortedData

    const startIndex = (currentPage - 1) * pageSize
    return sortedData.slice(startIndex, startIndex + pageSize)
  }, [sortedData, currentPage, pageSize, pagination])

  const totalPages = Math.ceil(sortedData.length / pageSize)

  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortColumn(columnKey)
      setSortDirection("asc")
    }
  }

  const getSortIcon = (columnKey: string) => {
    if (sortColumn !== columnKey) {
      return <ArrowUpDown className="w-4 h-4 ml-1 opacity-50" />
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="w-4 h-4 ml-1" />
    ) : (
      <ArrowDown className="w-4 h-4 ml-1" />
    )
  }

  return (
    <Card className={className}>
      {(title || description || searchable) && (
        <CardHeader className="px-3 sm:px-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
            <div className="flex-1 min-w-0">
              {title && <CardTitle className="text-lg sm:text-xl">{title}</CardTitle>}
              {description && (
                <p className="text-xs sm:text-sm text-[var(--ink-muted)] mt-1">{description}</p>
              )}
            </div>
            {searchable && (
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder={searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 text-base h-11 sm:h-10 min-h-[44px] touch-manipulation"
                />
              </div>
            )}
          </div>
        </CardHeader>
      )}

      <CardContent className="p-0">
        <div className="overflow-x-auto -mx-3 sm:mx-0">
          <div className="inline-block min-w-full align-middle">
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map((column) => (
                    <TableHead
                      key={column.key}
                      className={cn(
                        column.sortable ? "cursor-pointer select-none touch-manipulation" : "",
                        "px-3 sm:px-6 py-3 text-xs sm:text-sm whitespace-nowrap"
                      )}
                      onClick={() => column.sortable && handleSort(column.key)}
                    >
                      <div className="flex items-center gap-1">
                        <span className="truncate">{column.label}</span>
                        {column.sortable && getSortIcon(column.key)}
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="text-center py-12 px-3 sm:px-6">
                      <p className="text-sm text-[var(--ink-muted)]">{emptyMessage}</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedData.map((row, index) => (
                    <TableRow
                      key={index}
                      className={cn(
                        onRowClick ? "cursor-pointer touch-manipulation" : "",
                        "hover:bg-[var(--bg-hover)] active:bg-[var(--bg-hover)]"
                      )}
                      onClick={() => onRowClick?.(row)}
                    >
                      {columns.map((column) => (
                        <TableCell key={column.key} className="px-3 sm:px-6 py-3 text-xs sm:text-sm">
                          <div className="truncate max-w-[200px] sm:max-w-none">
                            {column.render
                              ? column.render(row[column.key], row)
                              : row[column.key]?.toString() || "-"}
                          </div>
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {pagination && totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-0 px-3 sm:px-6 py-3 sm:py-4 border-t border-[var(--border)]">
            <div className="text-xs sm:text-sm text-[var(--ink-muted)] text-center sm:text-left">
              {t('transportadora', 'pagination_showing')} {(currentPage - 1) * pageSize + 1} {t('transportadora', 'pagination_to')}{" "}
              {Math.min(currentPage * pageSize, sortedData.length)} {t('transportadora', 'pagination_of')} {sortedData.length} {t('transportadora', 'pagination_records')}
            </div>
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="min-h-[44px] touch-manipulation"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">{t('transportadora', 'pagination_previous')}</span>
              </Button>
              <div className="text-xs sm:text-sm text-[var(--ink-muted)] px-2">
                {currentPage}/{totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="min-h-[44px] touch-manipulation"
              >
                <span className="hidden sm:inline">{t('transportadora', 'pagination_next')}</span>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

