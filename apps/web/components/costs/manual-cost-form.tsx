"use client"

import { useState, useEffect } from "react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { notifySuccess, notifyError } from "@/lib/toast"

interface CostCategory {
  id: string
  group_name: string
  category: string
  subcategory: string | null
}

interface ManualCostFormProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  companyId: string
  routeId?: string
  vehicleId?: string
  driverId?: string
}

export function ManualCostForm({
  isOpen,
  onClose,
  onSave,
  companyId,
  routeId,
  vehicleId,
  driverId
}: ManualCostFormProps) {
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<CostCategory[]>([])
  const [groups, setGroups] = useState<string[]>([])
  const [formData, setFormData] = useState({
    cost_category_id: '',
    date: new Date().toISOString().split('T')[0],
    amount: '',
    qty: '',
    unit: '',
    notes: '',
    selectedGroup: ''
  })

  useEffect(() => {
    if (isOpen) {
      loadCategories()
    }
  }, [isOpen])

  const loadCategories = async () => {
    try {
      const res = await fetch('/api/costs/categories')
      if (res.ok) {
        const data = await res.json()
        setCategories(data)
        setGroups(Array.from(new Set(data.map((c: CostCategory) => c.group_name))))
      }
    } catch (error) {
      console.error('Erro ao carregar categorias:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/costs/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_id: companyId,
          route_id: routeId || null,
          veiculo_id: vehicleId || null,
          motorista_id: driverId || null,
          cost_category_id: formData.cost_category_id,
          date: formData.date,
          amount: parseFloat(formData.amount),
          qty: formData.qty ? parseFloat(formData.qty) : null,
          unit: formData.unit || null,
          notes: formData.notes || null,
          source: 'manual'
        })
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Erro ao salvar custo')
      }

      notifySuccess('', { i18n: { ns: 'common', key: 'success.costAdded' } })
      onSave()
      onClose()
      resetForm()
    } catch (error: any) {
      console.error('Erro ao salvar custo:', error)
      notifyError(error, 'Erro ao salvar custo')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      cost_category_id: '',
      date: new Date().toISOString().split('T')[0],
      amount: '',
      qty: '',
      unit: '',
      notes: '',
      selectedGroup: ''
    })
  }

  const filteredCategories = formData.selectedGroup
    ? categories.filter(c => c.group_name === formData.selectedGroup)
    : categories

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] sm:w-[90vw] sm:max-w-[600px] max-h-[90vh] overflow-y-auto p-4 sm:p-6 mx-auto">
        <DialogHeader>
          <DialogTitle>Adicionar Custo Manual</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="group">Grupo de Custo *</Label>
              <Select
                value={formData.selectedGroup}
                onValueChange={(value) => {
                  setFormData({ ...formData, selectedGroup: value, cost_category_id: '' })
                }}
                required
              >
                <SelectTrigger id="group">
                  <SelectValue placeholder="Selecione um grupo" />
                </SelectTrigger>
                <SelectContent>
                  {groups.map(group => (
                    <SelectItem key={group} value={group}>{group}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Categoria *</Label>
              <Select
                value={formData.cost_category_id}
                onValueChange={(value) => setFormData({ ...formData, cost_category_id: value })}
                disabled={!formData.selectedGroup}
                required
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {filteredCategories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.category}{cat.subcategory ? ` - ${cat.subcategory}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Data *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Valor (R$) *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0.00"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="qty">Quantidade</Label>
              <Input
                id="qty"
                type="number"
                step="0.001"
                min="0"
                value={formData.qty}
                onChange={(e) => setFormData({ ...formData, qty: e.target.value })}
                placeholder="0.000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit">Unidade</Label>
              <Input
                id="unit"
                type="text"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                placeholder="litro, km, hora, etc."
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <textarea
              id="notes"
              className="w-full px-3 py-2 rounded-lg border border-border bg-white text-sm"
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Observações sobre este custo..."
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="bg-brand hover:bg-brand-hover">
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

