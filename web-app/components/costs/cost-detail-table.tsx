"use client"

import { useState, useMemo } from "react"
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

export function CostDetailTable({ costs, onReconcile, loading }: CostDetailTableProps) {
  const [grouping, setGrouping] = useState<GroupingLevel>('group')
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [sortColumn, setSortColumn] = useState<keyof CostDetail | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  const toggleGroup = (group: string) => {
    const newExpanded = new Set(expandedGroups)
    if (newExpanded.has(group)) {
      newExpanded.delete(group)
    } else {
      newExpanded.add(group)
    }
    setExpandedGroups(newExpanded)
  }

  const handleSort = (column: keyof CostDetail) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('desc')
    }
  }

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

  // Agrupar custos
  const groupedData = useMemo(() => {
    if (grouping === 'none') {
      return { items: sortedCosts }
    }

    const groups: Record<string, {
      items: CostDetail[]
      total: number
    }> = {}

    sortedCosts.forEach(cost => {
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

  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
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
  }

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-12 bg-gray-200 rounded"></div>
          ))}
        </div>
      </Card>
    )
  }

  if (costs.length === 0) {
    return (
      <Card className="p-12 text-center">
        <p className="text-gray-500">Nenhum custo encontrado</p>
      </Card>
    )
  }

  const totalColSpan = grouping === 'none' ? 7 : (grouping === 'group' ? 7 : 8)

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold">Detalhamento de Custos</h3>
          <Badge variant="outline">{costs.length} registros</Badge>
        </div>
        <div className="flex items-center gap-2">
          <select
            className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm"
            value={grouping}
            onChange={(e) => setGrouping(e.target.value as GroupingLevel)}
          >
            <option value="none">Sem agrupamento</option>
            <option value="group">Por Grupo</option>
            <option value="category">Por Categoria</option>
          </select>
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
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              {grouping === 'group' && <th className="text-left p-2">Grupo</th>}
              {grouping === 'category' && <th className="text-left p-2">Categoria</th>}
              <th 
                className="text-left p-2 cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort('date')}
              >
                Data {sortColumn === 'date' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              {grouping === 'none' && <th className="text-left p-2">Grupo/Categoria</th>}
              <th className="text-left p-2">Rota</th>
              <th className="text-left p-2">Veículo</th>
              <th 
                className="text-right p-2 cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort('amount')}
              >
                Valor {sortColumn === 'amount' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th className="text-left p-2">Origem</th>
              {onReconcile && <th className="text-center p-2">Ações</th>}
            </tr>
          </thead>
          <tbody>
            {grouping === 'none' ? (
              sortedCosts.map(cost => (
                <tr key={cost.id} className="border-b hover:bg-gray-50">
                  <td className="p-2">{new Date(cost.date).toLocaleDateString('pt-BR')}</td>
                  <td className="p-2">{cost.group_name} {cost.category}{cost.subcategory ? ` - ${cost.subcategory}` : ''}</td>
                  <td className="p-2">{cost.route_name || '-'}</td>
                  <td className="p-2">{cost.vehicle_plate || '-'}</td>
                  <td className="p-2 text-right font-semibold">{formatCurrency(cost.amount)}</td>
                  <td className="p-2">
                    <Badge variant="outline" className="text-xs">{cost.source}</Badge>
                  </td>
                  {onReconcile && (
                    <td className="p-2 text-center">
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
                  className="border-b bg-gray-50 font-semibold cursor-pointer hover:bg-gray-100"
                  onClick={() => toggleGroup(groupName)}
                >
                  <td className="p-2" colSpan={grouping === 'group' ? 1 : 1}>
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
                  <td className="p-2" colSpan={grouping === 'group' ? 4 : 4}></td>
                  <td className="p-2 text-right">{formatCurrency(group.total)}</td>
                  {onReconcile && <td></td>}
                </tr>,
                ...(expandedGroups.has(groupName) ? group.items.map(cost => (
                  <tr key={cost.id} className="border-b hover:bg-gray-50">
                    <td className="p-2 pl-8">{new Date(cost.date).toLocaleDateString('pt-BR')}</td>
                    <td className="p-2">{cost.category}{cost.subcategory ? ` - ${cost.subcategory}` : ''}</td>
                    <td className="p-2">{cost.route_name || '-'}</td>
                    <td className="p-2">{cost.vehicle_plate || '-'}</td>
                    <td className="p-2 text-right font-semibold">{formatCurrency(cost.amount)}</td>
                    <td className="p-2">
                      <Badge variant="outline" className="text-xs">{cost.source}</Badge>
                    </td>
                    {onReconcile && (
                      <td className="p-2 text-center">
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
          <tfoot>
            <tr className="border-t-2 font-bold bg-gray-100">
              <td colSpan={totalColSpan - 1} className="p-2">Total</td>
              <td className="p-2 text-right">{formatCurrency(costs.reduce((sum, c) => sum + c.amount, 0))}</td>
              {onReconcile && <td></td>}
            </tr>
          </tfoot>
        </table>
      </div>
    </Card>
  )
}
