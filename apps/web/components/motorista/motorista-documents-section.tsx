"use client"

import { useState, useEffect, useCallback } from "react"
import { Loader2, FileText, RefreshCw, User, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { FileUpload } from "@/components/ui/file-upload"
import { DocumentCard } from "@/components/ui/document-card"
import { useFileUpload } from "@/hooks/use-file-upload"
import { notifySuccess, notifyError } from "@/lib/toast"
import {
    MotoristaDocumentType,
    MOTORISTA_DOCUMENT_LABELS,
    DRIVER_DOCS_WITH_EXPIRY,
    REQUIRED_MOTORISTA_DOCUMENTS,
    MotoristaDocument,
} from "@/types/documents"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

interface MotoristaDocumentsSectionProps {
    motoristaId: string | undefined
    isEditing: boolean
    compact?: boolean
}

/**
 * Componente para gerenciar documentos de um motorista
 */
export function MotoristaDocumentsSection({
    motoristaId: driverId,
    isEditing,
    compact = false,
}: MotoristaDocumentsSectionProps) {
    const [documents, setDocuments] = useState<MotoristaDocument[]>([])
    const [loading, setLoading] = useState(false)
    const [selectedType, setSelectedType] = useState<MotoristaDocumentType>("cnh")
    const [expiryDate, setExpiryDate] = useState("")
    const [documentNumber, setDocumentNumber] = useState("")
    const [fileToUpload, setFileToUpload] = useState<File | null>(null)
    const [uploading, setUploading] = useState(false)

    const { upload } = useFileUpload({
        bucket: "motorista-documents",
        maxSize: 10,
    })

    const loadDocuments = useCallback(async () => {
        if (!driverId) return

        setLoading(true)
        try {
            const response = await fetch(`/api/admin/motoristas/${driverId}/documents`)
            if (response.ok) {
                const data = await response.json()
                setDocuments(data || [])
            }
        } catch (error) {
            console.error("Erro ao carregar documentos:", error)
        } finally {
            setLoading(false)
        }
    }, [driverId])

    useEffect(() => {
        if (driverId && isEditing) {
            loadDocuments()
        }
    }, [driverId, isEditing, loadDocuments])

    const handleManualSave = async () => {
        if (!driverId) {
            notifyError(new Error("Salve o motorista primeiro"), "Erro")
            return
        }

        if (!fileToUpload) {
            notifyError(new Error("Selecione um arquivo"), "Erro")
            return
        }

        setUploading(true)
        try {
            const result = await upload(fileToUpload, driverId, selectedType)
            if (!result) return

            const response = await fetch(`/api/admin/motoristas/${driverId}/documents`, {
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
            setFileToUpload(null)
        } catch (error) {
            notifyError(error, "Erro ao enviar documento")
        } finally {
            setUploading(false)
        }
    }

    const handleDelete = async (documentId: string) => {
        if (!driverId) return

        try {
            const response = await fetch(
                `/api/admin/motoristas/${driverId}/documents?documentId=${documentId}`,
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

    const getDocumentByType = (type: MotoristaDocumentType) => {
        return documents.find((d) => d.document_type === type)
    }

    const documentTypes = Object.keys(MOTORISTA_DOCUMENT_LABELS) as MotoristaDocumentType[]

    if (!isEditing || !driverId) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Salve o motorista primeiro para adicionar documentos</p>
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

    if (compact) {
        return (
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <h4 className="font-medium">Documentos do Motorista</h4>
                    <Button size="sm" variant="outline" onClick={loadDocuments} disabled={loading}>
                        <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                    </Button>
                </div>

                {REQUIRED_MOTORISTA_DOCUMENTS.map((type) => {
                    const doc = getDocumentByType(type)
                    return (
                        <DocumentCard
                            key={type}
                            documentType={type}
                            documentLabel={MOTORISTA_DOCUMENT_LABELS[type]}
                            fileUrl={doc?.file_url}
                            fileName={doc?.file_name}
                            expiryDate={doc?.expiry_date}
                            status={doc?.status}
                            required={true}
                            onDelete={doc ? () => handleDelete(doc.id) : undefined}
                            compact
                        />
                    )
                })}
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Formulário de Upload */}
            <div className="border rounded-lg p-4 space-y-4 bg-muted/20">
                <h4 className="font-medium flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Adicionar/Atualizar Documento
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Tipo de Documento</Label>
                        <Select
                            value={selectedType}
                            onValueChange={(v) => setSelectedType(v as MotoristaDocumentType)}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {documentTypes.map((type) => (
                                    <SelectItem key={type} value={type}>
                                        {MOTORISTA_DOCUMENT_LABELS[type]}
                                        {REQUIRED_MOTORISTA_DOCUMENTS.includes(type) && " *"}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Número do Documento (opcional)</Label>
                        <Input
                            value={documentNumber}
                            onChange={(e) => setDocumentNumber(e.target.value)}
                            placeholder="Ex: 123456789"
                        />
                    </div>

                    {DRIVER_DOCS_WITH_EXPIRY.includes(selectedType) && (
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
                    manual
                    onFileSelect={setFileToUpload}
                    onUpload={async () => null}
                    disabled={uploading}
                    label="Arraste o documento ou clique para selecionar"
                    maxSize={10}
                    currentFileName={fileToUpload?.name}
                />

                <div className="flex justify-end mt-4">
                    <Button
                        onClick={handleManualSave}
                        disabled={!fileToUpload || uploading}
                    >
                        {uploading ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                            <Save className="h-4 w-4 mr-2" />
                        )}
                        Salvar Documento
                    </Button>
                </div>
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
                                documentLabel={MOTORISTA_DOCUMENT_LABELS[doc.document_type as MotoristaDocumentType] || doc.document_type}
                                fileUrl={doc.file_url}
                                fileName={doc.file_name}
                                fileSize={doc.file_size}
                                expiryDate={doc.expiry_date}
                                status={doc.status}
                                documentNumber={doc.document_number}
                                required={REQUIRED_MOTORISTA_DOCUMENTS.includes(doc.document_type as MotoristaDocumentType)}
                                onDelete={() => handleDelete(doc.id)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default DriverDocumentsSection
