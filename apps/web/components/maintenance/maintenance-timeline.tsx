"use client"

import { Wrench, Calendar, Clock, Truck, DollarSign } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { formatDate } from "@/lib/utils"

interface Maintenance {
    id: string
    maintenance_type: string
    status: string
    description: string
    scheduled_date?: string
    completed_date?: string
    next_maintenance_date?: string
    odometer_km?: number
    workshop_name?: string
    mechanic_name?: string
    cost_parts_brl?: number
    cost_labor_brl?: number
}

interface MaintenanceTimelineProps {
    maintenances: Maintenance[]
    formatCurrency: (value: number) => string
}

export function MaintenanceTimeline({ maintenances, formatCurrency }: MaintenanceTimelineProps) {

    return (
        <div className="relative">
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border"></div>
            <div className="space-y-6">
                {maintenances
                    .sort((a, b) => {
                        const dateA = a.completed_date || a.scheduled_date || ''
                        const dateB = b.completed_date || b.scheduled_date || ''
                        return new Date(dateB).getTime() - new Date(dateA).getTime()
                    })
                    .map((maint) => {
                        const totalCost = (parseFloat(maint.cost_parts_brl?.toString() || '0') + parseFloat(maint.cost_labor_brl?.toString() || '0'))
                        return (
                            <div key={maint.id} className="relative pl-12">
                                <div className={`absolute left-4 top-6 w-4 h-4 rounded-full border-2 ${maint.status === 'completed' ? 'bg-success border-success' :
                                    maint.status === 'in_progress' ? 'bg-info border-info' :
                                        maint.status === 'cancelled' ? 'bg-error border-error' :
                                            'bg-warning border-warning'
                                    }`}></div>

                                <Card className="p-4 hover:shadow-lg transition-shadow">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-3">
                                                <Wrench className="h-5 w-5 text-brand" />
                                                <h3 className="font-bold capitalize">{maint.maintenance_type.replace('_', ' ')}</h3>
                                                <Badge variant={
                                                    maint.status === 'completed' ? 'default' :
                                                        maint.status === 'in_progress' ? 'secondary' :
                                                            maint.status === 'cancelled' ? 'destructive' : 'outline'
                                                }>
                                                    {maint.status === 'scheduled' ? 'Agendada' :
                                                        maint.status === 'in_progress' ? 'Em Andamento' :
                                                            maint.status === 'completed' ? 'Concluída' : 'Cancelada'}
                                                </Badge>
                                            </div>

                                            <p className="text-sm text-ink mb-3">{maint.description}</p>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                                {maint.scheduled_date && (
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="h-4 w-4 text-ink-muted" />
                                                        <span className="text-ink-muted">Agendada:</span>
                                                        <span className="font-medium">{formatDate(maint.scheduled_date)}</span>
                                                    </div>
                                                )}
                                                {maint.completed_date && (
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="h-4 w-4 text-ink-muted" />
                                                        <span className="text-ink-muted">Concluída:</span>
                                                        <span className="font-medium">{formatDate(maint.completed_date)}</span>
                                                    </div>
                                                )}
                                                {maint.odometer_km && (
                                                    <div className="flex items-center gap-2">
                                                        <Truck className="h-4 w-4 text-ink-muted" />
                                                        <span className="text-ink-muted">Odômetro:</span>
                                                        <span className="font-medium">{maint.odometer_km.toLocaleString('pt-BR')} km</span>
                                                    </div>
                                                )}
                                            </div>

                                            {totalCost > 0 && (
                                                <div className="mt-3 pt-3 border-t border-border">
                                                    <div className="flex items-center gap-2">
                                                        <DollarSign className="h-4 w-4 text-ink-muted" />
                                                        <span className="text-sm text-ink-muted">Custo Total:</span>
                                                        <span className="font-semibold text-lg">{formatCurrency(totalCost)}</span>
                                                    </div>
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
