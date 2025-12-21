"use client"

import { DocumentsSection } from "@/components/shared/documents-section"

interface VeiculoDocumentsSectionProps {
    veiculoId: string | undefined
    isEditing: boolean
    compact?: boolean
}

/**
 * Componente para gerenciar documentos de um veículo
 * Wrapper que usa o componente genérico DocumentsSection
 */
export function VeiculoDocumentsSection({
    veiculoId,
    isEditing,
    compact = false,
}: VeiculoDocumentsSectionProps) {
    return (
        <DocumentsSection
            entityType="veiculo"
            entityId={veiculoId}
            isEditing={isEditing}
            compact={compact}
        />
    )
}

export default VeiculoDocumentsSection
