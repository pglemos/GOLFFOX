"use client"

import { useState, useEffect } from "react"

import { ColumnDef } from "@tanstack/react-table"
import { Building2, Plus, Edit, Trash2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DataTablePremium } from "@/components/ui/data-table-premium"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SkeletonList } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { supabase } from "@/lib/supabase"
import { notifySuccess, notifyError } from "@/lib/toast"
import { logError } from "@/lib/logger"



interface CostCenter {
    id: string
    code: string
    name: string
    is_active: boolean
    company_id: string
}

interface CostCentersListProps {
    companyId: string
}

export function CostCentersList({ companyId }: CostCentersListProps) {
    const [costCenters, setCostCenters] = useState<CostCenter[]>([])
    const [loading, setLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingCenter, setEditingCenter] = useState<CostCenter | null>(null)
    const [formData, setFormData] = useState({ code: '', name: '', is_active: true })

    const loadCostCenters = async () => {
        try {
            const { data, error } = await supabase
                .from('gf_cost_centers' as any)
                .select('*')
                .eq('company_id', companyId)
                .order('code')

            if (error) throw error
            setCostCenters(data as any as CostCenter[])
        } catch (error) {
            logError('Erro ao carregar centros de custo', { error }, 'CostCentersList')
            notifyError('Erro ao carregar dados')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (companyId) loadCostCenters()
    }, [companyId])

    const handleSave = async () => {
        try {
            if (editingCenter) {
                // Update
                const { error } = await supabase
                    .from('gf_cost_centers' as any)
                    .update({
                        code: formData.code,
                        name: formData.name,
                        is_active: formData.is_active
                    })
                    .eq('id', editingCenter.id)

                if (error) throw error
                notifySuccess('Centro de custo atualizado')
            } else {
                // Insert
                const { error } = await supabase
                    .from('gf_cost_centers' as any)
                    .insert({
                        company_id: companyId,
                        code: formData.code,
                        name: formData.name,
                        is_active: formData.is_active
                    })

                if (error) throw error
                notifySuccess('Centro de custo criado')
            }

            setIsDialogOpen(false)
            setEditingCenter(null)
            setFormData({ code: '', name: '', is_active: true })
            loadCostCenters()
        } catch (error) {
            logError('Erro ao salvar', { error }, 'CostCentersList')
            notifyError('Erro ao salvar centro de custo')
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja remover este centro de custo?')) return

        try {
            const { error } = await supabase
                .from('gf_cost_centers' as any)
                .delete()
                .eq('id', id)

            if (error) throw error
            notifySuccess('Centro de custo removido')
            loadCostCenters()
        } catch (error) {
            logError('Erro ao remover', { error }, 'CostCentersList')
            notifyError('Erro ao remover')
        }
    }

    const openEdit = (center: CostCenter) => {
        setEditingCenter(center)
        setFormData({
            code: center.code,
            name: center.name,
            is_active: center.is_active
        })
        setIsDialogOpen(true)
    }

    const openCreate = () => {
        setEditingCenter(null)
        setFormData({ code: '', name: '', is_active: true })
        setIsDialogOpen(true)
    }

    if (loading) return <SkeletonList count={3} />

    const columns: ColumnDef<CostCenter>[] = [
        {
            accessorKey: "code",
            header: "Código",
        },
        {
            accessorKey: "name",
            header: "Nome",
        },
        {
            accessorKey: "is_active",
            header: "Status",
            cell: ({ row }) => {
                const isActive = row.getValue("is_active") as boolean
                return (
                    <Badge variant={isActive ? 'default' : 'secondary'}>
                        {isActive ? 'Ativo' : 'Inativo'}
                    </Badge>
                )
            }
        },
        {
            id: "actions",
            enableHiding: false,
            cell: ({ row }) => {
                const center = row.original
                return (
                    <div className="flex gap-2 justify-end">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(center)}>
                            <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(center.id)}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                )
            },
        },
    ]

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Centros de Custo Cadastrados</h3>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={openCreate}>
                            <Plus className="h-4 w-4 mr-2" />
                            Novo Centro
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>
                                {editingCenter ? 'Editar Centro de Custo' : 'Novo Centro de Custo'}
                            </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Código</Label>
                                <Input
                                    value={formData.code}
                                    onChange={e => setFormData({ ...formData, code: e.target.value })}
                                    placeholder="Ex: ADM-01"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Nome</Label>
                                <Input
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Ex: Administrativo Matriz"
                                />
                            </div>
                            <div className="flex items-center space-x-2">
                                <Switch
                                    checked={formData.is_active}
                                    onCheckedChange={checked => setFormData({ ...formData, is_active: checked })}
                                />
                                <Label>Ativo</Label>
                            </div>
                            <Button className="w-full" onClick={handleSave}>Salvar</Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <DataTablePremium
                columns={columns}
                data={costCenters}
                searchKey="name"
                placeholder="Filtrar por nome..."
            />
        </div>
    )
}
