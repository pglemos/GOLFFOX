"use client"

import { DocumentsSection } from "@/components/shared/documents-section"

interface MotoristaDocumentsSectionProps {
    motoristaId: string | undefined
    isEditing: boolean
    compact?: boolean
}

/**
 * Componente para gerenciar documentos de um motorista
 * Wrapper que usa o componente genérico DocumentsSection
 */
export function MotoristaDocumentsSection({
    motoristaId,
    isEditing,
    compact = false,
}: MotoristaDocumentsSectionProps) {
    return (
        <DocumentsSection
            entityType="motorista"
            entityId={motoristaId}
            isEditing={isEditing}
            compact={compact}
        />
    )
}

export default MotoristaDocumentsSection
