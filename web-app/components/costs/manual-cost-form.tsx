"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import toast from "react-hot-toast"

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
          vehicle_id: vehicleId || null,
          driver_id: driverId || null,
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

      toast.success('Custo adicionado com sucesso!')
      onSave()
      onClose()
      resetForm()
    } catch (error: any) {
      console.error('Erro ao salvar custo:', error)
      toast.error(error.message || 'Erro ao salvar custo')
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
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Adicionar Custo Manual</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="group">Grupo de Custo *</Label>
              <select
                id="group"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm"
                value={formData.selectedGroup}
                onChange={(e) => {
                  setFormData({ ...formData, selectedGroup: e.target.value, cost_category_id: '' })
                }}
                required
              >
                <option value="">Selecione um grupo</option>
                {groups.map(group => (
                  <option key={group} value={group}>{group}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Categoria *</Label>
              <select
                id="category"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm"
                value={formData.cost_category_id}
                onChange={(e) => setFormData({ ...formData, cost_category_id: e.target.value })}
                required
                disabled={!formData.selectedGroup}
              >
                <option value="">Selecione uma categoria</option>
                {filteredCategories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.category}{cat.subcategory ? ` - ${cat.subcategory}` : ''}
                  </option>
                ))}
              </select>
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
              className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm"
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
            <Button type="submit" disabled={loading} className="bg-orange-500 hover:bg-orange-600">
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

