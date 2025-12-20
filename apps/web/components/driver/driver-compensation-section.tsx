"use client"

import { useState, useEffect, useCallback } from "react"
import { Loader2, DollarSign, Save, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { notifySuccess, notifyError } from "@/lib/toast"
import {
    MotoristaCompensation,
    PaymentFrequency,
    ContractType,
    PAYMENT_FREQUENCY_LABELS,
    CONTRACT_TYPE_LABELS,
} from "@/types/documents"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

interface MotoristaCompensationSectionProps {
    driverId: string | undefined
    isEditing: boolean
}

const defaultCompensation = {
    base_salary: undefined as number | undefined,
    payment_frequency: "monthly" as PaymentFrequency,
    contract_type: "clt" as ContractType,
    has_meal_allowance: false,
    meal_allowance_value: undefined as number | undefined,
    has_transport_allowance: false,
    transport_allowance_value: undefined as number | undefined,
    has_health_insurance: false,
    health_insurance_value: undefined as number | undefined,
    has_dental_insurance: false,
    dental_insurance_value: undefined as number | undefined,
    has_life_insurance: false,
    life_insurance_value: undefined as number | undefined,
    has_fuel_card: false,
    fuel_card_limit: undefined as number | undefined,
    other_benefits: "",
    start_date: "",
    notes: "",
}

/**
 * Componente para gerenciar salário e benefícios de motorista
 */
export function DriverCompensationSection({
    driverId,
    isEditing,
}: MotoristaCompensationSectionProps) {
    const [formData, setFormData] = useState(defaultCompensation)
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [hasExisting, setHasExisting] = useState(false)

    // Carregar dados existentes
    const loadCompensation = useCallback(async () => {
        if (!driverId) return

        setLoading(true)
        try {
            const response = await fetch(`/api/admin/drivers/${driverId}/compensation`)
            if (response.ok) {
                const data: MotoristaCompensation | null = await response.json()
                if (data) {
                    setFormData({
                        base_salary: data.base_salary ?? undefined,
                        payment_frequency: data.payment_frequency || "monthly",
                        contract_type: data.contract_type || "clt",
                        has_meal_allowance: data.has_meal_allowance || false,
                        meal_allowance_value: data.meal_allowance_value ?? undefined,
                        has_transport_allowance: data.has_transport_allowance || false,
                        transport_allowance_value: data.transport_allowance_value ?? undefined,
                        has_health_insurance: data.has_health_insurance || false,
                        health_insurance_value: data.health_insurance_value ?? undefined,
                        has_dental_insurance: data.has_dental_insurance || false,
                        dental_insurance_value: data.dental_insurance_value ?? undefined,
                        has_life_insurance: data.has_life_insurance || false,
                        life_insurance_value: data.life_insurance_value ?? undefined,
                        has_fuel_card: data.has_fuel_card || false,
                        fuel_card_limit: data.fuel_card_limit ?? undefined,
                        other_benefits: data.other_benefits || "",
                        start_date: data.start_date || "",
                        notes: data.notes || "",
                    })
                    setHasExisting(true)
                }
            }
        } catch (error) {
            console.error("Erro ao carregar compensação:", error)
        } finally {
            setLoading(false)
        }
    }, [driverId])

    useEffect(() => {
        if (driverId && isEditing) {
            loadCompensation()
        }
    }, [driverId, isEditing, loadCompensation])

    // Salvar dados
    const handleSave = async () => {
        if (!driverId) {
            notifyError(new Error("Salve o motorista primeiro"), "Erro")
            return
        }

        setSaving(true)
        try {
            const response = await fetch(`/api/admin/drivers/${driverId}/compensation`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            })

            if (!response.ok) {
                throw new Error("Erro ao salvar dados")
            }

            notifySuccess("Dados salvos com sucesso!")
            setHasExisting(true)
        } catch (error) {
            notifyError(error, "Erro ao salvar")
        } finally {
            setSaving(false)
        }
    }

    // Formatar valor monetário
    const formatCurrency = (value: number | undefined) => {
        if (!value) return ""
        return value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })
    }

    // Se não está editando, mostrar mensagem
    if (!isEditing || !driverId) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Salve o motorista primeiro para definir salário e benefícios</p>
            </div>
        )
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Dados Salariais */}
            <Card className="p-4 space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Dados Salariais
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <Label>Tipo de Contrato</Label>
                        <Select
                            value={formData.contract_type}
                            onValueChange={(v) => setFormData({ ...formData, contract_type: v as ContractType })}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.entries(CONTRACT_TYPE_LABELS).map(([value, label]) => (
                                    <SelectItem key={value} value={value}>
                                        {label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Salário Base (R$)</Label>
                        <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0,00"
                            value={formData.base_salary || ""}
                            onChange={(e) => setFormData({
                                ...formData,
                                base_salary: e.target.value ? parseFloat(e.target.value) : undefined
                            })}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Frequência de Pagamento</Label>
                        <Select
                            value={formData.payment_frequency}
                            onValueChange={(v) => setFormData({ ...formData, payment_frequency: v as PaymentFrequency })}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.entries(PAYMENT_FREQUENCY_LABELS).map(([value, label]) => (
                                    <SelectItem key={value} value={value}>
                                        {label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Data de Início</Label>
                        <Input
                            type="date"
                            value={formData.start_date || ""}
                            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                        />
                    </div>
                </div>
            </Card>

            {/* Benefícios */}
            <Card className="p-4 space-y-4">
                <h4 className="font-medium">Benefícios</h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Vale Refeição */}
                    <div className="flex items-start gap-3 p-3 rounded-lg border">
                        <Checkbox
                            id="meal"
                            checked={formData.has_meal_allowance}
                            onCheckedChange={(v) => setFormData({ ...formData, has_meal_allowance: !!v })}
                        />
                        <div className="flex-1 space-y-2">
                            <Label htmlFor="meal" className="cursor-pointer">Vale Refeição</Label>
                            {formData.has_meal_allowance && (
                                <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    placeholder="Valor (R$)"
                                    value={formData.meal_allowance_value || ""}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        meal_allowance_value: e.target.value ? parseFloat(e.target.value) : undefined
                                    })}
                                />
                            )}
                        </div>
                    </div>

                    {/* Vale Transporte */}
                    <div className="flex items-start gap-3 p-3 rounded-lg border">
                        <Checkbox
                            id="transport"
                            checked={formData.has_transport_allowance}
                            onCheckedChange={(v) => setFormData({ ...formData, has_transport_allowance: !!v })}
                        />
                        <div className="flex-1 space-y-2">
                            <Label htmlFor="transport" className="cursor-pointer">Vale Transporte</Label>
                            {formData.has_transport_allowance && (
                                <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    placeholder="Valor (R$)"
                                    value={formData.transport_allowance_value || ""}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        transport_allowance_value: e.target.value ? parseFloat(e.target.value) : undefined
                                    })}
                                />
                            )}
                        </div>
                    </div>

                    {/* Plano de Saúde */}
                    <div className="flex items-start gap-3 p-3 rounded-lg border">
                        <Checkbox
                            id="health"
                            checked={formData.has_health_insurance}
                            onCheckedChange={(v) => setFormData({ ...formData, has_health_insurance: !!v })}
                        />
                        <div className="flex-1 space-y-2">
                            <Label htmlFor="health" className="cursor-pointer">Plano de Saúde</Label>
                            {formData.has_health_insurance && (
                                <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    placeholder="Valor (R$)"
                                    value={formData.health_insurance_value || ""}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        health_insurance_value: e.target.value ? parseFloat(e.target.value) : undefined
                                    })}
                                />
                            )}
                        </div>
                    </div>

                    {/* Plano Odonto */}
                    <div className="flex items-start gap-3 p-3 rounded-lg border">
                        <Checkbox
                            id="dental"
                            checked={formData.has_dental_insurance}
                            onCheckedChange={(v) => setFormData({ ...formData, has_dental_insurance: !!v })}
                        />
                        <div className="flex-1 space-y-2">
                            <Label htmlFor="dental" className="cursor-pointer">Plano Odontológico</Label>
                            {formData.has_dental_insurance && (
                                <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    placeholder="Valor (R$)"
                                    value={formData.dental_insurance_value || ""}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        dental_insurance_value: e.target.value ? parseFloat(e.target.value) : undefined
                                    })}
                                />
                            )}
                        </div>
                    </div>

                    {/* Seguro de Vida */}
                    <div className="flex items-start gap-3 p-3 rounded-lg border">
                        <Checkbox
                            id="life"
                            checked={formData.has_life_insurance}
                            onCheckedChange={(v) => setFormData({ ...formData, has_life_insurance: !!v })}
                        />
                        <div className="flex-1 space-y-2">
                            <Label htmlFor="life" className="cursor-pointer">Seguro de Vida</Label>
                            {formData.has_life_insurance && (
                                <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    placeholder="Valor (R$)"
                                    value={formData.life_insurance_value || ""}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        life_insurance_value: e.target.value ? parseFloat(e.target.value) : undefined
                                    })}
                                />
                            )}
                        </div>
                    </div>

                    {/* Cartão Combustível */}
                    <div className="flex items-start gap-3 p-3 rounded-lg border">
                        <Checkbox
                            id="fuel"
                            checked={formData.has_fuel_card}
                            onCheckedChange={(v) => setFormData({ ...formData, has_fuel_card: !!v })}
                        />
                        <div className="flex-1 space-y-2">
                            <Label htmlFor="fuel" className="cursor-pointer">Cartão Combustível</Label>
                            {formData.has_fuel_card && (
                                <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    placeholder="Limite (R$)"
                                    value={formData.fuel_card_limit || ""}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        fuel_card_limit: e.target.value ? parseFloat(e.target.value) : undefined
                                    })}
                                />
                            )}
                        </div>
                    </div>
                </div>

                {/* Outros Benefícios */}
                <div className="space-y-2">
                    <Label>Outros Benefícios</Label>
                    <Textarea
                        placeholder="Descreva outros benefícios oferecidos..."
                        value={formData.other_benefits || ""}
                        onChange={(e) => setFormData({ ...formData, other_benefits: e.target.value })}
                        rows={3}
                    />
                </div>

                {/* Observações */}
                <div className="space-y-2">
                    <Label>Observações</Label>
                    <Textarea
                        placeholder="Observações sobre salário/benefícios..."
                        value={formData.notes || ""}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        rows={2}
                    />
                </div>
            </Card>

            {/* Botão Salvar */}
            <div className="flex justify-end gap-2">
                <Button
                    variant="outline"
                    onClick={loadCompensation}
                    disabled={loading}
                >
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                    Recarregar
                </Button>
                <Button
                    onClick={handleSave}
                    disabled={saving}
                >
                    {saving ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                        <Save className="h-4 w-4 mr-2" />
                    )}
                    {hasExisting ? "Atualizar" : "Salvar"}
                </Button>
            </div>
        </div>
    )
}

export default DriverCompensationSection
