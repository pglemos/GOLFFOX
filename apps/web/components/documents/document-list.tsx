"use client"

import { FileText, Calendar, DollarSign, ExternalLink, AlertCircle } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { formatDate, formatCurrency } from "@/lib/utils"

interface Document {
    id: string
    document_type: string
    status: string
    expiry_date?: string
    file_url?: string
    document_number?: string
    value_brl?: number
    insurance_company?: string
    policy_number?: string
}

interface DocumentListProps {
    documents: Document[]
    getDaysToExpiry: (date: string) => number | null
}

export function DocumentList({ documents, getDaysToExpiry }: DocumentListProps) {
    return (
        <div className="relative">
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border"></div>
            <div className="space-y-6">
                {documents
                    .sort((a, b) => {
                        const dateA = a.expiry_date ? new Date(a.expiry_date).getTime() : 0
                        const dateB = b.expiry_date ? new Date(b.expiry_date).getTime() : 0
                        return dateB - dateA
                    })
                    .map((doc) => {
                        const daysToExpiry = getDaysToExpiry(doc.expiry_date || '')
                        const isExpiring = daysToExpiry !== null && daysToExpiry < 30

                        return (
                            <div key={doc.id} className="relative pl-12">
                                <div className={`absolute left-4 top-6 w-4 h-4 rounded-full border-2 ${doc.status === 'expired' ? 'bg-error border-error' :
                                    isExpiring ? 'bg-warning border-warning' :
                                        'bg-success border-success'
                                    }`}></div>

                                <Card className="p-4 hover:shadow-lg transition-shadow">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-3">
                                                <FileText className="h-5 w-5 text-brand" />
                                                <h3 className="font-bold uppercase">{doc.document_type}</h3>
                                                <Badge variant={doc.status === 'valid' ? 'default' : doc.status === 'expired' ? 'destructive' : 'secondary'}>
                                                    {doc.status === 'valid' ? 'Válido' : doc.status === 'expired' ? 'Vencido' : 'Pendente'}
                                                </Badge>
                                                {isExpiring && (
                                                    <Badge variant={daysToExpiry! < 0 ? 'destructive' : 'outline'} className={daysToExpiry! >= 0 ? 'border-warning text-warning' : ''}>
                                                        {daysToExpiry! < 0 ? `Vencido há ${Math.abs(daysToExpiry!)} dias` : `${daysToExpiry} dias restantes`}
                                                    </Badge>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-ink-muted">
                                                {doc.document_number && <div><span className="font-medium">Número:</span> {doc.document_number}</div>}
                                                {doc.expiry_date && (
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="h-4 w-4" />
                                                        <span>Vence em: {formatDate(doc.expiry_date)}</span>
                                                    </div>
                                                )}
                                                {doc.value_brl && <div><span className="font-medium">Valor:</span> {formatCurrency(parseFloat(doc.value_brl.toString()))}</div>}
                                            </div>

                                            {doc.file_url && (
                                                <div className="mt-3 pt-3 border-t border-border">
                                                    <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-brand hover:underline">
                                                        <ExternalLink className="h-4 w-4" />
                                                        Ver documento completo
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        )
                    })}
            </div>
        </div>
    )
}
