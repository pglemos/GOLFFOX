"use client"

import React, { useState, useMemo, useCallback } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  ChevronRight, 
  ChevronDown, 
  Download
} from "lucide-react"
import { formatCurrency } from "@/lib/kpi-utils"
import { exportToCSV, exportToExcel, exportToPDF } from "@/lib/export-utils"
import { useMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"

interface CostDetail {
  id: string
  date: string
  group_name: string
  category: string
  subcategory: string | null
  route_name: string | null
  vehicle_plate: string | null
  driver_email: string | null
  amount: number
  qty: number | null
  unit: string | null
  source: string
  notes: string | null
  invoice_id?: string | null
}

interface CostDetailTableProps {
  costs: CostDetail[]
  onReconcile?: (cost: CostDetail) => void
  loading?: boolean
}

type GroupingLevel = 'group' | 'category' | 'none'

// Componente memoizado para card mobile
const CostCard = React.memo(function CostCard({
  cost,
  onReconcile
}: {
  cost: CostDetail
  onReconcile?: (cost: CostDetail) => void
}) {
  return (
    <Card key={cost.id} className="mobile-table-card p-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground uppercase">Data</span>
          <span className="text-sm font-semibold">{new Date(cost.date).toLocaleDateString('pt-BR')}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground uppercase">Grupo/Categoria</span>
          <span className="text-sm text-right flex-1 ml-2">{cost.group_name} {cost.category}{cost.subcategory ? ` - ${cost.subcategory}` : ''}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground uppercase">Rota</span>
          <span className="text-sm">{cost.route_name || '-'}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground uppercase">Veículo</span>
          <span className="text-sm">{cost.vehicle_plate || '-'}</span>
        </div>
        <div className="flex items-center justify-between pt-2 border-t">
          <span className="text-xs font-medium text-muted-foreground uppercase">Valor</span>
          <span className="text-base font-bold text-primary">{formatCurrency(cost.amount)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground uppercase">Origem</span>
          <Badge variant="outline" className="text-xs">{cost.source}</Badge>
        </div>
        {onReconcile && cost.invoice_id && (
          <div className="pt-2 border-t">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onReconcile(cost)}
              className="w-full min-h-[44px] touch-manipulation"
            >
              Conciliar
            </Button>
          </div>
        )}
      </div>
    </Card>
  )
}, (prev, next) => 
  prev.cost.id === next.cost.id && 
  prev.cost.amount === next.cost.amount && 
  prev.cost.date === next.cost.date
)

function CostDetailTableComponent({ costs, onReconcile, loading }: CostDetailTableProps) {
  const isMobile = useMobile() // Hook mobile-first
  const [grouping, setGrouping] = useState<GroupingLevel>('group')
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [sortColumn, setSortColumn] = useState<keyof CostDetail | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(isMobile ? 20 : 50) // Menos itens por página em mobile

  const toggleGroup = useCallback((group: string) => {
    setExpandedGroups(prev => {
      const newExpanded = new Set(prev)
      if (newExpanded.has(group)) {
        newExpanded.delete(group)
      } else {
        newExpanded.add(group)
      }
      return newExpanded
    })
  }, [])

  const handleSort = useCallback((column: keyof CostDetail) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('desc')
    }
  }, [sortColumn, sortDirection])

  const sortedCosts = useMemo(() => {
    if (!sortColumn) return costs

    return [...costs].sort((a, b) => {
      const aVal = a[sortColumn]
      const bVal = b[sortColumn]

      if (aVal === null || aVal === undefined) return 1
      if (bVal === null || bVal === undefined) return -1

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal
      }

      const aStr = String(aVal).toLowerCase()
      const bStr = String(bVal).toLowerCase()

      if (sortDirection === 'asc') {
        return aStr.localeCompare(bStr)
      } else {
        return bStr.localeCompare(aStr)
      }
    })
  }, [costs, sortColumn, sortDirection])

  const pageCount = Math.max(1, Math.ceil(sortedCosts.length / pageSize))
  const currentPage = Math.min(page, pageCount - 1)
  const paginatedCosts = useMemo(() => {
    const start = currentPage * pageSize
    return sortedCosts.slice(start, start + pageSize)
  }, [sortedCosts, currentPage, pageSize])

  // Agrupar custos
  const groupedData = useMemo(() => {
    if (grouping === 'none') {
      return { items: paginatedCosts }
    }

    const groups: Record<string, {
      items: CostDetail[]
      total: number
    }> = {}

    paginatedCosts.forEach(cost => {
      if (grouping === 'group') {
        const key = cost.group_name || 'Outros'
        if (!groups[key]) {
          groups[key] = { items: [], total: 0 }
        }
        groups[key].items.push(cost)
        groups[key].total += cost.amount
      } else if (grouping === 'category') {
        const key = `${cost.group_name} > ${cost.category}`
        if (!groups[key]) {
          groups[key] = { items: [], total: 0 }
        }
        groups[key].items.push(cost)
        groups[key].total += cost.amount
      }
    })

    return { groups }
  }, [sortedCosts, grouping])

  const handleExport = useCallback((format: 'csv' | 'excel' | 'pdf') => {
    const reportData = {
      title: 'Detalhamento de Custos',
      description: `Total de ${costs.length} registros`,
      headers: [
        'Data',
        'Grupo',
        'Categoria',
        'Subcategoria',
        'Rota',
        'Veículo',
        'Motorista',
        'Valor',
        'Quantidade',
        'Unidade',
        'Origem',
        'Observações'
      ],
      rows: costs.map(cost => [
        new Date(cost.date).toLocaleDateString('pt-BR'),
        cost.group_name || '-',
        cost.category || '-',
        cost.subcategory || '-',
        cost.route_name || '-',
        cost.vehicle_plate || '-',
        cost.driver_email || '-',
        formatCurrency(cost.amount),
        cost.qty?.toString() || '-',
        cost.unit || '-',
        cost.source || 'manual',
        cost.notes || '-'
      ])
    }

    if (format === 'csv') {
      exportToCSV(reportData, `custos_${new Date().toISOString().split('T')[0]}.csv`)
    } else if (format === 'excel') {
      exportToExcel(reportData, `custos_${new Date().toISOString().split('T')[0]}.xlsx`)
    } else {
      exportToPDF(reportData, `custos_${new Date().toISOString().split('T')[0]}.pdf`)
    }
  }, [costs])

  if (loading) {
    return (
      <Card className="p-6 bg-card">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-12 bg-muted rounded"></div>
          ))}
        </div>
      </Card>
    )
  }

  if (costs.length === 0) {
    return (
      <Card className="p-12 text-center bg-card">
        <p className="text-muted-foreground">Nenhum custo encontrado</p>
      </Card>
    )
  }

  const totalColSpan = grouping === 'none' ? 7 : (grouping === 'group' ? 7 : 8)

  return (
    <Card className={cn("bg-card", isMobile ? "p-3" : "p-4")}>
      <div className={cn(
        "mb-4",
        isMobile ? "flex flex-col gap-3" : "flex items-center justify-between"
      )}>
        <div className="flex items-center gap-2">
          <h3 className={cn("font-semibold", isMobile ? "text-base" : "text-lg")}>Detalhamento de Custos</h3>
          <Badge variant="outline">{costs.length} registros</Badge>
        </div>
        <div className={cn(
          "flex items-center gap-2",
          isMobile ? "flex-wrap w-full" : ""
        )}>
          <select
            className={cn(
              "rounded-lg border border-border bg-card text-sm touch-manipulation",
              isMobile ? "flex-1 min-h-[44px] px-3 py-2" : "px-3 py-2"
            )}
            value={grouping}
            onChange={(e) => setGrouping(e.target.value as GroupingLevel)}
          >
            <option value="none">Sem agrupamento</option>
            <option value="group">Por Grupo</option>
            <option value="category">Por Categoria</option>
          </select>
          {!isMobile && (
            <select
              className="px-3 py-2 rounded-lg border border-border bg-card text-sm"
              value={pageSize}
              onChange={(e) => { setPageSize(parseInt(e.target.value)); setPage(0) }}
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          )}
          {!isMobile && (
            <div className="flex gap-1">
              <Button variant="outline" size="sm" onClick={() => handleExport('csv')}>
                <Download className="h-4 w-4 mr-1" />
                CSV
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleExport('excel')}>
                <Download className="h-4 w-4 mr-1" />
                Excel
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleExport('pdf')}>
                <Download className="h-4 w-4 mr-1" />
                PDF
              </Button>
            </div>
          )}
        </div>
      </div>

      {isMobile ? (
        /* Mobile: Cards Layout */
        <div className="p-3 space-y-3">
          {grouping === 'none' ? (
            paginatedCosts.map(cost => (
              <Card key={cost.id} className="mobile-table-card p-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground uppercase">Data</span>
                    <span className="text-sm font-semibold">{new Date(cost.date).toLocaleDateString('pt-BR')}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground uppercase">Grupo/Categoria</span>
                    <span className="text-sm text-right flex-1 ml-2">{cost.group_name} {cost.category}{cost.subcategory ? ` - ${cost.subcategory}` : ''}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground uppercase">Rota</span>
                    <span className="text-sm">{cost.route_name || '-'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground uppercase">Veículo</span>
                    <span className="text-sm">{cost.vehicle_plate || '-'}</span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-xs font-medium text-muted-foreground uppercase">Valor</span>
                    <span className="text-base font-bold text-primary">{formatCurrency(cost.amount)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground uppercase">Origem</span>
                    <Badge variant="outline" className="text-xs">{cost.source}</Badge>
                  </div>
                  {onReconcile && cost.invoice_id && (
                    <div className="pt-2 border-t">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => onReconcile(cost)}
                        className="w-full min-h-[44px] touch-manipulation"
                      >
                        Conciliar
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            ))
          ) : (grouping === 'group' || grouping === 'category') && groupedData.groups ? (
            Object.entries(groupedData.groups).flatMap(([groupName, group]) => [
              <Card 
                key={`${groupName}-header`}
                className="mobile-table-card p-4 bg-muted/30"
                onClick={() => toggleGroup(groupName)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {expandedGroups.has(groupName) ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                    <span className="font-semibold">{groupName}</span>
                    <Badge variant="outline">{group.items.length}</Badge>
                  </div>
                  <span className="text-sm font-bold">{formatCurrency(group.total)}</span>
                </div>
              </Card>,
              ...(expandedGroups.has(groupName) ? group.items.map(cost => (
                <Card key={cost.id} className="mobile-table-card p-4 ml-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground uppercase">Data</span>
                      <span className="text-sm font-semibold">{new Date(cost.date).toLocaleDateString('pt-BR')}</span>
                    </div>
                    {grouping === 'group' && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground uppercase">Categoria</span>
                        <span className="text-sm">{cost.category}{cost.subcategory ? ` - ${cost.subcategory}` : ''}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground uppercase">Rota</span>
                      <span className="text-sm">{cost.route_name || '-'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground uppercase">Veículo</span>
                      <span className="text-sm">{cost.vehicle_plate || '-'}</span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="text-xs font-medium text-muted-foreground uppercase">Valor</span>
                      <span className="text-base font-bold text-primary">{formatCurrency(cost.amount)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground uppercase">Origem</span>
                      <Badge variant="outline" className="text-xs">{cost.source}</Badge>
                    </div>
                    {onReconcile && cost.invoice_id && (
                      <div className="pt-2 border-t">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => onReconcile(cost)}
                          className="w-full min-h-[44px] touch-manipulation"
                        >
                          Conciliar
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              )) : [])
            ])
          ) : null}
        </div>
      ) : (
        /* Desktop: Table Layout */
        <div className="overflow-x-auto rounded-lg border bg-card">
          <table className="w-full text-sm bg-card">
          <thead className="bg-card">
            <tr className="border-b border-border">
              {grouping === 'group' && <th className="text-left p-2 sm:p-4 bg-card">Grupo</th>}
              {grouping === 'category' && <th className="text-left p-2 sm:p-4 bg-card">Categoria</th>}
              <th 
                className="text-left p-2 sm:p-4 bg-card cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => handleSort('date')}
              >
                Data {sortColumn === 'date' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              {grouping === 'none' && <th className="text-left p-2 sm:p-4 bg-card">Grupo/Categoria</th>}
              <th className="text-left p-2 sm:p-4 bg-card">Rota</th>
              <th className="text-left p-2 sm:p-4 bg-card">Veículo</th>
              <th 
                className="text-right p-2 sm:p-4 bg-card cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => handleSort('amount')}
              >
                Valor {sortColumn === 'amount' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th className="text-left p-2 sm:p-4 bg-card">Origem</th>
              {onReconcile && <th className="text-center p-2 sm:p-4 bg-card">Ações</th>}
            </tr>
          </thead>
          <tbody className="bg-card">
            {grouping === 'none' ? (
              paginatedCosts.map(cost => (
                <tr key={cost.id} className="border-b border-border/50 hover:bg-muted/50 transition-colors bg-card">
                  <td className="p-2 sm:p-4 bg-card">{new Date(cost.date).toLocaleDateString('pt-BR')}</td>
                  <td className="p-2 sm:p-4 bg-card">{cost.group_name} {cost.category}{cost.subcategory ? ` - ${cost.subcategory}` : ''}</td>
                  <td className="p-2 sm:p-4 bg-card">{cost.route_name || '-'}</td>
                  <td className="p-2 sm:p-4 bg-card">{cost.vehicle_plate || '-'}</td>
                  <td className="p-2 sm:p-4 text-right font-semibold bg-card">{formatCurrency(cost.amount)}</td>
                  <td className="p-2 sm:p-4 bg-card">
                    <Badge variant="outline" className="text-xs">{cost.source}</Badge>
                  </td>
                  {onReconcile && (
                    <td className="p-2 sm:p-4 text-center bg-card">
                      {cost.invoice_id && (
                        <Button variant="ghost" size="sm" onClick={() => onReconcile(cost)}>
                          Conciliar
                        </Button>
                      )}
                    </td>
                  )}
                </tr>
              ))
            ) : (grouping === 'group' || grouping === 'category') && groupedData.groups ? (
              Object.entries(groupedData.groups).flatMap(([groupName, group]) => [
                <tr 
                  key={`${groupName}-header`}
                  className="border-b border-border bg-muted/30 font-semibold cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => toggleGroup(groupName)}
                >
                  <td className="p-2 sm:p-4 bg-muted/30" colSpan={grouping === 'group' ? 1 : 1}>
                    <div className="flex items-center gap-2">
                      {expandedGroups.has(groupName) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                      <span>{groupName}</span>
                      <Badge variant="outline">{group.items.length}</Badge>
                    </div>
                  </td>
                  <td className="p-2 sm:p-4 bg-muted/30" colSpan={grouping === 'group' ? 4 : 4}></td>
                  <td className="p-2 sm:p-4 text-right bg-muted/30">{formatCurrency(group.total)}</td>
                  {onReconcile && <td className="bg-muted/30"></td>}
                </tr>,
                ...(expandedGroups.has(groupName) ? group.items.map(cost => (
                  <tr key={cost.id} className="border-b border-border/50 hover:bg-muted/50 transition-colors bg-card">
                    <td className="p-2 sm:p-4 pl-8 bg-card">{new Date(cost.date).toLocaleDateString('pt-BR')}</td>
                    <td className="p-2 sm:p-4 bg-card">{cost.category}{cost.subcategory ? ` - ${cost.subcategory}` : ''}</td>
                    <td className="p-2 sm:p-4 bg-card">{cost.route_name || '-'}</td>
                    <td className="p-2 sm:p-4 bg-card">{cost.vehicle_plate || '-'}</td>
                    <td className="p-2 sm:p-4 text-right font-semibold bg-card">{formatCurrency(cost.amount)}</td>
                    <td className="p-2 sm:p-4 bg-card">
                      <Badge variant="outline" className="text-xs">{cost.source}</Badge>
                    </td>
                    {onReconcile && (
                      <td className="p-2 sm:p-4 text-center bg-card">
                        {cost.invoice_id && (
                          <Button variant="ghost" size="sm" onClick={() => onReconcile(cost)}>
                            Conciliar
                          </Button>
                        )}
                      </td>
                    )}
                  </tr>
                )) : [])
              ])
            ) : null}
          </tbody>
          <tfoot className="bg-card">
            <tr className="border-t-2 border-border font-bold bg-muted/30">
              <td colSpan={totalColSpan - 1} className="p-2 sm:p-4 bg-muted/30">Total</td>
              <td className="p-2 sm:p-4 text-right bg-muted/30">{formatCurrency(costs.reduce((sum, c) => sum + c.amount, 0))}</td>
              {onReconcile && <td className="bg-muted/30"></td>}
            </tr>
          </tfoot>
        </table>
      </div>
      )}
      <div className={cn(
        "flex items-center justify-between mt-4",
        isMobile ? "flex-col gap-3 px-3" : "flex-row"
      )}>
        <span className="text-sm text-muted-foreground text-center">{isMobile ? `Página ${currentPage + 1}/${pageCount}` : `Página ${currentPage + 1} de ${pageCount}`}</span>
        <div className={cn(
          "flex gap-2",
          isMobile ? "w-full" : ""
        )}>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setPage(p => Math.max(0, p - 1))} 
            disabled={currentPage === 0}
            className={cn(
              isMobile ? "flex-1 min-h-[44px] touch-manipulation" : ""
            )}
          >
            Anterior
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setPage(p => Math.min(pageCount - 1, p + 1))} 
            disabled={currentPage >= pageCount - 1}
            className={cn(
              isMobile ? "flex-1 min-h-[44px] touch-manipulation" : ""
            )}
          >
            Próxima
          </Button>
        </div>
      </div>
    </Card>
  )
}

export const CostDetailTable = React.memo(CostDetailTableComponent)
