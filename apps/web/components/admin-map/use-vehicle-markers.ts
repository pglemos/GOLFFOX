"use client"

import { useRef, useCallback, useEffect } from "react"

import { MarkerClusterer } from "@googlemaps/markerclusterer"

import { Veiculo } from "@/types/map"

export function useVehicleMarkers(map: google.maps.Map | null) {
    const markersRef = useRef<Map<string, google.maps.Marker>>(new Map())
    const clustererRef = useRef<MarkerClusterer | null>(null)

    const updateMarkers = useCallback((veiculos: Veiculo[], onMarkerClick: (v: Veiculo) => void) => {
        if (!map || !window.google) return

        // Inicializar clusterer se necessário
        if (!clustererRef.current) {
            clustererRef.current = new MarkerClusterer({ map, markers: [] })
        }

        const currentIds = new Set(veiculos.map(v => v.id))

        // Remover marcadores de veículos que não estão mais na lista
        markersRef.current.forEach((marker, id) => {
            if (!currentIds.has(id)) {
                marker.setMap(null)
                clustererRef.current?.removeMarker(marker)
                markersRef.current.delete(id)
            }
        })

        // Adicionar ou atualizar marcadores
        const newMarkers: google.maps.Marker[] = []
        veiculos.forEach(v => {
            if (v.lat === null || v.lng === null) return

            const position = { lat: v.lat, lng: v.lng }
            let marker = markersRef.current.get(v.id)

            if (marker) {
                marker.setPosition(position)
            } else {
                marker = new google.maps.Marker({
                    position,
                    map,
                    title: v.plate,
                    icon: {
                        path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                        scale: 5,
                        fillColor: v.is_active ? "#10b981" : "#6b7280",
                        fillOpacity: 1,
                        strokeWeight: 2,
                        rotation: v.heading || 0
                    }
                })

                marker.addListener("click", () => onMarkerClick(v))
                markersRef.current.set(v.id, marker)
                newMarkers.push(marker)
            }
        })

        if (newMarkers.length > 0) {
            clustererRef.current.addMarkers(newMarkers)
        }
    }, [map])

    return { updateMarkers }
}
