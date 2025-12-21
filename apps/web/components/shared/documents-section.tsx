"use client"

import { FileText, RefreshCw, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { FileUpload } from "@/components/ui/file-upload"
import { DocumentCard } from "@/components/ui/document-card"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { useDocuments } from "@/hooks/use-documents"
import { EntityType } from "@/lib/documents-config"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

interface DocumentsSectionProps {
    entityType: EntityType
    entityId: string | undefined
    isEditing: boolean
    compact?: boolean
}

/**
 * Componente genérico para gerenciar documentos de qualquer entidade
 * 
 * @example
 * <DocumentsSection
 *   entityType="transportadora"
 *   entityId={transportadoraId}
 *   isEditing={true}
 * />
 */
export function DocumentsSection({
    entityType,
    entityId,
    isEditing,
    compact = false,
}: DocumentsSectionProps) {
    const {
        documents,
        loading,
        uploading,
        selectedType,
        setSelectedType,
        expiryDate,
        setExpiryDate,
        documentNumber,
        setDocumentNumber,
        fileToUpload,
        setFileToUpload,
        loadDocuments,
        handleSave,
        handleDelete,
        getDocumentByType,
        documentTypes,
        config,
    } = useDocuments({
        entityType,
        entityId,
        isEditing,
    })

    const PlaceholderIcon = config.placeholderIcon

    if (!isEditing || !entityId) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                <PlaceholderIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>{config.placeholderMessage}</p>
            </div>
        )
    }

    if (loading) {
        return (
            <div className="py-8">
                <LoadingSpinner size="md" />
            </div>
        )
    }

    // Modo compacto
    if (compact) {
        const typesToShow = entityType === "transportadora" 
            ? documentTypes.slice(0, 6)
            : entityType === "motorista"
            ? config.requiredDocuments
            : documentTypes

        return (
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <h4 className="font-medium">Documentos da {config.entityName}</h4>
                    <Button size="sm" variant="outline" onClick={loadDocuments} disabled={loading}>
                        <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                    </Button>
                </div>

                {typesToShow.map((type) => {
                    const doc = getDocumentByType(type)
                    const isRequired = config.requiredDocuments.includes(type)

                    return (
                        <DocumentCard
                            key={type}
                            documentType={type}
                            documentLabel={config.documentLabels[type] || type}
                            fileUrl={doc?.file_url}
                            fileName={doc?.file_name}
                            expiryDate={doc?.expiry_date}
                            status={doc?.status}
                            required={isRequired}
                            onDelete={doc ? () => handleDelete(doc.id) : undefined}
                            compact
                        />
                    )
                })}
            </div>
        )
    }

    // Modo completo
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
                            onValueChange={setSelectedType}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {documentTypes.map((type) => (
                                    <SelectItem key={type} value={type}>
                                        {config.documentLabels[type] || type}
                                        {config.requiredDocuments.includes(type) && " *"}
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

                    {config.docsWithExpiry.includes(selectedType) && (
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

                <div className="flex justify-end">
                    <Button
                        onClick={handleSave}
                        disabled={!fileToUpload || uploading}
                    >
                        {uploading ? (
                            <LoadingSpinner size="sm" variant="inline" />
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
                    <h4 className="font-medium">
                        Documentos Enviados ({documents.filter(d => {
                            // Para transportadora, filtrar legal_rep_cnh
                            if (entityType === "transportadora") {
                                return d.document_type !== 'legal_rep_cnh'
                            }
                            return true
                        }).length})
                    </h4>
                    <Button size="sm" variant="ghost" onClick={loadDocuments} disabled={loading}>
                        <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                        Atualizar
                    </Button>
                </div>

                {documents.filter(d => {
                    if (entityType === "transportadora") {
                        return d.document_type !== 'legal_rep_cnh'
                    }
                    return true
                }).length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                        <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>Nenhum documento enviado ainda</p>
                        {entityType === "veiculo" && (
                            <p className="text-xs mt-1">
                                Documentos obrigatórios: {config.requiredDocuments.map((t) => config.documentLabels[t]).join(", ")}
                            </p>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {documents.filter(d => {
                            if (entityType === "transportadora") {
                                return d.document_type !== 'legal_rep_cnh'
                            }
                            return true
                        }).map((doc) => (
                            <DocumentCard
                                key={doc.id}
                                documentType={doc.document_type}
                                documentLabel={config.documentLabels[doc.document_type] || doc.document_type}
                                fileUrl={doc.file_url}
                                fileName={doc.file_name}
                                fileSize={doc.file_size}
                                expiryDate={doc.expiry_date}
                                status={doc.status}
                                documentNumber={doc.document_number}
                                required={config.requiredDocuments.includes(doc.document_type)}
                                onDelete={() => handleDelete(doc.id)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default DocumentsSection

