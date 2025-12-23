"use client"

import { Truck, Search, Activity } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Veiculo } from "@/types/map"

interface VehiclePanelProps {
    veiculos: Veiculo[]
    onSelect: (v: Veiculo) => void
    search: string
    onSearchChange: (val: string) => void
}

export function VehiclePanel({ veiculos, onSelect, search, onSearchChange }: VehiclePanelProps) {
    const filtered = veiculos.filter(v =>
        v.plate.toLowerCase().includes(search.toLowerCase()) ||
        v.model?.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <Card className="p-4 bg-white/90 backdrop-blur-md shadow-2xl border-none">
            <div className="flex items-center gap-2 mb-4">
                <Activity className="h-5 w-5 text-brand" />
                <h2 className="font-bold text-lg">Frota em Tempo Real</h2>
            </div>

            <div className="relative mb-4">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Buscar veículo..."
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="pl-10 bg-slate-50 border-none h-10"
                />
            </div>

            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {filtered.map(v => (
                    <div
                        key={v.id}
                        onClick={() => onSelect(v)}
                        className="p-3 rounded-xl border border-transparent hover:border-brand/20 hover:bg-brand/5 cursor-pointer transition-all role-button"
                    >
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="font-bold text-slate-900">{v.plate}</p>
                                <p className="text-xs text-slate-500 uppercase">{v.model || 'N/A'}</p>
                            </div>
                            <Badge variant={v.is_active ? "default" : "secondary"} className="text-[10px]">
                                {v.is_active ? "Online" : "Offline"}
                            </Badge>
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    )
}
