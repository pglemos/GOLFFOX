import React from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Navigation } from "lucide-react"
import type { EmployeeLite, OptimizeRouteResponse } from "@/types/routes"

interface RoutePreviewMapProps {
    result: OptimizeRouteResponse
    employees: EmployeeLite[]
    origin: string
    destination: string
}

export function RoutePreviewMap({
    result,
    employees,
    origin,
    destination,
}: RoutePreviewMapProps) {
    const mapRef = React.useRef<HTMLDivElement>(null)
    const [map, setMap] = React.useState<any>(null)
    const [manualOrder, setManualOrder] = React.useState<Array<{ id: string; lat: number; lng: number; order: number }>>(result.ordered)

    // Atualizar manualOrder quando result mudar
    React.useEffect(() => {
        setManualOrder(result.ordered)
    }, [result])

    // Função para mover item na lista
    const moveItem = React.useCallback((fromIndex: number, toIndex: number) => {
        setManualOrder((prev) => {
            const newOrder = [...prev]
            const [movedItem] = newOrder.splice(fromIndex, 1)
            newOrder.splice(toIndex, 0, movedItem)
            // Atualizar ordem numérica
            return newOrder.map((item, index) => ({
                ...item,
                order: index + 1
            }))
        })
    }, [])

    React.useEffect(() => {
        if (!mapRef.current || typeof window === "undefined" || !window.google?.maps) return

        const googleMap = new window.google.maps.Map(mapRef.current, {
            zoom: 12,
            center: { lat: result.ordered[0]?.lat || -23.5505, lng: result.ordered[0]?.lng || -46.6333 },
        })

        setMap(googleMap)

        if (!window.google.maps.LatLngBounds || !window.google.maps.Marker) return

        const bounds = new window.google.maps.LatLngBounds()

        // Origem
        if (result.ordered[0]) {
            new window.google.maps.Marker({
                position: { lat: result.ordered[0].lat, lng: result.ordered[0].lng },
                map: googleMap,
                label: "O",
                title: origin,
            })
            bounds.extend({ lat: result.ordered[0].lat, lng: result.ordered[0].lng })
        }

        // Paradas numeradas
        result.ordered.forEach((point) => {
            const emp = employees.find((e) => e.employee_id === point.id)
            new window.google.maps.Marker({
                position: { lat: point.lat, lng: point.lng },
                map: googleMap,
                label: String(point.order),
                title: emp ? `${emp.first_name} ${emp.last_name}` : `Parada ${point.order}`,
            })
            bounds.extend({ lat: point.lat, lng: point.lng })
        })

        // Polyline otimizada
        if (result.polyline && window.google?.maps?.geometry?.encoding) {
            try {
                const decoded = window.google.maps.geometry.encoding.decodePath(result.polyline)
                new window.google.maps.Polyline({
                    path: decoded,
                    map: googleMap,
                    strokeColor: "#10B981",
                    strokeWeight: 4,
                })
            } catch (e) {
                console.warn("Erro ao decodificar polyline:", e)
            }
        }

        try {
            googleMap.fitBounds(bounds)
        } catch (e) {
            console.warn("Erro ao ajustar bounds do mapa:", e)
        }
    }, [result, employees, origin, destination])

    const totalMinutes = Math.round(result.totalDurationSeconds / 60)
    const totalKm = (result.totalDistanceMeters / 1000).toFixed(1)

    return (
        <div className="space-y-3 sm:space-y-4 h-full flex flex-col">
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
                <div className="p-2 sm:p-3 bg-gray-50 rounded-lg">
                    <div className="text-xs sm:text-sm text-gray-600">Distância Total</div>
                    <div className="text-lg sm:text-2xl font-bold">{totalKm} km</div>
                </div>
                <div className="p-2 sm:p-3 bg-gray-50 rounded-lg">
                    <div className="text-xs sm:text-sm text-gray-600">Tempo Total</div>
                    <div className="text-lg sm:text-2xl font-bold">{totalMinutes} min</div>
                </div>
                <div className="p-2 sm:p-3 bg-gray-50 rounded-lg">
                    <div className="text-xs sm:text-sm text-gray-600">Paradas</div>
                    <div className="text-lg sm:text-2xl font-bold">{result.ordered.length}</div>
                </div>
            </div>

            <div className="flex-1 min-h-0">
                <div ref={mapRef} className="w-full h-full rounded-lg" />
            </div>

            <div className="border rounded-lg p-2 sm:p-4 max-h-48 overflow-y-auto">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-2">
                    <div className="font-medium text-sm sm:text-base">Ordem dos Embarques:</div>
                    <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                        {JSON.stringify(manualOrder.map((o: { id: string }) => o.id)) !== JSON.stringify(result.ordered.map((o: { id: string }) => o.id)) && (
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setManualOrder(result.ordered)}
                                aria-label="Aplicar ordem otimizada"
                                className="text-xs sm:text-sm flex-1 sm:flex-initial"
                            >
                                <span className="hidden sm:inline">Aplicar Ordem Otimizada</span>
                                <span className="sm:hidden">Aplicar</span>
                            </Button>
                        )}
                        {JSON.stringify(manualOrder.map((o: { id: string }) => o.id)) !== JSON.stringify(result.ordered.map((o: { id: string }) => o.id)) && (
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setManualOrder(result.ordered)}
                                aria-label="Reverter para ordem otimizada"
                                className="text-xs sm:text-sm flex-1 sm:flex-initial"
                            >
                                Reverter
                            </Button>
                        )}
                    </div>
                </div>
                <div className="space-y-1">
                    {manualOrder.map((point: { id: string; lat: number; lng: number; order: number }, idx: number) => {
                        const emp = employees.find((e) => e.employee_id === point.id)
                        return (
                            <div
                                key={point.id}
                                className="flex items-center gap-2 text-xs sm:text-sm p-1.5 sm:p-2 hover:bg-gray-50 rounded cursor-move"
                                draggable
                                onDragStart={(e) => {
                                    e.dataTransfer.setData("text/plain", idx.toString())
                                }}
                                onDragOver={(e) => {
                                    e.preventDefault()
                                }}
                                onDrop={(e) => {
                                    e.preventDefault()
                                    const fromIndex = parseInt(e.dataTransfer.getData("text/plain"))
                                    moveItem(fromIndex, idx)
                                }}
                                aria-label={`Parada ${point.order}: ${emp ? `${emp.first_name} ${emp.last_name}` : `Parada ${point.order}`}. Arraste para reordenar`}
                                tabIndex={0}
                                onKeyDown={(e) => {
                                    if (e.key === "ArrowUp" && idx > 0) {
                                        e.preventDefault()
                                        moveItem(idx, idx - 1)
                                    } else if (e.key === "ArrowDown" && idx < manualOrder.length - 1) {
                                        e.preventDefault()
                                        moveItem(idx, idx + 1)
                                    }
                                }}
                            >
                                <Badge className="text-xs">{point.order}</Badge>
                                <span className="flex-1 truncate">
                                    {emp ? `${emp.first_name} ${emp.last_name}` : `Parada ${point.order}`}
                                </span>
                                <Navigation className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 flex-shrink-0" />
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
