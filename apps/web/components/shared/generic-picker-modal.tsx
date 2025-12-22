/**
 * GenericPickerModal
 * 
 * Modal genérico e reutilizável para seleção de itens (motoristas, veículos, etc.).
 * Substitui os modais duplicados: driver-picker-modal, motorista-picker-modal,
 * vehicle-picker-modal, veiculo-picker-modal.
 */

"use client"

import { useState, useEffect, useMemo, useCallback, ReactNode } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Badge, BadgeProps } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, AlertTriangle, CheckCircle2, XCircle, Loader2 } from "lucide-react"
import type { MotoristaPicker, VeiculoPicker } from "@/types/entities"

// ============================================================================
// TIPOS
// ============================================================================

/**
 * Item base que pode ser selecionado
 */
export interface PickerItem {
  id: string
  [key: string]: unknown
}

/**
 * Coluna para renderização da lista
 */
export interface PickerColumn<T extends PickerItem> {
  /** Chave do campo no item */
  key: keyof T | string
  /** Rótulo da coluna */
  label: string
  /** Função para renderizar o valor */
  render?: (value: unknown, item: T) => ReactNode
  /** Se é o título principal */
  isPrimary?: boolean
  /** Se é subtítulo */
  isSecondary?: boolean
}

/**
 * Opção de filtro
 */
export interface FilterOption {
  value: string
  label: string
}

/**
 * Badge de status
 */
export interface StatusBadge<T extends PickerItem> {
  /** Função para determinar a variante do badge */
  getVariant: (item: T) => BadgeProps['variant']
  /** Função para obter o texto do badge */
  getText: (item: T) => string
  /** Função para obter ícone opcional */
  getIcon?: (item: T) => ReactNode
}

/**
 * Props do GenericPickerModal
 */
export interface GenericPickerModalProps<T extends PickerItem> {
  /** Se o modal está aberto */
  open?: boolean
  /** @deprecated Use 'open' instead */
  isOpen?: boolean
  /** Callback ao fechar */
  onClose: () => void
  /** Callback ao selecionar item */
  onSelect: (item: T) => void
  /** Título do modal */
  title: string
  /** Descrição do modal */
  description?: string
  /** Placeholder do campo de busca */
  searchPlaceholder?: string
  /** Mensagem quando não há resultados */
  emptyMessage?: string
  /** Itens para exibir (se fornecido, não usa fetchItems) */
  items?: T[]
  /** Estado de loading (quando usando items diretamente) */
  isLoading?: boolean
  /** Erro (quando usando items diretamente) */
  error?: string | null
  /** Função para buscar itens (usado se items não for fornecido) */
  fetchItems?: () => Promise<T[]>
  /** Colunas para renderização */
  columns?: PickerColumn<T>[]
  /** Função para renderizar item customizado */
  renderItem?: (item: T) => ReactNode
  /** Função para filtrar itens por texto */
  filterFn?: (item: T, query: string) => boolean
  /** Opções de filtro adicional */
  filterOptions?: FilterOption[]
  /** Função para aplicar filtro adicional */
  applyFilter?: (item: T, filterValue: string) => boolean
  /** Badges de status */
  statusBadges?: StatusBadge<T>[]
  /** Função para verificar se item pode ser selecionado */
  canSelect?: (item: T) => boolean
  /** Mensagem quando item não pode ser selecionado */
  disabledMessage?: string
  /** Aviso adicional (ex: capacidade mínima) */
  warningMessage?: string
  /** Dependências que trigam reload */
  deps?: unknown[]
  /** ID do item pré-selecionado */
  selectedId?: string
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export function GenericPickerModal<T extends PickerItem>({
  open,
  isOpen,
  onClose,
  onSelect,
  title,
  description,
  searchPlaceholder = "Buscar...",
  emptyMessage = "Nenhum item encontrado",
  items: itemsProp,
  isLoading: isLoadingProp,
  error: errorProp,
  fetchItems,
  columns = [],
  renderItem,
  filterFn,
  filterOptions,
  applyFilter,
  statusBadges,
  canSelect,
  disabledMessage,
  warningMessage,
  deps = [],
}: GenericPickerModalProps<T>) {
  const modalOpen = open ?? isOpen ?? false
  const [items, setItems] = useState<T[]>(itemsProp || [])
  const [loading, setLoading] = useState(isLoadingProp || false)
  const [error, setError] = useState<string | null>(errorProp || null)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterValue, setFilterValue] = useState<string>("all")

