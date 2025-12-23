/**
 * ManualCostFormView
 * 
 * Componente presentational (UI pura) do formulário de custo manual.
 * Não possui lógica de negócio, apenas renderização.
 */

"use client"

import { memo } from "react"

import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"


// ============================================================================
// TIPOS
// ============================================================================

export interface CostCategory {
  id: string
  group_name: string
  category: string
  subcategory: string | null
}

export interface ManualCostFormData {
  cost_category_id: string
  date: string
  amount: string
  qty: string
  unit: string
  notes: string
  selectedGroup: string
}

export interface ManualCostFormViewProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: ManualCostFormData) => Promise<void>
  formData: ManualCostFormData
  onFieldChange: (field: keyof ManualCostFormData, value: string) => void
  categories: CostCategory[]
  groups: string[]
  loading: boolean
  loadingCategories: boolean
  error: string | null
}

// ============================================================================
// COMPONENTES AUXILIARES
// ============================================================================

interface FormFieldProps {
  id: string
  label: string
  required?: boolean
  children: React.ReactNode
}

const FormField = memo(({ id, label, required, children }: FormFieldProps) => (
  <div className="space-y-2">
    <Label htmlFor={id}>
      {label} {required && '*'}
    </Label>
    {children}
  </div>
))
FormField.displayName = 'FormField'

interface SelectFieldProps {
  id: string
  value: string
  onChange: (value: string) => void
  options: Array<{ value: string; label: string }>
  placeholder: string
  required?: boolean
  disabled?: boolean
}

const SelectField = memo(({
  id,
  value,
  onChange,
  options,
  placeholder,
  required,
  disabled,
}: SelectFieldProps) => (
  <select
    id={id}
    className="min-h-[48px] w-full px-4 py-3 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
    value={value}
    onChange={(e) => onChange(e.target.value)}
    required={required}
    disabled={disabled}
  >
    <option value="">{placeholder}</option>
    {options.map((opt) => (
      <option key={opt.value} value={opt.value}>
        {opt.label}
      </option>
    ))}
  </select>
))
SelectField.displayName = 'SelectField'

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export const ManualCostFormView = memo(({
  isOpen,
  onClose,
  onSubmit,
  formData,
  onFieldChange,
  categories,
  groups,
  loading,
  loadingCategories,
  error,
}: ManualCostFormViewProps) => {
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit(formData)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] sm:w-[90vw] sm:max-w-[600px] max-h-[90vh] overflow-y-auto p-4 sm:p-6 mx-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Adicionar Custo Manual</DialogTitle>
        </DialogHeader>

        {loadingCategories ? (
          <div className="flex items-center justify-center py-8 gap-2 text-ink-muted">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Carregando categorias...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Erro */}
            {error && (
              <div className="p-3 bg-error-light/10 border border-error/20 rounded-lg text-sm text-error">
                {error}
              </div>
            )}

            {/* Grupo e Categoria */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField id="group" label="Grupo de Custo" required>
                <SelectField
                  id="group"
                  value={formData.selectedGroup}
                  onChange={(value) => onFieldChange('selectedGroup', value)}
                  options={groups.map((g) => ({ value: g, label: g }))}
                  placeholder="Selecione um grupo"
                  required
                />
              </FormField>

              <FormField id="category" label="Categoria" required>
                <SelectField
                  id="category"
                  value={formData.cost_category_id}
                  onChange={(value) => onFieldChange('cost_category_id', value)}
                  options={categories.map((c) => ({
                    value: c.id,
                    label: c.subcategory ? `${c.category} - ${c.subcategory}` : c.category,
                  }))}
                  placeholder="Selecione uma categoria"
                  required
                  disabled={!formData.selectedGroup}
                />
              </FormField>
            </div>

            {/* Data e Valor */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField id="date" label="Data" required>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => onFieldChange('date', e.target.value)}
                  required
                />
              </FormField>

              <FormField id="amount" label="Valor (R$)" required>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={(e) => onFieldChange('amount', e.target.value)}
                  placeholder="0.00"
                  required
                />
              </FormField>
            </div>

            {/* Quantidade e Unidade */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField id="qty" label="Quantidade">
                <Input
                  id="qty"
                  type="number"
                  step="0.001"
                  min="0"
                  value={formData.qty}
                  onChange={(e) => onFieldChange('qty', e.target.value)}
                  placeholder="0.000"
                />
              </FormField>

              <FormField id="unit" label="Unidade">
                <Input
                  id="unit"
                  type="text"
                  value={formData.unit}
                  onChange={(e) => onFieldChange('unit', e.target.value)}
                  placeholder="litro, km, hora, etc."
                />
              </FormField>
            </div>

            {/* Observações */}
            <FormField id="notes" label="Observações">
              <textarea
                id="notes"
                className="w-full px-3 py-2 rounded-lg border border-border bg-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                rows={3}
                value={formData.notes}
                onChange={(e) => onFieldChange('notes', e.target.value)}
                placeholder="Observações sobre este custo..."
              />
            </FormField>

            {/* Ações */}
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-brand hover:bg-brand-hover"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Salvar'
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
})

ManualCostFormView.displayName = 'ManualCostFormView'

export default ManualCostFormView

