"use client"

import { useState, useEffect, useCallback } from "react"
import { Loader2, Building2, Save, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { notifySuccess, notifyError } from "@/lib/toast"
import {
    BankAccountType,
    PixKeyType,
    BANK_ACCOUNT_TYPE_LABELS,
    PIX_KEY_TYPE_LABELS,
    TransportadoraBankingData,
} from "@/types/documents"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

interface TransportadoraBankingSectionProps {
    carrierId: string | undefined
    isEditing: boolean
    initialData?: TransportadoraBankingData
    onSave?: (data: TransportadoraBankingData) => void
}

const defaultBankingData: TransportadoraBankingData = {
    bank_name: "",
    bank_code: "",
    bank_agency: "",
    bank_account: "",
    bank_account_type: "corrente",
    pix_key: "",
    pix_key_type: "cnpj",
}

/**
 * Componente para gerenciar dados bancários de uma transportadora
 */
export function CarrierBankingSection({
    carrierId,
    isEditing,
    initialData,
    onSave,
}: TransportadoraBankingSectionProps) {
    const [formData, setFormData] = useState<TransportadoraBankingData>(initialData || defaultBankingData)
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)

    // Carregar dados existentes
    const loadBankingData = useCallback(async () => {
        if (!carrierId) return

        setLoading(true)
        try {
            const response = await fetch(`/api/admin/carriers/${carrierId}`)
            if (response.ok) {
                const data = await response.json()
                if (data) {
                    setFormData({
                        bank_name: data.bank_name || "",
                        bank_code: data.bank_code || "",
                        bank_agency: data.bank_agency || "",
                        bank_account: data.bank_account || "",
                        bank_account_type: data.bank_account_type || "corrente",
                        pix_key: data.pix_key || "",
                        pix_key_type: data.pix_key_type || "cnpj",
                    })
                }
            }
        } catch (error) {
            console.error("Erro ao carregar dados bancários:", error)
        } finally {
            setLoading(false)
        }
    }, [carrierId])

    useEffect(() => {
        if (carrierId && isEditing && !initialData) {
            loadBankingData()
        }
    }, [carrierId, isEditing, initialData, loadBankingData])

    useEffect(() => {
        if (initialData) {
            setFormData(initialData)
        }
    }, [initialData])

    const handleSave = async () => {
        if (!carrierId) {
            notifyError(new Error("Salve a transportadora primeiro"), "Erro")
            return
        }

        setSaving(true)
        try {
            const response = await fetch(`/api/admin/transportadoras/update?id=${carrierId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            })

            if (!response.ok) {
                throw new Error("Erro ao salvar dados bancários")
            }

            notifySuccess("Dados bancários salvos com sucesso!")
            if (onSave) onSave(formData)
        } catch (error) {
            notifyError(error, "Erro ao salvar")
        } finally {
            setSaving(false)
        }
    }

    if (!isEditing || !carrierId) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Salve a transportadora primeiro para adicionar dados bancários</p>
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
            <Card className="p-4 space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Dados Bancários
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Nome do Banco</Label>
                        <Input
                            value={formData.bank_name || ""}
                            onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                            placeholder="Ex: Banco do Brasil"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Código do Banco</Label>
                        <Input
                            value={formData.bank_code || ""}
                            onChange={(e) => setFormData({ ...formData, bank_code: e.target.value })}
                            placeholder="Ex: 001"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Agência</Label>
                        <Input
                            value={formData.bank_agency || ""}
                            onChange={(e) => setFormData({ ...formData, bank_agency: e.target.value })}
                            placeholder="Ex: 1234-5"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Conta</Label>
                        <Input
                            value={formData.bank_account || ""}
                            onChange={(e) => setFormData({ ...formData, bank_account: e.target.value })}
                            placeholder="Ex: 12345-6"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Tipo de Conta</Label>
                        <Select
                            value={formData.bank_account_type || "corrente"}
                            onValueChange={(v) => setFormData({ ...formData, bank_account_type: v as BankAccountType })}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.entries(BANK_ACCOUNT_TYPE_LABELS).map(([value, label]) => (
                                    <SelectItem key={value} value={value}>
                                        {label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </Card>

            <Card className="p-4 space-y-4">
                <h4 className="font-medium">Chave PIX</h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Tipo de Chave</Label>
                        <Select
                            value={formData.pix_key_type || "cnpj"}
                            onValueChange={(v) => setFormData({ ...formData, pix_key_type: v as PixKeyType })}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.entries(PIX_KEY_TYPE_LABELS).map(([value, label]) => (
                                    <SelectItem key={value} value={value}>
                                        {label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Chave PIX</Label>
                        <Input
                            value={formData.pix_key || ""}
                            onChange={(e) => setFormData({ ...formData, pix_key: e.target.value })}
                            placeholder="Informe a chave PIX"
                        />
                    </div>
                </div>
            </Card>

            <div className="flex justify-end gap-2">
                <Button
                    variant="outline"
                    onClick={loadBankingData}
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
                    Salvar
                </Button>
            </div>
        </div>
    )
}

export default CarrierBankingSection
