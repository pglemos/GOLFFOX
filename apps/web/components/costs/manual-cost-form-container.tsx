/**
 * ManualCostFormContainer
 * 
 * Container component que gerencia a lógica de negócio do formulário de custo manual.
 * Segue o padrão Container/Presentational para separação de responsabilidades.
 */

"use client"

import { useState, useEffect, useCallback } from "react"

import { useApiMutation } from "@/hooks/use-api-mutation"
import { notifySuccess, notifyError } from "@/lib/toast"

import { ManualCostFormView, type ManualCostFormData, type CostCategory } from "./manual-cost-form-view"

// ============================================================================
// TIPOS
// ============================================================================

export interface ManualCostFormContainerProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  companyId: string
  routeId?: string
  vehicleId?: string
  driverId?: string
}

interface ManualCostPayload {
  company_id: string
  route_id: string | null
  veiculo_id: string | null
  motorista_id: string | null
  cost_category_id: string
  date: string
  amount: number
  qty: number | null
  unit: string | null
  notes: string | null
  source: 'manual'
}

// ============================================================================
// ESTADO INICIAL
// ============================================================================

const getInitialFormData = (): ManualCostFormData => ({
  cost_category_id: '',
  date: new Date().toISOString().split('T')[0],
  amount: '',
  qty: '',
  unit: '',
  notes: '',
  selectedGroup: '',
})

// ============================================================================
// CONTAINER COMPONENT
// ============================================================================

export function ManualCostFormContainer({
  isOpen,
  onClose,
  onSave,
  companyId,
  routeId,
  vehicleId,
  driverId,
}: ManualCostFormContainerProps) {
  // Estado do formulário
  const [formData, setFormData] = useState<ManualCostFormData>(getInitialFormData())
  const [categories, setCategories] = useState<CostCategory[]>([])
  const [groups, setGroups] = useState<string[]>([])
  const [loadingCategories, setLoadingCategories] = useState(false)

  // Mutation para salvar custo
  const { mutate: saveCost, loading: saving, error: saveError } = useApiMutation<
    { success: boolean },
    ManualCostPayload
  >({
    url: '/api/costs/manual',
    method: 'POST',
    showSuccessToast: true,
    successI18nKey: { ns: 'common', key: 'success.costAdded' },
    showErrorToast: true,
    errorMessage: 'Erro ao salvar custo',
    onSuccess: () => {
      onSave()
      handleClose()
    },
  })

  // Carregar categorias quando modal abre
  useEffect(() => {
    if (isOpen) {
      loadCategories()
    }
  }, [isOpen])

  // Carregar categorias de custo
  const loadCategories = useCallback(async () => {
    setLoadingCategories(true)
    try {
      const res = await fetch('/api/costs/categories')
      if (res.ok) {
        const data: CostCategory[] = await res.json()
        setCategories(data)
        
        // Extrair grupos únicos
        const uniqueGroups = Array.from(new Set(data.map((c) => c.group_name)))
        setGroups(uniqueGroups)
      } else {
        notifyError('Erro ao carregar categorias')
      }
    } catch (error) {
      console.error('Erro ao carregar categorias:', error)
      notifyError('Erro ao carregar categorias')
    } finally {
      setLoadingCategories(false)
    }
  }, [])

  // Resetar formulário
  const resetForm = useCallback(() => {
    setFormData(getInitialFormData())
  }, [])

  // Handler de fechar modal
  const handleClose = useCallback(() => {
    resetForm()
    onClose()
  }, [onClose, resetForm])

  // Handler de submit
  const handleSubmit = useCallback(async (data: ManualCostFormData) => {
    const payload: ManualCostPayload = {
      company_id: companyId,
      route_id: routeId || null,
      veiculo_id: vehicleId || null,
      motorista_id: driverId || null,
      cost_category_id: data.cost_category_id,
      date: data.date,
      amount: parseFloat(data.amount),
      qty: data.qty ? parseFloat(data.qty) : null,
      unit: data.unit || null,
      notes: data.notes || null,
      source: 'manual',
    }

    await saveCost(payload)
  }, [companyId, routeId, vehicleId, driverId, saveCost])

  // Handler de mudança de campo
  const handleFieldChange = useCallback((field: keyof ManualCostFormData, value: string) => {
    setFormData((prev) => {
      // Se mudou o grupo, limpar a categoria
      if (field === 'selectedGroup') {
        return { ...prev, [field]: value, cost_category_id: '' }
      }
      return { ...prev, [field]: value }
    })
  }, [])

  // Filtrar categorias pelo grupo selecionado
  const filteredCategories = formData.selectedGroup
    ? categories.filter((c) => c.group_name === formData.selectedGroup)
    : categories

  return (
    <ManualCostFormView
      isOpen={isOpen}
      onClose={handleClose}
      onSubmit={handleSubmit}
      formData={formData}
      onFieldChange={handleFieldChange}
      categories={filteredCategories}
      groups={groups}
      loading={saving}
      loadingCategories={loadingCategories}
      error={saveError?.message || null}
    />
  )
}

export default ManualCostFormContainer

