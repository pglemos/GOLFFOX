"use client"

import React from "react"

import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { motion } from "framer-motion"
import { AlertTriangle, Clock, Building2, MapPin, Truck, User, CheckCircle, Edit, Trash2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface Alerta {
    id: string
    message?: string
    description?: string
    type?: string
    vehicle_plate?: string
    route_name?: string
    severity?: string
    status?: string
    created_at: string
    companies?: { name: string }
    routes?: { name: string }
    veiculos?: { plate: string }
    motoristas?: { name?: string; email: string }
}

interface AlertCardProps {
    alert: Alerta
    index: number
    onResolve: (id: string) => void
    onEdit: (alert: Alerta) => void
    onDelete: (id: string) => void
}

const severityConfig = {
    critical: {
        bg: 'bg-red-50 dark:bg-red-900/20',
        icon: 'text-red-600 dark:text-red-400',
        badge: 'destructive' as const,
        label: 'Crítico'
    },
    error: {
        bg: 'bg-red-50 dark:bg-red-900/20',
        icon: 'text-red-600 dark:text-red-400',
        badge: 'destructive' as const,
        label: 'Erro'
    },
    warning: {
        bg: 'bg-amber-50 dark:bg-amber-900/20',
        icon: 'text-amber-600 dark:text-amber-400',
        badge: 'default' as const,
        label: 'Aviso'
    },
    info: {
        bg: 'bg-blue-50 dark:bg-blue-900/20',
        icon: 'text-blue-600 dark:text-blue-400',
        badge: 'secondary' as const,
        label: 'Info'
    }
}

const statusConfig = {
    open: { label: 'Aberto', variant: 'outline' as const },
    assigned: { label: 'Atribuído', variant: 'outline' as const },
    resolved: { label: 'Resolvido', variant: 'secondary' as const }
}

export const AlertCard = React.memo(function AlertCard({
    alert,
    index,
    onResolve,
    onEdit,
    onDelete
}: AlertCardProps) {
    const severity = severityConfig[alert.severity as keyof typeof severityConfig] || severityConfig.info
    const status = statusConfig[alert.status as keyof typeof statusConfig] || statusConfig.open

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.04 }}
            whileHover={{ y: -4 }}
        >
            <Card variant="premium" className="p-3 sm:p-4 group">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    {/* Left: Icon + Content */}
                    <div className="flex gap-3 flex-1 min-w-0">
                        {/* Severity Icon */}
                        <div className={`mt-0.5 p-2 rounded-xl flex-shrink-0 ${severity.bg}`}>
                            <AlertTriangle className={`h-4 w-4 ${severity.icon}`} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                            {/* Badges Row */}
                            <div className="flex flex-wrap items-center gap-1.5 mb-2">
                                <Badge variant={severity.badge} className="text-xs font-medium">
                                    {severity.label}
                                </Badge>
                                <Badge variant={status.variant} className="text-xs">
                                    {status.label}
                                </Badge>
                                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Clock className="h-3 w-3" />
                                    {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true, locale: ptBR })}
                                </span>
                            </div>

                            {/* Message */}
                            <p className="font-medium text-sm sm:text-base text-foreground mb-2 line-clamp-2 group-hover:text-brand transition-colors">
                                {alert.message || alert.description || 'Sem descrição'}
                            </p>

                            {/* Metadata Tags */}
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                {alert.companies && (
                                    <span className="flex items-center gap-1">
                                        <Building2 className="h-3 w-3" />
                                        {alert.companies.name}
                                    </span>
                                )}
                                {(alert.routes || alert.route_name) && (
                                    <span className="flex items-center gap-1">
                                        <MapPin className="h-3 w-3" />
                                        {alert.routes?.name || alert.route_name}
                                    </span>
                                )}
                                {(alert.veiculos || alert.vehicle_plate) && (
                                    <span className="flex items-center gap-1">
                                        <Truck className="h-3 w-3" />
                                        {alert.veiculos?.plate || alert.vehicle_plate}
                                    </span>
                                )}
                                {alert.motoristas && (
                                    <span className="flex items-center gap-1">
                                        <User className="h-3 w-3" />
                                        {alert.motoristas.name || alert.motoristas.email}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex gap-1.5 flex-wrap sm:flex-nowrap">
                        {alert.status !== 'resolved' && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onResolve(alert.id)}
                                className="flex-1 sm:flex-none min-h-[40px] text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20 border-green-200 dark:border-green-800"
                            >
                                <CheckCircle className="h-3.5 w-3.5 mr-1" />
                                <span className="hidden sm:inline">Resolver</span>
                            </Button>
                        )}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onEdit(alert)}
                            className="flex-1 sm:flex-none min-h-[40px]"
                        >
                            <Edit className="h-3.5 w-3.5 mr-1" />
                            <span className="hidden md:inline">Editar</span>
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onDelete(alert.id)}
                            className="flex-none min-h-[40px] text-destructive hover:bg-destructive/10 border-destructive/20"
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                </div>
            </Card>
        </motion.div>
    )
}, (prev, next) => prev.alert.id === next.alert.id && prev.alert.status === next.alert.status)
