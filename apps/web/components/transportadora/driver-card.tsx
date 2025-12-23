"use client"

import { motion } from "framer-motion"
import { Users, Mail, Phone, Edit, Trash2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Driver } from "@/lib/services/driver-service"

interface DriverCardProps {
    driver: Driver
    onEdit: (driver: Driver) => void
    onDelete: (id: string, name: string) => void
}

export function DriverCard({ driver, onEdit, onDelete }: DriverCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            whileHover={{ y: -4 }}
        >
            <Card variant="premium" className="p-3 sm:p-4 group">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                    <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                            <div className="p-1 rounded-lg bg-gradient-to-br from-bg-brand-light to-bg-brand-soft">
                                <Users className="h-4 w-4 text-brand" />
                            </div>
                            <h3 className="font-bold text-base sm:text-lg group-hover:text-brand transition-colors">
                                {driver.name || "Sem Nome"}
                            </h3>
                            <Badge variant={driver.is_active !== false ? "default" : "secondary"}>
                                {driver.is_active !== false ? "Ativo" : "Inativo"}
                            </Badge>
                        </div>

                        <div className="space-y-1 text-sm text-ink-muted">
                            <div className="flex items-center gap-2">
                                <Mail className="h-3.5 w-3.5 opacity-70" />
                                <span className="truncate">{driver.email}</span>
                            </div>
                            {driver.phone && (
                                <div className="flex items-center gap-2">
                                    <Phone className="h-3.5 w-3.5 opacity-70" />
                                    <span>{driver.phone}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onEdit(driver)}
                            className="min-h-[40px] flex-1 sm:flex-none"
                        >
                            <Edit className="h-4 w-4 mr-1" />
                            Editar
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onDelete(driver.id, driver.name || driver.email || 'Motorista')}
                            className="min-h-[40px] text-destructive hover:bg-destructive/10 border-destructive/20"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </Card>
        </motion.div>
    )
}
