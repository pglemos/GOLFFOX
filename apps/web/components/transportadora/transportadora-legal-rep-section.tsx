"use client"

import { useState, useEffect, useCallback } from "react"

import { Loader2, User, Save, RefreshCw, FileText } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { DocumentCard } from "@/components/ui/document-card"
import { FileUpload } from "@/components/ui/file-upload"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useFileUpload } from "@/hooks/use-file-upload"
import { notifySuccess, notifyError } from "@/lib/toast"
import {
    TransportadoraLegalRepData,
    TRANSPORTADORA_DOCUMENT_LABELS,
} from "@/types/documents"

interface TransportadoraLegalRepSectionProps {
    transportadoraId: string | undefined
    isEditing: boolean
    initialData?: TransportadoraLegalRepData
    onSave?: (data: TransportadoraLegalRepData) => void
}

const defaultLegalRepData: TransportadoraLegalRepData = {
    legal_rep_name: "",
    legal_rep_cpf: "",
    legal_rep_rg: "",
    legal_rep_email: "",
    legal_rep_phone: "",
}

/**
 * Componente para gerenciar dados do representante legal da transportadora
 */
export function TransportadoraLegalRepSection({
    transportadoraId: carrierId,
    isEditing,
    initialData,
    onSave,
}: TransportadoraLegalRepSectionProps) {
    const [formData, setFormData] = useState<TransportadoraLegalRepData>(initialData || defaultLegalRepData)
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [cnhDocument, setCnhDocument] = useState<{ file_url?: string; file_name?: string } | null>(null)
    const [fileToUpload, setFileToUpload] = useState<File | null>(null)
    const [uploading, setUploading] = useState(false) // Mantido para compatibilidade visual, mas controlado pelo save

    const { upload } = useFileUpload({
        bucket: "documentos-transportadora",
        maxSize: 10,
    })

    // Carregar dados existentes
    const loadData = useCallback(async () => {
        if (!carrierId) return

        setLoading(true)
        try {
            // Carregar dados do representante legal
            const response = await fetch(`/api/admin/carriers/${carrierId}`)
            if (response.ok) {
                const data = await response.json()
                if (data) {
                    setFormData({
                        legal_rep_name: data.legal_rep_name || "",
                        legal_rep_cpf: data.legal_rep_cpf || "",
                        legal_rep_rg: data.legal_rep_rg || "",
                        legal_rep_email: data.legal_rep_email || "",
                        legal_rep_phone: data.legal_rep_phone || "",
                    })
                }
            }

            // Carregar CNH do representante legal
            const docsResponse = await fetch(`/api/admin/carriers/${carrierId}/documents`)
            if (docsResponse.ok) {
                const docs = await docsResponse.json()
                const cnhDoc = docs?.find((d: { document_type: string }) => d.document_type === "legal_rep_cnh")
                if (cnhDoc) {
                    setCnhDocument({ file_url: cnhDoc.file_url, file_name: cnhDoc.file_name })
                }
            }
        } catch (error) {
            console.error("Erro ao carregar dados:", error)
        } finally {
            setLoading(false)
        }
    }, [carrierId])

    useEffect(() => {
        if (carrierId && isEditing && !initialData) {
            loadData()
        }
    }, [carrierId, isEditing, initialData, loadData])

    useEffect(() => {
        if (initialData) {
            setFormData(initialData)
        }
    }, [initialData])

    const processUpload = async (): Promise<boolean> => {
        if (!fileToUpload || !carrierId) return true

        setUploading(true)
        try {
            const result = await upload(fileToUpload, carrierId, "legal_rep_cnh")
            if (!result) return false

            const response = await fetch(`/api/admin/carriers/${carrierId}/documents`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    document_type: "legal_rep_cnh",
                    file_url: result.url,
                    file_name: result.name,
                    file_size: result.size,
                    file_type: result.type,
                    status: "valid",
                }),
            })

            if (!response.ok) {
                throw new Error("Erro ao salvar documento CNH")
            }

            setCnhDocument({ file_url: result.url, file_name: result.name })
            setFileToUpload(null)
            return true
        } catch (error) {
            console.error(error)
            notifyError(error, "Erro ao enviar CNH")
            return false
        } finally {
            setUploading(false)
        }
    }

    const handleSave = async () => {
        if (!carrierId) {
            notifyError(new Error("Salve a transportadora primeiro"), "Erro")
            return
        }

        setSaving(true)
        try {
            // 1. Processar upload se houver
            if (fileToUpload) {
                const uploadSuccess = await processUpload()
                if (!uploadSuccess) {
                    setSaving(false)
                    return // Para aqui se o upload falhar
                }
            }

            // 2. Salvar dados cadastrais
            const response = await fetch(`/api/admin/transportadoras/update?id=${carrierId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                throw new Error(errorData.message || errorData.error || "Erro ao salvar dados do representante")
            }

            notifySuccess("Dados do representante salvos com sucesso!")
            if (onSave) onSave(formData)
        } catch (error) {
            notifyError(error, "Erro ao salvar")
        } finally {
            setSaving(false)
        }
    }

    const formatCPF = (value: string) => {
        return value
            .replace(/\D/g, '')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d{1,2})/, '$1-$2')
            .replace(/(-\d{2})\d+?$/, '$1')
    }

    const formatPhone = (value: string) => {
        return value
            .replace(/\D/g, '')
            .replace(/(\d{2})(\d)/, '($1) $2')
            .replace(/(\d{5})(\d)/, '$1-$2')
            .replace(/(-\d{4})\d+?$/, '$1')
    }

    if (!isEditing || !carrierId) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Salve a transportadora primeiro para adicionar dados do representante</p>
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
                    <User className="h-4 w-4" />
                    Dados do Representante Legal
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2 sm:col-span-2">
                        <Label>Nome Completo *</Label>
                        <Input
                            value={formData.legal_rep_name || ""}
                            onChange={(e) => setFormData({ ...formData, legal_rep_name: e.target.value })}
                            placeholder="Nome completo do representante"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>CPF *</Label>
                        <Input
                            value={formData.legal_rep_cpf || ""}
                            onChange={(e) => setFormData({ ...formData, legal_rep_cpf: formatCPF(e.target.value) })}
                            placeholder="000.000.000-00"
                            maxLength={14}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>RG</Label>
                        <Input
                            value={formData.legal_rep_rg || ""}
                            onChange={(e) => setFormData({ ...formData, legal_rep_rg: e.target.value })}
                            placeholder="Número do RG"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>E-mail</Label>
                        <Input
                            type="email"
                            value={formData.legal_rep_email || ""}
                            onChange={(e) => setFormData({ ...formData, legal_rep_email: e.target.value })}
                            placeholder="email@exemplo.com"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Telefone</Label>
                        <Input
                            value={formData.legal_rep_phone || ""}
                            onChange={(e) => setFormData({ ...formData, legal_rep_phone: formatPhone(e.target.value) })}
                            placeholder="(00) 00000-0000"
                            maxLength={15}
                        />
                    </div>
                </div>
            </Card>

            {/* CNH do Representante Legal */}
            <Card className="p-4 space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    CNH do Representante Legal
                </h4>

                {cnhDocument?.file_url ? (
                    <div className="space-y-4">
                        <DocumentCard
                            documentType="legal_rep_cnh"
                            documentLabel={TRANSPORTADORA_DOCUMENT_LABELS.legal_rep_cnh}
                            fileUrl={cnhDocument.file_url}
                            fileName={cnhDocument.file_name}
                            status="valid"
                            required
                        />
                        <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive w-full sm:w-auto"
                            onClick={() => setCnhDocument(null)}
                        >
                            Substituir CNH
                        </Button>
                    </div>
                ) : (
                    <FileUpload
                        manual
                        onFileSelect={setFileToUpload}
                        onUpload={async () => null}
                        disabled={uploading || saving}
                        label="Arraste a CNH ou clique para selecionar"
                        maxSize={10}
                        currentFileName={fileToUpload?.name}
                    />
                )}
            </Card>

            <div className="flex justify-end gap-2">
                <Button
                    variant="outline"
                    onClick={loadData}
                    disabled={loading || saving}
                >
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                    Recarregar
                </Button>
                <Button
                    onClick={handleSave}
                    disabled={saving || (uploading && !fileToUpload)}
                >
                    {saving || uploading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                        <Save className="h-4 w-4 mr-2" />
                    )}
                    {fileToUpload ? "Salvar Dados e Enviar CNH" : "Salvar Dados"}
                </Button>
            </div>
        </div>
    )
}

export default TransportadoraLegalRepSection
