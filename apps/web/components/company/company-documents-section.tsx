"use client"

import { useState, useEffect, useCallback } from "react"
import { Loader2, FileText, RefreshCw, Briefcase } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { FileUpload } from "@/components/ui/file-upload"
import { DocumentCard } from "@/components/ui/document-card"
import { useFileUpload } from "@/hooks/use-file-upload"
import { notifySuccess, notifyError } from "@/lib/toast"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

// Tipos de documentos da empresa
type CompanyDocumentType =
    | 'cnpj_card'
    | 'social_contract'
    | 'operating_license'
    | 'state_registration'
    | 'municipal_registration'
    | 'insurance_certificate'
    | 'environmental_license'
    | 'power_attorney'
    | 'other'

const COMPANY_DOCUMENT_LABELS: Record<CompanyDocumentType, string> = {
    cnpj_card: 'Cartão CNPJ',
    social_contract: 'Contrato Social',
    operating_license: 'Alvará de Funcionamento',
    state_registration: 'Inscrição Estadual',
    municipal_registration: 'Inscrição Municipal',
    insurance_certificate: 'Certificado de Seguro',
    environmental_license: 'Licença Ambiental',
    power_attorney: 'Procuração',
    other: 'Outro Documento',
}

const COMPANY_DOCS_WITH_EXPIRY: CompanyDocumentType[] = [
    'operating_license',
    'insurance_certificate',
    'environmental_license',
]

interface CompanyDocument {
    id: string
    company_id: string
    document_type: CompanyDocumentType
    document_number?: string | null
    expiry_date?: string | null
    file_url?: string | null
    file_name?: string | null
    file_size?: number | null
    file_type?: string | null
    status: string
    created_at: string
}

interface CompanyDocumentsSectionProps {
    companyId: string | undefined
    isEditing: boolean
    compact?: boolean
}

/**
 * Componente para gerenciar documentos de uma empresa
 */
export function CompanyDocumentsSection({
    companyId,
    isEditing,
    compact = false,
}: CompanyDocumentsSectionProps) {
    const [documents, setDocuments] = useState<CompanyDocument[]>([])
    const [loading, setLoading] = useState(false)
    const [selectedType, setSelectedType] = useState<CompanyDocumentType>("cnpj_card")
    const [expiryDate, setExpiryDate] = useState("")
    const [documentNumber, setDocumentNumber] = useState("")
    const [uploading, setUploading] = useState(false)

    const { upload } = useFileUpload({
        bucket: "company-documents",
        maxSize: 10,
    })

    const loadDocuments = useCallback(async () => {
        if (!companyId) return

        setLoading(true)
        try {
            const response = await fetch(`/api/admin/companies/${companyId}/documents`)
            if (response.ok) {
                const data = await response.json()
                setDocuments(data || [])
            }
        } catch (error) {
            console.error("Erro ao carregar documentos:", error)
        } finally {
            setLoading(false)
        }
    }, [companyId])

    useEffect(() => {
        if (companyId && isEditing) {
            loadDocuments()
        }
    }, [companyId, isEditing, loadDocuments])

    const handleUpload = async (file: File): Promise<string | null> => {
        if (!companyId) {
            notifyError(new Error("Salve a empresa primeiro"), "Erro")
            return null
        }

        setUploading(true)
        try {
            const result = await upload(file, companyId, selectedType)
            if (!result) return null

            const response = await fetch(`/api/admin/companies/${companyId}/documents`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    document_type: selectedType,
                    document_number: documentNumber || null,
                    expiry_date: expiryDate || null,
                    file_url: result.url,
                    file_name: result.name,
                    file_size: result.size,
                    file_type: result.type,
                    status: "valid",
                }),
            })

            if (!response.ok) {
                throw new Error("Erro ao salvar documento")
            }

            notifySuccess("Documento salvo com sucesso!")
            await loadDocuments()
            setDocumentNumber("")
            setExpiryDate("")

            return result.url
        } catch (error) {
            notifyError(error, "Erro ao enviar documento")
            return null
        } finally {
            setUploading(false)
        }
    }

    const handleDelete = async (documentId: string) => {
        if (!companyId) return

        try {
            const response = await fetch(
                `/api/admin/companies/${companyId}/documents?documentId=${documentId}`,
                { method: "DELETE" }
            )

            if (!response.ok) {
                throw new Error("Erro ao remover documento")
            }

            notifySuccess("Documento removido!")
            await loadDocuments()
        } catch (error) {
            notifyError(error, "Erro ao remover documento")
        }
    }

    const documentTypes = Object.keys(COMPANY_DOCUMENT_LABELS) as CompanyDocumentType[]

    if (!isEditing || !companyId) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Salve a empresa primeiro para adicionar documentos</p>
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
            {/* Formulário de Upload */}
            <div className="border rounded-lg p-4 space-y-4 bg-muted/20">
                <h4 className="font-medium flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Adicionar Documento
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Tipo de Documento</Label>
                        <Select
                            value={selectedType}
                            onValueChange={(v) => setSelectedType(v as CompanyDocumentType)}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {documentTypes.map((type) => (
                                    <SelectItem key={type} value={type}>
                                        {COMPANY_DOCUMENT_LABELS[type]}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Número (opcional)</Label>
                        <Input
                            value={documentNumber}
                            onChange={(e) => setDocumentNumber(e.target.value)}
                            placeholder="Ex: 123456789"
                        />
                    </div>

                    {COMPANY_DOCS_WITH_EXPIRY.includes(selectedType) && (
                        <div className="space-y-2">
                            <Label>Data de Vencimento</Label>
                            <Input
                                type="date"
                                value={expiryDate}
                                onChange={(e) => setExpiryDate(e.target.value)}
                            />
                        </div>
                    )}
                </div>

                <FileUpload
                    onUpload={handleUpload}
                    disabled={uploading}
                    label="Arraste o documento ou clique para enviar"
                    maxSize={10}
                />
            </div>

            {/* Lista de Documentos */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h4 className="font-medium">Documentos Enviados ({documents.length})</h4>
                    <Button size="sm" variant="ghost" onClick={loadDocuments} disabled={loading}>
                        <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                        Atualizar
                    </Button>
                </div>

                {documents.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                        <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>Nenhum documento enviado ainda</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {documents.map((doc) => (
                            <DocumentCard
                                key={doc.id}
                                documentType={doc.document_type}
                                documentLabel={COMPANY_DOCUMENT_LABELS[doc.document_type as CompanyDocumentType] || doc.document_type}
                                fileUrl={doc.file_url}
                                fileName={doc.file_name}
                                fileSize={doc.file_size}
                                expiryDate={doc.expiry_date}
                                status={doc.status as any}
                                documentNumber={doc.document_number}
                                onDelete={() => handleDelete(doc.id)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default CompanyDocumentsSection
