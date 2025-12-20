"use client"

import { useState } from "react"
import {
    FileText,
    Image as ImageIcon,
    Eye,
    Trash2,
    AlertTriangle,
    CheckCircle2,
    Clock,
    XCircle
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
    DocumentStatus,
    AlertLevel,
    STATUS_LABELS,
} from "@/types/documents"
import { isImageFile, formatFileSize } from "@/hooks/use-file-upload"

/**
 * Props do componente DocumentCard
 */
export interface DocumentCardProps {
    documentType: string
    documentLabel: string
    fileUrl?: string | null
    fileName?: string | null
    fileSize?: number | null
    expiryDate?: string | null
    status?: DocumentStatus
    alertLevel?: AlertLevel
    documentNumber?: string | null
    notes?: string | null
    required?: boolean
    onDelete?: () => void
    onView?: () => void
    disabled?: boolean
    className?: string
    compact?: boolean
}

function calculateAlertLevel(expiryDate: string | null | undefined): AlertLevel {
    if (!expiryDate) return 'ok'

    const expiry = new Date(expiryDate)
    const today = new Date()
    const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays < 0) return 'expired'
    if (diffDays <= 30) return 'critical'
    if (diffDays <= 60) return 'warning'
    return 'ok'
}

function formatDate(dateString: string | null | undefined): string {
    if (!dateString) return 'Não informada'
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR')
}

