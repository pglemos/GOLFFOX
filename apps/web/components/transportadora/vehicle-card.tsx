"use client"

import { motion } from "framer-motion"
import { Truck, AlertCircle, Wrench, FileText, MapPin } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { formatDate } from "@/lib/format-utils"
import { Vehicle } from "@/lib/services/vehicle-service"

interface VehicleCardProps {
    vehicle: Vehicle
    index: number
    onClick: () => void
    onViewDocs: () => void
    onViewMap: () => void
}

export function VehicleCard({ vehicle, index, onClick, onViewDocs, onViewMap }: VehicleCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
        >
            <Card
                variant="premium"
                className="p-4 hover:shadow-lg transition-shadow cursor-pointer relative overflow-hidden group"
                onClick={onClick}
            >
                <div className="space-y-3">
                    {/* Foto e Status */}
                    <div className="relative overflow-hidden rounded-lg">
                        {vehicle.photo_url ? (
                            <img
                                src={vehicle.photo_url}
                                alt={`Veículo ${vehicle.plate} ${vehicle.model}`}
                                className="w-full h-40 object-cover border border-border group-hover:scale-105 transition-transform duration-500"
                            />
                        ) : (
                            <div className="w-full h-40 bg-brand-light flex items-center justify-center border border-border">
                                <Truck className="h-12 w-12 text-brand/40" />
                            </div>
                        )}

                        <div className="absolute top-2 right-2 flex gap-2">
                            <Badge variant={vehicle.is_active ? "default" : "secondary"}>
                                {vehicle.is_active ? "Ativo" : "Inativo"}
                            </Badge>
                        </div>

                        {vehicle.hasExpiringDocs && (
                            <div className="absolute top-2 left-2">
                                <Badge variant="destructive" className="animate-pulse">
                                    <AlertCircle className="h-3 w-3 mr-1" />
                                    {vehicle.expiringDocsCount}
                                </Badge>
                            </div>
                        )}
                    </div>

                    {/* Informações */}
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Truck className="h-4 w-4 text-brand" />
                            <h3 className="font-bold text-lg tracking-tight">{vehicle.plate}</h3>
                        </div>
                        <p className="font-medium text-sm text-ink-muted mb-2">{vehicle.model || "Sem modelo"}</p>

                        <div className="grid grid-cols-2 gap-2 text-xs text-ink-light pt-2">
                            <div className="flex flex-col">
                                <span className="text-ink-muted/60 uppercase font-semibold text-[10px]">Ano</span>
                                <span className="font-medium">{vehicle.year || "N/A"}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-ink-muted/60 uppercase font-semibold text-[10px]">Capacidade</span>
                                <span className="font-medium">{vehicle.capacity || "N/A"} l</span>
                            </div>
                        </div>

                        {vehicle.lastMaintenance && (
                            <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between text-[11px]">
                                <span className="flex items-center gap-1 text-ink-muted">
                                    <Wrench className="h-3 w-3" />
                                    Manutenção:
                                </span>
                                <span className="font-semibold text-brand">
                                    {formatDate(vehicle.lastMaintenance.completed_date || vehicle.lastMaintenance.scheduled_date)}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Ações */}
                    <div className="flex gap-2 pt-1">
                        <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 h-9"
                            onClick={(e) => {
                                e.stopPropagation()
                                onViewDocs()
                            }}
                        >
                            <FileText className="h-4 w-4 mr-1" />
                            Docs
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 h-9"
                            onClick={(e) => {
                                e.stopPropagation()
                                onViewMap()
                            }}
                        >
                            <MapPin className="h-4 w-4 mr-1" />
                            Mapa
                        </Button>
                    </div>
                </div>
            </Card>
        </motion.div>
    )
}
