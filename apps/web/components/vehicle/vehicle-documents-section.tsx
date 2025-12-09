"use client"

import { useState, useEffect, useCallback } from "react"
import { Loader2, FileText, AlertTriangle, RefreshCw, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { FileUpload } from "@/components/ui/file-upload"
import { DocumentCard } from "@/components/ui/document-card"
import { useFileUpload } from "@/hooks/use-file-upload"
import { notifySuccess, notifyError } from "@/lib/toast"
import {
    VehicleDocumentType,
    VEHICLE_DOCUMENT_LABELS,
    VEHICLE_DOCS_WITH_EXPIRY,
    REQUIRED_VEHICLE_DOCUMENTS,
    VehicleDocument,
} from "@/types/documents"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

interface VehicleDocumentsSectionProps {
    vehicleId: string | undefined
    isEditing: boolean
    compact?: boolean
}

/**
 * Componente para gerenciar documentos de um veículo
 */
export function VehicleDocumentsSection({
    vehicleId,
    isEditing,
    compact = false,
}: VehicleDocumentsSectionProps) {
    const [documents, setDocuments] = useState<VehicleDocument[]>([])
    const [loading, setLoading] = useState(false)
    const [selectedType, setSelectedType] = useState<VehicleDocumentType>("crlv")
    const [expiryDate, setExpiryDate] = useState("")
    const [documentNumber, setDocumentNumber] = useState("")
    const [fileToUpload, setFileToUpload] = useState<File | null>(null)
    const [uploading, setUploading] = useState(false)

    const { upload } = useFileUpload({
        bucket: "vehicle-documents",
        maxSize: 10,
    })

    const loadDocuments = useCallback(async () => {
        if (!vehicleId) return

        setLoading(true)
        try {
            const response = await fetch(`/api/admin/vehicles/${vehicleId}/documents`)
            if (response.ok) {
                const data = await response.json()
                setDocuments(data || [])
            }
        } catch (error) {
            console.error("Erro ao carregar documentos:", error)
        } finally {
            setLoading(false)
        }
    }, [vehicleId])

    useEffect(() => {
        if (vehicleId && isEditing) {
            loadDocuments()
        }
    }, [vehicleId, isEditing, loadDocuments])

    const handleManualSave = async () => {
        if (!vehicleId) {
            notifyError(new Error("Salve o veículo primeiro"), "Erro")
            return
        }

        if (!fileToUpload) {
            notifyError(new Error("Selecione um arquivo"), "Erro")
            return
        }

        setUploading(true)
        try {
            const result = await upload(fileToUpload, vehicleId, selectedType)
            if (!result) return

            const response = await fetch(`/api/admin/vehicles/${vehicleId}/documents`, {
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

            if (!response.ok) throw new Error("Erro ao salvar documento")

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
        if (!vehicleId) return

        try {
            const response = await fetch(
                `/api/admin/vehicles/${vehicleId}/documents?documentId=${documentId}`,
                { method: "DELETE" }
            )

            if (!response.ok) throw new Error("Erro ao remover documento")

            notifySuccess("Documento removido!")
            await loadDocuments()
        } catch (error) {
            notifyError(error, "Erro ao remover documento")
        }
    }

    const getDocumentByType = (type: VehicleDocumentType) => {
        return documents.find((d) => d.document_type === type)
    }

    const documentTypes = Object.keys(VEHICLE_DOCUMENT_LABELS) as VehicleDocumentType[]

    if (!isEditing || !vehicleId) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Salve o veículo primeiro para adicionar documentos</p>
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
                    <h4 className="font-medium">Documentos do Veículo</h4>
                    <Button size="sm" variant="outline" onClick={loadDocuments} disabled={loading}>
                        <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                    </Button>
                </div>

                {documentTypes.map((type) => {
                    const doc = getDocumentByType(type)
                    const isRequired = REQUIRED_VEHICLE_DOCUMENTS.includes(type)

                    return (
                        <DocumentCard
                            key={type}
                            documentType={type}
                            documentLabel={VEHICLE_DOCUMENT_LABELS[type]}
                            fileUrl={doc?.file_url}
                            fileName={doc?.file_name}
                            fileSize={doc?.file_size}
                            expiryDate={doc?.expiry_date}
                            status={doc?.status}
                            documentNumber={doc?.document_number}
                            required={isRequired}
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
                            onValueChange={(v) => setSelectedType(v as VehicleDocumentType)}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {documentTypes.map((type) => (
                                    <SelectItem key={type} value={type}>
                                        {VEHICLE_DOCUMENT_LABELS[type]}
                                        {REQUIRED_VEHICLE_DOCUMENTS.includes(type) && " *"}
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

                    {VEHICLE_DOCS_WITH_EXPIRY.includes(selectedType) && (
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
                        <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>Nenhum documento enviado ainda</p>
                        <p className="text-xs mt-1">
                            Documentos obrigatórios: {REQUIRED_VEHICLE_DOCUMENTS.map((t) => VEHICLE_DOCUMENT_LABELS[t]).join(", ")}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {documents.map((doc) => (
                            <DocumentCard
                                key={doc.id}
                                documentType={doc.document_type}
                                documentLabel={VEHICLE_DOCUMENT_LABELS[doc.document_type as VehicleDocumentType] || doc.document_type}
                                fileUrl={doc.file_url}
                                fileName={doc.file_name}
                                fileSize={doc.file_size}
                                expiryDate={doc.expiry_date}
                                status={doc.status}
                                documentNumber={doc.document_number}
                                required={REQUIRED_VEHICLE_DOCUMENTS.includes(doc.document_type as VehicleDocumentType)}
                                onDelete={() => handleDelete(doc.id)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default VehicleDocumentsSection
