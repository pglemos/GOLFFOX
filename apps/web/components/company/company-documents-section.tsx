"use client"

import { DocumentsSection } from "@/components/shared/documents-section"

interface CompanyDocumentsSectionProps {
    companyId: string | undefined
    isEditing: boolean
    compact?: boolean
}

/**
 * Componente para gerenciar documentos de uma empresa
 * Wrapper que usa o componente genérico DocumentsSection
 */
export function CompanyDocumentsSection({
    companyId,
    isEditing,
    compact = false,
}: CompanyDocumentsSectionProps) {
    return (
        <DocumentsSection
            entityType="company"
            entityId={companyId}
            isEditing={isEditing}
            compact={compact}
        />
    )
}

export default CompanyDocumentsSection