function getDaysToExpiry(expiryDate: string | null | undefined): number | null {
    if (!expiryDate) return null
    const expiry = new Date(expiryDate)
    const today = new Date()
    return Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

export function DocumentCard({
    documentType,
    documentLabel,
    fileUrl,
    fileName,
    fileSize,
    expiryDate,
    status = 'valid',
    alertLevel: alertLevelProp,
    documentNumber,
    notes,
    required = false,
    onDelete,
    onView,
    disabled = false,
    className,
    compact = false,
}: DocumentCardProps) {
    const [deleting, setDeleting] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)

    const alertLevel = alertLevelProp || calculateAlertLevel(expiryDate)
    const daysToExpiry = getDaysToExpiry(expiryDate)
    const hasFile = !!fileUrl
    const FileIcon = fileUrl && isImageFile(fileUrl) ? ImageIcon : FileText

    const statusConfig: Record<DocumentStatus, { color: string; icon: typeof CheckCircle2 }> = {
        valid: { color: 'text-success bg-success-light border-success-light', icon: CheckCircle2 },
        expired: { color: 'text-error bg-error-light border-error-light', icon: XCircle },
        pending: { color: 'text-warning bg-warning-light border-warning-light', icon: Clock },
        rejected: { color: 'text-error bg-error-light border-error-light', icon: XCircle },
    }

    const alertConfig: Record<AlertLevel, { color: string; bgColor: string }> = {
        ok: { color: 'text-success', bgColor: 'bg-success-light' },
        warning: { color: 'text-warning', bgColor: 'bg-warning-light' },
        critical: { color: 'text-brand', bgColor: 'bg-brand-light' },
        expired: { color: 'text-error', bgColor: 'bg-error-light' },
    }

    const handleDelete = async () => {
        if (!onDelete) return
        setDeleting(true)
        try {
            await onDelete()
        } finally {
            setDeleting(false)
            setShowConfirm(false)
        }
    }

    const handleView = () => {
        if (onView) {
            onView()
        } else if (fileUrl) {
            window.open(fileUrl, '_blank')
        }
    }

    // Modo compacto
    if (compact) {
        return (
            <div className={cn(
                "flex items-center justify-between p-3 rounded-lg border",
                hasFile ? "bg-card" : "bg-muted/30 border-dashed",
                className
            )}>
                <div className="flex items-center gap-3 min-w-0">
                    <div className={cn(
                        "h-8 w-8 rounded flex items-center justify-center",
                        hasFile ? "bg-primary/10" : "bg-muted"
                    )}>
                        <FileIcon className={cn(
                            "h-4 w-4",
                            hasFile ? "text-primary" : "text-muted-foreground"
                        )} />
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                            {documentLabel}
                            {required && <span className="text-destructive ml-1">*</span>}
                        </p>
                        {hasFile && expiryDate && (
                            <p className={cn("text-xs", alertConfig[alertLevel].color)}>
                                Vence: {formatDate(expiryDate)}
                            </p>
                        )}
                        {!hasFile && (
                            <p className="text-xs text-muted-foreground">Não enviado</p>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    {hasFile && (
                        <>
                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleView}>
                                <Eye className="h-4 w-4" />
                            </Button>
                            {onDelete && (
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8 text-destructive"
                                    onClick={handleDelete}
                                    disabled={deleting}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            )}
                        </>
                    )}
                </div>
            </div>
        )
    }

    // Modo completo (card)
    return (
        <Card className={cn(
            "overflow-hidden transition-all",
            !hasFile && "border-dashed bg-muted/20",
            className
        )}>
            {/* Header */}
            <div className="flex items-start justify-between p-4 pb-2">
                <div className="flex items-center gap-3">
                    <div className={cn(
                        "h-10 w-10 rounded-lg flex items-center justify-center",
                        hasFile ? "bg-primary/10" : "bg-muted"
                    )}>
                        <FileIcon className={cn(
                            "h-5 w-5",
                            hasFile ? "text-primary" : "text-muted-foreground"
                        )} />
                    </div>
                    <div>
                        <h4 className="font-medium text-sm">
                            {documentLabel}
                            {required && <span className="text-destructive ml-1">*</span>}
                        </h4>
                        {documentNumber && (
                            <p className="text-xs text-muted-foreground">Nº: {documentNumber}</p>
                        )}
                    </div>
                </div>

                {/* Status Badge */}
                {hasFile && (
                    <Badge
                        variant="outline"
                        className={cn("text-xs", statusConfig[status].color)}
                    >
                        {STATUS_LABELS[status]}
                    </Badge>
                )}
            </div>

            {/* Content */}
            <div className="px-4 pb-3 space-y-2">
                {hasFile ? (
                    <>
                        {/* Preview para imagens */}
                        {fileUrl && isImageFile(fileUrl) && (
                            <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={fileUrl}
                                    alt={documentLabel}
                                    className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                    onClick={handleView}
                                />
                            </div>
                        )}

                        {/* Info do arquivo */}
                        <div className="text-xs text-muted-foreground space-y-1">
                            {fileName && (
                                <p className="truncate" title={fileName}>{fileName}</p>
                            )}
                            {fileSize && (
                                <p>{formatFileSize(fileSize)}</p>
                            )}
                        </div>

                        {/* Data de vencimento */}
                        {expiryDate && (
                            <div className={cn(
                                "flex items-center gap-2 p-2 rounded-md text-xs",
                                alertConfig[alertLevel].bgColor
                            )}>
                                {alertLevel === 'ok' && <CheckCircle2 className={cn("h-4 w-4", alertConfig[alertLevel].color)} />}
                                {alertLevel === 'warning' && <AlertTriangle className={cn("h-4 w-4", alertConfig[alertLevel].color)} />}
                                {alertLevel === 'critical' && <AlertTriangle className={cn("h-4 w-4", alertConfig[alertLevel].color)} />}
                                {alertLevel === 'expired' && <XCircle className={cn("h-4 w-4", alertConfig[alertLevel].color)} />}
                                <span className={alertConfig[alertLevel].color}>
                                    {daysToExpiry !== null && daysToExpiry < 0
                                        ? `Vencido há ${Math.abs(daysToExpiry)} dias`
                                        : daysToExpiry === 0
                                            ? 'Vence hoje'
                                            : `Vence em ${daysToExpiry} dias (${formatDate(expiryDate)})`
                                    }
                                </span>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="py-4 text-center">
                        <p className="text-sm text-muted-foreground">
                            Documento não enviado
                        </p>
                        {required && (
                            <p className="text-xs text-destructive mt-1">
                                Este documento é obrigatório
                            </p>
                        )}
                    </div>
                )}

                {/* Notas */}
                {notes && (
                    <p className="text-xs text-muted-foreground italic">{notes}</p>
                )}
            </div>

            {/* Actions */}
            {hasFile && (
                <div className="flex items-center gap-2 px-4 pb-4">
                    <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={handleView}
                    >
                        <Eye className="h-4 w-4 mr-2" />
                        Visualizar
                    </Button>
                    {onDelete && (
                        <Button
                            size="sm"
                            variant="outline"
                            className="text-destructive border-destructive/30 hover:bg-destructive/10"
                            disabled={disabled || deleting}
                            onClick={handleDelete}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            )}
        </Card>
    )
}

export default DocumentCard