  // Atualizar items quando prop mudar
  useEffect(() => {
    if (itemsProp) {
      setItems(itemsProp)
    }
  }, [itemsProp])

  // Atualizar loading quando prop mudar
  useEffect(() => {
    if (isLoadingProp !== undefined) {
      setLoading(isLoadingProp)
    }
  }, [isLoadingProp])

  // Atualizar error quando prop mudar
  useEffect(() => {
    if (errorProp !== undefined) {
      setError(errorProp)
    }
  }, [errorProp])

  // Carregar itens via fetchItems
  const loadItems = useCallback(async () => {
    if (!fetchItems) return
    
    setLoading(true)
    setError(null)
    try {
      const data = await fetchItems()
      setItems(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao carregar dados"
      setError(message)
      console.error("Erro ao carregar itens:", err)
    } finally {
      setLoading(false)
    }
  }, [fetchItems])

  // Carregar quando abre ou deps mudam (apenas se usar fetchItems)
  useEffect(() => {
    if (modalOpen && fetchItems && !itemsProp) {
      loadItems()
    }
  }, [modalOpen, loadItems, fetchItems, itemsProp, ...deps])

  // Filtrar itens
  const filteredItems = useMemo(() => {
    let result = items

    // Filtro por texto
    if (searchQuery) {
      const query = searchQuery.toLowerCase().trim()
      if (filterFn) {
        result = result.filter((item) => filterFn(item, query))
      } else {
        // Filtro padrão: busca em todos os valores do item
        result = result.filter((item) => {
          const searchableText = Object.values(item)
            .map(v => String(v ?? '').toLowerCase())
            .join(' ')
          return searchableText.includes(query)
        })
      }
    }

    // Filtro adicional
    if (filterValue !== "all" && applyFilter) {
      result = result.filter((item) => applyFilter(item, filterValue))
    }

    return result
  }, [items, searchQuery, filterValue, filterFn, applyFilter])

  // Handler de seleção
  const handleSelect = (item: T) => {
    if (!canSelect || canSelect(item)) {
      onSelect(item)
      onClose()
    }
  }

  // Renderizar valor de coluna
  const renderColumnValue = (column: PickerColumn<T>, item: T): ReactNode => {
    const value = column.key.includes(".") 
      ? column.key.split(".").reduce((obj: unknown, key) => (obj as Record<string, unknown>)?.[key], item)
      : item[column.key as keyof T]

    if (column.render) {
      return column.render(value, item)
    }

    return String(value ?? "")
  }

  return (
    <Dialog open={modalOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] sm:w-[90vw] max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6 mx-auto">
        <DialogHeader className="pb-4 sm:pb-6">
          <DialogTitle className="text-xl sm:text-2xl font-bold break-words">
            {title}
          </DialogTitle>
          {description && (
            <DialogDescription className="text-sm sm:text-base break-words">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="space-y-4">
          {/* Search and Filter */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-light" />
              <Input
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            {filterOptions && filterOptions.length > 0 && (
              <Select value={filterValue} onValueChange={setFilterValue}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filtrar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {filterOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Warning Message */}
          {warningMessage && (
            <div className="p-3 bg-brand-light border border-brand-soft rounded-lg flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-brand shrink-0" />
              <span className="text-sm text-brand">{warningMessage}</span>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-error-light border border-error/20 rounded-lg flex items-center gap-2">
              <XCircle className="h-4 w-4 text-error shrink-0" />
              <span className="text-sm text-error">{error}</span>
            </div>
          )}

          {/* List */}
          {loading ? (
            <div className="flex items-center justify-center py-8 gap-2 text-ink-muted">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Carregando...</span>
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {filteredItems.length === 0 ? (
                  <div className="text-center py-8 text-ink-muted">
                    {emptyMessage}
                  </div>
                ) : (
                  filteredItems.map((item) => {
                    const isSelectable = !canSelect || canSelect(item)

                    // Se renderItem foi fornecido, usar ele
                    if (renderItem) {
                      return (
                        <div
                          key={item.id}
                          onClick={() => isSelectable && handleSelect(item)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if ((e.key === "Enter" || e.key === " ") && isSelectable) {
                              e.preventDefault()
                              handleSelect(item)
                            }
                          }}
                          aria-disabled={!isSelectable}
                        >
                          {renderItem(item)}
                        </div>
                      )
                    }

                    // Renderização padrão com colunas
                    const primaryColumn = columns.find((c) => c.isPrimary)
                    const secondaryColumn = columns.find((c) => c.isSecondary)
                    const otherColumns = columns.filter((c) => !c.isPrimary && !c.isSecondary)

                    return (
                      <div
                        key={item.id}
                        className={`flex items-center justify-between p-3 border rounded-lg hover:bg-bg-soft cursor-pointer transition-colors ${
                          !isSelectable ? "opacity-60 cursor-not-allowed" : ""
                        }`}
                        onClick={() => handleSelect(item)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault()
                            handleSelect(item)
                          }
                        }}
                        aria-disabled={!isSelectable}
                      >
                        <div className="flex-1 min-w-0">
                          {primaryColumn && (
                            <div className="font-medium truncate">
                              {renderColumnValue(primaryColumn, item)}
                            </div>
                          )}
                          {secondaryColumn && (
                            <div className="text-sm text-ink-muted truncate">
                              {renderColumnValue(secondaryColumn, item)}
                            </div>
                          )}
                          {otherColumns.map((column) => (
                            <div
                              key={String(column.key)}
                              className="text-xs text-ink-light truncate"
                            >
                              {column.label}: {renderColumnValue(column, item)}
                            </div>
                          ))}
                        </div>

                        {/* Status Badges */}
                        <div className="flex items-center gap-2 shrink-0 ml-2">
                          {statusBadges?.map((badge, index) => (
                            <Badge key={index} variant={badge.getVariant(item)}>
                              {badge.getIcon?.(item)}
                              {badge.getText(item)}
                            </Badge>
                          ))}
                          {!isSelectable && disabledMessage && (
                            <Badge variant="destructive">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              {disabledMessage}
                            </Badge>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ============================================================================
// PRESETS ESPECÍFICOS
// ============================================================================

/**
 * Props específicas para MotoristaPickerModal
 */
export interface MotoristaPickerModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (motorista: MotoristaPicker) => void
  companyId?: string
}

/**
 * Modal de seleção de motorista usando GenericPickerModal
 */
export function MotoristaPickerModal({
  isOpen,
  onClose,
  onSelect,
  companyId,
}: MotoristaPickerModalProps) {
  const fetchMotoristas = useCallback(async (): Promise<MotoristaPicker[]> => {
    const url = companyId
      ? `/api/admin/motoristas-list?company_id=${companyId}`
      : "/api/admin/motoristas-list"

    const response = await fetch(url)
    const result = await response.json()

    if (!result.success) {
      throw new Error(result.error || "Erro ao carregar motoristas")
    }

    return (result.motoristas || []).map((d: Record<string, unknown>) => ({
      id: d.id as string,
      name: (d.name as string) || "Sem nome",
      cpf: (d.cpf as string) || "",
      documents_valid: !!d.cpf,
      rating: undefined,
    }))
  }, [companyId])

  const columns: PickerColumn<MotoristaPicker>[] = [
    { key: "name", label: "Nome", isPrimary: true },
    {
      key: "cpf",
      label: "CPF",
      isSecondary: true,
      render: (value) => {
        if (!value) return ""
        const cpf = String(value)
        return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
      },
    },
  ]

  const statusBadges: StatusBadge<MotoristaPicker>[] = [
    {
      getVariant: (item) => (item.documents_valid ? "default" : "destructive"),
      getText: (item) => (item.documents_valid ? "Docs OK" : "Pendente"),
      getIcon: (item) =>
        item.documents_valid ? (
          <CheckCircle2 className="h-3 w-3 mr-1" />
        ) : (
          <XCircle className="h-3 w-3 mr-1" />
        ),
    },
  ]

  return (
    <GenericPickerModal<MotoristaPicker>
      isOpen={isOpen}
      onClose={onClose}
      onSelect={onSelect}
      title="Selecionar Motorista"
      description="Busque e selecione um motorista para a rota"
      searchPlaceholder="Buscar por nome ou CPF..."
      emptyMessage="Nenhum motorista encontrado"
      fetchItems={fetchMotoristas}
      columns={columns}
      filterFn={(item, query) =>
        item.name.toLowerCase().includes(query) ||
        item.cpf.replace(/\D/g, "").includes(query.replace(/\D/g, ""))
      }
      statusBadges={statusBadges}
      deps={[companyId]}
    />
  )
}

/**
 * Props específicas para VeiculoPickerModal
 */
export interface VeiculoPickerModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (veiculo: VeiculoPicker) => void
  companyId?: string
  requiredCapacity?: number
}

/**
 * Modal de seleção de veículo usando GenericPickerModal
 */
export function VeiculoPickerModal({
  isOpen,
  onClose,
  onSelect,
  companyId,
  requiredCapacity,
}: VeiculoPickerModalProps) {
  const fetchVeiculos = useCallback(async (): Promise<VeiculoPicker[]> => {
    const url = companyId
      ? `/api/admin/veiculos-list?company_id=${companyId}`
      : "/api/admin/veiculos-list"

    const response = await fetch(url)
    const result = await response.json()

    if (!result.success) {
      throw new Error(result.error || "Erro ao carregar veículos")
    }

    return (result.veiculos || []).map((v: Record<string, unknown>) => ({
      id: v.id as string,
      plate: v.plate as string,
      model: v.model as string,
      capacity: (v.capacity as number) || 0,
      status: (v.status as string) || (v.is_active ? "active" : "garage"),
      is_active: (v.is_active as boolean) ?? true,
    }))
  }, [companyId])

  const columns: PickerColumn<VeiculoPicker>[] = [
    { key: "plate", label: "Placa", isPrimary: true },
    { key: "model", label: "Modelo", isSecondary: true },
    {
      key: "capacity",
      label: "Capacidade",
      render: (value) => `${value} passageiros`,
    },
  ]

  const filterOptions: FilterOption[] = [
    { value: "active", label: "Ativo" },
    { value: "maintenance", label: "Manutenção" },
    { value: "garage", label: "Garagem" },
  ]

  const statusBadges: StatusBadge<VeiculoPicker>[] = [
    {
      getVariant: (item) =>
        item.is_active
          ? "default"
          : item.status === "maintenance"
          ? "destructive"
          : "secondary",
      getText: (item) =>
        item.is_active
          ? "Ativo"
          : item.status === "maintenance"
          ? "Manutenção"
          : "Garagem",
    },
  ]

  return (
    <GenericPickerModal<VeiculoPicker>
      isOpen={isOpen}
      onClose={onClose}
      onSelect={onSelect}
      title="Selecionar Veículo"
      description="Busque e selecione um veículo para a rota. Verifique a capacidade antes de selecionar."
      searchPlaceholder="Buscar por placa ou modelo..."
      emptyMessage="Nenhum veículo encontrado"
      fetchItems={fetchVeiculos}
      columns={columns}
      filterFn={(item, query) =>
        item.plate.toLowerCase().includes(query) ||
        item.model.toLowerCase().includes(query)
      }
      filterOptions={filterOptions}
      applyFilter={(item, filterValue) => {
        if (filterValue === "active") return item.is_active
        if (filterValue === "maintenance") return item.status === "maintenance"
        if (filterValue === "garage") return item.status === "garage"
        return true
      }}
      statusBadges={statusBadges}
      canSelect={
        requiredCapacity
          ? (item) => item.capacity >= requiredCapacity
          : undefined
      }
      disabledMessage="Insuficiente"
      warningMessage={
        requiredCapacity
          ? `Capacidade mínima necessária: ${requiredCapacity} passageiros`
          : undefined
      }
      deps={[companyId]}
    />
  )
}

export default GenericPickerModal

