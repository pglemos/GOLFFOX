"use client"

import React, { useState, useMemo, useEffect, useCallback } from "react"

import { Search, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, Eye, Trash2, MoreHorizontal } from "lucide-react"

import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useMobile } from "@/hooks/use-mobile"
import { t } from "@/lib/i18n"
import { cn } from "@/lib/utils"

export interface Column<T> {
  key: string
  label: string
  sortable?: boolean
  render?: (value: any, row: T) => React.ReactNode
  filterable?: boolean
  filterType?: "text" | "select" | "date"
  filterOptions?: { label: string; value: string }[]
  showCheckbox?: boolean
  isUserColumn?: boolean
  isStatusColumn?: boolean
  isActionsColumn?: boolean
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
  showFilters?: boolean
  filterConfig?: {
    role?: { label: string; options: { label: string; value: string }[] }
    plan?: { label: string; options: { label: string; value: string }[] }
    status?: { label: string; options: { label: string; value: string }[] }
  }
  onView?: (row: T) => void
  onDelete?: (row: T) => void
  onAction?: (action: string, row: T) => void
}

function DataTableComponent<T extends Record<string, any>>({
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
  className,
  showFilters = false,
  filterConfig,
  onView,
  onDelete,
  onAction
}: DataTableProps<T>) {
  const isMobile = useMobile() // Hook mobile-first
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [filters, setFilters] = useState<Record<string, string>>({
    role: "all",
    plan: "all",
    status: "all"
  })
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set())
  const [selectAll, setSelectAll] = useState(false)

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
      if (value && value !== "all") {
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

  const handleSort = useCallback((columnKey: string) => {
    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortColumn(columnKey)
      setSortDirection("asc")
    }
  }, [sortColumn, sortDirection])

  const getSortIcon = useCallback((columnKey: string) => {
    if (sortColumn !== columnKey) {
      return <ArrowUpDown className="w-4 h-4 ml-1 opacity-50" />
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="w-4 h-4 ml-1" />
    ) : (
      <ArrowDown className="w-4 h-4 ml-1" />
    )
  }, [sortColumn, sortDirection])

  const getUserInitials = useCallback((name?: string) => {
    if (!name) return 'U'
    return name
      .split(' ')
      .slice(0, 2)
      .map(n => n[0])
      .join('')
      .toUpperCase()
  }, [])

  const getStatusBadge = useCallback((status: string) => {
    const statusLower = status?.toLowerCase() || ''
    if (statusLower.includes('active') || statusLower.includes('ativo')) {
      return <Badge className="bg-success-light0 hover:bg-success text-white">{status}</Badge>
    }
    if (statusLower.includes('pending') || statusLower.includes('pendente')) {
      return <Badge className="bg-brand hover:bg-brand-hover text-white">{status}</Badge>
    }
    if (statusLower.includes('inactive') || statusLower.includes('inativo')) {
      return <Badge variant="secondary">{status}</Badge>
    }
    return <Badge variant="outline">{status}</Badge>
  }, [])

  // Handle checkbox selection
  const handleSelectAll = useCallback((checked: boolean) => {
    if (checked) {
      // Selecionar todos os itens da página atual
      const pageStart = (currentPage - 1) * pageSize
      const pageEnd = Math.min(pageStart + pageSize, sortedData.length)
      setSelectedRows(prev => {
        const newSelected = new Set(prev)
        for (let i = pageStart; i < pageEnd; i++) {
          newSelected.add(i)
        }
        setSelectAll(newSelected.size === sortedData.length && sortedData.length > 0)
        return newSelected
      })
    } else {
      // Desselecionar todos os itens da página atual
      const pageStart = (currentPage - 1) * pageSize
      const pageEnd = Math.min(pageStart + pageSize, sortedData.length)
      setSelectedRows(prev => {
        const newSelected = new Set(prev)
        for (let i = pageStart; i < pageEnd; i++) {
          newSelected.delete(i)
        }
        setSelectAll(false)
        return newSelected
      })
    }
  }, [currentPage, pageSize, sortedData.length])

  const handleSelectRow = useCallback((index: number, checked: boolean) => {
    setSelectedRows(prev => {
      const newSelected = new Set(prev)
      if (checked) {
        newSelected.add(index)
      } else {
        newSelected.delete(index)
      }
      setSelectAll(newSelected.size === sortedData.length && sortedData.length > 0)
      return newSelected
    })
  }, [sortedData.length])

  // Check if all items on current page are selected
  useEffect(() => {
    if (sortedData.length === 0) {
      setSelectAll(false)
      return
    }
    const pageStart = (currentPage - 1) * pageSize
    const pageEnd = Math.min(pageStart + pageSize, sortedData.length)
    let allSelected = true
    for (let i = pageStart; i < pageEnd; i++) {
      if (!selectedRows.has(i)) {
        allSelected = false
        break
      }
    }
    setSelectAll(allSelected)
  }, [currentPage, pageSize, sortedData.length, selectedRows])

  return (
    <Card className={cn("bg-card", className)}>
      {(title || description || searchable) && (
        <CardHeader className="px-3 sm:px-6 bg-card">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
            <div className="flex-1 min-w-0">
              {title && <CardTitle className="text-lg sm:text-xl">{title}</CardTitle>}
              {description && (
                <CardDescription className="text-xs sm:text-sm mt-1">{description}</CardDescription>
              )}
            </div>
            {searchable && (
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder={searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 text-base h-11 sm:h-10 min-h-[44px] touch-manipulation bg-card"
                />
              </div>
            )}
          </div>
        </CardHeader>
      )}

      {/* Filtros conforme Datatable Component 04 */}
      {showFilters && filterConfig && (
        <div className="px-3 sm:px-6 pb-4 border-b border-border bg-card">
          <h3 className="text-lg font-semibold mb-3">Filter</h3>
          <div className="flex flex-col sm:flex-row gap-3">
            {filterConfig.role && (
              <Select value={filters.role || "all"} onValueChange={(value) => setFilters({ ...filters, role: value })}>
                <SelectTrigger className="w-full sm:w-[180px] bg-card">
                  <SelectValue placeholder={filterConfig.role.label} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {filterConfig.role.options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {filterConfig.plan && (
              <Select value={filters.plan || "all"} onValueChange={(value) => setFilters({ ...filters, plan: value })}>
                <SelectTrigger className="w-full sm:w-[180px] bg-card">
                  <SelectValue placeholder={filterConfig.plan.label} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {filterConfig.plan.options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {filterConfig.status && (
              <Select value={filters.status || "all"} onValueChange={(value) => setFilters({ ...filters, status: value })}>
                <SelectTrigger className="w-full sm:w-[180px] bg-card">
                  <SelectValue placeholder={filterConfig.status.label} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {filterConfig.status.options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      )}

      <CardContent className="p-0">
        {/* Mobile: Cards Layout */}
        {isMobile ? (
          <div className="p-3 space-y-3">
            {paginatedData.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-sm text-muted-foreground">{emptyMessage}</p>
              </div>
            ) : (
              paginatedData.map((row, globalIndex) => {
                const actualIndex = (currentPage - 1) * pageSize + globalIndex
                const isSelected = selectedRows.has(actualIndex)
                
                return (
                  <Card
                    key={actualIndex}
                    className={cn(
                      "mobile-table-card cursor-pointer touch-manipulation",
                      isSelected && "ring-2 ring-primary"
                    )}
                    onClick={() => onRowClick?.(row)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      {/* Checkbox */}
                      {columns.some(col => col.showCheckbox) && (
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) => handleSelectRow(actualIndex, checked as boolean)}
                          onClick={(e) => e.stopPropagation()}
                          className="mt-1"
                        />
                      )}
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0 space-y-2">
                        {columns.map((column) => {
                          // User column
                          if (column.isUserColumn) {
                            const name = row.name || row.user_name || ''
                            const email = row.email || row.user_email || ''
                            const avatar = row.avatar_url || row.avatar || ''
                            const initials = getUserInitials(name)
                            
                            return (
                              <div key={column.key} className="flex items-center gap-3">
                                <Avatar className="h-10 w-10">
                                  <AvatarImage src={avatar} alt={name} />
                                  <AvatarFallback className="bg-primary text-primary-foreground">
                                    {initials}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col min-w-0 flex-1">
                                  <span className="font-semibold text-sm truncate">{name}</span>
                                  <span className="text-xs text-muted-foreground truncate">{email}</span>
                                </div>
                              </div>
                            )
                          }
                          
                          // Status column
                          if (column.isStatusColumn) {
                            const status = row[column.key] || row.status || ''
                            return (
                              <div key={column.key} className="flex items-center justify-between">
                                <span className="text-xs font-medium text-muted-foreground uppercase">{column.label}</span>
                                {getStatusBadge(status)}
                              </div>
                            )
                          }
                          
                          // Actions column
                          if (column.isActionsColumn) {
                            return (
                              <div key={column.key} className="flex items-center justify-end gap-2 pt-2 border-t">
                                {onView && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="min-h-[44px] touch-manipulation"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      onView(row)
                                    }}
                                  >
                                    <Eye className="h-4 w-4 mr-2" />
                                    Ver
                                  </Button>
                                )}
                                {onDelete && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="min-h-[44px] touch-manipulation text-destructive"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      onDelete(row)
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Excluir
                                  </Button>
                                )}
                              </div>
                            )
                          }
                          
                          // Regular column
                          return (
                            <div key={column.key} className="flex items-center justify-between">
                              <span className="text-xs font-medium text-muted-foreground uppercase">{column.label}</span>
                              <span className="text-sm font-medium text-right flex-1 ml-2">
                                {column.render
                                  ? column.render(row[column.key], row)
                                  : row[column.key]?.toString() || "-"}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </Card>
                )
              })
            )}
          </div>
        ) : (
          /* Desktop: Table Layout */
          <div className="overflow-x-auto -mx-3 sm:mx-0">
            <div className="inline-block min-w-full align-middle">
              <Table>
              <TableHeader>
                <TableRow>
                  {/* Checkbox column */}
                  {columns.some(col => col.showCheckbox) && (
                    <TableHead className="w-12 px-3 sm:px-6 py-3">
                      <Checkbox
                        checked={selectAll}
                        onCheckedChange={handleSelectAll}
                        aria-label="Select all"
                      />
                    </TableHead>
                  )}
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
                    <TableCell colSpan={columns.length + (columns.some(col => col.showCheckbox) ? 1 : 0)} className="text-center py-12 px-3 sm:px-6">
                      <p className="text-sm text-muted-foreground">{emptyMessage}</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedData.map((row, globalIndex) => {
                    const actualIndex = (currentPage - 1) * pageSize + globalIndex
                    const isSelected = selectedRows.has(actualIndex)
                    
                    return (
                      <TableRow
                        key={actualIndex}
                        className={cn(
                          onRowClick ? "cursor-pointer touch-manipulation" : "",
                          "hover:bg-muted/50 transition-colors",
                          isSelected && "bg-muted/30",
                          onRowClick && "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        )}
                        onClick={() => onRowClick?.(row)}
                        onKeyDown={(e) => {
                          if (onRowClick && (e.key === 'Enter' || e.key === ' ')) {
                            e.preventDefault()
                            onRowClick(row)
                          }
                        }}
                        role={onRowClick ? "button" : undefined}
                        tabIndex={onRowClick ? 0 : undefined}
                        aria-label={onRowClick ? `Ver detalhes da linha ${actualIndex + 1}` : undefined}
                      >
                        {/* Checkbox cell */}
                        {columns.some(col => col.showCheckbox) && (
                          <TableCell className="px-3 sm:px-6 py-3 bg-card">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={(checked) => handleSelectRow(actualIndex, checked as boolean)}
                              onClick={(e) => e.stopPropagation()}
                              aria-label={`Selecionar linha ${actualIndex + 1}`}
                            />
                          </TableCell>
                        )}
                        {columns.map((column) => {
                          // User column with avatar
                          if (column.isUserColumn) {
                            const name = row.name || row.user_name || ''
                            const email = row.email || row.user_email || ''
                            const avatar = row.avatar_url || row.avatar || ''
                            const initials = getUserInitials(name)
                            
                            return (
                              <TableCell key={column.key} className="px-3 sm:px-6 py-3 text-xs sm:text-sm">
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-8 w-8">
                                    <AvatarImage src={avatar} alt={name} />
                                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                                      {initials}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex flex-col min-w-0">
                                    <span className="font-medium truncate">{name}</span>
                                    <span className="text-xs text-muted-foreground truncate">{email}</span>
                                  </div>
                                </div>
                              </TableCell>
                            )
                          }
                          
                          // Status column with badge
                          if (column.isStatusColumn) {
                            const status = row[column.key] || row.status || ''
                            return (
                              <TableCell key={column.key} className="px-3 sm:px-6 py-3 text-xs sm:text-sm">
                                {getStatusBadge(status)}
                              </TableCell>
                            )
                          }
                          
                          // Actions column with icons
                          if (column.isActionsColumn) {
                            return (
                              <TableCell key={column.key} className="px-3 sm:px-6 py-3 text-xs sm:text-sm">
                                <div className="flex items-center gap-2">
                                  {onView && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        onView(row)
                                      }}
                                      aria-label={`Visualizar linha ${globalIndex + 1}`}
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                  )}
                                  {onDelete && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-destructive hover:text-destructive"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        onDelete(row)
                                      }}
                                      aria-label={`Excluir linha ${globalIndex + 1}`}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  )}
                                  {onAction && (
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-8 w-8"
                                          onClick={(e) => e.stopPropagation()}
                                          aria-label="More actions"
                                        >
                                          <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                                        <DropdownMenuItem onClick={() => onAction('edit', row)}>
                                          Editar
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => onAction('duplicate', row)}>
                                          Duplicar
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  )}
                                </div>
                              </TableCell>
                            )
                          }
                          
                          // Regular column
                          return (
                            <TableCell key={column.key} className="px-3 sm:px-6 py-3 text-xs sm:text-sm">
                              <div className="truncate max-w-[200px] sm:max-w-none">
                                {column.render
                                  ? column.render(row[column.key], row)
                                  : row[column.key]?.toString() || "-"}
                              </div>
                            </TableCell>
                          )
                        })}
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>
        )}

        {pagination && totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-0 px-3 sm:px-6 py-3 sm:py-4 border-t border-border bg-card">
            <div className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
              Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, sortedData.length)} of {sortedData.length} entries
            </div>
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="min-h-[44px] touch-manipulation bg-card"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Previous</span>
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let pageNum: number
                  if (totalPages <= 5) {
                    pageNum = i + 1
                  } else if (currentPage <= 3) {
                    pageNum = i + 1
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i
                  } else {
                    pageNum = currentPage - 2 + i
                  }
                  
                  if (i === 4 && totalPages > 5 && currentPage < totalPages - 2) {
                    return (
                      <React.Fragment key={`ellipsis-${i}`}>
                        <span className="text-xs sm:text-sm text-muted-foreground px-2">...</span>
                        <Button
                          variant={currentPage === totalPages ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(totalPages)}
                          className={cn(
                            "min-h-[32px] h-8 px-3 bg-card",
                            currentPage === totalPages && "bg-primary text-primary-foreground"
                          )}
                        >
                          {totalPages}
                        </Button>
                      </React.Fragment>
                    )
                  }
                  
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      className={cn(
                        "min-h-[32px] h-8 px-3 bg-card",
                        currentPage === pageNum && "bg-primary text-primary-foreground"
                      )}
                    >
                      {pageNum}
                    </Button>
                  )
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="min-h-[44px] touch-manipulation bg-card"
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export const DataTable = React.memo(DataTableComponent) as typeof DataTableComponent

