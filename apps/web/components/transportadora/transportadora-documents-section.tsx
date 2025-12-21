"use client"

import { DocumentsSection } from "@/components/shared/documents-section"

interface TransportadoraDocumentsSectionProps {
    transportadoraId: string | undefined
    isEditing: boolean
    compact?: boolean
}

/**
 * Componente para gerenciar documentos de uma transportadora
 * Wrapper que usa o componente genérico DocumentsSection
 */
export function TransportadoraDocumentsSection({
    transportadoraId,
    isEditing,
    compact = false,
}: TransportadoraDocumentsSectionProps) {
    return (
        <DocumentsSection
            entityType="transportadora"
            entityId={transportadoraId}
            isEditing={isEditing}
            compact={compact}
        />
    )
}

export default TransportadoraDocumentsSection
