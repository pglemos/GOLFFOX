/**
 * SmartDataTable
 * 
 * Componente inteligente que escolhe automaticamente entre:
 * - VirtualizedTable para grandes volumes (>1000 itens)
 * - DataTable padrão para volumes menores
 * 
 * Melhora performance automaticamente baseado no tamanho dos dados.
 */

'use client'

import { useMemo } from 'react'

import { DataTable } from '@/components/transportadora/data-table'

import { VirtualizedTable, VirtualizedColumn } from './virtualized-table'

interface SmartDataTableProps<T extends Record<string, unknown>> {
  data: T[]
  columns: VirtualizedColumn<T>[]
  virtualizeThreshold?: number
  // Props do DataTable padrão
  searchable?: boolean
  searchPlaceholder?: string
  title?: string
  description?: string
  emptyMessage?: string
  pagination?: boolean
  pageSize?: number
  onRowClick?: (row: T, index: number) => void
  className?: string
}

const DEFAULT_VIRTUALIZE_THRESHOLD = 1000

export function SmartDataTable<T extends Record<string, unknown>>({
  data,
  columns,
  virtualizeThreshold = DEFAULT_VIRTUALIZE_THRESHOLD,
  ...props
}: SmartDataTableProps<T>) {
  const shouldVirtualize = useMemo(() => {
    return data.length >= virtualizeThreshold
  }, [data.length, virtualizeThreshold])

  // Converter colunas do VirtualizedTable para formato do DataTable
  const dataTableColumns = useMemo(() => {
    return columns.map(col => ({
      key: col.key,
      label: col.label,
      sortable: col.sortable,
      render: col.render ? (value: any, row: T) => col.render!(value, row, 0) : undefined
    }))
  }, [columns])

  if (shouldVirtualize) {
    return (
      <VirtualizedTable
        data={data}
        columns={columns}
        searchable={props.searchable}
        searchPlaceholder={props.searchPlaceholder}
        title={props.title}
        description={props.description}
        emptyMessage={props.emptyMessage}
        onRowClick={props.onRowClick ? (row: T) => props.onRowClick!(row, 0) : undefined}
        className={props.className}
      />
    )
  }

  return (
    <DataTable
      data={data}
      columns={dataTableColumns}
      searchable={props.searchable}
      searchPlaceholder={props.searchPlaceholder}
      title={props.title}
      description={props.description}
      emptyMessage={props.emptyMessage}
      pagination={props.pagination}
      pageSize={props.pageSize}
      onRowClick={props.onRowClick ? (row: T) => props.onRowClick!(row, 0) : undefined}
      className={props.className}
    />
  )
}

