"use client"

import { useState, useEffect, useCallback } from "react"
import { useFileUpload } from "@/hooks/use-file-upload"
import { notifySuccess, notifyError } from "@/lib/toast"
import { getDocumentsConfig, EntityType, getFilteredDocumentTypes } from "@/lib/documents-config"
import { BaseDocument } from "@/types/documents"

interface UseDocumentsOptions {
    entityType: EntityType
    entityId: string | undefined
    isEditing: boolean
}

interface UseDocumentsReturn {
    documents: BaseDocument[]
    loading: boolean
    uploading: boolean
    selectedType: string
    setSelectedType: (type: string) => void
    expiryDate: string
    setExpiryDate: (date: string) => void
    documentNumber: string
    setDocumentNumber: (number: string) => void
    fileToUpload: File | null
    setFileToUpload: (file: File | null) => void
    loadDocuments: () => Promise<void>
    handleSave: () => Promise<void>
    handleDelete: (documentId: string) => Promise<void>
    getDocumentByType: (type: string) => BaseDocument | undefined
    documentTypes: string[]
    config: ReturnType<typeof getDocumentsConfig>
}

/**
 * Hook para gerenciar documentos de qualquer entidade
 * 
 * @example
 * const {
 *   documents,
 *   loading,
 *   handleSave,
 *   handleDelete
 * } = useDocuments({
 *   entityType: 'transportadora',
 *   entityId: transportadoraId,
 *   isEditing: true
 * })
 */
export function useDocuments({
    entityType,
    entityId,
    isEditing,
}: UseDocumentsOptions): UseDocumentsReturn {
    const config = getDocumentsConfig(entityType)
    const documentTypes = getFilteredDocumentTypes(entityType)
    
    const [documents, setDocuments] = useState<BaseDocument[]>([])
    const [loading, setLoading] = useState(false)
    const [selectedType, setSelectedType] = useState<string>(documentTypes[0] || "")
    const [expiryDate, setExpiryDate] = useState("")
    const [documentNumber, setDocumentNumber] = useState("")
    const [fileToUpload, setFileToUpload] = useState<File | null>(null)
    const [uploading, setUploading] = useState(false)

    const { upload } = useFileUpload({
        bucket: config.bucket,
        maxSize: 10,
    })

    const loadDocuments = useCallback(async () => {
        if (!entityId) return

        setLoading(true)
        try {
            const response = await fetch(`${config.endpoint}/${entityId}/documents`)
            if (response.ok) {
                const data = await response.json()
                setDocuments(data || [])
            }
        } catch (error) {
            console.error("Erro ao carregar documentos:", error)
        } finally {
            setLoading(false)
        }
    }, [entityId, config.endpoint])

    useEffect(() => {
        if (entityId && isEditing) {
            loadDocuments()
        }
    }, [entityId, isEditing, loadDocuments])

    const handleSave = useCallback(async () => {
        if (!entityId) {
            notifyError(new Error(`Salve o ${config.entityNameSingular} primeiro`), "Erro")
            return
        }

        if (!fileToUpload) {
            notifyError(new Error("Selecione um arquivo"), "Erro")
            return
        }

        setUploading(true)
        try {
            const result = await upload(fileToUpload, entityId, selectedType)
            if (!result) return

            const response = await fetch(`${config.endpoint}/${entityId}/documents`, {
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
    }, [entityId, fileToUpload, selectedType, documentNumber, expiryDate, upload, config.endpoint, config.entityNameSingular, loadDocuments])

    const handleDelete = useCallback(async (documentId: string) => {
        if (!entityId) return

        try {
            const response = await fetch(
                `${config.endpoint}/${entityId}/documents?documentId=${documentId}`,
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
    }, [entityId, config.endpoint, loadDocuments])

    const getDocumentByType = useCallback((type: string) => {
        return documents.find((d) => d.document_type === type)
    }, [documents])

    return {
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
    }
}

